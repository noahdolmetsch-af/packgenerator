/**
 * «Cardio-Belastung» Idee D (Noah 07.11.2026 «alle A–F»): «Wie wird gerechnet?» shows the calculation of the cardio
 * load with a real day as the example. Pure: the minutes per pulse zone of a day in, the parts of the sum out.
 */
import { LOAD_WEIGHTS, cardioLoadOf } from './own.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The example when no day has zones yet: 30 min light and 10 min moderate make 50 points. */
export const FIXED_EXAMPLE = { light: 30, mod: 10 };

/**
 * The parts of the sum of one day: [{ zone, min, weight, points }] for the zones with minutes, plus the total.
 * → { parts, total } or null when the day has no zone minutes. total equals cardioLoadOf(zones).
 */
export function loadExample(zones) {
  if (!zones || typeof zones !== 'object') return null;
  const parts = [];
  for (const [zone, weight] of Object.entries(LOAD_WEIGHTS)) {
    const min = fin(zones[zone]);
    if (min != null && min > 0) parts.push({ zone, min, weight, points: min * weight });
  }
  const total = cardioLoadOf(zones);
  return parts.length && total != null ? { parts, total } : null;
}

/** The newest day (of the given days, oldest first) that has an example, or null: { day, ...example }. */
export function lastExample(days = [], zonesOf) {
  for (let i = days.length - 1; i >= 0; i--) {
    const ex = loadExample(zonesOf?.(days[i]));
    if (ex) return { day: days[i], ...ex };
  }
  return null;
}
