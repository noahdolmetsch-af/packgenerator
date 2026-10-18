/**
 * /api/push: Erinnerungen aufs Handy (Web-Push; Noah 15.10.2026 «1a 2b 3a 4b 5a», 18.10.2026 «2b»).
 *
 *   GET  ?a=key            → { publicKey, ready }  the key the phone subscribes with
 *   GET  ?a=keys           → a new key pair and tick code for the setup, only while none is set
 *   POST { a: 'save', token, sub, items, weather, texts, hotC }  → { ok, next }  the phone's next reminders
 *   POST { a: 'test', token }   → sends «So kommen deine Erinnerungen» now
 *   POST { a: 'off', token }    → forgets the phone
 *   GET|POST ?a=tick&key=<PUSH_TICK_KEY>  → sends what is due (cron-job.org every minute, Noah «2b»)
 *
 * token: a random code the app makes once per phone (never the subscription itself). The texts come
 * from the app in its language; the server keeps them only until they are sent. Free: Upstash Redis
 * (free tier), Open-Meteo (free) and Vercel Hobby.
 *
 * Environment (Vercel «packgen», never in the code): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
 * VAPID_SUBJECT (mailto: or https:), PUSH_TICK_KEY, and the Upstash KV_REST_API_URL / _TOKEN.
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { route, json, ApiError, pick, redis, redisEnv, NO_STORAGE } from './_lib/core.js';
import { newVapidKeys, vapidOk, sendPush } from './_lib/webpush.js';
import { devKey, cleanSub, cleanList, nextAt, split, weatherReasons, forecastUrl, weatherMessage, KEEP_S } from './_lib/push.js';

/** Compare two codes in constant time (their hashes, so the length does not leak); empty never matches. */
export function sameToken(given, want) {
  if (!given || !want) return false;
  const h = (v) => createHash('sha256').update(String(v)).digest();
  return timingSafeEqual(h(given), h(want));
}

export function pushEnv(e = process.env) {
  return {
    vapid: { publicKey: pick('VAPID_PUBLIC_KEY', e), privateKey: pick('VAPID_PRIVATE_KEY', e), subject: pick('VAPID_SUBJECT', e) || 'mailto:packgenerator@example.org' },
    tickKey: pick('PUSH_TICK_KEY', e),
    ...redisEnv(e),
  };
}

const DEVS = 'push:devs';
const NEXT = 'push:next';
const tokenOk = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(t);

