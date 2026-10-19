/**
 * /api/sync: P8 «Automatischer Abgleich» between the phone and the computer (Noah 18.10.2026
 * «1b … 2b 3b»: a free store on Vercel, with the server package, the app asks when both changed).
 * What the server keeps and why it cannot read it: api/_lib/sync.js.
 *
 *   POST ?step=status { token }                     → { seq }
 *   POST ?step=pull   { token, since }              → { seq, items: [{ k, s, e }], next, more }
 *   POST ?step=push   { token, items: [{ k, base, e }] } → { done: [{ k, s }], conflicts: [{ k, s }] }
 *   POST ?step=forget { token }                     → { ok } (everything of this space is removed)
 *   ?action=spur …                                  → the read link of a tour (Paket S, api/_lib/spur.js)
 *
 * Environment (names only; values only in the Vercel project «packgen»): KV_REST_API_URL and
 * KV_REST_API_TOKEN, set by the Upstash integration (the same store as the KI-Helfer and «Ich habe bezahlt»).
 */
import { route, json, redisEnv, needStore, ApiError } from './_lib/core.js';
import { jsonBody } from './_lib/oauth.js';
import { makeSpurHandler } from './_lib/spur.js';
import { isToken, spaceOf, keysOf, readPush, readPushAnswer, readStored, PUSH_LUA, SPACE_TTL_S, PULL_MAX, PULL_BYTES, BODY_MAX } from './_lib/sync.js';

export function makeHandler({ env = () => redisEnv(), doFetch = (...a) => fetch(...a) } = {}) {
  return route(
    {
      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const body = await jsonBody(request, BODY_MAX);
        if (!isToken(body.token)) throw new ApiError(400, 'bad_request', 'The device token is missing or wrong.');
        const store = needStore(env(), doFetch);
        const keys = keysOf(spaceOf(body.token));
        const seqNow = async () => Number((await store.get(keys.seq)) ?? 0) || 0;

        if (step === 'status') return json(request, 200, { seq: await seqNow() });

        if (step === 'pull') {
          const since = Number(body.since ?? 0);
          if (!Number.isSafeInteger(since) || since < 0) throw new ApiError(400, 'bad_request', 'since must be a whole number.');
          const seq = await seqNow();
          const flat = (await store.cmd('ZRANGEBYSCORE', keys.log, `(${since}`, '+inf', 'WITHSCORES', 'LIMIT', 0, PULL_MAX + 1)) ?? [];
          const rows = [];
          for (let i = 0; i + 1 < flat.length; i += 2) rows.push({ k: String(flat[i]), s: Number(flat[i + 1]) });
          const page = rows.slice(0, PULL_MAX);
          let more = rows.length > PULL_MAX;
          const values = page.length ? ((await store.cmd('HMGET', keys.data, ...page.map((r) => r.k))) ?? []) : [];
          const items = [];
          let bytes = 0;
          let next = since;
          for (let i = 0; i < page.length; i++) {
            const v = readStored(values[i]);
            if (!v) {
              next = page[i].s;
              continue;
            }
            if (items.length && bytes + v.e.length > PULL_BYTES) {
              more = true;
              break;
            }
            bytes += v.e.length;
            items.push({ k: page[i].k, s: v.s, e: v.e });
            next = page[i].s;
          }
          return json(request, 200, { seq, items, next, more });
        }

        if (step === 'push') {
          const items = readPush(body.items);
          if (!items) throw new ApiError(400, 'bad_request', 'The records are missing or wrong.');
          const args = items.flatMap((it) => [it.k, it.base, it.e]);
          const flat = await store.cmd('EVAL', PUSH_LUA, 3, keys.data, keys.log, keys.seq, SPACE_TTL_S, items.length, ...args);
          return json(request, 200, readPushAnswer(flat));
        }

        if (step === 'forget') {
          await store.cmd('DEL', keys.data, keys.log, keys.seq);
          return json(request, 200, { ok: true });
        }

        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'sync',
  );
}

/** The sync, or with ?action=spur the read link of a tour (one function for both: the free plan allows 12). */
export function makeDispatch({ sync = makeHandler(), spur = makeSpurHandler() } = {}) {
  return (request) => (new URL(request.url).searchParams.get('action') === 'spur' ? spur(request) : sync(request));
}

const handler = makeDispatch();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
