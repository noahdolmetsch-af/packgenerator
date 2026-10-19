/**
 * Paket S «Reise-Spur»: the sums of the zoomable tour map (no map library, so the app stays small).
 * A place is kept as Web Mercator x, y in 0…1; a view is { x, y, zoom } (the middle and a zoom that
 * may have a fraction, so pinching is smooth). Tiles come at the whole zoom next to it and are scaled.
 * Pure, tested in tests/spur.test.js.
 */
export const TILE = 256;
export const MIN_ZOOM = 2;

/** [lat, lon] → { x, y } in 0…1. */
export function merc([lat, lon]) {
  const la = Math.max(-85.0511, Math.min(85.0511, lat));
  const r = (la * Math.PI) / 180;
  return { x: (lon + 180) / 360, y: (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 };
}

/** { x, y } in 0…1 → [lat, lon]. */
export function unmerc({ x, y }) {
  const n = Math.PI - 2 * Math.PI * y;
  return [(180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))), x * 360 - 180];
}

/** The view that shows the bounds { s, w, n, e } in a box of w × h pixels with a margin. */
export function fitView(b, w, h, { pad = 32, maxZoom = 16 } = {}) {
  if (!b) return { x: 0.5214, y: 0.3523, zoom: 7 }; // Switzerland
  const a = merc([b.n, b.w]);
  const c = merc([b.s, b.e]);
  const dx = Math.max(1e-9, c.x - a.x);
  const dy = Math.max(1e-9, c.y - a.y);
  const zx = Math.log2(Math.max(1, w - 2 * pad) / (dx * TILE));
  const zy = Math.log2(Math.max(1, h - 2 * pad) / (dy * TILE));
  const zoom = Math.max(MIN_ZOOM, Math.min(maxZoom, Math.min(zx, zy)));
  return { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, zoom };
}

/** Screen pixel of a mercator point in a w × h box. */
export function toScreen(p, view, w, h) {
  const s = TILE * 2 ** view.zoom;
  return { x: (p.x - view.x) * s + w / 2, y: (p.y - view.y) * s + h / 2 };
}

/** Mercator point under a screen pixel. */
export function fromScreen(px, py, view, w, h) {
  const s = TILE * 2 ** view.zoom;
  return { x: view.x + (px - w / 2) / s, y: view.y + (py - h / 2) / s };
}

/** Zoom by k (×2 = one step in) around the screen pixel (px, py), which stays where it is. */
export function zoomAt(view, k, px, py, w, h, { min = MIN_ZOOM, max = 18 } = {}) {
  const zoom = Math.max(min, Math.min(max, view.zoom + Math.log2(k)));
  const at = fromScreen(px, py, view, w, h);
  const s = TILE * 2 ** zoom;
  return { x: at.x - (px - w / 2) / s, y: at.y - (py - h / 2) / s, zoom };
}

/** Move the view by dx, dy screen pixels. */
export function panBy(view, dx, dy) {
  const s = TILE * 2 ** view.zoom;
  return { ...view, x: view.x - dx / s, y: Math.max(0, Math.min(1, view.y - dy / s)) };
}

/** The tiles that cover the box: [{ key, z, x, y, left, top, size }] (x wraps around the world). */
export function tilesFor(view, w, h, maxZoom = 18) {
  const z = Math.max(0, Math.min(maxZoom, Math.round(view.zoom)));
  const size = TILE * 2 ** (view.zoom - z);
  const n = 2 ** z;
  const cx = view.x * n;
  const cy = view.y * n;
  const x0 = Math.floor(cx - w / 2 / size);
  const x1 = Math.floor(cx + w / 2 / size);
  const y0 = Math.max(0, Math.floor(cy - h / 2 / size));
  const y1 = Math.min(n - 1, Math.floor(cy + h / 2 / size));
  const out = [];
  if (x1 - x0 > 40 || y1 - y0 > 40) return out;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const wx = ((tx % n) + n) % n;
      out.push({ key: `${z}/${tx}/${ty}`, z, x: wx, y: ty, left: (tx - cx) * size + w / 2, top: (ty - cy) * size + h / 2, size });
    }
  }
  return out;
}

/** SVG path of a line [[lat, lon], …] in the box (points closer than 1 px are skipped). */
export function pathOf(line, view, w, h) {
  let d = '';
  let lx = null;
  let ly = null;
  for (let n = 0; n < (line?.length ?? 0); n++) {
    const p = toScreen(merc(line[n]), view, w, h);
    const last = n === line.length - 1;
    if (lx != null && !last && Math.abs(p.x - lx) < 1 && Math.abs(p.y - ly) < 1) continue;
    d += `${d ? 'L' : 'M'}${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`;
    lx = p.x;
    ly = p.y;
  }
  return d;
}
