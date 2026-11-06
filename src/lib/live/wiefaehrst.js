/**
 * «Wie fährst du?» (Noah 05.11.2026 «3a», Thread «Verbessern: Routing und Navigation»): in the window «Neu planen zu …» the
 * way of riding is suggested from the kind of your bike (road bike → short and paved, gravel bike → gravel,
 * mountain bike → trails). It is only a suggestion: all four ways stay one tap away, and without a bike the
 * window starts as before with «Quiet roads and good paths». Pure functions, tested in tests/wiefaehrst.test.js.
 */
import { kindOf, baseKind } from '../bikekind.js';
import { PROFILE_STD, PROFILES } from '../reroute.js';

/** The router profile each bike kind starts with. */
export const PROFILE_OF_KIND = { road: 'fastbike', gravel: 'gravel', mtb: 'mtb' };

/** The profile suggested for a bike (null: no bike, so no suggestion). An own kind works like gravel. */
export function suggestProfile(bike) {
  if (!bike) return null;
  const p = PROFILE_OF_KIND[baseKind(kindOf(bike))];
  return PROFILES.some((x) => x.key === p) ? p : PROFILE_STD;
}
