/**
 * BF8 «Gratis-Grenzen» (Noah 13.10.2026): Strava allows only so many requests per 15 minutes and per
 * day. The server (api/strava.js) passes Strava's numbers back with every answer (field `rate`:
 * { limit: [15 min, day], usage: [15 min, day], readLimit, readUsage }); the app keeps the latest on
 * this device (db.meta RATE_KEY, never exported) and shows two bars under Ich › App maintenance. From
 * HOT % on, a calm line on Today (check.js). Vercel is left out on purpose.
 */
export const RATE_KEY = 'maint.rate';
export const HOT = 80;
const QUARTER = 15 * 60 * 1000;

const pct = (used, limit) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);

/**
 * Two bars: [{ key: 'short' | 'daily', used, limit, pct, fresh }]. Of the overall and the read limit,
 * the one that is fuller counts. fresh: the value still holds (same quarter hour, same UTC day; Strava
 * starts counting again at :00, :15, :30, :45 and at midnight UTC).
 */
export function rateBars(rate, now = new Date()) {
  if (!rate) return [];
  const at = Date.parse(rate.at ?? '');
  const t = now.getTime();
  const fresh = [Number.isFinite(at) && Math.floor(at / QUARTER) === Math.floor(t / QUARTER), Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === new Date(t).toISOString().slice(0, 10)];
  return ['short', 'daily'].map((key, i) => {
    const cands = [[rate.usage, rate.limit], [rate.readUsage, rate.readLimit]].filter(([u, l]) => u && l).map(([u, l]) => ({ used: u[i], limit: l[i], pct: pct(u[i], l[i]) }));
    const best = cands.sort((a, b) => b.pct - a.pct)[0] ?? { used: 0, limit: 0, pct: 0 };
    return { key, ...best, fresh: fresh[i] };
  });
}

/** The fullest bar that still holds, when it is at HOT % or more (else null). */
export function rateHot(rate, now = new Date()) {
  const hot = rateBars(rate, now).filter((b) => b.fresh && b.limit > 0 && b.pct >= HOT).sort((a, b) => b.pct - a.pct);
  return hot[0] ?? null;
}

/** Keep the latest numbers on this device (db.meta, never exported). Never throws. */
export async function saveRate(db, rate, now = new Date()) {
  if (!rate || typeof rate !== 'object') return;
  try {
    await db.meta.put({ key: RATE_KEY, at: now.toISOString(), limit: rate.limit ?? null, usage: rate.usage ?? null, readLimit: rate.readLimit ?? null, readUsage: rate.readUsage ?? null });
  } catch {
    /* no database (a test, a private window): the bars just stay empty */
  }
}
