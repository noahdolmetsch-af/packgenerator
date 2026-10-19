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
