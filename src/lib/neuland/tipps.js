/**
 * «Heute passt: Ausflugstipps» (Träume und Neuland N3, Noah 27.10.2026 «1-5 a»): three places you have never
 * been, that fit the free time of the day, in different directions. On Touren › Träume at the top, with the
 * weather of the day and «Round through it» (the Neuland-Runde, runde.js).
 *
 * - Places: Neuland passes, lakes and municipalities you have not reached (huts and peaks are left out: mostly
 *   not by bike). Your own hidden entries stay hidden.
 * - Reach: the hours × the speed of «Curious» (19 km/h) is the round; the place may lie at most half of it
 *   away, roads being ROAD_FACTOR longer than the straight line. A tip aims at about two thirds of that.
 * - Free time: the longest gap between 08:00 and 20:00 in the Google calendar copy (db.gEvents), when there
 *   is one; else the standard hours. Everything is a suggestion: the hours can be changed.
 * Pure, tested in tests/tipps.test.js. tripTips() is also meant for the «App denkt mit» suggestion.
 */
import { km } from './geo.js';
import { bearing, sectorOf, ROAD_FACTOR, LEVELS } from '../ueberraschung.js';

export const TIP_KINDS = ['passes', 'lakes', 'municipalities'];
export const TIP_HOURS = [2, 3, 4, 6];
export const TIP_HOURS_STD = 3;
export const TIP_KMH = LEVELS.find((l) => l.key === 'curious')?.kmh ?? 19;
/** Places closer than this are no outing. */
export const MIN_KM = 3;
const DAY_FROM = 8 * 60;
const DAY_TO = 20 * 60;

/** [lat, lon] of an item (a point, or the middle of an area), or null. */
export function pointOf(it) {
  if (Number.isFinite(Number(it?.lat)) && Number.isFinite(Number(it?.lon))) return [Number(it.lat), Number(it.lon)];
  if (Array.isArray(it?.c)) return [Number(it.c[1]), Number(it.c[0])];
  return null;
}

/** The furthest a place may lie (straight km) for a round of `hours`. */
export const reachKm = (hours, kmh = TIP_KMH) => (Number(hours) * kmh) / 2 / ROAD_FACTOR;

/**
 * Up to n tips: [{ id, cid, name, lat, lon, km (straight), roundKm (there and back on roads), alt, sector }].
 * collections: computeFrom(...).collections (items, visited); home { lat, lon }. Tips come from different
 * directions and, where possible, different kinds; nearest to the aim first.
 */
export function tripTips(collections = [], home, { hours = TIP_HOURS_STD, n = 3, kinds = TIP_KINDS } = {}) {
  const H = [Number(home?.lat), Number(home?.lon)];
  if (!H.every(Number.isFinite)) return [];
  const reach = reachKm(hours);
  const aim = reach * 0.66;
  const cands = [];
  for (const c of collections) {
    if (!kinds.includes(c.id)) continue;
    for (const it of c.items ?? []) {
      if (c.visited?.has?.(it.id)) continue;
      const p = pointOf(it);
      if (!p) continue;
      const d = km(H, p);
      if (d < MIN_KM || d > reach) continue;
      const sector = sectorOf(bearing({ lat: H[0], lon: H[1] }, { lat: p[0], lon: p[1] }));
      cands.push({ id: it.id, cid: c.id, name: it.name, lat: p[0], lon: p[1], km: Math.round(d * 10) / 10, roundKm: Math.round(2 * d * ROAD_FACTOR), alt: it.alt ?? null, sector, off: Math.abs(d - aim) });
    }
  }
  cands.sort((a, b) => a.off - b.off || a.name.localeCompare(b.name));
  const out = [];
  const tests = [(x) => !out.some((o) => o.sector === x.sector || o.cid === x.cid), (x) => !out.some((o) => o.sector === x.sector), () => true];
  for (const ok of tests)
    for (const x of cands) {
      if (out.length >= n) break;
      if (!out.includes(x) && ok(x)) out.push(x);
    }
  return out.map(({ off, ...x }) => x);
}

/** Minutes after midnight in Zürich of an ISO time. */
function minutesZ(iso) {
  const s = new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' });
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
const dayZ = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

/**
 * The longest free time of `day` between 08:00 and 20:00 (from `now` on, when it is today), after the busy
 * calendar events. → { hours (half hours, rounded down), from, to ('13:00') } or null when nothing is free.
 */
export function freeTime(events = [], day, now = null) {
  let start = DAY_FROM;
  if (now && dayZ(now) === day) start = Math.max(start, Math.ceil(minutesZ(now) / 30) * 30);
  if (start >= DAY_TO) return null;
  const busy = [];
  for (const e of events) {
    if (!e || e.busy === false) continue;
    if (e.allDay) {
      if (e.day <= day && (e.lastDay ?? e.day) >= day) busy.push([DAY_FROM, DAY_TO]);
      continue;
    }
    if (!e.start || !e.end) continue;
    const a = dayZ(e.start) < day ? 0 : dayZ(e.start) > day ? null : minutesZ(e.start);
    const b = dayZ(e.end) > day ? 24 * 60 : dayZ(e.end) < day ? null : minutesZ(e.end);
    if (a == null || b == null) continue;
    busy.push([a, b]);
  }
  busy.sort((x, y) => x[0] - y[0]);
  let best = null;
  let at = start;
  for (const [a, b] of [...busy, [DAY_TO, DAY_TO]]) {
    const end = Math.min(a, DAY_TO);
    if (end - at > (best ? best[1] - best[0] : 0)) best = [at, end];
    at = Math.max(at, b);
    if (at >= DAY_TO) break;
  }
  if (!best || best[1] - best[0] < 30) return null;
  const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return { hours: Math.floor((best[1] - best[0]) / 30) / 2, from: hm(best[0]), to: hm(best[1]) };
}

/** The hours to start with: the free time snapped down to a choice (at least the smallest), else the standard. */
export function startHours(free) {
  if (!free) return TIP_HOURS_STD;
  return [...TIP_HOURS].reverse().find((h) => h <= free.hours) ?? TIP_HOURS[0];
}
