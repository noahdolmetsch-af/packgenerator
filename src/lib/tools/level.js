/**
 * Paket L «Werkzeugkasten» (Wasserwaage, Noah 19.10.2026): the tilt of the phone from its motion sensor.
 * Lying flat: both axes; on its edge: one angle. «Set to zero» keeps an offset (a crooked phone case).
 * Pure, tested in tests/werkzeugkasten.test.js.
 */

/** Tilt in degrees from a deviceorientation event: { x (left–right), y (front–back) } or null. */
export function tiltOf(e) {
  if (!e || typeof e.beta !== 'number' || typeof e.gamma !== 'number') return null;
  return { x: e.gamma, y: e.beta };
}

/** Flat on a table or on its edge (beta near ±90 means standing up). */
export const isEdge = (tilt) => !!tilt && Math.abs(tilt.y) > 45;

/** The angle to show, minus the zero offset, rounded to 0.1°. Flat: the bigger axis; edge: left–right. */
export function angleOf(tilt, zero = { x: 0, y: 0 }) {
  if (!tilt) return null;
  const x = tilt.x - (zero?.x ?? 0);
  const y = (isEdge(tilt) ? 0 : tilt.y) - (isEdge(tilt) ? 0 : (zero?.y ?? 0));
  const a = Math.abs(x) >= Math.abs(y) ? x : y;
  return Math.round(a * 10) / 10;
}

/** Where the bubble sits, −1…1 on each axis (±10° is the edge of the glass). */
export function bubbleOf(tilt, zero = { x: 0, y: 0 }) {
  if (!tilt) return { x: 0, y: 0 };
  const c = (v) => Math.max(-1, Math.min(1, v / 10));
  return { x: c(tilt.x - (zero?.x ?? 0)), y: isEdge(tilt) ? 0 : c(tilt.y - (zero?.y ?? 0)) };
}

/** Level within half a degree. */
export const isLevel = (a) => a != null && Math.abs(a) < 0.5;

/** The slope in percent of an angle (for a road or a ramp): 5.7° ≈ 10 %. */
export const slopePct = (deg) => (deg == null ? null : Math.round(Math.tan((Math.abs(deg) * Math.PI) / 180) * 1000) / 10);
