/**
 * «Ein Schalter für alles» (Noah 27.11.2026 «2a»): the one period of the cards on Auswerten › Woche (Haken-Verlauf, Tagestotal,
 * Wochenpensum, Gesundheit): 10 days, 30 days, 3 months, a year. The choice stays on this device (the key of the first card).
 * The rules of the choice are flow/hakenverlauf.js.
 */
import { SPAN_DEFAULT, spanOf } from './hakenverlauf.js';

const KEY = 'pg.hakenverlauf';
const read = () => {
  try {
    return spanOf(localStorage.getItem(KEY));
  } catch {
    return SPAN_DEFAULT;
  }
};

export const hakenSpan = $state({ v: read() });

/** Choose a period (any other value falls back to 10 days) and remember it. */
export function pickSpan(v) {
  hakenSpan.v = spanOf(v);
  try {
    localStorage.setItem(KEY, String(hakenSpan.v));
  } catch {
    /* not saved: the choice still counts until the page is left */
  }
}
