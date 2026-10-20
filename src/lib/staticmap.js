/**
 * v0.102.0 Design-Refresh P4 «Touren» (T3 «Strecke», baustein «Karte mit Strecke», G6): a small still
 * map of a route. No map library: the OpenStreetMap tiles that cover the route are laid out under the
 * line (Web Mercator, 256 px tiles), so the app stays small and works offline (then only the line shows).
 * Pure, tested in tests/staticmap.test.js.
 */

export const TILE = 256;
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** World pixel of a point at a zoom level. */
export function project({ lat, lon }, z) {
  const s = TILE * 2 ** z;
  const la = Math.max(-85.0511, Math.min(85.0511, lat));
  const r = (la * Math.PI) / 180;
  return { x: ((lon + 180) / 360) * s, y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s };
}

/**
 * Everything to draw the map: the zoom that fits the points into w × h (with a margin), the tiles
 * [{ x, y, z, left, top, url }], and a function px(point) → { x, y } in the w × h box.
 * url: the tile address with {z}/{x}/{y} (the app's map ground, Kartenlayer 20.10.2026; OpenStreetMap by default).
 * Returns null without points.
 */
export function mapView(points, w, h, { pad = 28, maxZoom = 15, minZoom = 3, url = TILE_URL } = {}) {
  const pts = (points ?? []).filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if (!pts.length) return null;
  let z = maxZoom;
  for (; z > minZoom; z--) {
    const xy = pts.map((p) => project(p, z));
    const dx = Math.max(...xy.map((p) => p.x)) - Math.min(...xy.map((p) => p.x));
    const dy = Math.max(...xy.map((p) => p.y)) - Math.min(...xy.map((p) => p.y));
    if (dx <= w - 2 * pad && dy <= h - 2 * pad) break;
  }
  const xy = pts.map((p) => project(p, z));
  const cx = (Math.max(...xy.map((p) => p.x)) + Math.min(...xy.map((p) => p.x))) / 2;
  const cy = (Math.max(...xy.map((p) => p.y)) + Math.min(...xy.map((p) => p.y))) / 2;
  const ox = cx - w / 2;
  const oy = cy - h / 2;
  const n = 2 ** z;
  const tiles = [];
  for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + h) / TILE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + w) / TILE); tx++) {
      const wx = ((tx % n) + n) % n;
      tiles.push({ x: wx, y: ty, z, left: tx * TILE - ox, top: ty * TILE - oy, url: url.replace('{z}', z).replace('{x}', wx).replace('{y}', ty) });
    }
  }
  const px = (p) => {
    const q = project(p, z);
    return { x: Math.round((q.x - ox) * 10) / 10, y: Math.round((q.y - oy) * 10) / 10 };
  };
  return { z, tiles, px };
}

/** The SVG path «M x,y L …» of a line [[lat, lon], …] in the box. */
export function linePath(line, px) {
  return (line ?? []).map(([lat, lon], n) => {
    const p = px({ lat, lon });
    return `${n ? 'L' : 'M'}${p.x},${p.y}`;
  }).join(' ');
}
