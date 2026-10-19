/**
 * P8 «Automatischer Abgleich» (Noah 18.10.2026 «1b und a möglich 2b 3b»): the phone and the computer
 * keep the same data through a small store on the server (Upstash Redis, free tier, already connected
 * to the Vercel project «packgen»).
 *
 * The server never sees the data: every record arrives encrypted on the device (AES-GCM, the key comes
 * from the pairing code and never leaves the devices), under an opaque name (k, 32 hex). The server only
 * keeps, per space, a counter and for every record its latest version number and the sealed envelope.
 *
 *   sync:<space>:d  HASH  k → "<seq>:<envelope>"   (a deleted record is an envelope too, «tombstone»)
 *   sync:<space>:l  ZSET  k scored by <seq>        (what changed since a number)
 *   sync:<space>:n  STRING the last number given out
 *
 * space = sha256 of the device token, so only devices that know the pairing code can read or write.
 * A space that nobody opens for SPACE_TTL_S is removed by Redis.
 */
import { createHash } from 'node:crypto';

export const SPACE_TTL_S = 400 * 86_400;
/** Most records in one push, and the most bytes one pull answer carries (Vercel answers stay below 4.5 MB). */
export const PUSH_MAX = 200;
export const PULL_MAX = 200;
export const PULL_BYTES = 3_000_000;
/** The largest request body (Vercel takes at most 4.5 MB). */
export const BODY_MAX = 4_200_000;

export const isToken = (t) => typeof t === 'string' && /^[0-9a-f]{64}$/.test(t);
export const isRecKey = (k) => typeof k === 'string' && /^[0-9a-f]{32}$/.test(k);
const isEnvelope = (e) => typeof e === 'string' && e.length > 0 && e.length <= BODY_MAX && /^[A-Za-z0-9+/=]+$/.test(e);

export const spaceOf = (token) => createHash('sha256').update(`pg-sync-space:${token}`).digest('hex').slice(0, 32);
export const keysOf = (space) => ({ data: `sync:${space}:d`, log: `sync:${space}:l`, seq: `sync:${space}:n` });

/** The checked records of a push, or null when anything is off. */
export function readPush(items) {
  if (!Array.isArray(items) || !items.length || items.length > PUSH_MAX) return null;
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = it?.k;
    const base = Number(it?.base);
    if (!isRecKey(k) || seen.has(k) || !Number.isSafeInteger(base) || base < 0 || !isEnvelope(it?.e)) return null;
    seen.add(k);
    out.push({ k, base, e: it.e });
  }
  return out;
}

/**
 * One push in one step on the server (Redis runs a script as a whole): a record is written only when
 * nobody wrote it after the version the device last saw (base); otherwise it comes back as a conflict.
 * KEYS: data, log, seq. ARGV: ttl, n, then k, base, envelope for each record.
 * Answer: a flat list, 'o', k, seq for a written record and 'c', k, seq for a conflict.
 */
export const PUSH_LUA = `
local ttl = tonumber(ARGV[1])
local n = tonumber(ARGV[2])
local out = {}
for i = 0, n - 1 do
  local k = ARGV[3 + i * 3]
  local base = tonumber(ARGV[4 + i * 3])
  local e = ARGV[5 + i * 3]
  local cur = redis.call('HGET', KEYS[1], k)
  local cs = 0
  if cur then cs = tonumber(string.match(cur, '^(%d+):')) or 0 end
  if cs > base then
    out[#out + 1] = 'c'
    out[#out + 1] = k
    out[#out + 1] = tostring(cs)
  else
    local s = redis.call('INCR', KEYS[3])
    redis.call('HSET', KEYS[1], k, s .. ':' .. e)
    redis.call('ZADD', KEYS[2], s, k)
    out[#out + 1] = 'o'
    out[#out + 1] = k
    out[#out + 1] = tostring(s)
  end
end
redis.call('EXPIRE', KEYS[1], ttl)
redis.call('EXPIRE', KEYS[2], ttl)
redis.call('EXPIRE', KEYS[3], ttl)
return out
`;

/** The script's flat answer → { done: [{ k, s }], conflicts: [{ k, s }] } */
export function readPushAnswer(flat) {
  const done = [];
  const conflicts = [];
  const list = Array.isArray(flat) ? flat : [];
  for (let i = 0; i + 2 < list.length; i += 3) {
    const row = { k: String(list[i + 1]), s: Number(list[i + 2]) };
    if (list[i] === 'o') done.push(row);
    else if (list[i] === 'c') conflicts.push(row);
  }
  return { done, conflicts };
}

/** "<seq>:<envelope>" → { s, e }, or null. */
export function readStored(v) {
  if (typeof v !== 'string') return null;
  const i = v.indexOf(':');
  if (i < 1) return null;
  const s = Number(v.slice(0, i));
  return Number.isSafeInteger(s) ? { s, e: v.slice(i + 1) } : null;
}
