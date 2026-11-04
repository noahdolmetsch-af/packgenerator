/**
 * «Eine Regel für Pässe» (Entdecken und Sammeln, Noah 04.11.2026 «1a»): when does a ride count as over a pass?
 * One rule for «Neuland» (Alpenpässe) and «Pässe sammeln»:
 *   - up to SURE_KM from the top of the pass: a sure hit (Neuland ticks it by itself, «Pässe sammeln» takes it with «Alle einsammeln»),
 *   - from there up to MAYBE_KM: «please confirm»: the app only suggests it, you decide with one tap, nothing counts by itself,
 *   - further away: not a hit.
 * Pure, tested in tests/passregel.test.js. The Gipfelbuch finds the highest point of a ride and is a different thing.
 */
export const SURE_KM = 0.6;
export const MAYBE_KM = 1.2;

/** 'sure' | 'maybe' | null for a distance in km from the pass top to the line. */
export function hitLevel(distKm) {
  if (!Number.isFinite(distKm) || distKm < 0) return null;
  if (distKm <= SURE_KM) return 'sure';
  if (distKm <= MAYBE_KM) return 'maybe';
  return null;
}
