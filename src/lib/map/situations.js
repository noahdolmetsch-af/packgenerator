/**
 * Suchvorschläge (Noah 27.10.2026 «1a 2a 3a 4a», «coole idee mit den situationsknöpfen»): the situation
 * buttons on top of «In der Nähe». One tap searches several kinds at once and may switch on a filter
 * (for «Hunger» only what is open now). They are suggestions: the kinds and filters stay changeable.
 * Every kind named here exists in poisearch.js (ALL_KEYS); the test checks it.
 * Pure, tested in tests/situations.test.js.
 */
import { NO_FILTER, normFilter } from './poifilter.js';

/** key, name (English key for t()), emoji, the kinds, and the filter fields it switches on. */
export const SITUATIONS = [
  { key: 'hunger', name: 'Hunger|situation', emoji: '🥐', kinds: ['bakery', 'shop', 'food'], filter: { open: 'now' } },
  { key: 'thirst', name: 'Thirst|situation', emoji: '💧', kinds: ['water', 'selecta', 'shop'], filter: {} },
  { key: 'repair', name: 'Breakdown|situation', emoji: '🔧', kinds: ['bike', 'repair', 'tubevend'], filter: {} },
  { key: 'coffee', name: 'Coffee break|situation', emoji: '☕', kinds: ['food', 'bakery'], filter: { open: 'now' } },
  { key: 'home', name: 'Take me home|situation', emoji: '🏠', kinds: ['station', 'bus', 'transit'], filter: {} },
  { key: 'sleep', name: 'Sleep|situation', emoji: '🛏', kinds: ['sleep', 'camp', 'hut'], filter: {} },
  { key: 'wildcamp', name: 'Find a spot for the night|situation', emoji: '⛺', kinds: ['shelter', 'hut', 'bivouac', 'roofbus', 'camp'], filter: {} },
  { key: 'relax', name: 'Relax|situation', emoji: '🧖', kinds: ['sauna', 'thermal', 'indoorpool', 'swim'], filter: {} },
  { key: 'rain', name: 'Rain|situation', emoji: '🌧', kinds: ['shelter', 'roofbus', 'food'], filter: { rain: true } },
  { key: 'heat', name: 'Heat|situation', emoji: '☀️', kinds: ['water', 'swim', 'icecream'], filter: {} },
  { key: 'night', name: 'Night|situation', emoji: '🌙', kinds: ['night24', 'selecta', 'foodvend', 'fuel'], filter: { open: 'now' } },
  { key: 'battery', name: 'Battery empty|situation', emoji: '🔋', kinds: ['charge', 'phonecharge', 'food'], filter: {} },
  { key: 'emergency', name: 'Emergency|situation', emoji: '🩺', kinds: ['hospital', 'pharmacy', 'defib', 'doctor', 'police'], filter: {} },
  { key: 'sunday', name: 'Sunday|situation', emoji: '📅', kinds: ['night24', 'fuel', 'bakery', 'station'], filter: { open: 'now' } },
];
export const SITUATION_KEYS = SITUATIONS.map((s) => s.key);
export const SITUATION = Object.fromEntries(SITUATIONS.map((s) => [s.key, s]));

/**
 * What a situation switches on, on top of the filter you have: { kinds, filter }. Fields the situation
 * does not name keep your value. An unknown key gives null.
 */
export function applySituation(key, filter = NO_FILTER) {
  const s = SITUATION[key];
  if (!s) return null;
  return { kinds: [...s.kinds], filter: normFilter({ ...normFilter(filter), ...s.filter }) };
}

/** The situation whose kinds are exactly the switched-on kinds (order does not matter), or ''. */
export function situationOf(on = []) {
  const set = new Set(on);
  const s = SITUATIONS.find((x) => x.kinds.length === set.size && x.kinds.every((k) => set.has(k)));
  return s ? s.key : '';
}
