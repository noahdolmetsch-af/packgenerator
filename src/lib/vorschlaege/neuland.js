/**
 * «Neuland» of the tour suggestions (Noah 24.11.2026 «1, 2, 3, 4 (wichtig, lieblingsfeature), 5»). What is new for you on a tour:
 *   1. a filter and the order «newest first» by the share of the line you have not ridden (newShare of regeln.js);
 *   2. the line on the map in two parts: the pieces you have ridden are grey, the new ones keep the colour (runsOf);
 *   3. new cantons: a tour in a canton you have never ridden in (cantonNew; Neuland › Cantons counts them);
 *   4. passes and peaks on the way (spotsAlong), which of them are new for you (the same list as Neuland, so nothing is counted twice);
 *   5. a quiet goal for the month («3 tours with over 60 % new»), ticked by hand, switched off with one tap (goalOf and the rest).
 * Pure functions, tested in tests/vorschlaege.test.js. The data (Neuland's computeFrom) is read by pages/Vorschlaege.svelte.
 */
import { densify, rodeNear } from './regeln.js';
import { nearestOnLine } from '../spur/kmmarks.js';

/** A pass or a peak counts as «on the way» when it lies this close to the line (km). */
export const NEAR_KM = 0.5;
export const NEU_MODES = ['sort', 'half', 'places', 'canton'];
/** The share of new line from which a tour is «mostly new». */
export const HALF = 0.5;

/** The passes and peaks of Neuland as one list: [{ id, name, kind: 'pass' | 'peak', lat, lon, alt }] from the items of the collections. */
export function spotList(collections = []) {
  const out = [];
  for (const c of collections) {
    const kind = c.id === 'passes' ? 'pass' : c.id === 'peaks' ? 'peak' : null;
    if (!kind) continue;
    for (const it of c.items ?? []) if (Number.isFinite(it?.lat) && Number.isFinite(it?.lon)) out.push({ id: it.id, name: it.name, kind, lat: it.lat, lon: it.lon, alt: it.alt ?? null });
  }
  return out;
}

/** The ids you have reached (passes and peaks), from computeFrom(): collection.visited is a Map. */
export function reachedOf(collections = []) {
  const out = new Set();
  for (const c of collections) if (c.id === 'passes' || c.id === 'peaks') for (const id of c.visited?.keys?.() ?? []) out.add(id);
  return out;
}

const box = new WeakMap();
function boxOf(t) {
  if (!box.has(t)) {
    let a = 90, b = -90, c = 180, d = -180;
    for (const p of t.line ?? []) {
      if (p[0] < a) a = p[0];
      if (p[0] > b) b = p[0];
      if (p[1] < c) c = p[1];
      if (p[1] > d) d = p[1];
    }
    box.set(t, [a - 0.01, b + 0.01, c - 0.015, d + 0.015]);
  }
  return box.get(t);
}

/** The passes and peaks on the way of a tour, in the order of the tour: [{ …spot, km (along the tour), away (km from the line) }]. */
export function spotsAlong(tour, spots = []) {
  if (!tour?.line?.length) return [];
  const [a, b, c, d] = boxOf(tour);
  const out = [];
  for (const s of spots) {
    if (s.lat < a || s.lat > b || s.lon < c || s.lon > d) continue;
    const r = nearestOnLine(tour.line, [s.lat, s.lon]);
    if (r && r.away <= NEAR_KM) out.push({ ...s, km: Math.round(r.km * 10) / 10, away: Math.round(r.away * 100) / 100 });
  }
  return out.sort((x, y) => x.km - y.km);
}

/** The spots of every tour at once: Map(tour id → list). */
export function spotIndex(tours = [], spots = []) {
  const m = new Map();
  for (const t of tours) m.set(t.id, spotsAlong(t, spots));
  return m;
}

/**
 * The tours that pass a point (a peak, a pass): [{ tour, km (along the tour), away (km from the line) }], the closest first. Used by the
 * Gipfelbuch («a tour for this peak»). tours: the list of the suggestions; max: how many to return.
 */
