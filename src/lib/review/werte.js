/**
 * SN2+ «SN2 plus» (mockups SN2e–SN2i, approved by Noah 13.10.2026: 1a 2b 3 «a und sonst b» 4b 5b):
 * the numbers behind «Puls und Leistung» in a trip's Rückblick, the Logbuch filters Velo and Reiseart,
 * the pace per bike and surface, planned against ridden, and the months. Heart rate and power are
 * observation only: no judgement, no good or bad.
 *
 * The components take plain data: rides and activity-like objects
 * ({ day | date, km, hm | gainM, movingS | movingH, hrAvg, hrMax, hist {bpm: seconds}, wAvg, wMax, wDevice, w20 })
 * and zone bounds (the upper heart rate of Z1–Z4). Pure functions, tested in tests/sn2plus.test.js.
 */
import { learnPace } from '../pace.js';
import { heartOf } from '../kmbook.js';
import { planVsReal } from './rueckblick.js';
import { tripEnd } from '../tripstate.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const r1 = (v) => Math.round(v * 10) / 10;
const dayOf = (a) => a?.day ?? a?.date ?? null;
const hoursOf = (a) => pos(a?.movingH) ?? (pos(a?.movingS) ? a.movingS / 3600 : null);

/* ---------- surface (answer 3 «a und sonst b») ---------- */

/** The three surfaces, in their order (English keys for t()). */
export const SURFACES = [
  { key: 'road', name: 'Road|surface' },
  { key: 'gravel', name: 'Gravel|surface' },
  { key: 'trail', name: 'Trail|surface' },
];
export const SURFACE_KEYS = SURFACES.map((s) => s.key);
export const surfaceName = (key) => SURFACES.find((s) => s.key === key)?.name ?? null;

/** The surface of a Strava sport type: Ride → road, Gravel Ride → gravel, Mountain Bike Ride → trail; else null. */
export function surfaceOfType(type) {
  const s = String(type ?? '').replace(/[\s_-]+/g, '').toLowerCase();
  if (!s) return null;
  if (s.includes('mountainbike') || s === 'mtb') return 'trail';
  if (s.includes('gravel')) return 'gravel';
  if (s.endsWith('ride')) return 'road';
  return null;
}

/** A ride's surface: changed by you on the ride, else from its sport type, else the bike's fixed one. */
export const surfaceOf = (ride, bike = null) => (SURFACE_KEYS.includes(ride?.surface) ? ride.surface : surfaceOfType(ride?.type) ?? (SURFACE_KEYS.includes(bike?.surface) ? bike.surface : null));

/* ---------- heart rate zones ---------- */

/** The standard zones from the highest heart rate: Z1 up to 60 %, Z2 70 %, Z3 80 %, Z4 90 %, Z5 above. */
export const ZONE_PCT = [0.6, 0.7, 0.8, 0.9];
export const standardZones = (maxHr) => (pos(maxHr) ? ZONE_PCT.map((p) => Math.round(maxHr * p)) : null);
/** Four rising upper bounds (Z1–Z4)? */
export const validBounds = (b) => Array.isArray(b) && b.length === 4 && b.every((v, i) => pos(v) && (i === 0 || v > b[i - 1]));

/** The five zones as rows: [{ z: 1, from, to }] (from of Z1 and to of Z5 are null). */
export const zoneRows = (bounds) => (validBounds(bounds) ? [0, 1, 2, 3, 4].map((i) => ({ z: i + 1, from: i ? bounds[i - 1] + 1 : null, to: i < 4 ? bounds[i] : null })) : []);

