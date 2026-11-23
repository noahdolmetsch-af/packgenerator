/**
 * Bikepacking-Vorschlag K3 «Wiegen am Starttag» (Noah 23.11.2026): one number per bag, the packed bag on the scale.
 * The app compares it with what it calculates (the weights of the items plus the bag itself) and says where they
 * differ: a piece missing from the list, or a weight in the gear that is not right. Everything is a suggestion; the
 * numbers live on the trip (`trip.weighed[slot] = { g, day }`), no new table. Pure functions; the page part is
 * BagWeigh.svelte. Tested in tests/bagweigh.test.js.
 */

/** A difference this small is no news: 30 g or 5 % of the calculation, whichever is more. */
export const weighTolerance = (calcG) => Math.max(30, Math.round((Number(calcG) || 0) * 0.05));

/**
 * calcG: items + bag in g; weighedG: the scale; missing: items without a weight (the calculation is then too low).
 * → { status: 'ok' | 'more' | 'less' | 'unsure', diffG } (diffG = weighed − calculated, rounded to 10 g).
 * 'unsure': the calculation lacks weights, so a difference says little (weighed more is expected).
 */
export function weighCompare({ calcG = 0, weighedG, missing = 0 } = {}) {
  const w = Number(weighedG);
  if (!Number.isFinite(w) || w <= 0) return null;
  const diff = w - (Number(calcG) || 0);
  const d = Math.round(diff / 10) * 10;
  if (Math.abs(diff) <= weighTolerance(calcG)) return { status: 'ok', diffG: d };
  if (missing > 0 && diff > 0) return { status: 'unsure', diffG: d };
  return { status: diff > 0 ? 'more' : 'less', diffG: d };
}

/** The weighed bags of a trip: { slot: { g, day } }, only valid numbers. */
export function weighedOf(trip) {
  const out = {};
  for (const [slot, v] of Object.entries(trip?.weighed ?? {})) if (v && Number.isFinite(Number(v.g)) && Number(v.g) > 0) out[slot] = { g: Number(v.g), day: v.day ?? '' };
  return out;
}

/** The `weighed` object after weighing a bag (g null or 0 takes the number away). */
export function withWeighed(trip, slot, g, day = '') {
  const next = { ...weighedOf(trip) };
  if (Number(g) > 0) next[slot] = { g: Math.round(Number(g)), day };
  else delete next[slot];
  return next;
}
