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

/* ---------- Gruppen-Live-Karte (Noah 25.10.2026 «b») ---------- */

/**
 * A ride with friends: who taps «Share my location» is a point on everyone's map, for at most 24 h
 * (an event group, Noah 26.10.2026: up to 7 days, GROUP_HOURS_MAX).
 * Sealed like the read link: the group key is made on the device and travels only after the # of the
 * invite link; the server keeps sealed names and places it cannot read. The whole group is one Redis
 * hash that expires GROUP_TTL_S after it was made (a write never makes it live longer), and whoever
 * made it can end it at once; a member can leave and is gone from the hash.
 *
 *   grp:<gid>             HASH  '_' → JSON { e?, p?, d: sha256(owner code), end } (e: the sealed route, p: the sealed plan)
 *                               <mid> → JSON { e, d: sha256(member code), at } (e: sealed name and place)
 *   grp:rate:<ip>:<day>   STRING writes from one address today (at most GROUP_WRITES_PER_DAY)
 *
 *   GET  ?action=group&gid=<gid>[&route=0]             → { ok, end, e, p, members: [{ m, e, at }] }
 *   POST ?action=group&step=new   { e?, p?, hours? }   → { ok, gid, del, end }
 *   POST ?action=group&step=route { gid, del, e }      → { ok }           (the owner: a new route)
 *   POST ?action=group&step=plan  { gid, del, p }      → { ok }           (the owner: the event plan, sealed)
 *   POST ?action=group&step=put   { gid, e }           → { ok, mid, del, at, members } (a new member)
 *   POST ?action=group&step=put   { gid, mid, del, e } → { ok, mid, at, members }      (a newer place)
 * (put answers with the members too: one call per update, because of the daily cap in daycap.js)
 *   POST ?action=group&step=leave { gid, mid, del }    → { ok }           (gone from the group)
 *   POST ?action=group&step=end   { gid, del }         → { ok }           (the owner: everything deleted)
 */
export const GROUP_TTL_S = 24 * 3600;
/** An event group (Noah 26.10.2026): up to 7 days. */
export const GROUP_HOURS_MAX = 7 * 24;
/** The maker's sealed event plan (night pause, checkpoints). */
export const PLAN_MAX = 4000;
export const GROUP_MEMBERS_MAX = 40;
/** A member's sealed name and place; the route may be larger. */
export const MEMBER_MAX = 8000; // with the event part: status, help, things, costs, meeting points
export const ROUTE_MAX = 200_000;
/** A place every 30 s for 24 h from a few phones behind one address. */
export const GROUP_WRITES_PER_DAY = 6000;
export const groupKey = (gid) => `grp:${gid}`;
const isSealed = (e, max) => typeof e === 'string' && e.length > 20 && e.length <= max && /^[A-Za-z0-9_-]+$/.test(e);

/** HGETALL's flat list → Map (the REST API answers [field, value, field, value, …]). */
function pairs(list) {
  const m = new Map();
  if (Array.isArray(list)) for (let i = 0; i + 1 < list.length; i += 2) m.set(String(list[i]), list[i + 1]);
  else if (list && typeof list === 'object') for (const [k, v] of Object.entries(list)) m.set(k, v);
  return m;
}
/** The hash → the members' sealed places [{ m, e, at }]. */
function membersOf(all) {
  return [...all]
    .filter(([k]) => k !== '_')
    .map(([k, v]) => [k, readJson(v)])
    .filter(([, r]) => r && typeof r.e === 'string')
    .map(([k, r]) => ({ m: k, e: r.e, at: r.at ?? null }));
}
function readJson(v) {
  if (typeof v !== 'string') return null;
  try {
    const r = JSON.parse(v);
    return r && typeof r === 'object' && typeof r.d === 'string' ? r : null;
  } catch {
    return null;
  }
}

