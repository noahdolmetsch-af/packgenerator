/**
 * «Griffbereit» (griff.js): the field item.reach, kept apart from griff.js because gear.js (itemRecord) needs it
 * and griff.js needs trip-side modules; no imports here. Pure.
 *   true       you marked it: it should lie where a hand reaches it while riding
 *   false      you said «Nicht griffbereit»: the app never suggests a place for it
 *   (no field) automatic: food and rain gear are suggested, everything else is left alone
 */
export const REACH_CHOICES = ['auto', 'yes', 'no'];

/** The choice of an item as the select shows it. */
export const reachChoice = (item) => (item?.reach === true ? 'yes' : item?.reach === false ? 'no' : 'auto');

/** The field as stored: true, false, or null when it was there and is now automatic (nothing when it never was). */
export function reachRecord(draft, item) {
  if (draft?.reach === true || draft?.reach === false) return { reach: draft.reach };
  return item && 'reach' in item ? { reach: null } : {};
}

/** The draft after choosing: 'yes' → true, 'no' → false, 'auto' → no field. */
export const withReach = (choice) => ({ reach: choice === 'yes' ? true : choice === 'no' ? false : null });
