/**
 * «Deine Fahrten» in «Dein Tempo» (W1, Noah 15.10.2026 «1-5 a»): each ride a compact row with a small bar
 * of its riding time against the guess, and only the newest few open. Pure functions, no imports;
 * tested in tests/fahrtenliste.test.js.
 */

/** How many rides stand open before «Alle n zeigen» (5a). */
export const RIDES_OPEN = 5;

/**
 * The bar of one ride (4a): riding time against the guess, both in hours. The longer of the two fills the
 * track; `ride` and `guess` are their widths in percent. `faster` when the ride took no longer than the
 * guess (green), else orange. `min` is the difference in whole minutes (always ≥ 0). Null without times.
 */
export function rideBar(movingH, guessH) {
  if (!(movingH > 0) || !(guessH > 0)) return null;
  const top = Math.max(movingH, guessH);
  return {
    ride: Math.round((movingH / top) * 100),
    guess: Math.round((guessH / top) * 100),
    faster: movingH <= guessH,
    min: Math.round(Math.abs(movingH - guessH) * 60),
  };
}

/**
 * The rides that stand open (5a): the newest `n` (the list comes sorted newest first), plus every ride
 * saved in this visit so a new upload is never hidden. All of them when `all`.
 */
export function openRides(rides, { all = false, n = RIDES_OPEN, isNew = () => false } = {}) {
  return all ? rides : rides.filter((r, i) => i < n || isNew(r));
}
