/**
 * Mini-Tools (Noah 28.10.2026 «1b»): a question you share with people by link, and their answers come back
 * by themselves. The first tool is «Find a date» (like Doodle); a mini survey and more follow on the same store.
 *
 * Nothing on the server can be read:
 * - the question (title, days, the maker's public key) is sealed with a key that is only after the # of the link;
 * - each answer is sealed on the answering device for the maker alone (ECDH P-256 + AES-GCM with the maker's
 *   public key from the question). The others with the link cannot read it, and neither can the server.
 * Whoever made the question keeps an owner code to read the answers, change the question or end it.
 * An answer keeps its own code, so the same person can change it. Redis deletes everything after `days`.
 *
 *   mini:<id>             HASH  '_' → JSON { e, d: sha256(owner code), end }
 *                               <aid> → JSON { e, d: sha256(answer code), at }
 *   mini:rate:<ip>:<day>  STRING writes from one address today (at most MINI_WRITES_PER_DAY)
 *
 * In the sync function (/api/sync?action=mini), because the free plan allows only 12 functions:
 *   GET  ?action=mini&id=<id>                          → { ok, end, e }                 (anyone with the link)
 *   POST ?action=mini&step=new    { e, days? }         → { ok, id, del, end }
 *   POST ?action=mini&step=read   { id, del }          → { ok, end, e, answers: [{ a, e, at }] } (the maker)
 *   POST ?action=mini&step=edit   { id, del, e }       → { ok }                         (the maker: a changed question)
 *   POST ?action=mini&step=answer { id, e }            → { ok, aid, del, at }           (a new answer)
 *   POST ?action=mini&step=answer { id, aid, del, e }  → { ok, aid, at }                (the same answer, changed)
 *   POST ?action=mini&step=end    { id, del }          → { ok }                         (the maker: everything deleted)
 */
import { route, json, redisEnv, needStore, ApiError } from './core.js';
import { jsonBody } from './oauth.js';
import { isId, isDel, sha, newId, newDel, ipOf } from './spur.js';

export const MINI_DAYS = 30;
export const MINI_DAYS_MAX = 60;
export const QUESTION_MAX = 12_000;
export const ANSWER_MAX = 4_000;
export const ANSWERS_MAX = 60;
export const MINI_WRITES_PER_DAY = 300;
export const miniKey = (id) => `mini:${id}`;
const isSealed = (e, max) => typeof e === 'string' && e.length > 20 && e.length <= max && /^[A-Za-z0-9_-]+$/.test(e);

function pairs(list) {
  const m = new Map();
  if (Array.isArray(list)) for (let i = 0; i + 1 < list.length; i += 2) m.set(String(list[i]), list[i + 1]);
  else if (list && typeof list === 'object') for (const [k, v] of Object.entries(list)) m.set(k, v);
  return m;
}
function readJson(v) {
  if (typeof v !== 'string') return null;
  try {
    const r = JSON.parse(v);
    return r && typeof r === 'object' && typeof r.d === 'string' && typeof r.e === 'string' ? r : null;
  } catch {
    return null;
  }
}

export function makeMiniHandler({ env = () => redisEnv(), doFetch = (...a) => fetch(...a), now = () => new Date() } = {}) {
  const GONE = () => new ApiError(404, 'not_found', 'This question has ended.');
  async function head(store, id) {
    if (!isId(id)) throw new ApiError(400, 'bad_request', 'The link is not complete.');
    const m = readJson(await store.cmd('HGET', miniKey(id), '_'));
    if (!m || Date.parse(m.end) <= now().getTime()) throw GONE();
    return m;
  }
  async function owner(store, body) {
    if (!isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
    const m = await head(store, body.id);
    if (m.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that made the question can do this.');
    return m;
  }
  async function limit(store, request) {
    const rk = `mini:rate:${ipOf(request)}:${now().toISOString().slice(0, 10)}`;
    const n = Number(await store.cmd('INCR', rk));
    if (n === 1) await store.expire(rk, 86_400);
    if (n > MINI_WRITES_PER_DAY) throw new ApiError(429, 'too_many', 'Too many answers today. Try again tomorrow.');
  }
  return route(
    {
      GET: async (request) => {
        const id = new URL(request.url).searchParams.get('id');
        const store = needStore(env(), doFetch);
        const m = await head(store, id);
        return json(request, 200, { ok: true, end: m.end, e: m.e });
      },
      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const body = await jsonBody(request, QUESTION_MAX + 2000);
        const store = needStore(env(), doFetch);
        if (step === 'new') {
          if (!isSealed(body.e, QUESTION_MAX)) throw new ApiError(400, 'bad_request', 'The question is missing or too large.');
          await limit(store, request);
          const days = Math.min(MINI_DAYS_MAX, Math.max(1, Math.round(Number(body.days) || MINI_DAYS)));
          const id = newId();
          const del = newDel();
          const end = new Date(now().getTime() + days * 86_400_000).toISOString();
          await store.cmd('HSET', miniKey(id), '_', JSON.stringify({ e: body.e, d: sha(del), end }));
          await store.expire(miniKey(id), days * 86_400);
          return json(request, 200, { ok: true, id, del, end });
        }
        if (step === 'read') {
          const m = await owner(store, body);
          const all = pairs(await store.cmd('HGETALL', miniKey(body.id)));
          const answers = [...all]
            .filter(([k]) => k !== '_')
            .map(([k, v]) => [k, readJson(v)])
            .filter(([, r]) => r)
            .map(([k, r]) => ({ a: k, e: r.e, at: r.at ?? null }));
          return json(request, 200, { ok: true, end: m.end, e: m.e, answers });
        }
        if (step === 'edit') {
          if (!isSealed(body.e, QUESTION_MAX)) throw new ApiError(400, 'bad_request', 'The question is missing or too large.');
          const m = await owner(store, body);
          await limit(store, request);
          await store.cmd('HSET', miniKey(body.id), '_', JSON.stringify({ ...m, e: body.e }));
          return json(request, 200, { ok: true });
        }
        if (step === 'end') {
          if (!isId(body.id) || !isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
          const m = readJson(await store.cmd('HGET', miniKey(body.id), '_'));
          if (!m) return json(request, 200, { ok: true });
          if (m.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that made the question can do this.');
          await store.del(miniKey(body.id));
          return json(request, 200, { ok: true });
        }
        if (step === 'answer') {
          if (!isSealed(body.e, ANSWER_MAX)) throw new ApiError(400, 'bad_request', 'The answer is missing or too large.');
          await head(store, body.id);
          await limit(store, request);
          const k = miniKey(body.id);
          const at = now().toISOString();
          if (body.aid != null) {
            if (!isId(body.aid) || !isDel(body.del)) throw new ApiError(400, 'bad_request', 'The link or its code is wrong.');
            const old = readJson(await store.cmd('HGET', k, body.aid));
            if (old && old.d !== sha(body.del)) throw new ApiError(403, 'forbidden', 'Only the device that sent this answer can change it.');
            if (old) {
              await store.cmd('HSET', k, body.aid, JSON.stringify({ e: body.e, d: old.d, at }));
              return json(request, 200, { ok: true, aid: body.aid, at });
            }
            // deleted meanwhile: in again as a new answer
          }
          if (Number(await store.cmd('HLEN', k)) - 1 >= ANSWERS_MAX) throw new ApiError(409, 'full', 'This question has enough answers.');
          const aid = newId();
          const del = newDel();
          await store.cmd('HSET', k, aid, JSON.stringify({ e: body.e, d: sha(del), at }));
          return json(request, 200, { ok: true, aid, del, at });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'mini',
  );
}
