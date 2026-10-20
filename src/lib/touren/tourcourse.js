/**
 * Tour-Seite «wie komoot» (Noah 20.10.2026: «ich möchte 1:1 die details aus komoot»): the course of a
 * finished tour by distance and its speed over time, from the details Strava sends (api/strava.js
 * trimCourse: dprof every 50 m, sprof [minute, km/h]). Pure functions, tested in tests/tourcourse.test.js.
 */
import { fineFromSeries, isFine } from '../map/fineprofile.js';

/** The heights of one stored dprof → [[km, m]] (null when it is not usable). */
export function dprofPoints(p) {
  if (!p || !(Number(p.step) > 0) || !Array.isArray(p.d) || p.d.length < 2) return null;
  const out = [];
  let h = 0;
  for (let i = 0; i < p.d.length; i++) (h += Number(p.d[i]) || 0), out.push([i * p.step, h]);
  return out;
}

/**
 * The fine profile of a tour: the recorded course of its activities, one after the other (activities
 * without a course move the next one on by their km); else the fine profile of the trip's GPX route.
 * → { fine, src: 'ride' | 'route' } or null.
 */
export function courseOf(acts = [], trip = null) {
  const ks = [];
  const es = [];
  let at = 0;
  let any = false;
  for (const a of acts) {
    const pts = dprofPoints(a?.dprof);
    const km = pts ? Math.max(pts.at(-1)[0], Number(a.dprof.km) || 0) : Number(a?.own?.km ?? a?.km) || 0;
    if (pts) {
      any = true;
      for (const [k, m] of pts) ks.push(at + k), es.push(m);
    }
    at += km;
  }
  if (any && ks.length > 1) return { fine: fineFromSeries(ks, es, ks.at(-1)), src: 'ride' };
  const r = trip?.route;
  if (r && isFine(r.profileFine)) return { fine: r.profileFine, src: 'route' };
  return null;
}

/**
 * The speed over the whole time of the tour, the activities one after the other: { pts: [[minute, km/h]],
 * ele: [[minute, m]] (the height as the background, from the course of TR6), max, end } or null.
 */
export function speedOf(acts = []) {
  const pts = [];
  const ele = [];
  let at = 0;
  for (const a of acts) {
    const s = Array.isArray(a?.sprof) ? a.sprof.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : [];
    const e = Array.isArray(a?.prof?.pts) ? a.prof.pts.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : [];
    for (const [m, v] of s) pts.push([at + m, v]);
    for (const [m, h] of e) ele.push([at + m, h]);
    const len = Math.max(s.at(-1)?.[0] ?? 0, e.at(-1)?.[0] ?? 0, (Number(a?.elapsedS) || 0) / 60);
    at += len;
  }
  if (pts.length < 2) return null;
  return { pts, ele, max: Math.max(...pts.map((p) => p[1])), end: Math.max(at, pts.at(-1)[0]) };
}

/** Moving average of the speed in [fromMin, toMin] (stops left out) and the time: { kmh, min }. */
export function speedIn(sp, fromMin, toMin) {
  if (!sp) return null;
  const sel = sp.pts.filter((p) => p[0] >= fromMin && p[0] <= toMin);
  const moving = sel.filter((p) => p[1] > 1);
  return { kmh: moving.length ? Math.round((moving.reduce((s, p) => s + p[1], 0) / moving.length) * 10) / 10 : null, min: Math.round(toMin - fromMin) };
}
