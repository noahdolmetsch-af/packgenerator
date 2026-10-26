/**
 * «Route prüfen» (Touren-Ideen 41, Noah 25.10.2026): before a GPX route becomes the route of a trip,
 * the app looks for three things that often go wrong when a route is drawn or exported:
 *   - jumps: two track points more than JUMP_KM apart (a missing piece, a straight line across);
 *     only for track points: route points of a planner lie far apart on purpose
 *   - loops: the route passes the same place again after at least LOOP_MIN_KM (drawn twice by mistake,
 *     or a there-and-back piece you want to know about); a round trip back to the start is no loop
 *   - heights: no heights at all, or missing on more than ELE_PART of the points (climbing and the
 *     profile are then too low)
 * Nothing is changed: the person sees the hints and decides «Use anyway» or «Cancel».
 * Pure (no browser needed), tested in tests/routecheck.test.js.
 */
import { distKm } from '../route.js';

export const JUMP_KM = 1;
export const LOOP_MIN_KM = 2;
export const LOOP_NEAR_KM = 0.05;
export const SAMPLE_KM = 0.1;
export const ELE_PART = 0.1;
/** At most this many jumps or loops are listed (the rest is counted). */
export const MAX_LIST = 5;

const r1 = (v) => Math.round(v * 10) / 10;

/** Points every SAMPLE_KM along the route: [{ lat, lon, km }]. */
function samples(points) {
  const out = [];
  let km = 0;
  let since = Infinity;
  for (let i = 0; i < points.length; i++) {
    if (i) {
      const d = distKm(points[i - 1], points[i]);
      km += d;
      since += d;
    }
    if (since >= SAMPLE_KM) {
      out.push({ lat: points[i].lat, lon: points[i].lon, km });
      since = 0;
    }
  }
  return { list: out, total: km };
}

/** The places the route passes twice: [{ km, againKm }], one per stretch (a there-and-back piece is one). */
function loopsOf(points) {
  const { list, total } = samples(points);
  const cell = LOOP_NEAR_KM / 111.32;
  const key = (a, b) => `${a}:${b}`;
  const grid = new Map();
  const out = [];
  let last = null;
  for (const s of list) {
    const cy = Math.floor(s.lat / cell);
    const cx = Math.floor((s.lon * Math.cos((s.lat * Math.PI) / 180)) / cell);
    let hit = null;
    for (let dy = -1; dy <= 1 && !hit; dy++) {
      for (let dx = -1; dx <= 1 && !hit; dx++) {
        for (const o of grid.get(key(cy + dy, cx + dx)) ?? []) {
          if (s.km - o.km < LOOP_MIN_KM) continue;
          if (o.km < 1 && total - s.km < 1) continue; // a round trip: back at the start
          if (distKm(o, s) <= LOOP_NEAR_KM) {
            hit = o;
            break;
          }
        }
      }
    }
    if (hit) {
      // one stretch: the next hits right after this one belong to it
      if (last && s.km - last.until <= 0.5) last.until = s.km;
      else out.push((last = { km: r1(hit.km), againKm: r1(s.km), until: s.km }));
    }
    const k = key(cy, cx);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(s);
  }
  return out.map(({ km, againKm }) => ({ km, againKm }));
}

/** The jumps between two track points: [{ km, gapKm }]. */
function jumpsOf(points) {
  const out = [];
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distKm(points[i - 1], points[i]);
    if (d > JUMP_KM) out.push({ km: r1(km), gapKm: r1(d) });
    km += d;
  }
  return out;
}

/**
 * The check of a parsed GPX ({ points, kind } of route.js parseGpx):
 * → { ok, jumps: [{ km, gapKm }], loops: [{ km, againKm }], ele: 'ok' | 'none' | 'part', elePct, count }
 */
export function routeCheck(gpx) {
  const points = Array.isArray(gpx?.points) ? gpx.points.filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon)) : [];
  if (points.length < 2) return { ok: true, jumps: [], loops: [], ele: 'ok', elePct: 0, count: 0 };
  const jumps = gpx.kind === 'rte' ? [] : jumpsOf(points);
  const loops = loopsOf(points);
  const without = points.filter((p) => p.ele == null).length;
  const elePct = Math.round((without / points.length) * 100);
  const ele = without === points.length ? 'none' : without / points.length > ELE_PART ? 'part' : 'ok';
  const count = jumps.length + loops.length + (ele === 'ok' ? 0 : 1);
  return { ok: count === 0, jumps, loops, ele, elePct, count };
}

const kmText = (v, num) => num(v < 10 ? r1(v) : Math.round(v));

/**
 * The hints as short lines for the page. t: the translator, num: the number formatter.
 * → [{ key, text }]
 */
export function checkLines(check, t, num = (v) => String(v)) {
  if (!check || check.ok) return [];
  const out = [];
  const list = (arr) => arr.slice(0, MAX_LIST).map((x) => kmText(x.km, num)).join(', ');
  if (check.jumps.length) {
    out.push({
      key: 'jumps',
      text:
        check.jumps.length === 1
          ? t('A jump of {gap} km at km {km}: a piece of the route may be missing.', { gap: kmText(check.jumps[0].gapKm, num), km: kmText(check.jumps[0].km, num) })
          : t('{n} jumps, at km {list}: pieces of the route may be missing.', { n: check.jumps.length, list: list(check.jumps) }),
    });
  }
  if (check.loops.length) {
    out.push({
      key: 'loops',
      text:
        check.loops.length === 1
          ? t('The route passes the same place twice, at km {km} and at km {again}.', { km: kmText(check.loops[0].km, num), again: kmText(check.loops[0].againKm, num) })
          : t('The route passes {n} places twice, first at km {list}.', { n: check.loops.length, list: list(check.loops) }),
    });
  }
  if (check.ele === 'none') out.push({ key: 'ele', text: t('The file has no heights: no climbing and no profile.') });
  else if (check.ele === 'part') out.push({ key: 'ele', text: t('Heights are missing on {pct} % of the route: the climbing comes out too low.', { pct: check.elePct }) });
  return out;
}
