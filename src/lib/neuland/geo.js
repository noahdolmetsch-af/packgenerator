/**
 * «Neuland» (wish #1007): the small geometry the detection needs. Pure functions, no imports.
 * Points are { lat, lon } or [lat, lon] (the app's route lines); polygon rings are flat arrays
 * [lon0, lat0, lon1, lat1, …] in degrees (decoded from the data files, see decodeRing).
 */

const R = 6371; // km
const RAD = Math.PI / 180;

/** Distance in km between two [lat, lon] points (haversine). */
export function km(a, b) {
  const dLat = (b[0] - a[0]) * RAD;
  const dLon = (b[1] - a[1]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** A delta-encoded ring of the data files [x0, y0, dx1, dy1, …] (1/q degree) → [lon, lat, …] in degrees. */
export function decodeRing(enc, q) {
  const out = new Float64Array(enc.length);
  let x = 0;
  let y = 0;
  for (let i = 0; i < enc.length; i += 2) {
    x += enc[i];
    y += enc[i + 1];
    out[i] = x / q;
    out[i + 1] = y / q;
  }
  return out;
}

/** [minLon, minLat, maxLon, maxLat] of some rings. */
export function bboxOf(rings) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const r of rings) {
    for (let i = 0; i < r.length; i += 2) {
      if (r[i] < b[0]) b[0] = r[i];
      if (r[i] > b[2]) b[2] = r[i];
      if (r[i + 1] < b[1]) b[1] = r[i + 1];
      if (r[i + 1] > b[3]) b[3] = r[i + 1];
    }
  }
  return b;
}

/** Is the point (lon, lat) inside the rings (even-odd: holes count out)? */
export function inRings(lon, lat, rings) {
  let inside = false;
  for (const r of rings) {
    const n = r.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

const inBox = (lon, lat, b, pad = 0) => lon >= b[0] - pad && lon <= b[2] + pad && lat >= b[1] - pad && lat <= b[3] + pad;
export { inBox };

/** Distance in km from point p [lat, lon] to the segment a–b (local flat projection, fine below ~100 km). */
export function segKm(p, a, b) {
  const k = Math.cos(p[0] * RAD);
  const ax = (a[1] - p[1]) * k, ay = a[0] - p[0];
  const bx = (b[1] - p[1]) * k, by = b[0] - p[0];
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? -(ax * dx + ay * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.sqrt(x * x + y * y) * 111.195;
}

/** The shortest distance in km from p [lat, lon] to a line [[lat, lon], …] (a single point works too). */
export function lineKm(p, line) {
  if (!line?.length) return Infinity;
  if (line.length === 1) return km(p, line[0]);
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const d = segKm(p, line[i - 1], line[i]);
    if (d < best) best = d;
  }
  return best;
}

/** Distance in km from p [lat, lon] to the edges of the rings. */
export function ringsKm(p, rings) {
  let best = Infinity;
  for (const r of rings) {
    const n = r.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const d = segKm(p, [r[j + 1], r[j]], [r[i + 1], r[i]]);
      if (d < best) best = d;
    }
  }
  return best;
}

/** The line with extra points so that no step is longer than `step` km (for the area tests). */
export function densify(line, step = 0.4) {
  if (!line?.length) return [];
  const out = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const n = Math.min(400, Math.ceil(km(a, b) / step));
    for (let s = 1; s < n; s++) out.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n]);
    out.push(b);
  }
  return out;
}

/** [minLat, minLon, maxLat, maxLon] of a line [[lat, lon], …]. */
export function lineBox(line) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [lat, lon] of line) {
    if (lat < b[0]) b[0] = lat;
    if (lat > b[2]) b[2] = lat;
    if (lon < b[1]) b[1] = lon;
    if (lon > b[3]) b[3] = lon;
  }
  return b;
}

/**
 * A grid over the areas' boxes, so a point only tests the few areas near it.
 * items: [{ bbox }]; cell: degrees. → (lon, lat) => [index, …]
 */
export function gridOf(items, cell) {
  const g = new Map();
  items.forEach((it, i) => {
    if (!it.bbox) return;
    const [x0, y0, x1, y1] = it.bbox;
    for (let x = Math.floor(x0 / cell); x <= Math.floor(x1 / cell); x++) {
      for (let y = Math.floor(y0 / cell); y <= Math.floor(y1 / cell); y++) {
        const k = `${x},${y}`;
        if (!g.has(k)) g.set(k, []);
        g.get(k).push(i);
      }
    }
  });
  return (lon, lat) => g.get(`${Math.floor(lon / cell)},${Math.floor(lat / cell)}`) ?? [];
}

/** The area (index) a point lies in, or -1. */
export function areaAt(lon, lat, items, grid) {
  for (const i of grid(lon, lat)) {
    const it = items[i];
    if (inBox(lon, lat, it.bbox) && inRings(lon, lat, it.rings)) return i;
  }
  return -1;
}

/**
 * The map projection: x = lon · cos(lat0), y = −lat (an equirectangular view, true enough for
 * Switzerland and Europe). → { x, y } in degree units, scaled by the caller's viewBox.
 */
export const project = (lon, lat, k) => [lon * k, -lat];

/** An SVG path of rings in the projection (k = cos(lat0)), coordinates rounded to `d` decimals. */
export function pathOf(rings, k, d = 3) {
  const f = 10 ** d;
  let s = '';
  for (const r of rings) {
    for (let i = 0; i < r.length; i += 2) s += `${i ? 'L' : 'M'}${Math.round(r[i] * k * f) / f} ${Math.round(-r[i + 1] * f) / f}`;
    s += 'Z';
  }
  return s;
}
