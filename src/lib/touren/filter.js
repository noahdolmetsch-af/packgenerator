/**
 * SN4g «Touren-Seite, Runde 2» (Noah 13.10.2026 22:24 «SN4g–SN4i freigegeben», answer 5a and the second
 * round 1a / 2b): the own filters of «Abgeschlossene Touren» on Touren › Übersicht.
 *
 *   FL1 Tourart   FL2 Velo   FL3 Zustand (the state chips, kept apart)   FL4 Dauer (all / one day / several)
 *   FL5 Distanz and Höhenmeter from–to   FL6 Wetter (rain, below 5 °C, above 28 °C)
 *   FL7 only trips with power values   FL8 save the filter under a name («Meine Filter»)
 *
 * Every choice shows how many trips of the period have it (counted over the period, as drawn). Choices of
 * one field are «or», the fields together «and». The filters are a suggestion: each chip can be tapped
 * away, «Filter löschen» clears all. The saved filters live in the settings record TOURS_KEY (goes into
 * every backup). Pure functions, tested in tests/sn4g.test.js.
 */
import { isBikepacking } from '../review/ganz.js';
import { actSavedOf } from './actfilter.js';

/**
 * settings key: { saved: [{ id, name, f }], actSaved: [{ id, name, f }], band: 'hidden' | null } (the band:
 * the Packmodus band, SN4g; actSaved: «Meine Filter» of the Strava activities, AT1, actfilter.js).
 */
export const TOURS_KEY = 'toursPage';

/** FL1: the kinds, in their order (English keys for t()). «Feierabend» comes with the Tourart round (TA). */
export const KINDS = [
  { key: 'day', name: 'Day ride|art' },
  { key: 'bikepacking', name: 'Bikepacking' },
  { key: 'multi', name: 'Multi-day|art' },
  { key: 'event', name: 'Race|art' },
  { key: 'other', name: 'Without a bike|art' },
  { key: 'ride', name: 'Ride from GPX|kind' },
  // Live Navigation M10 (Noah 26.10.2026): a ride recorded on the live map, on its own
  { key: 'live', name: 'Live Navigation' },
];
/** FL4. */
export const DURS = [
  { key: 'all', name: 'All|duration' },
  { key: 'one', name: 'One day|duration' },
  { key: 'multi', name: 'Several days|duration' },
];
/** FL6: the weather saved with the trip. */
export const COLD_C = 5;
export const HOT_C = 28;
export const WXS = [
  { key: 'rain', name: 'with rain' },
  { key: 'cold', name: 'below {n} °C', n: COLD_C },
  { key: 'hot', name: 'above {n} °C', n: HOT_C },
];

/** No filter: everything shows. */
export const emptyFilter = () => ({ kinds: [], bikes: [], dur: 'all', km: [null, null], hm: [null, null], wx: [], watts: false });

const numOrNull = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v));
const pair = (p) => (Array.isArray(p) ? [numOrNull(p[0]), numOrNull(p[1])] : [null, null]);

/** A stored or typed filter with every field there (an old record never breaks the page). */
export function normFilter(f) {
  const x = f && typeof f === 'object' ? f : {};
  const keys = (list, ok) => (Array.isArray(list) ? [...new Set(list.filter((k) => typeof k === 'string' && (!ok || ok.includes(k))))] : []);
  return {
    kinds: keys(x.kinds, KINDS.map((k) => k.key)),
    bikes: keys(x.bikes),
    dur: DURS.some((d) => d.key === x.dur) ? x.dur : 'all',
    km: pair(x.km),
    hm: pair(x.hm),
    wx: keys(x.wx, WXS.map((w) => w.key)),
    watts: x.watts === true,
  };
}

/** FL1: the kind of a row of tripFacts (an uploaded ride on its own is «Fahrt aus GPX»). */
export function kindOf(row) {
  if (!row) return 'ride';
  if (row.kind === 'ride') return row.live ? 'live' : 'ride';
  if (row.art === 'event' || row.art === 'other') return row.art;
  if (isBikepacking(row.trip)) return 'bikepacking';
  return row.art === 'multi' ? 'multi' : 'day';
}

/** FL6: the weather marks of a row. */
export const wxOf = (row) => ({ rain: row?.rain?.wet === true, cold: typeof row?.tmin === 'number' && row.tmin < COLD_C, hot: typeof row?.tmax === 'number' && row.tmax > HOT_C });

const inRange = (v, [lo, hi]) => (lo == null && hi == null) || (typeof v === 'number' && (lo == null || v >= lo) && (hi == null || v <= hi));

/**
 * Does a row pass the filter? ctx: { bikeOf(row) → bike id | null, wattsOf(row) → boolean }.
 */
export function matches(row, filter, { bikeOf = (r) => r.trip?.bikeId ?? null, wattsOf = () => false } = {}) {
  const f = normFilter(filter);
  if (f.kinds.length && !f.kinds.includes(kindOf(row))) return false;
  if (f.bikes.length && !f.bikes.includes(bikeOf(row))) return false;
  if (f.dur === 'one' && row.days > 1) return false;
  if (f.dur === 'multi' && !(row.days > 1)) return false;
  if (!inRange(row.km, f.km) || !inRange(row.gainM, f.hm)) return false;
  if (f.wx.length) {
    const w = wxOf(row);
    if (!f.wx.some((k) => w[k])) return false;
  }
  if (f.watts && !wattsOf(row)) return false;
  return true;
}

