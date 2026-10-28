/**
 * /api/push: Erinnerungen aufs Handy (Web-Push; Noah 15.10.2026 «1a 2b 3a 4b 5a», 18.10.2026 «2b»).
 *
 *   GET  ?a=key            → { publicKey, ready }  the key the phone subscribes with
 *   GET  ?a=cron           Bearer <device key or Helfer-Code> → { url }  the tick address for cron-job.org
 *   POST { a: 'save', token, sub, items, weather, texts, hotC }  → { ok, next }  the phone's next reminders
 *   POST { a: 'test', token }   → sends «So kommen deine Erinnerungen» now
 *   POST { a: 'off', token }    → forgets the phone
 *   GET|POST ?a=tick&key=<tick code>  → sends what is due (cron-job.org every minute, Noah «2b»)
 *
 * token: a random code the app makes once per phone (never the subscription itself). The texts come
 * from the app in its language; the server keeps them only until they are sent. Free: Upstash Redis
 * (free tier), Open-Meteo (free) and Vercel Hobby.
 *
 * Paket B «Server» (Noah 18.10.2026 20:34 «1a …», notes/server-einrichten/anleitung.md): Noah copies no
 * key. On first use the server makes its own VAPID key pair (push:vapid) and its tick code
 * (push:tickkey) and keeps them in Upstash. The app fetches the tick address with «Adresse für
 * cron-job.org kopieren» (?a=cron); only a device of this server (the key from the Strava login,
 * api/_lib/oauth.js) or the Helfer-Code (HELPER_TOKEN) gets it.
 * Optional overrides in Vercel «packgen» (never needed): VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY,
 * VAPID_SUBJECT (mailto: or https:, default the app's address), PUSH_TICK_KEY.
 * Storage: the Upstash KV_REST_API_URL / _TOKEN. Every tick notes its time in push:lasttick (api/health).
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { route, json, ApiError, pick, redis, redisEnv, NO_STORAGE, API_BASE, APP_ORIGIN } from './_lib/core.js';
import { KEYS, hash, bearer as bearerOf } from './_lib/oauth.js';
import { newVapidKeys, vapidOk, sendPush } from './_lib/webpush.js';
import { devKey, cleanSub, cleanList, nextAt, split, weatherReasons, forecastUrl, weatherMessage, KEEP_S, keepWatch, watchUrl, watchVerdict, watchNews, watchMessage, zurichDay, WATCH_EVERY_MS, keepRain, placeNow, rainUrl, rainSoon, rainMessage, RAIN_EVERY_MS, RAIN_QUIET_MS, airUrl, airVerdict, airText } from './_lib/push.js';

/** Compare two codes in constant time (their hashes, so the length does not leak); empty never matches. */
export function sameToken(given, want) {
  if (!given || !want) return false;
  const h = (v) => createHash('sha256').update(String(v)).digest();
  return timingSafeEqual(h(given), h(want));
}

export function pushEnv(e = process.env) {
  return {
    vapid: { publicKey: pick('VAPID_PUBLIC_KEY', e), privateKey: pick('VAPID_PRIVATE_KEY', e), subject: pick('VAPID_SUBJECT', e) || DEFAULT_SUBJECT },
    tickKey: pick('PUSH_TICK_KEY', e),
    helperToken: pick('HELPER_TOKEN', e),
    ...redisEnv(e),
  };
}

export const DEFAULT_SUBJECT = `${APP_ORIGIN}/packgenerator/`;
export const VAPID_KEY = 'push:vapid';
export const TICK_KEY = 'push:tickkey';
export const LAST_TICK = 'push:lasttick';
export const DEVS = 'push:devs';
const NEXT = 'push:next';
const LAST_TICK_S = 7 * 24 * 3600;

/**
 * The VAPID key pair: the one from Vercel when both halves are set there, else the server's own,
 * made on first use and kept in Upstash (SET NX: two first calls at the same time keep one pair).
 */
