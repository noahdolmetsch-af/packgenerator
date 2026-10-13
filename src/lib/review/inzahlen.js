/**
 * SN4+ «SN4 plus» (mockups SN4e and SN4f-a, approved by Noah 13.10.2026: 1a, 2 «Wetter und Temperatur immer
 * an, plus Max. Puls», 3b, 4a, 5a): the numbers behind «Vergangene Touren».
 *
 * - SN4e: the columns of the table (COLS, all on at first; Tour and Zustand always stay) and per row the
 *   values from Strava (rowValues): Hm, moving and elapsed time, Ø km/h, Ø and max heart rate, the bike's
 *   type (answer 3b: only the type) and the Strava comment («Kommentar laden» / «–»).
 * - SN4f-a: «In Zahlen» under the table, 10 blocks in 4 groups (BLOCKS, GROUPS). Every block reads the rows
 *   of the table (answer 5a: period and filters), except V6 «Zum Vorjahr», which always compares 1 January
 *   up to today with last year up to the same date (answer 4a).
 *
 * Heart rate is observation only: these functions give numbers, never a judgement. Unknown is null (the
 * page shows a calm «–»). Pure functions, tested in tests/sn4plus.test.js.
 */
import { tripEntries, tripActs, tripValues } from './werte.js';
import { periodOf, periodStats } from './rueckblick.js';
import { heartOf } from '../kmbook.js';
import { tripStats } from '../trips.js';
import { addMonths } from '../yearreview.js';
import { monthKeys } from './werte.js';
import { COLS, COL_KEYS, GROUPS, GROUP_KEYS, BLOCK_KEYS } from './pastcols.js';
import { tripPower } from './power.js';

export { VIEW_KEY, COLS, COL_KEYS, COL_GROUPS, BLOCKS, BLOCK_KEYS, GROUPS, GROUP_KEYS } from './pastcols.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const sumOf = (list, f) => {
  const xs = list.map(f).filter((v) => typeof v === 'number' && Number.isFinite(v));
  return xs.length ? xs.reduce((s, v) => s + v, 0) : null;
};

/* ---------- SN4e: the columns ---------- */

/** The view as stored, with the defaults: every column on, the first group open, every block on and open. */
export function viewOf(value) {
  const list = (x, keys) => (Array.isArray(x) ? x.filter((k) => keys.includes(k)) : []);
  return {
    hide: list(value?.hide, COL_KEYS),
    open: Array.isArray(value?.open) ? list(value.open, GROUP_KEYS) : [GROUPS[0].key],
    off: list(value?.off, BLOCK_KEYS),
    shut: list(value?.shut, BLOCK_KEYS),
  };
}
/** The columns shown: [column], in the table's order. */
export const shownCols = (view) => COLS.filter((c) => !view.hide.includes(c.key));
/** One key switched in a list (add when missing, else take out). */
export const toggled = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

/* ---------- SN4e: the values of a row ---------- */

/** The ledger's Strava rides of a row: the trip's days (trip rows), else that day and about the same km. */
export function rowEntries(row, entries = []) {
  if (row.kind === 'trip') return tripEntries(entries, row.trip, row.end);
  return entries.filter((e) => e.source === 'strava' && e.kind === 'ride' && e.state !== 'removed' && e.date === row.start && (!pos(row.km) || Math.abs((Number(e.km) || 0) - row.km) <= Math.max(2, row.km * 0.1)));
}

/** The comment of a row's activities: { state: 'text' | 'load' | 'empty' | 'none', text, ids }. */
export function commentOf(acts = []) {
  if (!acts.length) return { state: 'none', text: '', ids: [] };
  const texts = acts.map((a) => (typeof a.desc === 'string' ? a.desc.trim() : '')).filter(Boolean);
  const missing = acts.filter((a) => a.desc === undefined).map((a) => a.id);
  if (texts.length) return { state: 'text', text: texts.join('\n'), ids: missing };
  if (missing.length) return { state: 'load', text: '', ids: missing };
  return { state: 'empty', text: '', ids: [] };
}

