/**
 * Touren-Ideen 45, 47, 49 (996 Ideen; Noah 26.10.2026 «1a 2b 3a 4b 5b»): three folds of the card
 * «Tour vorbereiten» on Planen. Each is a suggestion and can stay empty. Stored on the trip (no new
 * table, no schema change; an older trip simply has none):
 *
 *   45 trip.daySports = { [day index]: kind id }   one packing list stays (2b); where the kind changes
 *                                                  between two days, the fold shows «Beim Wechsel» (3a)
 *   47 trip.unclear   = [{ id, km, text, done, doneAt }]       a list with km, no map (4b)
 *   49 trip.border    = [{ id, country, points: [{ id, area, text, source, done, checkedAt }] }]
 *                       per country three areas with points you fill in yourself (5b)
 *
 * The day kinds are an app list («Listen und Typen», applists.js 'daySports'): rename, add, hide.
 * Pure functions, tested in tests/touren-a2.test.js. Labels are English keys for t().
 */
import { hasId, nameOf, offered } from '../applists.js';

/* ---------- 45 Sportart pro Tag ---------- */

export const DAY_SPORTS = ['bike', 'hike', 'rest'];
export const DAY_SPORT_NAMES = { bike: 'Bike|daysport', hike: 'Hiking|daysport', rest: 'Rest day|daysport' };
export const DAY_SPORTS_STD = DAY_SPORTS.map((id) => ({ id, name: DAY_SPORT_NAMES[id] }));
export const isDaySport = (id) => typeof id === 'string' && (DAY_SPORTS.includes(id) || hasId('daySports', DAY_SPORTS_STD, id));
export const daySportName = (id, tr) => nameOf('daySports', DAY_SPORTS_STD, id, tr, '');
export const daySportsOffered = (keep = null) => offered('daySports', DAY_SPORTS_STD, keep);

const daysOf = (trip) => Math.max(1, Number(trip?.days) || 1);

/** The kind of each day ([id | null] × days); an unknown kind counts as none. */
export function daySportsOf(trip) {
  const own = trip?.daySports && typeof trip.daySports === 'object' ? trip.daySports : {};
  return Array.from({ length: daysOf(trip) }, (_, n) => (isDaySport(own[n]) ? own[n] : null));
}

/** The trip field after setting day n to kind (null: none). Days past the end are dropped. */
export function setDaySport(trip, n, kind) {
  const list = daySportsOf(trip);
  if (n >= 0 && n < list.length) list[n] = kind && isDaySport(kind) ? kind : null;
  const out = {};
  list.forEach((k, i) => k && (out[i] = k));
  return out;
}

/**
 * What to think of when the kind changes: bike → foot, foot → bike, into a rest day, back from it.
 * Own kinds count as «on foot» unless their id is a bike or rest kind. Labels for t().
 */
export const CHANGE_TIPS = {
  offBike: ['Park the bike: where, and until when?', 'Repack: a backpack instead of the bike bags', 'What stays with the bike: helmet, tools, cycling shoes'],
  onBike: ['Pick up the bike and check tyres and brakes', 'Stow the hiking shoes and poles', 'Bike bags back on, backpack inside'],
  intoRest: ['Rest day: laundry, charge everything, check the bike'],
};
const onBike = (k) => k === 'bike';
const resting = (k) => k === 'rest';

/** The changes between two days with a kind: [{ day (the first day of the new kind), from, to, tips }]. */
export function sportChanges(trip) {
  const list = daySportsOf(trip);
  const out = [];
  let last = null;
  list.forEach((k, n) => {
    if (!k) return;
    if (last && last.k !== k) {
      const tips = [];
      if (resting(k)) tips.push(...CHANGE_TIPS.intoRest);
      else if (onBike(last.k) && !onBike(k)) tips.push(...CHANGE_TIPS.offBike);
      else if (!onBike(last.k) && onBike(k) && !resting(last.k)) tips.push(...CHANGE_TIPS.onBike);
      else if (resting(last.k) && onBike(k)) tips.push(CHANGE_TIPS.onBike[0]);
      if (tips.length) out.push({ day: n, from: last.k, to: k, tips });
    }
    last = { k, n };
  });
  return out;
}

/* ---------- 47 Unklare Stellen ---------- */

const newId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const kmOf = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Math.round(Number(v) * 10) / 10);

