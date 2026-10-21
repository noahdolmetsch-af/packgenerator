/**
 * Lernschleife (UI-Ziele #18 «I3», Noah 20.10.2026 «alle freigegeben»): after a tour with a ride, the tour
 * page asks one question at a time about the things that were along: «Hast du die Regenjacke gebraucht?
 * Ja · Nein · Weiss nicht». The heaviest things first, at most 5 per tour. «Nicht fragen für dieses Teil»
 * keeps the question away for good; «Heute nicht» for the rest of the day. At most one question card a day
 * (the first tour that shows one keeps it). An answer «Nein» marks the thing «nicht gebraucht» (tourgear.js
 * setMark), so the next packing list shows it as ballast. Pure functions, tested in tests/lernfrage.test.js.
 *
 * The state is one settings record ASK_KEY: { day, key, skip, off: [itemId], asked: { tripId: { itemId: 'yes'|'no'|'unknown' } } }
 *   day/key: the day and the tour that had today's card; skip: the day of «Heute nicht».
 */
const FOOD = 'food'; // tourgear.js FOOD (kept here so this file stays free of the database)

export const ASK_KEY = 'tourAsk';
export const ASK_MAX = 5;
export const ANSWERS = ['yes', 'no', 'unknown'];

/** The state with its defaults. */
export function askState(rec) {
  const v = rec && typeof rec === 'object' ? rec : {};
  return { day: v.day ?? null, key: v.key ?? null, skip: v.skip ?? null, off: Array.isArray(v.off) ? v.off : [], asked: v.asked && typeof v.asked === 'object' ? v.asked : {} };
}

/**
 * Today's question for this tour, or null. trip: the trip (with entries); debrief: its Rückblick or null;
 * items: all things; ride: a ride is linked (Strava or uploaded); key: the tour's key; today: YYYY-MM-DD.
 * → { item, n, of } (n: this is question n of `of`)
 */
export function nextQuestion({ trip, debrief = null, items = [], ride = false, key, today, state, over = true }) {
  if (!trip || !ride || !over) return null;
  const s = askState(state);
  if (s.skip === today) return null;
  if (s.day === today && s.key && s.key !== key) return null; // one card a day
  const asked = s.asked[trip.id] ?? {};
  const done = Object.keys(asked).length;
  if (done >= ASK_MAX) return null;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const marks = debrief?.items ?? {};
  const open = (trip.entries ?? [])
    .map((e) => ({ e, it: byId[e.itemId] }))
    .filter(({ e, it }) => it && it.category !== FOOD && !s.off.includes(e.itemId) && !asked[e.itemId] && !marks[e.itemId])
    .sort((a, b) => (b.it.weightG ?? 0) * (b.e.qty || 1) - (a.it.weightG ?? 0) * (a.e.qty || 1) || String(a.it.name).localeCompare(String(b.it.name)));
  if (!open.length) return null;
  const of = Math.min(ASK_MAX, done + open.length);
  return { item: open[0].it, n: done + 1, of };
}

/** The state after today's card was shown for this tour (it keeps the day). */
export const shown = (state, key, today) => ({ ...askState(state), day: today, key });

/** The state after an answer. */
export function answer(state, tripId, itemId, value) {
  const s = askState(state);
  return { ...s, asked: { ...s.asked, [tripId]: { ...(s.asked[tripId] ?? {}), [itemId]: ANSWERS.includes(value) ? value : 'unknown' } } };
}

/** «Heute nicht»: no question card for the rest of the day. */
export const skipToday = (state, today) => ({ ...askState(state), skip: today });

/** «Nicht fragen für dieses Teil». */
export const neverAsk = (state, itemId) => {
  const s = askState(state);
  return { ...s, off: [...new Set([...s.off, itemId])] };
};
