/**
 * «Pässe sammeln» (Noah 03.11.2026 «E und F», Paket E, Idee 24): the passes the app knows and how it finds the ones
 * a ride crossed. A short list of well-known Swiss passes (name, height above sea level, a point on the top);
 * the places are rounded to about 100 m and a ride counts as crossing a pass when its line comes within RADIUS_KM
 * of that point. It is only a suggestion: nothing is collected without a tap, and own passes can be added.
 * Pure, tested in tests/paesse.test.js.
 */

/** Swiss passes: key, name, height (m), place on the top. */
export const PASSES = [
  { key: 'furka', name: 'Furka', m: 2429, lat: 46.5726, lon: 8.415 },
  { key: 'grimsel', name: 'Grimsel', m: 2164, lat: 46.572, lon: 8.334 },
  { key: 'susten', name: 'Susten', m: 2224, lat: 46.7295, lon: 8.447 },
  { key: 'nufenen', name: 'Nufenen', m: 2478, lat: 46.4775, lon: 8.388 },
  { key: 'gotthard', name: 'Gotthard', m: 2106, lat: 46.559, lon: 8.562 },
  { key: 'klausen', name: 'Klausen', m: 1948, lat: 46.868, lon: 8.858 },
  { key: 'oberalp', name: 'Oberalp', m: 2044, lat: 46.659, lon: 8.671 },
  { key: 'lukmanier', name: 'Lukmanier', m: 1915, lat: 46.562, lon: 8.8 },
  { key: 'sanbernardino', name: 'San Bernardino', m: 2066, lat: 46.496, lon: 9.169 },
  { key: 'spluegen', name: 'Splügen', m: 2113, lat: 46.5075, lon: 9.33 },
  { key: 'julier', name: 'Julier', m: 2284, lat: 46.472, lon: 9.731 },
  { key: 'albula', name: 'Albula', m: 2315, lat: 46.585, lon: 9.837 },
  { key: 'fluela', name: 'Flüela', m: 2383, lat: 46.747, lon: 9.948 },
  { key: 'bernina', name: 'Bernina', m: 2328, lat: 46.41, lon: 10.02 },
  { key: 'ofen', name: 'Ofen', m: 2149, lat: 46.636, lon: 10.297 },
  { key: 'umbrail', name: 'Umbrail', m: 2501, lat: 46.531, lon: 10.453 },
  { key: 'simplon', name: 'Simplon', m: 2005, lat: 46.251, lon: 8.033 },
  { key: 'stbernhard', name: 'Grosser St. Bernhard', m: 2469, lat: 45.869, lon: 7.171 },
  { key: 'forclaz', name: 'Col de la Forclaz', m: 1526, lat: 46.06, lon: 6.998 },
  { key: 'mosses', name: 'Col des Mosses', m: 1445, lat: 46.398, lon: 7.1 },
  { key: 'pillon', name: 'Col du Pillon', m: 1546, lat: 46.355, lon: 7.207 },
  { key: 'jaun', name: 'Jaunpass', m: 1509, lat: 46.609, lon: 7.332 },
  { key: 'bruenig', name: 'Brünig', m: 1008, lat: 46.756, lon: 8.133 },
  { key: 'pragel', name: 'Pragel', m: 1550, lat: 47.008, lon: 8.877 },
  { key: 'ibergeregg', name: 'Ibergeregg', m: 1406, lat: 47.042, lon: 8.767 },
  { key: 'maloja', name: 'Maloja', m: 1815, lat: 46.4, lon: 9.696 },
  { key: 'lenzerheide', name: 'Lenzerheide', m: 1547, lat: 46.728, lon: 9.556 },
  { key: 'marchairuz', name: 'Col du Marchairuz', m: 1447, lat: 46.522, lon: 6.233 },
];

/** How close a ride's line must come to the top of a pass (km). */
export const RADIUS_KM = 1.2;

const KM_PER_DEG = 111.2;

/** The distance (km) from a point to a stretch a–b, on a flat map around the point (fine for a few km). */
export function distToSegmentKm(p, a, b) {
  const k = Math.cos((p[0] * Math.PI) / 180);
  const xy = (q) => [(q[1] - p[1]) * k * KM_PER_DEG, (q[0] - p[0]) * KM_PER_DEG];
  const [ax, ay] = xy(a);
  const [bx, by] = xy(b);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const u = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
  return Math.hypot(ax + u * dx, ay + u * dy);
}

/** The keys of the passes a line [[lat, lon], …] crosses (comes within `radius` km of), in the catalogue's order. */
export function passesOnLine(line, radius = RADIUS_KM, catalog = PASSES) {
  const pts = (Array.isArray(line) ? line : []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return [];
  const pad = (radius * 3) / KM_PER_DEG;
  const lat0 = Math.min(...pts.map((p) => p[0])) - pad;
  const lat1 = Math.max(...pts.map((p) => p[0])) + pad;
  const lon0 = Math.min(...pts.map((p) => p[1])) - pad * 2;
  const lon1 = Math.max(...pts.map((p) => p[1])) + pad * 2;
  const out = [];
  for (const c of catalog) {
    if (c.lat < lat0 || c.lat > lat1 || c.lon < lon0 || c.lon > lon1) continue;
    const at = [c.lat, c.lon];
    for (let i = 1; i < pts.length; i++) {
      if (distToSegmentKm(at, pts[i - 1], pts[i]) <= radius) {
        out.push(c.key);
        break;
      }
    }
  }
  return out;
}
