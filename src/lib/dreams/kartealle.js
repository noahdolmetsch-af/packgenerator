/**
 * «Karte aller Träume» (Träume und Neuland N14, Noah 27.10.2026 «1-5 a»): every dream with a map on one map,
 * each with how many municipalities, passes and lakes it would bring for the first time, so you see which
 * dream brings the most new. Uses the Neuland finder (neuland.js detect) on the dream's route.
 * Pure, tested in tests/kartealle.test.js.
 */
import { detect } from '../neuland/neuland.js';

export const NEW_KINDS = ['municipalities', 'passes', 'lakes'];

/** The dreams with a route of at least two points. */
export const routedDreams = (dreams = []) => dreams.filter((d) => Array.isArray(d?.route?.line) && d.route.line.length > 1);

/**
 * What each dream would bring new: Map(dream id → { municipalities, passes, lakes, total }).
 * collections: computeFrom(...).collections (id, kind, radius, items, visited).
 */
export function dreamNews(dreams = [], collections = []) {
  const defs = collections.filter((c) => NEW_KINDS.includes(c.id));
  const out = new Map();
  for (const d of routedDreams(dreams)) {
    const found = detect(defs, [{ day: '9999-12-31', tripId: null, rideId: null, pts: d.route.line }]);
    const n = Object.fromEntries(NEW_KINDS.map((k) => [k, 0]));
    for (const c of defs) for (const id of Object.keys(found[c.id] ?? {})) if (!c.visited?.has?.(id)) n[c.id]++;
    out.set(d.id, { ...n, total: NEW_KINDS.reduce((s, k) => s + n[k], 0) });
  }
  return out;
}

/** The routed dreams, most new first (then in their own order). → [{ dream, news, no }] (no: 1, 2, … on the map). */
export function rankDreams(dreams = [], news = new Map()) {
  const list = routedDreams(dreams).map((dream, i) => ({ dream, news: news.get(dream.id) ?? null, i }));
  list.sort((a, b) => (b.news?.total ?? -1) - (a.news?.total ?? -1) || a.i - b.i);
  return list.map(({ i, ...x }, k) => ({ ...x, no: k + 1 }));
}
