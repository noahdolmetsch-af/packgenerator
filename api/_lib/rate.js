/**
 * BF8 «Gratis-Grenzen» (Noah 13.10.2026): Strava's request numbers from its answer headers, passed to the
 * app as the field `rate` (src/lib/maintenance/rate.js shows them).
 */
/** "200,2000" → [200, 2000]; anything else → null. */
export function pair(v) {
  if (v == null) return null;
  const p = String(v).split(',').map((x) => Number(x.trim()));
  return p.length === 2 && p.every((n) => Number.isFinite(n) && n >= 0) ? p : null;
}

/** Strava's rate headers (a Headers object or a plain object) → the `rate` field, or null. */
export function rateOf(headers) {
  const get = (k) => (typeof headers?.get === 'function' ? headers.get(k) : (headers?.[k] ?? headers?.[k.toLowerCase()] ?? null));
  const out = { limit: pair(get('X-RateLimit-Limit')), usage: pair(get('X-RateLimit-Usage')), readLimit: pair(get('X-ReadRateLimit-Limit')), readUsage: pair(get('X-ReadRateLimit-Usage')) };
  if (!(out.limit && out.usage) && !(out.readLimit && out.readUsage)) return null;
  return out;
}

