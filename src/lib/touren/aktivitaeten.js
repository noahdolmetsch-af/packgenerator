/**
 * AT1 «Abgeschlossene Touren aus Strava» (mockup AT1, Noah 14.10.2026 21:19 «1a 2a 3b 4b at1 freigeben»;
 * earlier answers 18:55–19:12: every Strava activity, the commute too, all sports, rating only in Packmodus,
 * a multi-day tour of the Packmodus is one row). The list «Abgeschlossene Touren» on Touren › Übersicht:
 *
 *   - every activity of the Strava store (db.activities, training.js), newest first;
 *   - an activity on the days of a trip packed in the app (training.js activitiesForTrip) carries the mark
 *     «Packmodus: <trip>»; several activities of one such trip are ONE row (answer 3a), with the trip's name;
 *   - the values Noah named (19:11): duration, km, Hm, TSS, Ø HF, Ø TF, Ø speed, Ø power, max. power,
 *     max. HF, elapsed time, max. speed, max. 20 min power, time in the HR zones 1–5 (min and %);
 *   - 1a: TSS only from a power meter ((NP ÷ FTP)² × h × 100, training.js powerLoad), else «–»;
 *   - 3b: runs, hikes and other sports show only the values that fit them (FIELDS);
 *   - 4b: the newest PAGE rows, «Mehr laden» shows PAGE more.
 * Values only to look at, no rating. Pure functions, tested in tests/aktivitaeten.test.js.
 */
import { activitiesForTrip, kindOf as kindOfType, zoneSecs, powerLoad, byNewest } from '../training.js';
import { withOwn, rowWithOwn, tourHref } from './tour.js';
import { stravaName } from '../stravanames.js';

/** 4b: how many rows show at first, and how many more each «Mehr laden» adds. */
export const PAGE = 20;

/**
 * 3b: the values of a row, by kind of sport, in the order of the mockup. A ride shows them all (a missing
 * one as «–»); the other sports only those that fit (a power value still shows when a power meter sent it).
 */
export const FIELDS = {
  bike: ['dauer', 'verstr', 'tss', 'hf', 'hfmax', 'tf', 'kmh', 'kmhmax', 'w', 'wmax', 'w20'],
  run: ['dauer', 'verstr', 'tss', 'hf', 'hfmax', 'tf', 'kmh', 'kmhmax', 'w', 'wmax', 'w20'],
  hike: ['dauer', 'verstr', 'hf', 'hfmax', 'kmh'],
  other: ['dauer', 'verstr', 'hf', 'hfmax'],
};
/** The power fields: outside a ride only shown with a value. */
const POWER = new Set(['tss', 'w', 'wmax', 'w20']);

/** The fields one row shows (3b). */
export function fieldsOf(row) {
  const list = FIELDS[row?.kind] ?? FIELDS.other;
  if (row?.kind === 'bike') return list;
  return list.filter((f) => !POWER.has(f) || row[f] != null);
}

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** Strava sends a run's cadence per leg; a step count is twice that. */
const cadOf = (a) => (fin(a.cad) == null ? null : a.kind === 'run' ? Math.round(a.cad * 2) : Math.round(a.cad));