/** Seconds in Z1–Z5 of a heart rate histogram ({ bpm: seconds }); null without one. */
export function zoneTimes(hist, bounds) {
  if (!hist || !validBounds(bounds)) return null;
  const out = [0, 0, 0, 0, 0];
  let any = false;
  for (const [bpm, s] of Object.entries(hist)) {
    const b = Number(bpm);
    const secs = Number(s);
    if (!Number.isFinite(b) || !(secs > 0)) continue;
    const z = bounds.findIndex((top) => b <= top);
    out[z < 0 ? 4 : z] += secs;
    any = true;
  }
  return any ? out : null;
}
const addZones = (a, b) => (a ? a.map((s, i) => s + (b?.[i] ?? 0)) : b ? [...b] : null);

/* ---------- «Puls und Leistung» of a trip (SN2e) ---------- */

/** Power of activities: measured when every one with power had a power meter, else estimated by Strava. */
function powerOf(acts) {
  const ws = acts.filter((a) => pos(a.wAvg));
  if (!ws.length) return null;
  const measured = ws.every((a) => a.wDevice === true);
  const weight = (a) => hoursOf(a) ?? pos(a.km) ?? 1;
  const sum = ws.reduce((s, a) => s + weight(a), 0);
  const w20s = ws.filter((a) => a.wDevice === true && pos(a.w20)).map((a) => a.w20);
  return {
    avg: Math.round(ws.reduce((s, a) => s + a.wAvg * weight(a), 0) / sum),
    max: Math.max(...ws.map((a) => Number(a.wMax) || 0)) || null,
    w20: measured && w20s.length ? Math.max(...w20s) : null,
    measured,
  };
}

/**
 * «Puls und Leistung» of a trip, or null when nothing is known (the card then shows a quiet line).
 * acts: the trip's activities (may be []); entries: the trip's Strava rides in the ledger (heart rate);
 * bounds: the zone bounds. → { zones: [{ z, s, pct }] | null, zoneS, hrAvg, hrMax, power, n }.
 */
export function tripValues({ acts = [], entries = [], bounds = null } = {}) {
  const withHeart = acts.filter((a) => pos(a.hrAvg));
  let hrAvg = null;
  let hrMax = null;
  if (withHeart.length) {
    const weight = (a) => hoursOf(a) ?? pos(a.km) ?? 1;
    const sum = withHeart.reduce((s, a) => s + weight(a), 0);
    hrAvg = Math.round(withHeart.reduce((s, a) => s + a.hrAvg * weight(a), 0) / sum);
    hrMax = Math.max(...withHeart.map((a) => Number(a.hrMax) || 0)) || null;
  } else {
    const h = heartOf(entries);
    if (h) (hrAvg = h.avg), (hrMax = h.max);
  }
  let zs = null;
  for (const a of acts) zs = addZones(zs, zoneTimes(a.hist, bounds));
  const zoneS = zs ? zs.reduce((s, v) => s + v, 0) : 0;
  const zones = zs && zoneS ? zs.map((s, i) => ({ z: i + 1, s, pct: Math.round((s / zoneS) * 100) })) : null;
  const power = powerOf(acts);
  if (hrAvg == null && !zones && !power) return null;
  return { zones, zoneS, hrAvg, hrMax, power, n: Math.max(acts.length, entries.length) };
}

/** The trip's Strava rides in the ledger: on its days, of its bike when it has one. */
export function tripEntries(entries = [], trip, end) {
  if (!trip?.startDate) return [];
  const last = end && end >= trip.startDate ? end : trip.startDate;
  return entries.filter((e) => e.source === 'strava' && e.kind === 'ride' && e.state !== 'removed' && e.date >= trip.startDate && e.date <= last && (!trip.bikeId || !e.bikeId || e.bikeId === trip.bikeId));
}

/** The trip's activities: on its days (SN2+: wire to training.js activitiesForTrip when the Training PR lands). */
export function tripActs(acts = [], trip, end) {
  if (!trip?.startDate) return [];
  const last = end && end >= trip.startDate ? end : trip.startDate;
  return acts.filter((a) => dayOf(a) && dayOf(a) >= trip.startDate && dayOf(a) <= last);
}

/* ---------- the rides behind the pace (SN2h) ---------- */