export function makeGroupHandler({ env = () => redisEnv(), doFetch = (...a) => fetch(...a), now = () => new Date() } = {}) {
  const GONE = () => new ApiError(404, 'not_found', 'This group has ended.');
  async function meta(store, gid) {
    if (!isId(gid)) throw new ApiError(400, 'bad_request', 'The link is not complete.');
    const m = readJson(await store.cmd('HGET', groupKey(gid), '_'));
    if (!m || Date.parse(m.end) <= now().getTime()) throw GONE();
    return m;
  }
  async function limit(store, request) {
    const rk = `grp:rate:${ipOf(request)}:${now().toISOString().slice(0, 10)}`;
    const n = Number(await store.cmd('INCR', rk));
    if (n === 1) await store.expire(rk, 86_400);
    if (n > GROUP_WRITES_PER_DAY) throw new ApiError(429, 'too_many', 'Too many updates today. Try again tomorrow.');
  }
  return route(
    {
      GET: async (request) => {
        const gid = new URL(request.url).searchParams.get('gid');
        const store = needStore(env(), doFetch);
        if (!isId(gid)) throw new ApiError(400, 'bad_request', 'The link is not complete.');
        const all = pairs(await store.cmd('HGETALL', groupKey(gid)));
        const m = readJson(all.get('_'));
        if (!m || Date.parse(m.end) <= now().getTime()) throw GONE();
        // ?route=0: only the members (the route is fetched once)
        const withRoute = new URL(request.url).searchParams.get('route') !== '0';
        return json(request, 200, { ok: true, end: m.end, e: withRoute ? (m.e ?? null) : null, p: m.p ?? null, members: membersOf(all) });
      },
      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const body = await jsonBody(request, ROUTE_MAX + 2000);
        const store = needStore(env(), doFetch);
        if (step === 'new') {
          if (body.e != null && !isSealed(body.e, ROUTE_MAX)) throw new ApiError(400, 'bad_request', 'The route is too large.');
          await limit(store, request);
          const hours = Math.min(GROUP_HOURS_MAX, Math.max(1, Math.round(Number(body.hours) || 24)));
          const gid = newId();
          const del = newDel();
          const end = new Date(now().getTime() + hours * 3600_000).toISOString();
          if (body.p != null && !isSealed(body.p, PLAN_MAX)) throw new ApiError(400, 'bad_request', 'The plan is too large.');
          await store.cmd('HSET', groupKey(gid), '_', JSON.stringify({ ...(body.e ? { e: body.e } : {}), ...(body.p ? { p: body.p } : {}), d: sha(del), end }));
          await store.expire(groupKey(gid), hours * 3600);
          return json(request, 200, { ok: true, gid, del, end });
        }
        if (step === 'route' || step === 'plan' || step === 'end') {
          if (!isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
          let m;
          try {
            m = await meta(store, body.gid);
          } catch (e) {
            if (step === 'end' && e.status === 404) return json(request, 200, { ok: true });
            throw e;
          }
          if (m.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that made the group can change it.');
          if (step === 'end') {
            await store.del(groupKey(body.gid));
            return json(request, 200, { ok: true });
          }
          if (step === 'plan') {
            if (!isSealed(body.p, PLAN_MAX)) throw new ApiError(400, 'bad_request', 'The plan is too large.');
            await limit(store, request);
            await store.cmd('HSET', groupKey(body.gid), '_', JSON.stringify({ ...m, p: body.p }));
            return json(request, 200, { ok: true });
          }
          if (!isSealed(body.e, ROUTE_MAX)) throw new ApiError(400, 'bad_request', 'The route is too large.');
          await limit(store, request);
          await store.cmd('HSET', groupKey(body.gid), '_', JSON.stringify({ ...m, e: body.e }));
          return json(request, 200, { ok: true });
        }
        if (step === 'put') {
          if (!isSealed(body.e, MEMBER_MAX)) throw new ApiError(400, 'bad_request', 'The place is missing or too large.');
          const m = await meta(store, body.gid);
          await limit(store, request);
          const at = now().toISOString();
          const k = groupKey(body.gid);
          if (body.mid != null) {
            if (!isId(body.mid) || !isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
            const old = readJson(await store.cmd('HGET', k, body.mid));
            if (old && old.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that shares this place can change it.');
            if (old) {
              await store.cmd('HSET', k, body.mid, JSON.stringify({ e: body.e, d: old.d, at }));
              return json(request, 200, { ok: true, mid: body.mid, at, p: m.p ?? null, members: membersOf(pairs(await store.cmd('HGETALL', k))) });
            }
            // left or removed meanwhile: in again as a new member
          }
          if (Number(await store.cmd('HLEN', k)) > GROUP_MEMBERS_MAX) throw new ApiError(409, 'full', 'This group is full.');
          const mid = newId();
          const del = newDel();
          await store.cmd('HSET', k, mid, JSON.stringify({ e: body.e, d: sha(del), at }));
          return json(request, 200, { ok: true, mid, del, at, p: m.p ?? null, members: membersOf(pairs(await store.cmd('HGETALL', k))) });
        }
        if (step === 'leave') {
          if (!isId(body.gid) || !isId(body.mid) || !isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
          const k = groupKey(body.gid);
          const old = readJson(await store.cmd('HGET', k, body.mid));
          if (old && old.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that shares this place can stop it.');
          if (old) await store.cmd('HDEL', k, body.mid);
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'group',
  );
}
