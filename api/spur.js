/**
 * /api/spur: Paket S «Reise-Spur» (Noah 19.10.2026 «4a»), the read-only link of a tour for the family.
 * What the server keeps and why it cannot read it: api/_lib/spur.js.
 *
 *   GET  ?id=<id>                        → { ok, e, at }                (anyone with the link)
 *   POST ?step=put    { e }              → { ok, id, del, at }          (a new link)
 *   POST ?step=put    { id, del, e }     → { ok, id, at }               (the same link, newer tour)
 *   POST ?step=delete { id, del }        → { ok }                       (the link stops working)
 *
 * Environment (names only; values only in the Vercel project «packgen»): KV_REST_API_URL and
 * KV_REST_API_TOKEN (the Upstash store of the sync, free tier).
 */
import { route, json, redisEnv, needStore, ApiError } from './_lib/core.js';
import { jsonBody } from './_lib/oauth.js';
import { isId, isDel, isEnvelope, keyOf, sha, newId, newDel, ipOf, readRec, SPUR_TTL_S, BODY_MAX, WRITES_PER_DAY } from './_lib/spur.js';

export function makeHandler({ env = () => redisEnv(), doFetch = (...a) => fetch(...a), now = () => new Date() } = {}) {
  return route(
    {
      GET: async (request) => {
        const id = new URL(request.url).searchParams.get('id');
        if (!isId(id)) throw new ApiError(400, 'bad_request', 'The link is not complete.');
        const store = needStore(env(), doFetch);
        const rec = readRec(await store.get(keyOf(id)));
        if (!rec) throw new ApiError(404, 'not_found', 'This link was deleted or has expired.');
        return json(request, 200, { ok: true, e: rec.e, at: rec.at ?? null });
      },
      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const body = await jsonBody(request, BODY_MAX);
        const store = needStore(env(), doFetch);
        if (step === 'put') {
          if (!isEnvelope(body.e)) throw new ApiError(400, 'bad_request', 'The tour is missing or too large.');
          const day = now().toISOString().slice(0, 10);
          const rk = `spur:rate:${ipOf(request)}:${day}`;
          const n = Number(await store.cmd('INCR', rk));
          if (n === 1) await store.expire(rk, 86_400);
          if (n > WRITES_PER_DAY) throw new ApiError(429, 'too_many', 'Too many links today. Try again tomorrow.');
          const at = now().toISOString();
          if (body.id != null) {
            if (!isId(body.id) || !isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
            const old = readRec(await store.get(keyOf(body.id)));
            if (!old) throw new ApiError(404, 'not_found', 'This link was deleted or has expired.');
            if (old.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that made the link can change it.');
            await store.set(keyOf(body.id), JSON.stringify({ e: body.e, d: old.d, at }), SPUR_TTL_S);
            return json(request, 200, { ok: true, id: body.id, at });
          }
          const id = newId();
          const del = newDel();
          await store.set(keyOf(id), JSON.stringify({ e: body.e, d: sha(del), at }), SPUR_TTL_S);
          return json(request, 200, { ok: true, id, del, at });
        }
        if (step === 'delete') {
          if (!isId(body.id) || !isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
          const old = readRec(await store.get(keyOf(body.id)));
          if (old && old.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that made the link can delete it.');
          if (old) await store.del(keyOf(body.id));
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'spur',
  );
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
