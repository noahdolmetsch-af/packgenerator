// «Windfahne beim Wetter» (Noah 03.11.2026 «b», Paket D, Idee 15): the pure part of WindVane.svelte.
// From the wind's direction (degrees it comes FROM) and speed (km/h) → how the vane is drawn.

/** Wind strength in steps by km/h: calm below 5, light below 15, fresh below 30, strong from 30. */
export function levelOf(kmh) {
  const v = Number(kmh);
  if (!Number.isFinite(v) || v < 5) return 'calm';
  if (v < 15) return 'light';
  if (v < 30) return 'fresh';
  return 'strong';
}

/**
 * { angle, len, amp, dur, level, calm } or null without a usable direction.
 * angle: the pennant points where the wind blows to, as on a map (north up): east = 0°, south = 90°.
 * len: pennant length (6 calm … 11 strong); amp: flutter in degrees; dur: seconds per swing (faster with more wind).
 */
export function vaneOf(dir, kmh) {
  const d = Number(dir);
  if (dir == null || dir === '' || !Number.isFinite(d)) return null;
  const level = levelOf(kmh);
  const to = (((d + 180) % 360) + 360) % 360;
  const len = { calm: 6, light: 8, fresh: 10, strong: 11 }[level];
  const amp = { calm: 0, light: 8, fresh: 16, strong: 26 }[level];
  const dur = { calm: 0, light: 0.9, fresh: 0.5, strong: 0.28 }[level];
  return { angle: to - 90, len, amp, dur, level, calm: level === 'calm' };
}
