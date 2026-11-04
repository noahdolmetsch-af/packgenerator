/**
 * «Höhenprofil wird abgefahren» (Noah 03.11.2026 «E und F», Paket E, Idee 13): when a tour opens, a small
 * dot rides along the elevation line once and the line draws itself behind it. Pure helpers, tested in
 * tests/abfahren.test.js; the moving part is abfahren.svelte.js.
 */

/** How long the ride along the line takes (ms). */
export const RIDE_MS = 1600;

/** Slows down at the end: 0…1 in, 0…1 out. */
export const ease = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;

/** The share (0…1) of the ride after `elapsed` ms. */
export const rideShare = (elapsed, ms = RIDE_MS) => ease(elapsed / ms);

/** The height at a km of a profile [[km, m], …] (straight between two points); null for an empty profile. */
export function heightAtKm(points = [], km = 0) {
  const pts = points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!pts.length) return null;
  if (km <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (km <= pts[i][0]) {
      const [k0, m0] = pts[i - 1];
      const [k1, m1] = pts[i];
      return k1 === k0 ? m1 : m0 + ((km - k0) / (k1 - k0)) * (m1 - m0);
    }
  }
  return pts.at(-1)[1];
}
