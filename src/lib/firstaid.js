/**
 * v0.72.0 «Feinschliff» (Noah 10a, 10.10.2026): first aid on every trip, no longer only with a night
 * (before: 10b, v0.28.0). The app picks by itself:
 *
 *   - a day trip (no night) brings the SMALL set: the first aid items marked as part of it;
 *   - a trip with a night brings the FULL set: every first aid item.
 *
 * Per item: item.aidSmall (true / false) says whether it belongs to the small set. Without the field
 * an item counts as small when its name says plaster, blister or rescue blanket (AID_SMALL_WORDS),
 * so older data works without an update. Per trip: trip.aid ('small' | 'full') overrides the choice
 * of the app; trip.sets.firstaid === false takes first aid off this trip (like the other ride blocks).
 * Everything stays a suggestion: per trip changeable and deselectable.
 * Pure functions, tested in tests/firstaid.test.js.
 */

/** The key of the built-in block «Erste Hilfe». */
export const AID_KEY = 'firstaid';
/** The two sets. */
export const AID_LEVELS = ['small', 'full'];
/** What makes an item part of the small set by default (English and German). */
export const AID_SMALL_WORDS = /pflaster|plaster|blase|blister|rettungsdecke|rescue blanket|emergency blanket|space blanket/i;

/** Is the item a first aid item (in the block «Erste Hilfe»)? */
export const isAid = (item) => !!item?.sets?.includes(AID_KEY);

/** Does the item belong to the small set? Its own mark first, else its name. */
export function inSmallAid(item) {
  if (typeof item?.aidSmall === 'boolean') return item.aidSmall;
  return AID_SMALL_WORDS.test(`${item?.name ?? ''} ${item?.nameDe ?? ''}`);
}

/** The set the app picks by itself: small without a night, full with one (unknown: full, as before). */
export const aidAuto = (trip) => (trip?.overnight === 'none' ? 'small' : 'full');

/** Did the trip choose its set by hand (trip.aid)? */
export const aidChosen = (trip) => AID_LEVELS.includes(trip?.aid);

/** The set of a trip: 'small', 'full', or null when first aid is switched off for it. */
export function aidLevel(trip) {
  if (trip?.sets?.[AID_KEY] === false) return null;
  return aidChosen(trip) ? trip.aid : aidAuto(trip);
}

/** Does a first aid item come with this set? (null: none comes) */
export const aidFits = (item, level) => level === 'full' || (level === 'small' && inSmallAid(item));

/** How many first aid items each set holds: { small, full } (inventory only, given by the caller). */
export function aidCounts(items = []) {
  const aid = items.filter(isAid);
  return { small: aid.filter(inSmallAid).length, full: aid.length };
}