/** The list made safe, sorted by km (without km last, in the order typed). */
export function unclearOf(trip) {
  const list = Array.isArray(trip?.unclear) ? trip.unclear.filter((x) => x && typeof x.text === 'string' && x.text.trim()) : [];
  return list
    .map((x, i) => ({ id: String(x.id ?? `u${i}`), km: kmOf(x.km), text: x.text.trim(), done: !!x.done, doneAt: x.doneAt ?? null, i }))
    .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity) || a.i - b.i)
    .map(({ i, ...x }) => x);
}
export const unclearAdd = (trip, { km = null, text = '' }, id = newId('u')) => (String(text).trim() ? [...unclearOf(trip), { id, km: kmOf(km), text: String(text).trim(), done: false, doneAt: null }] : unclearOf(trip));
export const unclearEdit = (trip, id, fields) => unclearOf(trip).map((x) => (x.id === id ? { ...x, ...('text' in fields && String(fields.text).trim() ? { text: String(fields.text).trim() } : {}), ...('km' in fields ? { km: kmOf(fields.km) } : {}) } : x));
export const unclearToggle = (trip, id, at = new Date().toISOString()) => unclearOf(trip).map((x) => (x.id === id ? { ...x, done: !x.done, doneAt: x.done ? null : at } : x));
export const unclearRemove = (trip, id) => unclearOf(trip).filter((x) => x.id !== id);
export const unclearOpen = (trip) => unclearOf(trip).filter((x) => !x.done).length;

/* ---------- 49 Grenzübertritt ---------- */

/** The three areas of a country (Noah 5b: no prefilled points, you fill them in yourself). */
export const BORDER_AREAS = [
  { key: 'docs', name: 'Documents' },
  { key: 'phone', name: 'Phone network' },
  { key: 'insurance', name: 'Insurance' },
];
/** A point checked longer ago than this many days says «check again». */
export const STALE_DAYS = 180;

const areaOk = (a) => BORDER_AREAS.some((x) => x.key === a);
export function borderOf(trip) {
  const list = Array.isArray(trip?.border) ? trip.border.filter((c) => c && typeof c.country === 'string' && c.country.trim()) : [];
  return list.map((c, i) => ({
    id: String(c.id ?? `c${i}`),
    country: c.country.trim(),
    points: (Array.isArray(c.points) ? c.points : [])
      .filter((p) => p && typeof p.text === 'string' && p.text.trim())
      .map((p, k) => ({ id: String(p.id ?? `p${k}`), area: areaOk(p.area) ? p.area : 'docs', text: p.text.trim(), source: typeof p.source === 'string' ? p.source.trim() : '', done: !!p.done, checkedAt: p.checkedAt ?? null })),
  }));
}
const mapCountry = (trip, cid, fn) => borderOf(trip).map((c) => (c.id === cid ? fn(c) : c));
export const borderAddCountry = (trip, country, id = newId('c')) => (String(country).trim() ? [...borderOf(trip), { id, country: String(country).trim(), points: [] }] : borderOf(trip));
export const borderRenameCountry = (trip, cid, country) => (String(country).trim() ? mapCountry(trip, cid, (c) => ({ ...c, country: String(country).trim() })) : borderOf(trip));
export const borderRemoveCountry = (trip, cid) => borderOf(trip).filter((c) => c.id !== cid);
export const borderAddPoint = (trip, cid, { area, text, source = '' }, id = newId('p')) =>
  String(text).trim() ? mapCountry(trip, cid, (c) => ({ ...c, points: [...c.points, { id, area: areaOk(area) ? area : 'docs', text: String(text).trim(), source: String(source).trim(), done: false, checkedAt: null }] })) : borderOf(trip);
export const borderEditPoint = (trip, cid, pid, fields) =>
  mapCountry(trip, cid, (c) => ({ ...c, points: c.points.map((p) => (p.id === pid ? { ...p, ...('text' in fields && String(fields.text).trim() ? { text: String(fields.text).trim() } : {}), ...('source' in fields ? { source: String(fields.source).trim() } : {}) } : p)) }));
export const borderTogglePoint = (trip, cid, pid, at = new Date().toISOString()) => mapCountry(trip, cid, (c) => ({ ...c, points: c.points.map((p) => (p.id === pid ? { ...p, done: !p.done, checkedAt: p.done ? p.checkedAt : at } : p)) }));
export const borderRemovePoint = (trip, cid, pid) => mapCountry(trip, cid, (c) => ({ ...c, points: c.points.filter((p) => p.id !== pid) }));
/** Move a point up (-1) or down (+1) within its area. */
export function borderMovePoint(trip, cid, pid, dir) {
  return mapCountry(trip, cid, (c) => {
    const pts = [...c.points];
    const i = pts.findIndex((p) => p.id === pid);
    if (i < 0) return c;
    const same = pts.map((p, k) => [p, k]).filter(([p]) => p.area === pts[i].area).map(([, k]) => k);
    const at = same.indexOf(i);
    const j = same[at + dir];
    if (j == null) return c;
    [pts[i], pts[j]] = [pts[j], pts[i]];
    return { ...c, points: pts };
  });
}
/** Is a checked point old? (checkedAt older than STALE_DAYS) */
export const isStale = (p, now = Date.now()) => !!p?.checkedAt && now - Date.parse(p.checkedAt) > STALE_DAYS * 864e5;
/** Open points over all countries. */
export const borderOpen = (trip) => borderOf(trip).reduce((n, c) => n + c.points.filter((p) => !p.done).length, 0);
