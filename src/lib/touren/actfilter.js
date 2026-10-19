/**
 * AT1 part 2 «Filter» of «Abgeschlossene Touren» (mockup AT1, Noah 14.10.2026 21:19 «at1 freigeben»: the
 * button «Filter» beside the sport chips, «Meine Filter» such as «Rennvelo mit Watt» and «Ohne Arbeitsweg»).
 * The filters of the Strava activities, beside the period and the sport chips:
 *
 *   AF1 Velo (the bike the ride ledger counted the activity for)   AF2 Arbeitsweg (all / without / only)
 *   AF3 Distanz and Höhenmeter from–to   AF4 only with a power meter   AF5 save under a name («Meine Filter»)
 *
 * Choices of one field are «or», the fields together «and». A suggestion: each chip taps away, «Filter
 * löschen» clears all. The saved ones live in the page record (filter.js TOURS_KEY, `actSaved`). Pure
 * functions, tested in tests/aktivitaeten.test.js.
 */

/** AF2. */
export const COMMUTES = [
  { key: 'all', name: 'All|commute' },
  { key: 'without', name: 'Without commute' },
  { key: 'only', name: 'Only commute' },
];

/** No filter: everything shows. */
export const emptyActFilter = () => ({ bikes: [], commute: 'all', km: [null, null], hm: [null, null], watts: false });

const numOrNull = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v));
const pair = (p) => (Array.isArray(p) ? [numOrNull(p[0]), numOrNull(p[1])] : [null, null]);

/** A stored or typed filter with every field there (an old record never breaks the page). */
export function normActFilter(f) {
  const x = f && typeof f === 'object' ? f : {};
  return {
    bikes: Array.isArray(x.bikes) ? [...new Set(x.bikes.filter((k) => typeof k === 'string'))] : [],
    commute: COMMUTES.some((c) => c.key === x.commute) ? x.commute : 'all',
    km: pair(x.km),
    hm: pair(x.hm),
    watts: x.watts === true,
  };
}

const inRange = (v, [lo, hi]) => (lo == null && hi == null) || (typeof v === 'number' && (lo == null || v >= lo) && (hi == null || v <= hi));

/** Does a row of aktivitaeten.js pass the filter? */
export function matchesAct(row, filter) {
  const f = normActFilter(filter);
  if (f.bikes.length && !f.bikes.includes(row.bikeId)) return false;
  if (f.commute === 'without' && row.commute) return false;
  if (f.commute === 'only' && !row.commute) return false;
  if (!inRange(row.km, f.km) || !inRange(row.hm, f.hm)) return false;
  if (f.watts && !row.power) return false;
  return true;
}

/** The rows that pass. */
export const filterActs = (rows = [], filter) => rows.filter((r) => matchesAct(r, filter));

/** The numbers beside every choice: { bikes: {id: n}, commute: { all, without, only }, watts: n }. */
export function actChoiceCounts(rows = []) {
  const c = { bikes: {}, commute: { all: rows.length, without: 0, only: 0 }, watts: 0 };
  for (const r of rows) {
    if (r.bikeId) c.bikes[r.bikeId] = (c.bikes[r.bikeId] ?? 0) + 1;
    c.commute[r.commute ? 'only' : 'without']++;
    if (r.power) c.watts++;
  }
  return c;
}

/** The active filters as chips: [{ id, field, value, label, vars }] (label: an English key for t()). */
export function actChips(filter, names = {}) {
  const f = normActFilter(filter);
  const out = [];
  for (const b of f.bikes) out.push({ id: `bike:${b}`, field: 'bikes', value: b, label: 'Bike: {name}', vars: { name: names[b] ?? b } });
  if (f.commute !== 'all') out.push({ id: 'commute', field: 'commute', value: f.commute, label: COMMUTES.find((c) => c.key === f.commute).name, vars: {} });
  for (const key of ['km', 'hm']) {
    const [lo, hi] = f[key];
    if (lo == null && hi == null) continue;
    const unit = key === 'km' ? 'km' : 'Hm';
    out.push({ id: key, field: key, value: null, label: lo != null && hi != null ? '{lo}–{hi} {unit}' : lo != null ? 'from {lo} {unit}' : 'up to {hi} {unit}', vars: { lo, hi, unit } });
  }
  if (f.watts) out.push({ id: 'watts', field: 'watts', value: true, label: 'only with a power meter', vars: {} });
  return out;
}

/** The filter without one chip. */
export function withoutActChip(filter, chip) {
  const f = normActFilter(filter);
  if (chip.field === 'bikes') f.bikes = f.bikes.filter((v) => v !== chip.value);
  else if (chip.field === 'commute') f.commute = 'all';
  else if (chip.field === 'km' || chip.field === 'hm') f[chip.field] = [null, null];
  else if (chip.field === 'watts') f.watts = false;
  return f;
}

/** One bike switched on or off. */
export const toggleActBike = (filter, id) => {
  const f = normActFilter(filter);
  f.bikes = f.bikes.includes(id) ? f.bikes.filter((v) => v !== id) : [...f.bikes, id];
  return f;
};

/** Are two filters the same (for the saved chip that is on)? */
export function sameActFilter(a, b) {
  const x = normActFilter(a);
  const y = normActFilter(b);
  return [...x.bikes].sort().join('|') === [...y.bikes].sort().join('|') && x.commute === y.commute && x.km.join() === y.km.join() && x.hm.join() === y.hm.join() && x.watts === y.watts;
}

/** The saved filters as stored, cleaned. */
export const actSavedOf = (list) => (Array.isArray(list) ? list : []).filter((s) => s && s.id && String(s.name ?? '').trim()).map((s) => ({ id: String(s.id), name: String(s.name).trim(), f: normActFilter(s.f) }));

/** AF5: save under a name; the same name (ignoring case) replaces the old one, an empty filter saves nothing. */
export function saveActFilter(saved = [], name, filter, id = `a${Date.now().toString(36)}`) {
  const n = String(name ?? '').trim();
  if (!n || !actChips(filter).length) return saved;
  const old = saved.find((s) => s.name.toLowerCase() === n.toLowerCase());
  const entry = { id: old?.id ?? id, name: n, f: normActFilter(filter) };
  return old ? saved.map((s) => (s.id === old.id ? entry : s)) : [...saved, entry];
}
