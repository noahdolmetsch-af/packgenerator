/**
 * «Sonnen-Ausfahrt» (Noah 06.11.2026 «1-5a», thread «Über die Nebelgrenze motivieren», variant A): on a day with
 * fog and sun above it, Today suggests one of your saved rides that climbs above the fog, with the time window:
 * the latest start, the km where the sun begins and when the fog clears. A suggestion, never a duty; it can be
 * switched off (setting 'sunRide') and put aside for the day («Not today», setting 'sunRideSkip').
 *
 * - When it shows (2a): fog with sun above it, your place in the fog, and the fog holds at least 2 more hours.
 * - Which rides: saved trips with a route and a profile whose start is within NEAR_KM of home (as the 07:00 push),
 *   that reach ABOVE_M above the fog top, start in the fog, and take at most MAX_MIN minutes. Nearest start first.
 * - The time: riding time as in «Surprise round» (ueberraschung.js minutesOf, the speed of «Curious», +1 h per 600 m).
 *   The latest start leaves MIN_SUN_MIN of sun before the fog clears (without a clearing: until END_STAYS_H).
 * Pure; the fog comes from nebelgrenze.js summary(), the km above the fog from nebelroute.js routeFog().
 * Tested in tests/sonnenfahrt.test.js.
 */
import { routeFog } from './nebelroute.js';

export const KEY = 'sunRide';
export const SKIP_KEY = 'sunRideSkip';
/** Rides count when their start lies within this many km of home (as «Fog line in the morning»). */
export const NEAR_KM = 60;
/** The ride must reach this far above the fog top (m). */
export const ABOVE_M = 100;
/** At most this long for a ride (minutes). */
export const MAX_MIN = 300;
/** At least this long in the sun before the fog clears (minutes). */
export const MIN_SUN_MIN = 60;
/** The fog must hold at least this many more minutes (2a). */
export const HOLDS_MIN = 120;
/** Without a clearing the window ends at this hour (the day is short in winter). */
export const END_STAYS_H = 16;
/** Riding speed on the flat (km/h, «Curious» of ueberraschung.js) and a start needs this much lead (minutes). */
export const KMH = 19;
export const LEAD_MIN = 15;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const rad = (d) => (d * Math.PI) / 180;
const km2 = (a, b) => 6371 * 2 * Math.asin(Math.sqrt(Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2));
const pts = (profile) => (profile ?? []).map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p?.km), Number(p?.m)])).filter((p) => fin(p[0]) && fin(p[1])).sort((a, b) => a[0] - b[0]);

/** The riding time in minutes from km and climb (m): the same formula as «Surprise round». */
export const minutesOf = (km, gainM, kmh = KMH) => Math.round(((km || 0) / kmh + (gainM || 0) / 600) * 60);

/** The riding time from the start to a km of the route (flat time plus the climb up to there), from its profile. */
export function minutesTo(profile, km, kmh = KMH) {
  const p = pts(profile);
  let gain = 0;
  for (let i = 0; i + 1 < p.length; i++) {
    const [k0, m0] = p[i];
    const [k1, m1] = p[i + 1];
    if (k0 >= km || k1 <= k0) break;
    const m = k1 <= km ? m1 : m0 + ((m1 - m0) * (km - k0)) / (k1 - k0);
    if (m > m0) gain += m - m0;
  }
  return minutesOf(km - (p[0]?.[0] ?? 0), gain, kmh);
}

/** The climb in m over the whole profile. */
const gainOf = (profile) => {
  const p = pts(profile);
  let g = 0;
  for (let i = 0; i + 1 < p.length; i++) if (p[i + 1][1] > p[i][1]) g += p[i + 1][1] - p[i][1];
  return Math.round(g);
};

/** Minutes of the local day for a time (ms) at a place with this offset (seconds). */
export const minuteOfDay = (ms, offset = 0) => {
  const m = Math.floor((ms + offset * 1000) / 60000) % 1440;
  return m < 0 ? m + 1440 : m;
};

/** Minutes of the day → "09:30". */
export const clock = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Does the day fit (2a)? Fog with sun above, your place in the fog, and the fog holds for HOLDS_MIN more minutes.
 * s: summary() of nebelgrenze.js; → { endMin (the window ends), clearsAt (hour | null) } or null.
 */
export function fits(s, now, offset = 0) {
  if (!s || s.now?.top == null || s.above !== 'sun' || !s.own?.in) return null;
  const nowMin = minuteOfDay(now, offset);
  const c = s.clearing;
  if (c?.kind === 'comes') return null;
  const clearsAt = c?.kind === 'clears' ? c.hour : null;
  const endMin = (clearsAt ?? END_STAYS_H) * 60;
  if (endMin - nowMin < HOLDS_MIN) return null;
  return { nowMin, endMin, clearsAt };
}

/**
 * The rides of `trips` that can take you over the fog today, nearest start first.
 * → [{ late, id, title, km, gainM, topM, aboveKm, toSunMin, totalMin, lastStartMin | null, startMin }]:
 * lastStartMin: the latest start that still gives MIN_SUN_MIN of sun (null: the fog stays, no deadline);
 * startMin: the start the times are told for (the latest, or in LEAD_MIN when that is later than now);
 * late: the latest start is already too near or gone.
 */
export function rides(trips, home, s, win) {
  if (!win || !home || !fin(Number(home.lat)) || !fin(Number(home.lon))) return [];
  const top = s.now.top;
  const seen = new Set();
  const earliest = win.nowMin + LEAD_MIN;
  return (trips ?? [])
    .filter((tr) => !tr.skipped && tr.title && fin(Number(tr.route?.start?.lat)) && fin(Number(tr.route?.start?.lon)) && pts(tr.route?.profile).length > 1)
    .map((tr) => {
      const r = routeFog(tr.route.profile, top);
      const toStart = km2({ lat: Number(home.lat), lon: Number(home.lon) }, { lat: Number(tr.route.start.lat), lon: Number(tr.route.start.lon) });
      if (!r || !r.startIn || r.aboveKm == null || r.topM < top + ABOVE_M || toStart > NEAR_KM) return null;
      const p = tr.route.profile;
      const totalMin = minutesOf(r.km, gainOf(p));
      if (totalMin > MAX_MIN) return null;
      const toSunMin = minutesTo(p, r.aboveKm);
      const lastStartMin = win.clearsAt != null ? Math.floor((win.endMin - MIN_SUN_MIN - toSunMin) / 5) * 5 : null;
      const late = lastStartMin != null && lastStartMin < earliest;
      return { late, id: tr.id, title: String(tr.title).slice(0, 60), km: Math.round(r.km), gainM: gainOf(p), topM: r.topM, aboveKm: Math.round(r.aboveKm), toSunMin, totalMin, lastStartMin, startMin: lastStartMin ?? Math.ceil(earliest / 5) * 5, dist: toStart };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist)
    .filter((o) => !seen.has(o.title) && seen.add(o.title))
    .map(({ dist, ...o }) => o);
}

/**
 * What Today shows: null (nothing), { kind: 'none' } (sun above the fog but no ride of yours reaches it) or
 * { kind: 'rides', list, clearsAt }.
 */
export function suggest({ s, now, offset = 0, trips, home }) {
  const win = fits(s, now, offset);
  if (!win) return null;
  const all = rides(trips, home, s, win);
  const list = all.filter((o) => !o.late);
  if (list.length) return { kind: 'rides', list, clearsAt: win.clearsAt };
  return all.length ? null : { kind: 'none' }; // all too late: say nothing; none reaches above the fog: say so
}