export async function vapidKeys(cfg, store, make = newVapidKeys) {
  if (cfg.vapid.publicKey && cfg.vapid.privateKey) return cfg.vapid;
  if (!store) return { publicKey: '', privateKey: '', subject: cfg.vapid.subject };
  let raw = await store.get(VAPID_KEY);
  if (!raw) {
    const k = make();
    await store.cmd('SET', VAPID_KEY, JSON.stringify({ publicKey: k.publicKey, privateKey: k.privateKey }), 'NX');
    raw = await store.get(VAPID_KEY);
  }
  const k = JSON.parse(raw);
  return { publicKey: k.publicKey, privateKey: k.privateKey, subject: cfg.vapid.subject };
}

/** The tick code: PUSH_TICK_KEY when set, else the server's own (made only when `create`). */
export async function tickKey(cfg, store, create = false) {
  if (cfg.tickKey) return cfg.tickKey;
  if (!store) return '';
  const cur = await store.get(TICK_KEY);
  if (cur || !create) return cur ?? '';
  await store.cmd('SET', TICK_KEY, randomBytes(24).toString('base64url'), 'NX');
  return (await store.get(TICK_KEY)) ?? '';
}

/** The daily-cap name of a call: the cron-job.org tick has its own cap (daycap.js «tick»). */
export const pushCapName = (request) => (new URL(request.url).searchParams.get('a') === 'tick' ? 'tick' : 'push');
export const tickUrl = (code) => `${API_BASE}/api/push?a=tick&key=${encodeURIComponent(code)}`;

/** Only a device of this server (Strava login key) or the Helfer-Code; else 401. */
export async function needOwner(request, store, cfg) {
  const key = bearerOf(request);
  if (key && cfg.helperToken && sameToken(key, cfg.helperToken)) return;
  if (key && Number(await store.cmd('SISMEMBER', KEYS, hash(key))) === 1) return;
  throw new ApiError(401, 'unauthorized', key ? 'This device is not connected (any more).' : 'This device is not connected yet.');
}
const tokenOk = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(t);