export function makeHandler({ env = () => pushEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now(), send = sendPush } = {}) {
  function setup() {
    const cfg = env();
    const store = redis(cfg, doFetch);
    return { cfg, store, ready: vapidOk(cfg.vapid) && !!store };
  }
  const read = async (store, k) => {
    const v = await store.get(k);
    try {
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  };
  /** push:next = the earliest due time over all phones (kept small: 1 read per tick when nothing is due). */
  async function renext(store) {
    const keys = (await store.cmd('SMEMBERS', DEVS)) ?? [];
    let next = Infinity;
    for (const k of keys) {
      const rec = await read(store, k);
      if (!rec) await store.cmd('SREM', DEVS, k);
      else next = Math.min(next, nextAt(rec));
    }
    if (next === Infinity) await store.del(NEXT);
    else await store.set(NEXT, String(next));
    return next === Infinity ? null : next;
  }

  async function tick(cfg, store) {
    const t = now();
    const next = Number(await store.get(NEXT));
    if (!next || next > t) return { sent: 0, next: next || null };
    let sent = 0;
    for (const k of (await store.cmd('SMEMBERS', DEVS)) ?? []) {
      const rec = await read(store, k);
      if (!rec) continue;
      let gone = false;
      const items = split(rec.items, t);
      const keepItems = [...items.wait];
      for (const it of items.due) {
        const status = await send(rec.sub, { title: it.title, body: it.body, url: it.url, tag: it.key }, cfg.vapid, { doFetch, now: t }).catch(() => 0);
        if (status === 404 || status === 410) gone = true;
        else if (status >= 200 && status < 300) sent++;
        else keepItems.push(it); // try again on the next tick (until it is stale)
        if (gone) break;
      }
      const wx = split(rec.weather, t);
      const keepWx = [...wx.wait];
      if (!gone)
        for (const w of wx.due) {
          const res = await doFetch(forecastUrl(w)).catch(() => null);
          const data = res?.ok ? await res.json().catch(() => null) : null;
          if (!data) {
            keepWx.push(w);
            continue;
          }
          const msg = weatherMessage(w, weatherReasons(data.daily, w.date, rec.hotC), rec.texts ?? {});
          if (!msg) continue; // fine weather: nothing to say
          const status = await send(rec.sub, msg, cfg.vapid, { doFetch, now: t }).catch(() => 0);
          if (status === 404 || status === 410) gone = true;
          else if (status >= 200 && status < 300) sent++;
          else keepWx.push(w);
        }
      if (gone) {
        await store.del(k);
        await store.cmd('SREM', DEVS, k);
      } else await store.set(k, JSON.stringify({ ...rec, items: keepItems, weather: keepWx }), KEEP_S);
    }
    return { sent, next: await renext(store) };
  }

  const handler = route(
    {
      GET: async (request) => {
        const q = new URL(request.url).searchParams;
        const a = q.get('a') ?? 'key';
        const { cfg, store, ready } = setup();
        if (a === 'key') return json(request, 200, { publicKey: cfg.vapid.publicKey || null, ready });
        if (a === 'keys') {
          // Setup help: a fresh pair to copy into Vercel, only while no pair is set (it is never stored here).
          if (cfg.vapid.privateKey) throw new ApiError(409, 'already_set_up', 'The keys are set already.');
          const k = newVapidKeys();
          return json(request, 200, { VAPID_PUBLIC_KEY: k.publicKey, VAPID_PRIVATE_KEY: k.privateKey, PUSH_TICK_KEY: randomBytes(24).toString('base64url') });
        }
        if (a === 'tick') return doTick(request, q.get('key'), cfg, store, ready);
        throw new ApiError(400, 'unknown', 'Unknown action.');
      },
      POST: async (request) => {
        const q = new URL(request.url).searchParams;
        if (q.get('a') === 'tick') {
          const { cfg, store, ready } = setup();
          return doTick(request, q.get('key'), cfg, store, ready);
        }
        const body = await request.json().catch(() => null);
        if (!body || !tokenOk(body.token)) throw new ApiError(400, 'bad_request', 'Missing or wrong phone code.');
        const { cfg, store, ready } = setup();
        if (!store) throw NO_STORAGE();
        if (!ready) throw new ApiError(503, 'not_set_up', 'Push is not set up on the server yet.');
        const k = devKey(body.token);
        if (body.a === 'off') {
          await store.del(k);
          await store.cmd('SREM', DEVS, k);
          await renext(store);
          return json(request, 200, { ok: true });
        }
        if (body.a === 'save') {
          const sub = cleanSub(body.sub);
          if (!sub) throw new ApiError(400, 'bad_subscription', 'The phone subscription is missing.');
          const list = cleanList(body);
          await store.set(k, JSON.stringify({ sub, ...list, updated: now() }), KEEP_S);
          await store.cmd('SADD', DEVS, k);
          const next = await renext(store);
          return json(request, 200, { ok: true, items: list.items.length, weather: list.weather.length, next });
        }
        if (body.a === 'test') {
          const rec = await read(store, k);
          if (!rec) throw new ApiError(404, 'unknown_phone', 'This phone is not signed up.');
          const status = await send(rec.sub, { title: String(body.title ?? 'Pack Generator').slice(0, 80), body: String(body.body ?? '').slice(0, 240), url: '#/', tag: 'test' }, cfg.vapid, { doFetch, now: now() }).catch(() => 0);
          return json(request, 200, { ok: status >= 200 && status < 300, status });
        }
        throw new ApiError(400, 'unknown', 'Unknown action.');
      },
    },
    'push',
  );

  async function doTick(request, key, cfg, store, ready) {
    const bearer = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!cfg.tickKey || !(sameToken(key ?? '', cfg.tickKey) || sameToken(bearer, cfg.tickKey))) throw new ApiError(401, 'unauthorized', 'Wrong or missing tick code.');
    if (!store) throw NO_STORAGE();
    if (!ready) throw new ApiError(503, 'not_set_up', 'Push is not set up on the server yet.');
    return json(request, 200, { ok: true, ...(await tick(cfg, store)) });
  }

  return handler;
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
