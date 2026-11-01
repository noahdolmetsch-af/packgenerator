/**
 * «Velo-Countdown» (Ziel 6, Noah 27.10.2026 «1a»: idea 3 of the ultra analysis): what to do with the bike
 * 6, 5, 4 … weeks before a race, as your own list per race (stored.countdown = [{ id, text, weeks, done }]).
 * Until you change something the suggestions show (English keys for t()); your own words never go
 * through t(). Pure functions; tested in tests/race-countdown.test.js.
 */
// own small date helpers (calendar days, like race.js), so this file has no imports and e2e specs can read it
const addDay = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/** The suggestions: a few steps from the paper check (sheet 1 B and F) and the learnings of long races. */
export const STEPS = [
  { id: 'cd-shop', weeks: 6, text: 'Bike to the shop: service, order worn parts' },
  { id: 'cd-parts', weeks: 6, text: 'New parts on now (tyres, chain), so you ride them in' },
  { id: 'cd-freeze', weeks: 5, text: 'Nothing new on the bike from now: no new parts, no new position' },
  { id: 'cd-night', weeks: 4, text: 'Lights, power bank and bike computer: test them for a whole night' },
  { id: 'cd-test', weeks: 3, text: 'Test ride fully loaded, then no more setup questions' },
  { id: 'cd-pads', weeks: 2, text: 'Top up the sealant, look at the brake pads' },
  { id: 'cd-track', weeks: 1, text: 'Track on the bike computer, clean and oil the chain' },
];

const weeksOf = (w) => Math.max(0, Math.min(52, Math.round(Number(w) || 0)));

/** Your list, or the suggestions (translated with t) while nothing is saved. */
export function stepsOf(stored = {}, t = (x) => x) {
  const base = Array.isArray(stored?.countdown) ? stored.countdown : STEPS.map((s) => ({ ...s, text: t(s.text), done: false }));
  return base.map((r) => ({ id: r.id, text: String(r.text ?? ''), weeks: weeksOf(r.weeks), done: r.done === true }));
}

/** The day a step is due: the race day minus its weeks (calendar days). null without a race day. */
export const dueOf = (raceDay, weeks) => (raceDay ? addDay(raceDay, -7 * weeksOf(weeks)) : null);

/**
 * Where a step stands today: 'done', 'late' (its day has passed), 'now' (due within 7 days),
 * 'later', or 'open' without a race day.
 */
export function stateOf(step, raceDay, today) {
  if (step.done) return 'done';
  const due = dueOf(raceDay, step.weeks);
  if (!due) return 'open';
  const d = daysBetween(today, due);
  return d < 0 ? 'late' : d <= 7 ? 'now' : 'later';
}

/** The count for the head: { done, of, late, now }. */
export function summary(steps, raceDay, today) {
  const st = steps.map((s) => stateOf(s, raceDay, today));
  return { done: st.filter((x) => x === 'done').length, of: steps.length, late: st.filter((x) => x === 'late').length, now: st.filter((x) => x === 'now').length };
}
