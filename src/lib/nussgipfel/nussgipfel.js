// «Nussgipfel-Rechner» (Noah 03.11.2026, Idee 26): the energy of a ride in nut croissants, for a smile.
// One Nussgipfel is about 400 kcal (a bakery one runs from 350 to 450). Pure, tested in tests/nussgipfel.test.js.

export const NUSSGIPFEL_KCAL = 400;

/** How many nut croissants a number of kcal is, rounded to a whole one; null for nothing to say. */
export function nussgipfelOf(kcal) {
  const k = Number(kcal);
  if (!Number.isFinite(k) || k <= 0) return null;
  return Math.round(k / NUSSGIPFEL_KCAL);
}
