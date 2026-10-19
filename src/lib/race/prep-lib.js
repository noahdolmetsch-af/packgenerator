/**
 * Paket U «Rennen» › Vorbereiten: small pure helpers of the part (tested in tests/race-prep.test.js).
 */
import { PAPERS } from './more.js';
import { addDay, hhmm } from './race.js';

/**
 * Lists that start from the app's rows (paperwork, bad-weather plans): such a row keeps its English keys
 * and std: true until you change it, so it shows in your language. showStd: the rows for people
 * (fields through tr while std); keepStd: back to storage (an unchanged row keeps its keys, a changed one
 * becomes yours).
 */
export const showStd = (rows = [], fields = [], tr = (s) => s) =>
  rows.map((r) => (r.std ? { ...r, ...Object.fromEntries(fields.map((f) => [f, r[f] == null ? r[f] : tr(r[f])])) } : r));
export function keepStd(list = [], before = [], fields = [], tr = (s) => s) {
  const old = Object.fromEntries(before.map((r) => [r.id, r]));
  return list.map((r) => {
    const o = old[r.id];
    if (!o?.std) return r;
    const same = fields.every((f) => (r[f] ?? '') === (o[f] == null ? '' : tr(o[f])));
    return same ? { ...r, ...Object.fromEntries(fields.map((f) => [f, o[f]])), std: true } : { ...r, std: false };
  });
}

/** The paperwork as the app comes, plus the beds (learning: «Hotels buchen (9 Nächte!)»). */
export const PAPER_ROWS = [
  ...PAPERS.map((p) => ({ ...p, std: true, done: false })),
  { id: 'pp-hotels', text: 'Book the hotels and rooms', daysBefore: 60, std: true, done: false },
];
/** When a paper is due: your date, else the start minus its days before. */
export const paperDue = (r, startDay) => r.due || (startDay && r.daysBefore != null ? addDay(startDay, -Number(r.daysBefore)) : '');

/** «Sat 14:30» for a time in ms (loc: the locale of the app). */
export function whenOf(ms, loc = 'de-CH') {
  if (!Number.isFinite(ms)) return '';
  return `${new Date(ms).toLocaleDateString(loc, { weekday: 'short' })} ${hhmm(ms)}`;
}

/** Stops per kind: { shop: 3, … } (kinds in the order of `kinds`, only those with stops). */
export function countByKind(pois = [], kinds = []) {
  const n = {};
  for (const p of pois) n[p.kind] = (n[p.kind] ?? 0) + 1;
  return kinds.filter((k) => n[k]).map((k) => ({ kind: k, n: n[k] }));
}

/** The km of the stops of these kinds, sorted. */
export const kmOfKinds = (pois = [], kinds = []) =>
  pois
    .filter((p) => kinds.includes(p.kind))
    .map((p) => Number(p.km))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

/** The packed things of a trip for the rules check: [{ id, name }], each item once. */
export function packedOf(trip, items = [], nameOf = (i) => i.name) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const seen = new Set();
  const out = [];
  for (const e of trip?.entries ?? []) {
    const it = byId[e.itemId];
    if (!it || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push({ id: it.id, name: nameOf(it) });
  }
  return out;
}

/** An SVG polyline for points [{ km, kg }] in a w × h box (with a small margin). → { d, x(km), y(kg) } */
export function lineOf(points = [], w = 300, h = 90, pad = 4) {
  if (!points.length) return { d: '', x: () => 0, y: () => 0 };
  const maxKm = Math.max(1, points.at(-1).km);
  const kgs = points.map((p) => p.kg);
  const lo = Math.min(...kgs);
  const hi = Math.max(lo + 1, Math.max(...kgs));
  const x = (km) => Math.round((pad + (km / maxKm) * (w - 2 * pad)) * 10) / 10;
  const y = (kg) => Math.round((h - pad - ((kg - lo) / (hi - lo)) * (h - 2 * pad)) * 10) / 10;
  return { d: points.map((p, i) => `${i ? 'L' : 'M'}${x(p.km)} ${y(p.kg)}`).join(' '), x, y };
}