export function toursNear(tours = [], lat, lon, { km = NEAR_KM, max = 3 } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  const out = [];
  for (const tour of tours) {
    if (!tour?.line?.length) continue;
    const [a, b, c, d] = boxOf(tour);
    if (lat < a || lat > b || lon < c || lon > d) continue;
    const r = nearestOnLine(tour.line, [lat, lon]);
    if (r && r.away <= km) out.push({ tour, km: Math.round(r.km * 10) / 10, away: Math.round(r.away * 100) / 100 });
  }
  return out.sort((x, y) => x.away - y.away).slice(0, max);
}

/** What is new on the list: the spots you have not reached. */
export const freshSpots = (list = [], reached = new Set()) => list.filter((s) => !reached.has(s.id));

/** The canton of a tour is new when you have never ridden in it (cantons: the Neuland items, visited a Map keyed by 'ZH' …). */
export function cantonNew(tour, collections = []) {
  const c = collections.find((x) => x.id === 'cantons');
  if (!c || !tour?.region) return null;
  return !c.visited?.has?.(String(tour.region).toUpperCase());
}

/**
 * The line of a tour in runs: [{ pts, fresh }]: the pieces within 150 m of your own rides are not fresh. grid: gridOf(). Runs share their end
 * point with the next one, so the map has no gap. null without a grid.
 */
export function runsOf(line = [], grid, near = 150) {
  if (!grid || line.length < 2) return null;
  const dense = densify(line, 100);
  const runs = [];
  for (let i = 0; i < dense.length; i++) {
    const fresh = !rodeNear(dense[i], grid, near);
    const last = runs.at(-1);
    if (last && last.fresh === fresh) last.pts.push(dense[i]);
    else {
      runs.push({ pts: last ? [last.pts.at(-1), dense[i]] : [dense[i]], fresh });
    }
  }
  return runs.filter((r) => r.pts.length > 1);
}

/** Does a tour pass the filter `mode`? ctx: { share (0 to 1 or null), fresh (the new spots), canton (bool or null) }. 'sort' and null keep every tour. */
export function neuOk(mode, ctx = {}) {
  if (mode === 'half') return ctx.share === null || ctx.share === undefined ? true : ctx.share >= HALF;
  if (mode === 'places') return (ctx.fresh?.length ?? 0) > 0;
  if (mode === 'canton') return ctx.canton === true;
  return true;
}

/** The tours with the newest first (by the share of new line); the order stays for the same share; tours without a share go last. Stable. */
export const neuSort = (tours = [], shareOf = () => null) => tours.map((t, i) => [t, shareOf(t), i]).sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1) || a[2] - b[2]).map((x) => x[0]);

/* ---------- the goal of the month (idea 5) ---------- */

export const GOAL_KEY = 'vorschlaege.neuziel';
export const GOAL_NS = [1, 2, 3, 4, 5];
export const GOAL_PCTS = [40, 60, 80];
export const GOAL_STD = { on: true, n: 3, pct: 60 };

/** The goal as it is kept (anything else becomes the standard): { on, n, pct, done: { 'YYYY-MM': [tour ids] } }. */
export function goalOf(v) {
  const done = {};
  for (const [m, ids] of Object.entries(v?.done ?? {})) if (/^\d{4}-\d{2}$/.test(m) && Array.isArray(ids)) done[m] = [...new Set(ids.filter((x) => typeof x === 'string'))];
  return { on: v?.on !== false, n: GOAL_NS.includes(v?.n) ? v.n : GOAL_STD.n, pct: GOAL_PCTS.includes(v?.pct) ? v.pct : GOAL_STD.pct, done };
}
/** The month of a day text. */
export const monthOf = (day) => String(day).slice(0, 7);
/** How many tours are ticked in the month. */
export const doneIn = (goal, month) => goal.done[month]?.length ?? 0;
/** Ticks a tour for the month, or takes the tick back. */
export function tickTour(goal, month, id, on) {
  const cur = goal.done[month] ?? [];
  const next = on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id);
  return { ...goal, done: { ...goal.done, [month]: next } };
}
