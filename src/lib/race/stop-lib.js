/**
 * «Nacht-Stopp-Ablauf» (Ziel 6, Noah 27.10.2026, his text on sheet 4 of the race check): what you do at
 * every night stop, as a list to tick off. Your own list per race (stored.stops = { list: [{ id, text, done }],
 * n }); until you change something the suggestions show (English keys for t()). «Next stop» clears the
 * ticks and counts the stop. No imports, so e2e specs can read it. Tested in tests/race-stops.test.js.
 */

export const STOP_STEPS = [
  { id: 'st-shop', text: 'Buy for the next stretch: food and drink for how many hours?' },
  { id: 'st-eat', text: 'Eat something warm and drink' },
  { id: 'st-charge', text: 'Charge phone, bike computer and lights' },
  { id: 'st-clothes', text: 'Dry or change clothes, warm layer ready' },
  { id: 'st-bottles', text: 'Fill the bottles' },
  { id: 'st-tyres', text: 'Check the tyre pressure' },
  { id: 'st-chain', text: 'Clean and oil the chain' },
  { id: 'st-alarm', text: 'Set the alarm, then sleep' },
];

/** Your list, or the suggestions (translated with t) while nothing is saved. */
export function stopsOf(stored = {}, t = (x) => x) {
  const s = stored?.stops;
  if (Array.isArray(s?.list)) return s.list.map((r) => ({ id: r.id, text: String(r.text ?? ''), done: r.done === true }));
  return STOP_STEPS.map((r) => ({ id: r.id, text: t(r.text), done: false }));
}

/** How many stops you have marked done (0 before the first). */
export const stopCount = (stored = {}) => Math.max(0, Math.round(Number(stored?.stops?.n) || 0));

/** «Next stop»: every tick off, the count one up. → the new stored.stops */
export function nextStop(list = [], n = 0) {
  return { list: list.map((r) => ({ id: r.id, text: r.text, done: false })), n: n + 1 };
}
