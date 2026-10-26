/**
 * Paket R «Andere Menschen und Geld» (Noah 19.10.2026 «1b»: the app is open to everyone; rule
 * «0 Kosten»): a daily cap on the small server, so the free tiers of Vercel (about 1 million calls a
 * month) and Upstash (about 500 000 commands a month) are never passed, however many people use it.
 *
 * Every call of a function counts once per day (Europe/Zurich) for its own name and for the total.
 * Over a cap the server answers 429 «daily_cap» until midnight; nothing costs money, the app says
 * «Der Server hat heute genug gearbeitet. Morgen geht es wieder.» The watcher (/api/health, check
 * «tagesgrenze») opens a GitHub issue for Noah on a day that reached a cap.
 *
 * One Redis command per call (a small script: count, and give the key a 2-day life on the first count).
 * When the store is missing or does not answer, nothing is blocked (the cap only protects the store).
 *
 *   cap:<YYYY-MM-DD>:<name>   calls of one function that day
 *   cap:<YYYY-MM-DD>:total    calls of all of them
 */

/** Calls per day. A name that is missing here counts only for the total. */
export const DAY_CAPS = {
  total: 4000,
  sync: 2500,
  google: 800,
  'google-callback': 200,
  strava: 800,
  helper: 200,
  pay: 300,
  booking: 600,
  // cron-job.org wakes the server every minute (1440 a day); 25.10.2026 had 25 hours (end of summer time),
  // so its 1500 ticks plus the phones' own calls passed the old cap of 1500 and stopped the last reminders
  push: 2000,
  linkcheck: 300,
  account: 300,
  rwgps: 200, // «Neue Quellen» 20.10.2026: Ride with GPS links (api/lake.js ?action=rwgps)
  group: 1500, // Gruppen-Live-Karte 25.10.2026: the group map of a ride (api/sync.js ?action=group)
  ov: 1500, // stops and departures (api/lake.js ?action=ov-…; Vercel's cache answers most)
};
/** Never counted: the watcher must always be able to look. */
export const UNCAPPED = new Set(['health']);
export const CAP_TTL_S = 2 * 86_400;

export const CAP_LUA =
  "local n = redis.call('INCR', KEYS[1]) if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end " +
  "local t = redis.call('INCR', KEYS[2]) if t == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end " +
  'return {n, t}';

/** The day in Switzerland, YYYY-MM-DD. */
export const dayOf = (ms = Date.now()) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
export const capKeys = (name, day) => ({ one: `cap:${day}:${name}`, all: `cap:${day}:total` });

/**
 * Count one call of `name`. → { n, total, over } (over: the name's cap or the total cap is passed),
 * or null when nothing was counted (uncapped name, no store, the store failed).
 */
export async function countCall(store, name, now = Date.now(), caps = DAY_CAPS) {
  if (!store || UNCAPPED.has(name)) return null;
  const k = capKeys(name, dayOf(now));
  let out;
  try {
    out = await store.cmd('EVAL', CAP_LUA, 2, k.one, k.all, CAP_TTL_S);
  } catch {
    return null;
  }
  const n = Number(out?.[0]) || 0;
  const total = Number(out?.[1]) || 0;
  const own = caps[name];
  return { n, total, over: total > caps.total || (Number.isFinite(own) && n > own) };
}

/** The day's numbers for the watcher: { day, total, limit, over: [names over their cap] }. */
export async function dayUsage(store, day, caps = DAY_CAPS) {
  const names = Object.keys(caps).filter((n) => n !== 'total');
  const vals = (await store.cmd('MGET', capKeys('total', day).all, ...names.map((n) => capKeys(n, day).one))) ?? [];
  const total = Number(vals[0]) || 0;
  const over = names.filter((n, i) => (Number(vals[i + 1]) || 0) >= caps[n]);
  if (total >= caps.total) over.unshift('total');
  return { day, total, limit: caps.total, over };
}