/** The rows that pass. */
export const filterRows = (rows = [], filter, ctx) => rows.filter((r) => matches(r, filter, ctx));

/**
 * The numbers beside every choice, over the rows of the period: { kinds: {key: n}, bikes: {id: n},
 * dur: { all, one, multi }, wx: { rain, cold, hot }, watts: n }.
 */
export function choiceCounts(rows = [], { bikeOf = (r) => r.trip?.bikeId ?? null, wattsOf = () => false } = {}) {
  const c = { kinds: Object.fromEntries(KINDS.map((k) => [k.key, 0])), bikes: {}, dur: { all: rows.length, one: 0, multi: 0 }, wx: { rain: 0, cold: 0, hot: 0 }, watts: 0 };
  for (const r of rows) {
    c.kinds[kindOf(r)]++;
    const b = bikeOf(r);
    if (b) c.bikes[b] = (c.bikes[b] ?? 0) + 1;
    c.dur[r.days > 1 ? 'multi' : 'one']++;
    const w = wxOf(r);
    for (const k of Object.keys(c.wx)) if (w[k]) c.wx[k]++;
    if (wattsOf(r)) c.watts++;
  }
  return c;
}

/**
 * The active filters as chips to tap away: [{ id, field, value, label, vars }] (label: an English key for
 * t(); vars: its values). names: { [bike id]: name }.
 */
export function activeChips(filter, names = {}) {
  const f = normFilter(filter);
  const out = [];
  for (const k of f.kinds) out.push({ id: `kind:${k}`, field: 'kinds', value: k, label: KINDS.find((x) => x.key === k).name, vars: {} });
  for (const b of f.bikes) out.push({ id: `bike:${b}`, field: 'bikes', value: b, label: 'Bike: {name}', vars: { name: names[b] ?? b } });
  if (f.dur !== 'all') out.push({ id: 'dur', field: 'dur', value: f.dur, label: f.dur === 'one' ? 'only one day' : 'only several days', vars: {} });
  for (const key of ['km', 'hm']) {
    const [lo, hi] = f[key];
    if (lo == null && hi == null) continue;
    const unit = key === 'km' ? 'km' : 'Hm';
    out.push({ id: key, field: key, value: null, label: lo != null && hi != null ? '{lo}–{hi} {unit}' : lo != null ? 'from {lo} {unit}' : 'up to {hi} {unit}', vars: { lo, hi, unit } });
  }
  for (const w of f.wx) {
    const x = WXS.find((y) => y.key === w);
    out.push({ id: `wx:${w}`, field: 'wx', value: w, label: x.name, vars: { n: x.n } });
  }
  if (f.watts) out.push({ id: 'watts', field: 'watts', value: true, label: 'only with power values', vars: {} });
  return out;
}

/** How many filters are on (the number on the «Filter» button). */
export const activeCount = (filter) => activeChips(filter).length;

/** The filter without one chip. */
export function withoutChip(filter, chip) {
  const f = normFilter(filter);
  if (chip.field === 'kinds' || chip.field === 'bikes' || chip.field === 'wx') f[chip.field] = f[chip.field].filter((v) => v !== chip.value);
  else if (chip.field === 'dur') f.dur = 'all';
  else if (chip.field === 'km' || chip.field === 'hm') f[chip.field] = [null, null];
  else if (chip.field === 'watts') f.watts = false;
  return f;
}

/** One value of a list field switched on or off. */
export function toggle(filter, field, value) {
  const f = normFilter(filter);
  f[field] = f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value];
  return f;
}

/** Are two filters the same (for the saved chip that is on)? */
export function sameFilter(a, b) {
  const x = normFilter(a);
  const y = normFilter(b);
  const s = (l) => [...l].sort().join('|');
  return s(x.kinds) === s(y.kinds) && s(x.bikes) === s(y.bikes) && x.dur === y.dur && x.km.join() === y.km.join() && x.hm.join() === y.hm.join() && s(x.wx) === s(y.wx) && x.watts === y.watts;
}

/** The page record as stored, with the defaults. */
export function toursOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const saved = (Array.isArray(v.saved) ? v.saved : []).filter((s) => s && s.id && String(s.name ?? '').trim()).map((s) => ({ id: String(s.id), name: String(s.name).trim(), f: normFilter(s.f) }));
  return { saved, actSaved: actSavedOf(v.actSaved), band: v.band === 'hidden' ? 'hidden' : null };
}

/**
 * FL8: save a filter under a name. The same name (ignoring case) replaces the old one; an empty name or
 * an empty filter saves nothing. → the new list.
 */
export function saveFilter(saved = [], name, filter, id = `f${Date.now().toString(36)}`) {
  const n = String(name ?? '').trim();
  if (!n || !activeCount(filter)) return saved;
  const old = saved.find((s) => s.name.toLowerCase() === n.toLowerCase());
  const entry = { id: old?.id ?? id, name: n, f: normFilter(filter) };
  return old ? saved.map((s) => (s.id === old.id ? entry : s)) : [...saved, entry];
}

/** Take a saved filter away. */
export const dropFilter = (saved = [], id) => saved.filter((s) => s.id !== id);
