/**
 * «Rückblick in 30 Sekunden» (Noah 05.11.2026, Touren 3b): three questions with faces for tired evenings:
 * how was the ride, was the luggage right, did you miss something. The answers go into the same fields as the
 * long debrief (joy.fun, amount, missing), so nothing is stored twice and the long version stays as it is.
 * Pure functions, tested in tests/kurz.test.js. Names are English keys for t().
 */

/** «How was the ride?» 1 to 5, stored as the scale «Riding fun» of «What made it good?» (freude.js). */
export const FUN_FACES = [
  { n: 1, icon: 'Frown', name: 'Bad|face' },
  { n: 2, icon: 'Annoyed', name: 'So-so|face' },
  { n: 3, icon: 'Meh', name: 'Okay|face' },
  { n: 4, icon: 'Smile', name: 'Good|face' },
  { n: 5, icon: 'Laugh', name: 'Great|face' },
];

/** «Was the luggage right?» the keys of AMOUNT in debrief.js. */
export const AMOUNT_FACES = [
  { key: 'right', icon: 'Smile', name: 'Just right' },
  { key: 'much', icon: 'Meh', name: 'Too much' },
  { key: 'little', icon: 'Frown', name: 'Too little' },
];

/** The missing list with one more name; null for an empty name or one that is on the list already. */
export function addMissingName(missing = [], name, items = [], id = `m${Date.now().toString(36)}`) {
  const text = String(name ?? '').trim();
  if (!text) return null;
  if (missing.some((m) => m.name.toLowerCase() === text.toLowerCase())) return null;
  const lower = text.toLowerCase();
  const match = items.find((i) => (i.name ?? '').toLowerCase() === lower || (i.nameDe ?? '').toLowerCase() === lower) ?? null;
  return [...missing, { id, name: match?.name ?? text, itemId: match?.id ?? null }];
}
