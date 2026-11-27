/**
 * «Weisse Flecken in der Nähe» (Träume und Neuland N1, Noah 27.10.2026 «1-5 a»): the municipalities around
 * your home place, and which of them you have never been to. A municipality counts as near when its middle
 * lies within the radius. Pure functions, tested in tests/flecken.test.js.
 * «Weisse Flecken ausbauen» (Noah 27.11.2026 «1b 2a 3a 4a 5b»): the radius has five buttons and can be typed (5 to 200 km);
 * directions() says per direction how many municipalities are still open; TRAIN_KM is where «Train there, bike home» is hinted.
 */
import { km } from './geo.js';
import { bearing, sectorOf, SECTORS } from '../ueberraschung.js';

export const SPOTS_KEY = 'neuland.spots';
export const SPOT_RADII = [10, 25, 50, 75, 100];
export const SPOT_RADIUS = 25;
/** The radius can be typed: from SPOT_MIN to SPOT_MAX km (a whole number). */
export const SPOT_MIN = 5;
export const SPOT_MAX = 200;
/** From this far on a ride there and back is long: the page hints at the train there and the bike home. */
export const TRAIN_KM = 50;

/** The saved choice { radius } with the default. */
export function spotsCfg(value) {
  const r = Number(value?.radius);
  return { radius: Number.isInteger(r) && r >= SPOT_MIN && r <= SPOT_MAX ? r : SPOT_RADIUS };
}

/**
 * items: the municipalities ({ id, name, kt, c: [lon, lat], rings, bbox }); visited: Map id → visit (Neuland
 * visitedOf); home: { lat, lon }. → { near: [{ id, name, kt, lat, lon, km, been, rings, bbox }] nearest first,
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
    near.push({ id: it.id, name: it.name, kt: it.kt ?? null, lat: it.c[1], lon: it.c[0], km: Math.round(d * 10) / 10, been: visited.has(it.id), rings: it.rings, bbox: it.bbox });
  }
  near.sort((a, b) => a.km - b.km || a.name.localeCompare(b.name));
  const open = near.filter((x) => !x.been);
  return { near, open, been: near.length - open.length };
}

/**
 * Where is the most new? The municipalities within the radius per direction (8 sectors from home): how many there are
 * and how many were never visited. → [{ sector (a key of SECTORS), open, all, nearest (km of the nearest open one) }],
 * only directions with something open, most open first (then nearest).
 */
export function directions(near = [], home) {
  const H = { lat: Number(home?.lat), lon: Number(home?.lon) };
  if (!Number.isFinite(H.lat) || !Number.isFinite(H.lon)) return [];
  const out = SECTORS.map((sector) => ({ sector, open: 0, all: 0, nearest: null }));
  for (const x of near) {
    const o = out[sectorOf(bearing(H, { lat: x.lat, lon: x.lon }))];
    o.all++;
    if (!x.been) {
      o.open++;
      if (o.nearest == null || x.km < o.nearest) o.nearest = x.km;
    }
  }
  return out.filter((o) => o.open).sort((a, b) => b.open - a.open || a.nearest - b.nearest);
}
