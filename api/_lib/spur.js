/**
 * Paket S «Reise-Spur» (Noah 19.10.2026 «4a»): a read-only link per tour for the family, without an account.
 *
 * The tour arrives sealed on the device (AES-GCM; the key is made on the device and travels only in
 * the link's part after #, which a browser never sends to a server). The server keeps the sealed
 * envelope under a random name and cannot read it. Whoever made the link keeps a delete code; with it
 * the link is updated or deleted. A link nobody updates for SPUR_TTL_S is removed by Redis.
 *
 *   spur:<id>              STRING JSON { e, d: sha256(delete code), at }
 *   spur:rate:<ip>:<day>   STRING writes from one address today (at most WRITES_PER_DAY)
 */
import { createHash, randomBytes } from 'node:crypto';
import { route, json, redisEnv, needStore, ApiError } from './core.js';
import { jsonBody } from './oauth.js';

export const SPUR_TTL_S = 400 * 86_400;
/** The largest sealed tour (characters); the body may be a little larger. */
export const ENVELOPE_MAX = 700_000;
export const BODY_MAX = 720_000;
export const WRITES_PER_DAY = 60;

export const isId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{22}$/.test(id);
export const isDel = (d) => typeof d === 'string' && /^[A-Za-z0-9_-]{32}$/.test(d);
export const isEnvelope = (e) => typeof e === 'string' && e.length > 20 && e.length <= ENVELOPE_MAX && /^[A-Za-z0-9_-]+$/.test(e);
export const keyOf = (id) => `spur:${id}`;
export const sha = (s) => createHash('sha256').update(`pg-spur:${s}`).digest('hex');
export const newId = () => randomBytes(16).toString('base64url');
export const newDel = () => randomBytes(24).toString('base64url');

/** The calling address, made anonymous (only for the daily write limit). */
export function ipOf(request) {
  const raw = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'none';
  return sha(`ip:${raw}`).slice(0, 24);
}

/** The stored record → { e, d, at } or null. */
export function readRec(v) {
  if (typeof v !== 'string') return null;
  try {
    const r = JSON.parse(v);
    return r && typeof r.e === 'string' && typeof r.d === 'string' ? r : null;
  } catch {
    return null;
  }
}

/**
 * The read link lives in the sync function (/api/sync?action=spur), because the free plan allows only
 * 12 functions:
 *
 *   GET  ?action=spur&id=<id>                    → { ok, e, at }        (anyone with the link)
 *   POST ?action=spur&step=put    { e }          → { ok, id, del, at }  (a new link)
 *   POST ?action=spur&step=put    { id, del, e } → { ok, id, at }       (the same link, newer tour)
 *   POST ?action=spur&step=delete { id, del }    → { ok }               (the link stops working)
 */
export function makeSpurHandler({ env = () => redisEnv(), doFetch = (...a) => fetch(...a), now = () => new Date() } = {}) {
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
