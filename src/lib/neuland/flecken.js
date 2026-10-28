/**
 * «Weisse Flecken in der Nähe» (Träume und Neuland N1, Noah 27.10.2026 «1-5 a»): the municipalities around
 * your home place, and which of them you have never been to. A municipality counts as near when its middle
 * lies within the radius. Pure functions, tested in tests/flecken.test.js.
 */
import { km } from './geo.js';

export const SPOTS_KEY = 'neuland.spots';
export const SPOT_RADII = [10, 25, 50];
export const SPOT_RADIUS = 25;

/** The saved choice { radius } with the default. */
export function spotsCfg(value) {
  const r = Number(value?.radius);
  return { radius: SPOT_RADII.includes(r) ? r : SPOT_RADIUS };
}

/**
 * items: the municipalities ({ id, name, kt, c: [lon, lat], rings, bbox }); visited: Map id → visit (Neuland
 * visitedOf); home: { lat, lon }. → { near: [{ id, name, kt, km, been, rings, bbox }] nearest first,
 * open: the ones never visited, been: how many visited } or null without a home place.
 */
export function whiteSpots(items = [], visited = new Map(), home, radius = SPOT_RADIUS) {
  const lat = Number(home?.lat);
  const lon = Number(home?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const near = [];
  for (const it of items) {
    if (!it?.c) continue;
    const d = km([lat, lon], [it.c[1], it.c[0]]);
    if (d > radius) continue;
    near.push({ id: it.id, name: it.name, kt: it.kt ?? null, km: Math.round(d * 10) / 10, been: visited.has(it.id), rings: it.rings, bbox: it.bbox });
  }
  near.sort((a, b) => a.km - b.km || a.name.localeCompare(b.name));
  const open = near.filter((x) => !x.been);
  return { near, open, been: near.length - open.length };
}
