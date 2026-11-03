// «Geheimnis im Logo» (Noah 03.11.2026, Idee 29): five quick taps on «PG» send a small bike across the screen.
// Pure counter (no screen, no clock of its own), tested in tests/logotaps.test.js.

export const TAPS_NEEDED = 5;
export const TAP_GAP_MS = 1500; // a pause longer than this starts the count again

/** Returns tap(now): true on the fifth quick tap (and then starts over), false before. */
export function makeTapCounter(needed = TAPS_NEEDED, gap = TAP_GAP_MS) {
  let n = 0;
  let last = -Infinity;
  return function tap(now) {
    n = now - last > gap ? 1 : n + 1;
    last = now;
    if (n >= needed) {
      n = 0;
      return true;
    }
    return false;
  };
}
