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
  // Einzelidee 36 «Vorschläge nach Art ausschalten» (996 Ideen, Noah 25.10.2026): a kind is off on every page
  { key: 'buy', label: 'Ideas to buy', kind: true, text: 'Every page: the best upgrade from your wishlist and other hints to buy something.' },
  { key: 'performance', label: 'Performance tips', kind: true, text: 'Every page: hints like «an easy day may help» or a fitness that rises too fast.' },
  { key: 'impulse', label: 'Ideas for free time', kind: true, text: 'Every page: the idea for today from your impulses.' },
  { key: 'tools', label: 'Fitting tools', kind: true, text: 'Every page: tools that fit your next trip.' },
];
/** Einzelidee 36: the kinds that count on every page (the other areas belong to one place). */
export const SUGGEST_KINDS = SUGGEST_AREAS.filter((a) => a.kind);

/** The stored value → the set of areas switched off (unknown keys are dropped). */
export const offOf = (value) => new Set((Array.isArray(value) ? value : []).filter((k) => SUGGEST_AREAS.some((a) => a.key === k)));

/** Switch one area: returns the new stored value (a sorted list). */
export function toggleArea(value, key, on) {
  const off = offOf(value);
  if (on) off.delete(key);
  else if (SUGGEST_AREAS.some((a) => a.key === key)) off.add(key);
  return [...off].sort();
}