/**
 * The values of one row of the table: { gainM, movingS, elapsedS, kmh, hrAvg, hrMax, type, comment, startAt }
 * (SN4g: plus bikeId, sport, surface, watts, wAvg, wMax, wNorm, tempAvg; watts only from a power meter).
 * acts: all activities (actOf shape), entries: the ride ledger, bikes: for the type (bike.type, raw).
 * Without activities the times come from the uploaded rides (moving, and moving plus pauses), the heart rate
 * from the ledger (kmBook hrAvg / hrMax), and the comment is «–».
 */
export function rowValues(row, { acts = [], entries = [], bikes = [], bounds = null } = {}) {
  // SN4+: wire to training.js activitiesForTrip when the Training PR lands
  const mine = row.kind === 'trip' ? tripActs(acts, row.trip, row.end) : acts.filter((a) => a.day === row.start);
  const ents = rowEntries(row, entries);
  const moving = sumOf(mine, (a) => a.movingS);
  const elapsed = sumOf(mine, (a) => a.elapsedS);
  const actKm = sumOf(mine, (a) => a.km);
  const movingS = moving ?? (pos(row.movingH) ? Math.round(row.movingH * 3600) : null);
  const elapsedS = elapsed ?? (pos(row.totalH) ? Math.round(row.totalH * 3600) : null);
  const heart = tripValues({ acts: mine, entries: ents, bounds });
  const bikeId = row.trip?.bikeId ?? ents.find((e) => e.bikeId)?.bikeId ?? null;
  const bike = bikeId ? bikes.find((b) => b.id === bikeId) ?? null : null;
  const startAt = row.rides?.find((r) => r.startAt)?.startAt ?? mine.find((a) => a.startAt)?.startAt ?? ents.find((e) => e.time)?.time ?? null;
  // SN4g: power only from a power meter (Strava's estimate counts as «ohne Wattwerte»), NP with it
  // SN4g: wire to training.js when the Training PR lands
  const pw = tripPower({ acts: mine });
  const watts = !!pw?.measured;
  const temp = sumOf(mine.filter((a) => typeof a.tempAvg === 'number'), (a) => a.tempAvg);
  const nTemp = mine.filter((a) => typeof a.tempAvg === 'number').length;
  return {
    gainM: row.gainM ?? null,
    movingS,
    elapsedS: elapsedS && movingS && elapsedS < movingS ? movingS : elapsedS,
    kmh: moving && actKm ? r1(actKm / (moving / 3600)) : row.kmh ?? (mine.length === 1 && pos(mine[0].spdAvg) ? r1(mine[0].spdAvg) : null),
    hrAvg: heart?.hrAvg ?? null,
    hrMax: heart?.hrMax ?? null,
    type: bike?.type ? String(bike.type).trim() || null : null,
    comment: commentOf(mine),
    zones: heart?.zones ?? null,
    startAt,
    acts: mine,
    // SN4g
    bikeId,
    sport: mine.find((a) => a.type)?.type ?? ents.find((e) => e.type)?.type ?? null,
    surface: ents.find((e) => e.surface)?.surface ?? null,
    watts,
    wAvg: watts ? pw.avg : null,
    wMax: watts ? pw.max : null,
    wNorm: watts ? pw.np ?? null : null,
    tempAvg: nTemp ? Math.round(temp / nTemp) : null,
  };
}

/* ---------- SN4f-a: the blocks and their groups ---------- */

/** The months of the bars: 12 months up to today, this year from January, or all since the first row. */
export function monthsOf(mode, today, rows = []) {
  if (mode === '12m') return monthKeys(addMonths(today, -11), today);
  if (mode === 'year') return monthKeys(`${today.slice(0, 4)}-01-01`, today);
  const first = rows.map((r) => r.start).filter(Boolean).sort()[0];
  return first ? monthKeys(first, today) : [];
}