/** One activity as a row (without the Packmodus mark). bounds: the HR zones in use; ftp: estimated FTP. */
export function actRow(raw, { bounds = null, ftp = null, bikeOf = () => null } = {}) {
  // Tour-Seite (Noah 19.10.2026 «3b»): the person's own name, kind and corrected values count
  const a = withOwn(raw);
  const power = !!a.wDevice;
  const km = fin(a.km) ?? 0;
  const movingS = fin(a.movingS) ?? 0;
  return {
    id: `a:${a.id}`,
    actIds: [a.id],
    // Tour-Seite (Noah 19.10.2026 «1a»): a finished activity opens its page «Tour»
    href: tourHref(`a:${a.id}`),
    day: a.day,
    endDay: a.day,
    time: a.time ?? '',
    // «Strava-Namen schöner» (Noah 21.10.2026 «2a»): Strava's default name in German; the own name wins
    name: raw?.own?.name ? a.name : stravaName(a.name || ''),
    type: a.type || '',
    kind: a.kind || kindOfType(a.type),
    n: 1,
    bikeId: a.kind === 'bike' ? bikeOf(a) : null,
    km,
    hm: fin(a.hm),
    dauer: movingS || null,
    verstr: fin(a.elapsedS),
    hf: fin(a.hrAvg),
    hfmax: fin(a.hrMax),
    tf: cadOf(a),
    kmh: fin(a.spdAvg) ?? (km > 0 && movingS > 0 ? round1(km / (movingS / 3600)) : null),
    kmhmax: fin(a.spdMax),
    w: fin(a.wAvg),
    // without a power meter Strava only estimates the average; there is no max. then
    wmax: power ? fin(a.wMax) : null,
    w20: power ? fin(a.w20) : null,
    tss: power ? powerLoad(a, ftp)?.load ?? null : null,
    zones: bounds ? zoneSecs(a.hist, bounds) : null,
    commute: !!a.commute,
    power,
    pm: null,
    changed: a.changed,
    strava: a.strava,
    hidden: !!a.hidden,
  };
}

const sum = (rows, k) => (rows.some((r) => r[k] != null) ? rows.reduce((s, r) => s + (r[k] ?? 0), 0) : null);
const max = (rows, k) => (rows.some((r) => r[k] != null) ? Math.max(...rows.filter((r) => r[k] != null).map((r) => r[k])) : null);
/** Weighted by moving time over the rows that have the value. */
function avg(rows, k) {
  const has = rows.filter((r) => r[k] != null && r.dauer > 0);
  const t = has.reduce((s, r) => s + r.dauer, 0);
  return t ? Math.round(has.reduce((s, r) => s + r[k] * r.dauer, 0) / t) : null;
}

/** Several activities of one tour as one row (3a): sums, averages over the moving time, the highest max. */
export function mergeRows(rows, trip) {
  const list = [...rows].sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
  const km = list.reduce((s, r) => s + (r.km ?? 0), 0);
  const dauer = sum(list, 'dauer');
  const zones = list.some((r) => r.zones) ? [0, 1, 2, 3, 4].map((i) => list.reduce((s, r) => s + (r.zones?.[i] ?? 0), 0)) : null;
  const bikes = [...new Set(list.map((r) => r.bikeId).filter(Boolean))];
  return {
    id: `t:${trip.id}`,
    actIds: list.flatMap((r) => r.actIds),
    href: tourHref(`t:${trip.id}`),
    day: list[0].day,
    endDay: list.at(-1).day,
    time: list[0].time,
    name: trip.title || list[0].name,
    type: list[0].type,
    kind: list[0].kind,
    n: list.length,
    bikeId: bikes.length === 1 ? bikes[0] : null,
    km: Math.round(km * 10) / 10,
    hm: sum(list, 'hm'),
    dauer,
    verstr: sum(list, 'verstr'),
    hf: avg(list, 'hf'),
    hfmax: max(list, 'hfmax'),
    tf: avg(list, 'tf'),
    kmh: km > 0 && dauer > 0 ? round1(km / (dauer / 3600)) : null,
    kmhmax: max(list, 'kmhmax'),
    w: avg(list, 'w'),
    wmax: max(list, 'wmax'),
    w20: max(list, 'w20'),
    tss: sum(list, 'tss'),
    zones,
    commute: list.every((r) => r.commute),
    power: list.some((r) => r.power),
    pm: null,
    changed: [...new Set(list.flatMap((r) => r.changed ?? []))],
    strava: {},
    hidden: list.every((r) => r.hidden),
  };
}

/** The bike the app counted a Strava activity for (the ride ledger, kmBook), or null. */
export function bikeMap(kmBook = []) {
  const m = new Map();
  for (const e of kmBook) if (e?.stravaId && e.bikeId && e.state !== 'removed') m.set(String(e.stravaId), e.bikeId);
  return (a) => m.get(String(a.id)) ?? null;
}

