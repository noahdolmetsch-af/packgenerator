// «Licht in der Nacht» (Noah 03.11.2026 «b», Paket D, Idee 20): the pure part of NightLight.svelte.
// After sunset the edge of the live map gets darker and a warm cone of light lies ahead, like from a front lamp.

/** Minutes of the fade: from sunset (and until sunrise) it takes this long to reach the full night. */
export const FADE_MIN = 30;

/**
 * How dark it is, 0 (day) … 1 (full night), from lightLeft() ({ rise, set, dark }) and now (ms).
 * After sunset it grows over FADE_MIN minutes; before sunrise it shrinks over the last FADE_MIN minutes.
 */
export function nightStrength(light, now = Date.now()) {
  if (!light?.dark || !Number.isFinite(light.rise) || !Number.isFinite(light.set)) return 0;
  const min = now > light.set ? (now - light.set) / 6e4 : (light.rise - now) / 6e4;
  return Math.max(0, Math.min(1, min / FADE_MIN));
}

/** Does the night light show? Only in the dark, when it is switched on and not with the battery saver. */
export const nightLightOn = ({ strength = 0, enabled = true, battery = false } = {}) => !!enabled && !battery && strength > 0;

/**
 * The cone points up when the map turns with you (your direction is up); with north up it turns with your
 * direction (deg, 0 = north), and without a direction yet it points up.
 */
export const beamDeg = ({ rotated = false, deg = null } = {}) => (rotated || deg == null || !Number.isFinite(Number(deg)) ? 0 : Math.round(Number(deg)));