/** V1: km and Hm per month: [{ ym, km, gainM, n }] (a trip counts in the month it started). */
export function monthSums(rows = [], months = []) {
  return months.map((ym) => {
    const rs = rows.filter((r) => r.start?.startsWith(ym));
    return { ym, n: rs.length, km: Math.round(sumOf(rs, (r) => r.km) ?? 0), gainM: Math.round(sumOf(rs, (r) => r.gainM) ?? 0) };
  });
}

/**
 * V2: the best values of the rows: { ride, gain, speed, trip }, each { value, title, id } or null.
 * ride: the longest single ride (a day of a trip counts on its own); gain: most Hm of a row; speed: the
 * fastest Ø (km over moving time); trip: the longest trip (most days, then most km).
 */
export function bestValues(rows = []) {
  const top = (list, f) => {
    const xs = list.filter((x) => pos(f(x)) != null).sort((a, b) => f(b) - f(a));
    return xs.length ? xs[0] : null;
  };
  let ride = null;
  for (const r of rows) {
    const rideKms = r.rides?.length ? r.rides.map((x) => pos(x.km)).filter(Boolean) : [];
    const km = rideKms.length ? Math.max(...rideKms) : r.days === 1 ? pos(r.km) : null;
    if (km != null && (!ride || km > ride.value)) ride = { value: r1(km), title: r.title, id: r.id };
  }
  const g = top(rows, (r) => r.gainM);
  const s = top(rows, (r) => r.kmh);
  const multi = rows.filter((r) => r.kind === 'trip');
  const tr = multi.length ? [...multi].sort((a, b) => b.days - a.days || (b.km ?? 0) - (a.km ?? 0))[0] : null;
  return {
    ride,
    gain: g ? { value: g.gainM, title: g.title, id: g.id } : null,
    speed: s ? { value: s.kmh, title: s.title, id: s.id } : null,
    trip: tr ? { value: tr.days, km: tr.km, title: tr.title, id: tr.id } : null,
  };
}

/**
 * V6 (answer 4a): 1 January up to today against last year up to the same date, from ALL trips (not the
 * filters, answer 5a). → { year, prevYear, to, prevTo, rows: [{ key, cur, prev, diff }] }.
 */
export function lastYear(facts = [], today) {
  const p = periodOf('year', today);
  const s = periodStats(facts, [], 'year', today);
  const pick = (key) => s.stats.find((x) => x.key === key);
  const rows = ['trips', 'km', 'gainM', 'movingH'].map((key) => {
    const x = pick(key);
    const cur = x?.value ?? (key === 'trips' ? 0 : null);
    const prev = x?.prev ?? (key === 'trips' ? 0 : null);
    return { key, cur, prev, diff: cur != null && prev != null ? (key === 'movingH' ? Math.round((cur - prev) * 100) / 100 : Math.round(cur - prev)) : null };
  });
  return { year: Number(today.slice(0, 4)), prevYear: Number(today.slice(0, 4)) - 1, to: p.to, prevTo: p.prevTo, rows };
}

/* ---------- V10: when you ride ---------- */