export function makeHandler({ env = () => pushEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now(), send = sendPush, makeKeys = newVapidKeys } = {}) {
  async function setup() {
    const base = env();
    const store = redis(base, doFetch);
    const cfg = { ...base, vapid: await vapidKeys(base, store, makeKeys) };
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
          let msg = weatherMessage(w, weatherReasons(data.daily, w.date, rec.hotC), rec.texts ?? {});
          // Paket G «Ozon und Pollen»: a strong day goes into the same morning message (or its own)
          if (rec.air && !w.only) {
            const ar = await doFetch(airUrl(w)).catch(() => null);
            const air = ar?.ok ? await ar.json().catch(() => null) : null;
            const words = air ? airText(airVerdict(air.hourly, w.date, rec.air), rec.texts ?? {}) : '';
            if (words) msg = msg ? { ...msg, body: `${msg.body} ${words}` } : { title: w.title || rec.texts?.title || 'Pack Generator', body: words, url: w.url, tag: w.key };
          }
          if (!msg) continue; // fine weather: nothing to say
          const status = await send(rec.sub, msg, cfg.vapid, { doFetch, now: t }).catch(() => 0);
          if (status === 404 || status === 410) gone = true;
          else if (status >= 200 && status < 300) sent++;
          else keepWx.push(w);
        }
      // Wetter-Wecker (Paket G): each planned tour twice a day until the day before; tell only news
      const today = zurichDay(t);
      const keepWatchList = [];
      for (const w of rec.watch ?? []) {
        if (w.date <= today) continue; // the tour day itself has the morning warning
        if (gone || w.at > t) {
          keepWatchList.push(w);
          continue;
        }
        const res = await doFetch(watchUrl(w, today)).catch(() => null);
        const data = res?.ok ? await res.json().catch(() => null) : null;
        if (!data) {
          keepWatchList.push({ ...w, at: t + 3600 * 1000 });
          continue;
        }
        const { verdict, alt } = watchVerdict(data.daily, w, today);
        const news = watchNews(w.last, verdict, alt, w.alt);
        const msg = news && watchMessage(w, news, rec.texts ?? {});
        if (msg) {
          const status = await send(rec.sub, msg, cfg.vapid, { doFetch, now: t }).catch(() => 0);
          if (status === 404 || status === 410) gone = true;
          else if (status >= 200 && status < 300) sent++;
        }
        keepWatchList.push({ ...w, at: t + WATCH_EVERY_MS, last: verdict ?? w.last, alt: news?.alt ?? (verdict === 'good' ? null : w.alt) });
      }
      // Regen-Warnung unterwegs (Paket G): while riding, every 15 min the next 45 min at the expected place
      const keepRainList = [];
      for (const r of rec.rain ?? []) {
        const last = r.points.at(-1);
        if (t > last.at + 30 * 60 * 1000) continue; // the ride is over
        if (gone || r.at > t) {
          keepRainList.push(r);
          continue;
        }
        const next = { ...r, at: t + RAIN_EVERY_MS };
        const p = placeNow(r, t);
        if (p && t - (r.warned ?? 0) >= RAIN_QUIET_MS) {
          const res = await doFetch(rainUrl(p)).catch(() => null);
          const data = res?.ok ? await res.json().catch(() => null) : null;
          const minutes = data ? rainSoon(data.minutely_15) : null;
          const msg = minutes ? rainMessage(r, minutes, rec.texts ?? {}) : null;
          if (msg) {
            const status = await send(rec.sub, msg, cfg.vapid, { doFetch, now: t }).catch(() => 0);
            if (status === 404 || status === 410) gone = true;
            else if (status >= 200 && status < 300) {
              sent++;
              next.warned = t;
            }
          }
        }
        keepRainList.push(next);
      }
      if (gone) {
        await store.del(k);
        await store.cmd('SREM', DEVS, k);
      } else await store.set(k, JSON.stringify({ ...rec, items: keepItems, weather: keepWx, watch: keepWatchList, rain: keepRainList }), KEEP_S);
    }
    return { sent, next: await renext(store) };
  }

  const handler = route(
    {
      GET: async (request) => {
        const q = new URL(request.url).searchParams;
        const a = q.get('a') ?? 'key';
        const { cfg, store, ready } = await setup();
        if (a === 'key') return json(request, 200, { publicKey: cfg.vapid.publicKey || null, ready });
        if (a === 'cron') {
          if (!store) throw NO_STORAGE();
          await needOwner(request, store, cfg);
          return json(request, 200, { ok: true, url: tickUrl(await tickKey(cfg, store, true)) });
        }
        if (a === 'tick') return doTick(request, q.get('key'), cfg, store, ready);
        throw new ApiError(400, 'unknown', 'Unknown action.');
      },
      POST: async (request) => {
        const q = new URL(request.url).searchParams;
        if (q.get('a') === 'tick') {
          const { cfg, store, ready } = await setup();
          return doTick(request, q.get('key'), cfg, store, ready);
        }
        const body = await request.json().catch(() => null);
        if (!body || !tokenOk(body.token)) throw new ApiError(400, 'bad_request', 'Missing or wrong phone code.');
        const { cfg, store, ready } = await setup();
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
          const prev = await read(store, k);
          list.watch = keepWatch(list.watch, prev?.watch);
          list.rain = keepRain(list.rain, prev?.rain);
          await store.set(k, JSON.stringify({ sub, ...list, updated: now() }), KEEP_S);
          await store.cmd('SADD', DEVS, k);
          const next = await renext(store);
          return json(request, 200, { ok: true, items: list.items.length, weather: list.weather.length, watch: list.watch.length, next });
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
    { capName: pushCapName },
  );

  async function doTick(request, key, cfg, store, ready) {
    const bearer = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!store) throw NO_STORAGE();
    const want = await tickKey(cfg, store);
    if (!want || !(sameToken(key ?? '', want) || sameToken(bearer, want))) throw new ApiError(401, 'unauthorized', 'Wrong or missing tick code.');
    if (!ready) throw new ApiError(503, 'not_set_up', 'Push is not set up on the server yet.');
    await store.set(LAST_TICK, String(now()), LAST_TICK_S);
    return json(request, 200, { ok: true, ...(await tick(cfg, store)) });
  }

  return handler;
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
