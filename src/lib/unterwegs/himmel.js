/**
 * Paket K #99 «Sonne, Mond und Kurztexte zu Orten»: when it gets light and dark at a place (sunrise,
 * sunset, the end of dusk) and the moon (its phase, how much of it is lit, the next full moon), all
 * worked out on the device, offline. Pure functions, tested in tests/unterwegs-himmel.test.js.
 */
const RAD = Math.PI / 180;

/**
 * Sun times of a date at a place for a sun height (degrees): -0.833 rise and set, -6 civil dusk.
 * The same sunrise equation as blockplan.js sunTimes. → { rise, set } UTC ms, or null (polar day/night).
 */
export function sunAt(date, lat, lon, h = -0.833) {
  const jNoon = new Date(`${date}T12:00:00Z`).getTime() / 864e5 + 2440587.5;
  const n = Math.round(jNoon - 2451545 + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const L = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
  const sinD = Math.sin(L * RAD) * Math.sin(23.4397 * RAD);
  const cosD = Math.cos(Math.asin(sinD));
  const cosW = (Math.sin(h * RAD) - Math.sin(lat * RAD) * sinD) / (Math.cos(lat * RAD) * cosD);
  if (cosW < -1 || cosW > 1) return null;
  const w = Math.acos(cosW) / RAD;
  const toMs = (j) => Math.round((j - 2440587.5) * 864e5);
  return { rise: toMs(jTransit - w / 360), set: toMs(jTransit + w / 360) };
}

/** Light of a day: { rise, set, dark (end of civil dusk), dawn (start of civil dawn), dayMin } in UTC ms. */
export function daylight(date, lat, lon) {
  const s = sunAt(date, lat, lon);
  if (!s) return null;
  const c = sunAt(date, lat, lon, -6);
  return { rise: s.rise, set: s.set, dawn: c?.rise ?? null, dark: c?.set ?? null, dayMin: Math.round((s.set - s.rise) / 6e4) };
}

/** A known new moon (6 Jan 2000, 18:14 UTC) and the length of a moon month in days. */
export const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
export const SYNODIC = 29.530588853;

/** The moon at a moment: { age (days since new moon), lit (0–1), phase (key), nextFull (ms), nextNew (ms) }. */
export function moon(ms) {
  const days = (ms - NEW_MOON) / 864e5;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const lit = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  const p = age / SYNODIC;
  const phase = p < 0.0339 || p >= 0.9661 ? 'new' : p < 0.2161 ? 'waxingCrescent' : p < 0.2839 ? 'firstQuarter' : p < 0.4661 ? 'waxingGibbous' : p < 0.5339 ? 'full' : p < 0.7161 ? 'waningGibbous' : p < 0.7839 ? 'lastQuarter' : 'waningCrescent';
  const toFull = ((SYNODIC / 2 - age + SYNODIC) % SYNODIC) || SYNODIC;
  const toNew = SYNODIC - age;
  return { age, lit, phase, nextFull: ms + toFull * 864e5, nextNew: ms + toNew * 864e5 };
}

/** The names of the phases (English keys for t()). */
export const PHASES = {
  new: 'New moon',
  waxingCrescent: 'Waxing crescent',
  firstQuarter: 'First quarter',
  waxingGibbous: 'Waxing gibbous',
  full: 'Full moon',
  waningGibbous: 'Waning gibbous',
  lastQuarter: 'Last quarter',
  waningCrescent: 'Waning crescent',
};
