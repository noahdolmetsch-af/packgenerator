// «Geheimmenü» (Noah 03.11.2026): five quick taps on «PG» trigger one surprise. With several surprises the app
// picks one by chance and never the same one twice in a row («a», coordinator 03.11.2026 20:06).
// Pure function (no screen, no clock), tested in tests/logosurprises.test.js.

/** Every surprise that exists. A new one is added here and gets its own component in LogoRide.svelte. */
export const SURPRISES = ['bike', 'saying', 'flat', 'marmot', 'weather', 'panorama'];

/** Picks one of `list`, not `prev` (unless it is the only one). rnd() is Math.random by default (0 ≤ r < 1). */
export function pickSurprise(list = SURPRISES, prev = null, rnd = Math.random) {
  const pool = list.length > 1 ? list.filter((s) => s !== prev) : list;
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}