/** The hour (0–23) of an instant on the clock of a time zone (the app's home: Zurich). */
export function hourIn(iso, tz = 'Europe/Zurich') {
  const ms = Date.parse(iso ?? '');
  if (!Number.isFinite(ms)) return null;
  const h = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date(ms));
  return Number(h) % 24;
}
/** The time of day of an hour: morning before 12, afternoon 12–17, evening from 17. */
export const partOf = (h) => (h == null ? null : h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
export const PARTS = ['morning', 'afternoon', 'evening'];

/**
 * V10: rows per weekday (Monday first, the start day) and per time of day (the start time on the Zurich
 * clock). starts: { [row id]: ISO start time | null }. → { days: [7 counts], parts: { morning, … }, without: [titles] }.
 */
export function whenBuckets(rows = [], starts = {}, tz = 'Europe/Zurich') {
  const days = [0, 0, 0, 0, 0, 0, 0];
  const parts = { morning: 0, afternoon: 0, evening: 0 };
  const without = [];
  for (const r of rows) {
    if (!r.start) continue;
    const wd = (new Date(`${r.start}T12:00:00Z`).getUTCDay() + 6) % 7;
    days[wd]++;
    const p = partOf(hourIn(starts[r.id], tz));
    if (p) parts[p]++;
    else without.push(r.title);
  }
  return { days, parts, without };
}

/* ---------- V7: the map ---------- */

/** The line of a row: the recorded rides' lines, else the planned route's line. [[[lat, lon], …], …]. */
export function linesOf(row) {
  const rides = (row.rides ?? []).map((r) => r.line).filter((l) => Array.isArray(l) && l.length > 1);
  if (rides.length) return rides;
  const l = row.trip?.route?.line;
  return Array.isArray(l) && l.length > 1 ? [l] : [];
}

/** How often a stretch was ridden, in three steps: 1×, 2–3×, 4× and more. */
export const levelOf = (n) => (n >= 4 ? 3 : n >= 2 ? 2 : 1);

/**
 * V7: every stretch of every route, with how many rows ride it. The points are snapped to a grid of about
 * `cell` degrees (≈ 500 m), so the same road ridden twice is the same stretch.
 * → { routes: [{ id, title, segs: [{ a: [lat, lon], b: [lat, lon], n, key }] }], box: { s, w, n, e } | null }.
 */
export function routeMap(rows = [], cell = 0.005) {
  const snap = (p) => `${Math.round(p[0] / cell)}:${Math.round(p[1] / cell)}`;
  const keyOf = (a, b) => [snap(a), snap(b)].sort().join('|');
  const routes = [];
  const count = new Map();
  for (const r of rows) {
    const lines = linesOf(r);
    if (!lines.length) continue;
    const segs = [];
    const mine = new Set();
    for (const l of lines) {
      for (let i = 1; i < l.length; i++) {
        const a = l[i - 1];
        const b = l[i];
        if (!Array.isArray(a) || !Array.isArray(b)) continue;
        const key = keyOf(a, b);
        segs.push({ a, b, key });
        if (snap(a) !== snap(b)) mine.add(key);
      }
    }
    for (const k of mine) count.set(k, (count.get(k) ?? 0) + 1);
    routes.push({ id: r.id, title: r.title, segs });
  }
  if (!routes.length) return { routes: [], box: null };
  let s = 90, w = 180, n = -90, e = -180;
  for (const r of routes) for (const g of r.segs) for (const p of [g.a, g.b]) (s = Math.min(s, p[0])), (n = Math.max(n, p[0])), (w = Math.min(w, p[1])), (e = Math.max(e, p[1]));
  for (const r of routes) for (const g of r.segs) g.n = count.get(g.key) ?? 1;
  return { routes, box: { s, w, n, e } };
}

/** Which rows ride the stretch `key`: [titles]. */
export const routesOn = (map, key) => map.routes.filter((r) => r.segs.some((g) => g.key === key)).map((r) => r.title);

/* ---------- V3, V12: bikes and luggage ---------- */

/** V3: per bike the rows, km and hours in motion, most km first: [{ id, name, type, n, km, h, share }]. */
export function perBike(rows = [], bikes = [], bikeOf = (r) => r.trip?.bikeId ?? null) {
  const by = new Map();
  for (const r of rows) {
    const id = bikeOf(r);
    if (!id) continue;
    const x = by.get(id) ?? { id, n: 0, km: 0, h: 0 };
    x.n++;
    x.km += pos(r.km) ?? 0;
    x.h += pos(r.movingH) ?? 0;
    by.set(id, x);
  }
  const all = [...by.values()];
  const kmAll = all.reduce((s, x) => s + x.km, 0);
  return all
    .map((x) => {
      const b = bikes.find((y) => y.id === x.id);
      return { ...x, name: b?.name ?? rows.find((r) => r.trip?.bikeId === x.id)?.bike ?? x.id, type: b?.type ?? null, km: Math.round(x.km), h: Math.round(x.h * 100) / 100, share: kmAll ? x.km / kmAll : 0 };
    })
    .sort((a, b) => b.km - a.km || b.n - a.n || String(a.name).localeCompare(String(b.name)));
}

/**
 * V12: the luggage of the trips with a packing list: Ø base weight per trip (gear in the bags and on the
 * bike, without food, water and what you wear), for day rides and for trips of several days, and the
 * items packed most often. → { avgG, dayG, multiG, n, top: [{ id, item, n }] }.
 */
export function packStats(rows = [], items = [], containers = [], bikes = [], topN = 5) {
  const trips = rows.filter((r) => r.kind === 'trip' && (r.trip?.entries ?? []).length);
  const weights = [];
  const seen = new Map();
  for (const r of trips) {
    const bike = bikes.find((b) => b.id === r.trip.bikeId) ?? null;
    let g = null;
    try {
      g = items.length ? tripStats(r.trip, items, containers, bike, null).baseG || null : null;
    } catch {
      g = null;
    }
    if (g) weights.push({ g, multi: r.days > 1 });
    for (const id of new Set(r.trip.entries.map((e) => e.itemId))) seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const avg = (xs) => (xs.length ? Math.round(xs.reduce((s, x) => s + x.g, 0) / xs.length) : null);
  const top = [...seen.entries()]
    .map(([id, n]) => ({ id, n, item: items.find((i) => i.id === id) ?? null }))
    .filter((x) => x.item)
    .sort((a, b) => b.n - a.n || String(a.item.name).localeCompare(String(b.item.name)))
    .slice(0, topN);
  return { n: trips.length, avgG: avg(weights), dayG: avg(weights.filter((x) => !x.multi)), multiG: avg(weights.filter((x) => x.multi)), top };
}

/* ---------- V8: time in heart rate zones per month ---------- */

/** V8: seconds in Z1–Z5 per month of the rows' activities: [{ ym, zones: [5] | null, zoneS }]. zonesOf: { [row id]: [5] | null }. */
export function zoneMonths(rows = [], months = [], zonesOf = {}) {
  return months.map((ym) => {
    let zs = null;
    for (const r of rows) {
      const z = zonesOf[r.id];
      if (!r.start?.startsWith(ym) || !z) continue;
      zs = zs ? zs.map((s, i) => s + (z[i] ?? 0)) : [...z];
    }
    const zoneS = zs ? zs.reduce((s, v) => s + v, 0) : 0;
    return { ym, zones: zoneS ? zs : null, zoneS };
  });
}

/* ---------- V9, V11: weather and footprint ---------- */

/** V9: { known, wet, cold: { value, title, id } | null, hot: … } of the rows with a weather. */
export function weatherSum(rows = []) {
  const known = rows.filter((r) => r.rain?.wet != null || r.tmin != null || r.tmax != null);
  const withMin = rows.filter((r) => typeof r.tmin === 'number').sort((a, b) => a.tmin - b.tmin);
  const withMax = rows.filter((r) => typeof r.tmax === 'number').sort((a, b) => b.tmax - a.tmax);
  return {
    known: known.length,
    wet: rows.filter((r) => r.rain?.wet === true).length,
    cold: withMin.length ? { value: withMin[0].tmin, title: withMin[0].title, id: withMin[0].id } : null,
    hot: withMax.length ? { value: withMax[0].tmax, title: withMax[0].title, id: withMax[0].id } : null,
  };
}

/** WU3 «Fussabdruck»: kg CO₂ a car would have emitted on the same km (an estimate, 0.15 kg per car km). */
export const CO2_PER_KM = 0.15;
/** V11: { km, kg } of the rows ridden by bike (trips without a bike do not count). */
export function footprint(rows = []) {
  const km = Math.round(sumOf(rows.filter((r) => r.art !== 'other'), (r) => r.km) ?? 0);
  return { km, kg: Math.round(km * CO2_PER_KM) };
}

/** The heart rate of the rows as one observation (the ledger): { avg, max, n } or null. */
export const heartAll = (rows = [], entries = []) => heartOf(rows.flatMap((r) => rowEntries(r, entries)));
