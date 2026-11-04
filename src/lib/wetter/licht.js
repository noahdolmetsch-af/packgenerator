/**
 * «Sonnenauf- und -untergang und Licht für die Fahrt» (Noah 04.11.2026 «5 alle»): per day sunrise, sunset, the
 * length of the daylight and the time to switch the lights on (30 minutes before sunset, a suggestion). From the
 * days of the weather core (kern.js). Pure functions, tested in tests/wetter-licht.test.js.
 */
import { localDate } from './kern.js';

/** Minutes before sunset at which the lamp goes on (and after sunrise it can go off). */
export const LAMP_MIN = 30;

const fin = (x) => typeof x === 'number' && Number.isFinite(x);

/**
 * The light of one local day (YYYY-MM-DD) from the core, or null when the core has no sun times for it.
 * → { date, rise, set, lengthMin, lampOn (ms), lampOff (ms) }.
 */
export function lightDay(core, date) {
  const d = core?.days?.find((x) => x.date === date);
  if (!d || !fin(d.rise) || !fin(d.set) || d.set <= d.rise) return null;
  return {
    date,
    rise: d.rise,
    set: d.set,
    lengthMin: Math.round((d.set - d.rise) / 6e4),
    lampOn: d.set - LAMP_MIN * 6e4,
    lampOff: d.rise + LAMP_MIN * 6e4,
  };
}

/** Today and tomorrow (where the core has them). */
export function lightDays(core, now = Date.now()) {
  const off = core?.offset ?? 0;
  const out = [];
  for (const [k, ms] of [['today', now], ['tomorrow', now + 24 * 36e5]]) {
    const l = lightDay(core, localDate(ms, off));
    if (l) out.push({ ...l, day: k });
  }
  return out;
}

/** 8 h 5 min as { h, m } for the text. */
export const hm = (min) => ({ h: Math.floor(min / 60), m: min % 60 });