/**
 * All rows of «Abgeschlossene Touren», newest first.
 * acts: db.activities; packed: [{ trip, state }] the trips of the Packmodus that happened (state 'done' |
 * 'rated'); kmBook: the ride ledger (the bike of an activity, a ride the ledger put on a trip).
 * Tour-Seite (Noah 19.10.2026): groups: the joined tours (5a, touren/tour.js), each one row «g:<id>»;
 * a hidden activity is left out unless showHidden (then it carries `hidden`).
 */
export function tourRows(acts = [], { packed = [], kmBook = [], bounds = null, ftp = null, groups = [], showHidden = false } = {}) {
  const bikeOf = bikeMap(kmBook);
  const used = new Set();
  const out = [];
  for (const { trip, state } of packed) {
    const mine = activitiesForTrip(trip, acts, kmBook).filter((a) => !used.has(a.id));
    if (!mine.length) continue;
    for (const a of mine) used.add(a.id);
    const rows = mine.map((a) => actRow(a, { bounds, ftp, bikeOf }));
    const row = rows.length === 1 ? { ...rows[0], href: tourHref(`t:${trip.id}`) } : mergeRows(rows, trip);
    out.push({ ...rowWithOwn(row, trip.own), pm: { tripId: trip.id, title: trip.title ?? '', state } });
  }
  const byId = new Map(acts.map((a) => [String(a.id), a]));
  for (const g of groups) {
    const mine = (g.acts ?? []).map((id) => byId.get(String(id))).filter((a) => a && !used.has(a.id));
    if (mine.length < 2) continue;
    for (const a of mine) used.add(a.id);
    const row = mergeRows(mine.map((a) => actRow(a, { bounds, ftp, bikeOf })), { id: g.id, title: g.name });
    out.push({ ...rowWithOwn(row, g.own), id: `g:${g.id}`, href: tourHref(`g:${g.id}`), grp: { id: g.id }, hidden: !!g.hidden });
  }
  for (const a of acts) if (!used.has(a.id)) out.push(actRow(a, { bounds, ftp, bikeOf }));
  return out.filter((r) => showHidden || !r.hidden).sort((a, b) => byNewest({ day: a.day, time: a.time }, { day: b.day, time: b.time }));
}

/** The rows of a period { from, to } (from null: since the beginning); a tour counts by its first day. */
export const inPeriodRows = (rows, { from = null, to = null } = {}) => rows.filter((r) => (!from || r.day >= from) && (!to || r.day <= to));

/** The sport chips: all, then each kind with rows. → [{ key, n }] */
export function sportCounts(rows) {
  const n = { bike: 0, run: 0, hike: 0, other: 0 };
  for (const r of rows) n[r.kind in n ? r.kind : 'other']++;
  return [{ key: 'all', n: rows.length }, ...Object.entries(n).filter(([, c]) => c).map(([key, c]) => ({ key, n: c }))];
}

/** Month groups in order: [{ month: 'YYYY-MM', rows }]. */
export function byMonth(rows) {
  const out = [];
  for (const r of rows) {
    const m = r.day.slice(0, 7);
    if (out.at(-1)?.month !== m) out.push({ month: m, rows: [] });
    out.at(-1).rows.push(r);
  }
  return out;
}

/** 2a: the zones as minutes and whole percent: [{ min, pct }] ×5, or null. */
export function zoneParts(secs) {
  const all = secs?.reduce((s, x) => s + x, 0) ?? 0;
  if (!all) return null;
  return secs.map((s) => ({ min: Math.round(s / 60), pct: Math.round((s / all) * 100) }));
}

/** The Strava activities of a Packmodus trip, for its row: { n, name } (n 0: none). */
export function stravaOfTrip(trip, acts = [], kmBook = []) {
  const list = activitiesForTrip(trip, acts, kmBook);
  // 19.10.2026 (answer 1a): each activity opens its own page
  return { n: list.length, name: list.length === 1 ? stravaName(list[0].name) : '', list: list.map((a) => ({ id: a.id, name: stravaName(a.name ?? ''), day: a.day ?? '' })) };
}

