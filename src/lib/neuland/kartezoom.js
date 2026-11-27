/**
 * Zoom of the Neuland map (Noah 27.11.2026 «die Karte muss wirklich ausgezeichnet sein mit Zoomfunktion»). Pure functions on the
 * drawing units of NeulandMap: base = the whole map [x, y, w, h]; a view = { z, cx, cy } (zoom 1 = the whole map, cx/cy = the middle of
 * what is shown, null = the middle of the map). Tested in tests/kartezoom.test.js.
 */
export const MAX_ZOOM = 40;

/** The part of the map that is shown: [x, y, w, h]. */
export function visibleBox(base, v) {
  const z = Math.max(1, v?.z ?? 1);
  const w = base[2] / z;
  const h = base[3] / z;
  const cx = v?.cx ?? base[0] + base[2] / 2;
  const cy = v?.cy ?? base[1] + base[3] / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}

/** Keeps the zoom in 1…max and the middle so that no empty space shows beside the map. */
export function clampView(base, v, max = MAX_ZOOM) {
  const z = Math.min(max, Math.max(1, v.z));
  if (z <= 1.001) return { z: 1, cx: null, cy: null };
  const w = base[2] / z;
  const h = base[3] / z;
  const cx = Math.min(base[0] + base[2] - w / 2, Math.max(base[0] + w / 2, v.cx ?? base[0] + base[2] / 2));
  const cy = Math.min(base[1] + base[3] - h / 2, Math.max(base[1] + h / 2, v.cy ?? base[1] + base[3] / 2));
  return { z, cx, cy };
}

/** Zooms to nz so that the point (px, py) stays where it is on the screen. */
export function zoomAt(base, v, px, py, nz) {
  const z = Math.max(1, v.z);
  const cx = v.cx ?? base[0] + base[2] / 2;
  const cy = v.cy ?? base[1] + base[3] / 2;
  const f = z / nz;
  return { z: nz, cx: px - (px - cx) * f, cy: py - (py - cy) * f };
}

/** A pinch: ratio = new distance / old distance of the fingers, (px, py) their middle, (dx, dy) how far the middle moved (drawing units). */
export function pinch(base, v, { px, py, ratio, dx = 0, dy = 0 }, max = MAX_ZOOM) {
  const nz = Math.min(max, Math.max(1, v.z * ratio));
  const z = zoomAt(base, v, px, py, nz);
  return clampView(base, { ...z, cx: z.cx - dx, cy: z.cy - dy }, max);
}
