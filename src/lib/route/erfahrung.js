/**
 * «Route kennt deine Erfahrung» (S3, Noah 21.11.2026 «2b», Thread «Ideen für bessere App und Inhalte sammeln»):
 * what your own rides say about a route before you ride it.
 *   - bad: stretches you marked as bad after a ride (Wege-Gedächtnis, live/wegegedaechtnis.js) that the route
 *     passes, with the km where it does;
 *   - good: how many stretches you marked as good lie on the route;
 *   - fresh: how many km run on roads you never rode (the rule of «Neue Kilometer», neuland/neuekm.js).
 * Only a hint: nothing is changed and nothing is stored. Pure functions, tested in tests/routeerfahrung.test.js.
 */
import { steps, newKmOfRoute } from '../neuland/neuekm.js';
import { merc } from '../spur/mapmath.js';

/** A marked stretch counts as «on the route» when one of its points is this close (m) to the route. */
export const ON_ROUTE_M = 60;
const STEP_M = 50;
const Z = 18; // grid squares of about 100 m
const N = 2 ** Z;
const R = 6371000;
const toRad = Math.PI / 180;

function meters(a, b) {
  const dLat = (b[0] - a[0]) * toRad;
  const dLon = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad);
  return Math.hypot(dLat, dLon) * R;
}

/** The route as points about STEP_M apart in a grid, each with its km along the route. */
function routeGrid(line) {
  const grid = new Map();
  let m = 0;
  for (const p of steps(line, STEP_M)) {
    m += p[2] / 2;
    const c = merc(p);
    const key = `${Math.floor(c.x * N)}/${Math.floor(c.y * N)}`;
    const cell = grid.get(key);
    const entry = [p[0], p[1], m / 1000];
    if (cell) cell.push(entry);
    else grid.set(key, [entry]);
    m += p[2] / 2;
  }
  return grid;
}

/** The km along the route where `pt` ([lat, lon]) is within `near` m of it, or null. */
function kmNear(grid, pt, near) {
  const c = merc(pt);
  const gx = Math.floor(c.x * N);
  const gy = Math.floor(c.y * N);
  let best = null;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (const q of grid.get(`${gx + dx}/${gy + dy}`) ?? []) {
        const d = meters(pt, q);
        if (d <= near && (best == null || d < best.d)) best = { d, km: q[2] };
      }
    }
  }
  return best ? best.km : null;
}

/**
 * The marked stretches (ways of the Wege-Gedächtnis, one rating) the route passes.
 * → [{ id, km }] in the order of the route; km = where the route first meets the stretch (0.1 km).
 */
export function waysOnRoute(ways = [], line = [], rating = 'down', { near = ON_ROUTE_M } = {}) {
  const pts = (line ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return [];
  const grid = routeGrid(pts);
  const out = [];
  for (const w of ways) {
    if (!w || w.rating !== rating || !Array.isArray(w.line)) continue;
    let km = null;
    for (const p of w.line) {
      const k = kmNear(grid, p, near);
      if (k != null && (km == null || k < km)) km = k;
    }
    if (km != null) out.push({ id: w.id, km: Math.round(km * 10) / 10 });
  }
  return out.sort((a, b) => a.km - b.km);
}

/**
 * What the rides say about a route. line: the route as [[lat, lon], …] (trip.route.line); ways: the stretches of
 * the Wege-Gedächtnis; lines: heatLines() output (or null while not loaded, then `fresh` stays null).
 * → { bad: [{ id, km }], good: n, fresh: { km, newKm } | null }
 */
export function experience({ line = [], ways = [], lines = null } = {}) {
  return {
    bad: waysOnRoute(ways, line, 'down'),
    good: waysOnRoute(ways, line, 'up').length,
    fresh: lines ? newKmOfRoute(line, lines) : null,
  };
}

const kmText = (v, num) => num(v < 10 ? Math.round(v * 10) / 10 : Math.round(v));

/**
 * The hints as short lines. t, tn, num: the translator, the plural translator, the number formatter.
 * → [{ key: 'bad' | 'good' | 'fresh', text }]
 */
export function experienceLines(exp, { t, tn, num = (v) => String(v) }) {
  const out = [];
  if (!exp) return out;
  if (exp.bad.length) {
    const list = exp.bad.slice(0, 5).map((b) => kmText(b.km, num)).join(', ');
    out.push({ key: 'bad', text: tn(exp.bad.length, 'One stretch you marked as bad is on this route, at km {list}.', '{n} stretches you marked as bad are on this route, first at km {list}.', { list }) });
  }
  if (exp.good > 0) out.push({ key: 'good', text: tn(exp.good, 'One stretch you marked as good is on this route.', '{n} stretches you marked as good are on this route.') });
  if (exp.fresh && exp.fresh.km > 0) {
    if (exp.fresh.newKm <= 0.1) out.push({ key: 'fresh', text: t('You know this whole route from your earlier rides.') });
    else out.push({ key: 'fresh', text: t('{pct} % of this route is new for you ({km} km).', { pct: Math.round((exp.fresh.newKm / exp.fresh.km) * 100), km: kmText(exp.fresh.newKm, num) }) });
  }
  return out;
}