/** One ride and one ledger entry: the same day and about the same km. */
const sameRide = (e, r) => e.kind === 'ride' && e.state !== 'removed' && e.date === r.date && Math.abs((Number(e.km) || 0) - (Number(r.km) || 0)) <= Math.max(2, (Number(r.km) || 0) * 0.1);

/**
 * Every ride that knows its moving time, with its bike and surface:
 * [{ id, from: 'act' | 'pace', date, name, km, gainM, movingH, bikeId, type, surface (yours), entryId, paceId,
 *    hrAvg, hrMax, hist, wAvg, wMax, wDevice, w20, use }].
 * acts: activities (Strava, with movingS); entries: the ride ledger (bike, sport type, your surface, heart
 * rate); paceRides: the rides of «Dein Tempo» (GPX, uploads); trips: a GPX ride on a trip day takes its bike.
 */
export function tempoRides({ acts = [], entries = [], paceRides = [], trips = [] } = {}) {
  const byStrava = new Map(entries.filter((e) => e.stravaId).map((e) => [String(e.stravaId), e]));
  const out = [];
  for (const a of acts) {
    const h = hoursOf(a);
    if (!h || !pos(a.km) || !dayOf(a)) continue;
    const e = byStrava.get(String(a.id)) ?? null;
    out.push({ id: `act:${a.id}`, from: 'act', date: dayOf(a), name: a.name ?? e?.name ?? '', km: a.km, gainM: a.hm ?? null, movingH: h, bikeId: e?.bikeId ?? null, type: a.type ?? e?.type ?? '', surface: e?.surface ?? null, entryId: e?.id ?? null, paceId: null, hrAvg: a.hrAvg ?? e?.hrAvg ?? null, hrMax: a.hrMax ?? e?.hrMax ?? null, hist: a.hist ?? null, wAvg: a.wAvg ?? null, wMax: a.wMax ?? null, wDevice: a.wDevice ?? null, w20: a.w20 ?? null, use: true });
  }
  for (const r of paceRides) {
    if (!r?.date || !pos(r.movingH) || !pos(r.km)) continue;
    if (out.some((x) => x.from === 'act' && x.date === r.date && Math.abs(x.km - r.km) <= Math.max(2, r.km * 0.1))) continue;
    const e = entries.find((x) => sameRide(x, r)) ?? null;
    const trip = trips.find((t) => t.bikeId && t.startDate && t.startDate <= r.date && r.date <= tripEnd(t));
    out.push({ id: `pace:${r.id}`, from: 'pace', date: r.date, name: r.name ?? '', km: r.km, gainM: r.gainM ?? null, movingH: r.movingH, bikeId: e?.bikeId ?? r.bikeId ?? trip?.bikeId ?? null, type: e?.type ?? '', surface: e?.surface ?? r.surface ?? null, entryId: e?.id ?? null, paceId: r.id, hrAvg: e?.hrAvg ?? null, hrMax: e?.hrMax ?? null, hist: null, wAvg: null, wMax: null, wDevice: null, w20: null, use: r.use !== false });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * For the months: the tempo rides plus the uploaded rides (db.rides) that are not among them yet (an upload
 * left out of «Dein Tempo» still is a ride of its month). Same day and about the same km = the same ride.
 */
export function withUploads(rides = [], uploads = []) {
  const extra = uploads
    .filter((u) => u?.date && pos(u.km) && pos(u.movingH) && !rides.some((r) => r.paceId === u.id || (r.date === u.date && Math.abs(r.km - u.km) <= Math.max(2, u.km * 0.1))))
    .map((u) => ({ id: `ride:${u.id}`, from: 'upload', date: u.date, name: u.name ?? '', km: u.km, gainM: u.gainM ?? null, movingH: u.movingH, bikeId: null, type: '', surface: null, entryId: null, paceId: null, hrAvg: null, hrMax: null, hist: null, wAvg: null, wMax: null, wDevice: null, w20: null, use: true }));
  return [...rides, ...extra].sort((a, b) => b.date.localeCompare(a.date));
}

/** A ride counts for the pace like for the rule: at least 20 km and half an hour moving, not left out. */
export const countsForPace = (r) => r.use !== false && r.km >= 20 && r.movingH > 0.5;

/** From this many rides on a bike and surface its own pace is used (answer 4b); below it the rule. */
export const CELL_MIN = 5;

/**
 * «Pro Velo und Untergrund»: per bike with rides, per surface { n, kmh, climbMh, counts }.
 * kmh and climbMh are that bike's rule on that surface (the same shape as «Deine Regel», climbing apart).
 * → [{ bike, cells: { road, gravel, trail } }], bikes in the order given.
 */
export function paceGrid(rides = [], bikes = []) {
  const out = [];
  for (const bike of bikes) {
    const mine = rides.filter((r) => r.bikeId === bike.id && countsForPace(r));
    if (!mine.length) continue;
    const cells = {};
    for (const key of SURFACE_KEYS) {
      const rs = mine.filter((r) => surfaceOf(r, bike) === key);
      const learned = rs.length ? learnPace(rs.map((r) => ({ km: r.km, gainM: r.gainM ?? 0, movingH: r.movingH, totalH: r.movingH }))) : null;
      cells[key] = { n: rs.length, kmh: learned?.kmh ?? null, climbMh: learned?.climbMh ?? null, counts: rs.length >= CELL_MIN && !!learned };
    }
    out.push({ bike, cells });
  }
  return out;
}

/** The surface a bike usually rides: its fixed one, else the one with the most rides. */
export function usualSurface(bike, rides = []) {
  if (SURFACE_KEYS.includes(bike?.surface)) return bike.surface;
  const n = {};
  for (const r of rides) if (r.bikeId === bike?.id && countsForPace(r)) {
    const s = surfaceOf(r, bike);
    if (s) n[s] = (n[s] ?? 0) + 1;
  }
  return Object.entries(n).sort((a, b) => b[1] - a[1] || SURFACE_KEYS.indexOf(a[0]) - SURFACE_KEYS.indexOf(b[0]))[0]?.[0] ?? null;
}

/**
 * The pace for a trip's riding time: the bike's own pace on its surface from CELL_MIN rides, else the
 * rule (paceOf). The standard you chose («Zurück zur Standardregel») stays the standard.
 * → the pace, with cell { bikeId, surface, n } when the bike's own value is used.
 */
export function paceFor(pace, grid = [], bikeId = null, surface = null) {
  if (!pace || pace.standard || !bikeId || !surface) return pace;
  const cell = grid.find((g) => g.bike.id === bikeId)?.cells?.[surface];
  if (!cell?.counts) return pace;
  return { ...pace, kmh: cell.kmh, climbMh: cell.climbMh, cell: { bikeId, surface, n: cell.n } };
}

/* ---------- planned and ridden (SN2h) ---------- */

/**
 * Per trip that knows its planned and its ridden moving time, newest first:
 * [{ id, title, start, end, bike, bikeId, planH, realH, diffMin, km, planKm, gainM, planGain }] and
 * avgMin: how far off the plan was on average (minutes, without a sign). Difference only, no good or bad.
 */
export function plannedRidden(facts = []) {
  const rows = [];
  for (const f of facts) {
    if (f.kind !== 'trip') continue;
    const pvr = planVsReal(f);
    const time = pvr.find((x) => x.key === 'movingH');
    if (!time) continue;
    const km = pvr.find((x) => x.key === 'km');
    const gain = pvr.find((x) => x.key === 'gainM');
    rows.push({ id: f.id, title: f.title, start: f.start, end: f.end, bike: f.bike, bikeId: f.trip?.bikeId ?? null, planH: time.plan, realH: time.real, diffMin: Math.round((time.real - time.plan) * 60), km: f.km, planKm: km?.plan ?? null, gainM: f.gainM, planGain: gain?.plan ?? null });
  }
  const avgMin = rows.length ? Math.round(rows.reduce((s, r) => s + Math.abs(r.diffMin), 0) / rows.length) : null;
  return { rows, avgMin };
}

/* ---------- the months (SN2i, answer 5b: all months since the first ride) ---------- */

/** 'YYYY-MM' from the month of `first` up to the month of `today`. */
export function monthKeys(first, today) {
  if (!first || !today || first > today) return [];
  const out = [];
  let y = Number(first.slice(0, 4));
  let m = Number(first.slice(5, 7));
  const end = today.slice(0, 7);
  for (let guard = 0; guard < 600; guard++) {
    const k = `${y}-${String(m).padStart(2, '0')}`;
    out.push(k);
    if (k >= end) break;
    m++;
    if (m > 12) (m = 1), y++;
  }
  return out;
}

/**
 * Per month since the first ride: { ym, n, kmh, hrAvg, hrMax, wAvg, wMax, w20, west, zones, zoneS }.
 * kmh: km over moving hours of the rides with a time; heart rate: the ledger's Strava rides (heartOf);
 * power: measured rides when the month has any, else Strava's estimate (west = true); w20 only measured;
 * zones: seconds in Z1–Z5 from the activities' histograms.
 */
export function monthly({ rides = [], entries = [], bounds = null, today } = {}) {
  const heartRides = entries.filter((e) => e.source === 'strava' && e.kind === 'ride' && e.state !== 'removed' && pos(e.hrAvg));
  const days = [...rides.filter((r) => r.use !== false).map((r) => r.date), ...heartRides.map((e) => e.date)].filter(Boolean).sort();
  const months = monthKeys(days[0], today);
  return months.map((ym) => {
    const rs = rides.filter((r) => r.use !== false && r.date?.startsWith(ym));
    const km = rs.reduce((s, r) => s + (pos(r.km) ?? 0), 0);
    const h = rs.reduce((s, r) => s + (pos(r.movingH) ?? 0), 0);
    const heart = heartOf(heartRides.filter((e) => e.date.startsWith(ym)));
    const withW = rs.filter((r) => pos(r.wAvg));
    const measured = withW.filter((r) => r.wDevice === true);
    const p = measured.length ? powerOf(measured) : withW.length ? powerOf(withW) : null;
    let zs = null;
    for (const r of rs) zs = addZones(zs, zoneTimes(r.hist, bounds));
    const zoneS = zs ? zs.reduce((s, v) => s + v, 0) : 0;
    return { ym, n: rs.length, kmh: km && h ? r1(km / h) : null, hrAvg: heart?.avg ?? null, hrMax: heart?.max ?? null, wAvg: p?.avg ?? null, wMax: p?.max ?? null, w20: p?.w20 ?? null, west: !!p && !measured.length, zones: zoneS ? zs : null, zoneS };
  });
}

/** The newest month with a value of `key`: { ym, v, west } or null. */
export function lastOf(months, key) {
  for (let i = months.length - 1; i >= 0; i--) if (months[i][key] != null && (key !== 'zoneS' || months[i][key] > 0)) return { ym: months[i].ym, v: months[i][key], west: months[i].west };
  return null;
}

/* ---------- Logbuch: Velo and Reiseart (SN2g, answer 2b) ---------- */

/** The bike of a log entry: its trip's bike (name), the event's bike text is not a filter. */
export const logBikeOf = (e) => e?.fact?.bike ?? null;

/** Chips with counts: [{ key, n }] of `of(entry)` over entries, most first, then by name. */
export function chipCounts(entries, of) {
  const n = new Map();
  for (const e of entries) {
    const k = of(e);
    if (k) n.set(k, (n.get(k) ?? 0) + 1);
  }
  return [...n.entries()].map(([key, c]) => ({ key, n: c })).sort((a, b) => b.n - a.n || String(a.key).localeCompare(String(b.key)));
}
