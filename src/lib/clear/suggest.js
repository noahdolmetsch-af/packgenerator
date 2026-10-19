/**
 * Paket Q #361 «Vorschläge pro Bereich an oder aus»: every area where the app suggests something by
 * itself can be switched off (all on at the start). The choice is a settings record, so it travels
 * in the backup and the exchange with the other device. Labels and texts are English keys for t().
 * Pure; the live switches are in suggest.svelte.js. Tested in tests/suggest.test.js.
 */
export const SUGGEST_KEY = 'suggestOff';

export const SUGGEST_AREAS = [
  { key: 'weather', label: 'Clothing for the weather', text: 'When packing: missing layers for the coldest hour of the trip.' },
  { key: 'inspo', label: 'Rules from your inspiration', text: 'When packing: the packing rules you took over from your links.' },
  { key: 'active', label: 'Ideas in Active', text: 'Active: actions suggested by day, weather and rings, and more ideas to add.' },
];

/** The stored value → the set of areas switched off (unknown keys are dropped). */
export const offOf = (value) => new Set((Array.isArray(value) ? value : []).filter((k) => SUGGEST_AREAS.some((a) => a.key === k)));

/** Switch one area: returns the new stored value (a sorted list). */
export function toggleArea(value, key, on) {
  const off = offOf(value);
  if (on) off.delete(key);
  else if (SUGGEST_AREAS.some((a) => a.key === key)) off.add(key);
  return [...off].sort();
}
