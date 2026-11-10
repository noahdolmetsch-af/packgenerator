/**
 * «Wochenplan» part 2 (Noah 09.11.2026): the words of the planner. The planner (wochenplan.js) gives codes and numbers,
 * never texts; this file says what each code is called. The tables hold the English texts, the page passes them
 * through t(); the German is in src/lib/i18n/de/wochenplan.js. Pure; tested in tests/wochenplan-seite.test.js.
 */

/** The name of a unit (goal types and the units the planner adds on its own). */
export const UNIT_NAME = {
  hockey: 'Ice hockey',
  tennis: 'Tennis',
  yoga: 'Yoga in the studio',
  gym: 'Gym',
  sauna: 'Sauna at the gym',
  rest: 'Rest block',
  bikeOut: 'Bike outdoors',
  bikeIn: 'Bike indoors',
  runOut: 'Run outdoors',
  runIn: 'Treadmill at the gym',
  mini: 'Mini workout',
  ski: 'Ski tour',
  med: 'Meditation',
  stretch: 'Stretching',
};

/** One line under the name of a goal: what a unit is, in words. */
export const UNIT_HINT = {
  sauna: 'after a gym session',
  rest: 'a whole morning or afternoon, does not count for the hours',
  mini: 'fills the gaps',
};

/** The load of a day, as the pill on the day says it. */
export const LOAD_WORD = { H: 'hard|day', M: 'medium|day', L: 'easy|day', F: 'free|day' };

/** Notes of the planner: what it changed on its own. `n` is one note of planWeek().notes. */
export const NOTE_TEXT = {
  'sauna-needs-gym': 'The sauna goes after a gym session. With no gym unit it has no place.',
  'sauna-no-room': 'No room for the sauna after the gym on {day}.',
  'med-skipped': 'No room for meditation on {day}.',
  'bike-hours': 'Cycling outdoors adds up to {h} h this week.',
};

/** Warnings of the planner: what does not fit. `w` is one warning of planWeek().warnings. */
export const WARN_TEXT = {
  'hard-run': 'Three hard days in a row, up to {day}.',
  'too-many': '{n} units on {day}, three are the most.',
  'no-free-half': 'No half day stays free this week.',
  'no-room': 'There is no room for «{type}» this week.',
  overlap: '«{a}» and «{b}» overlap on {day}.',
};

/** Minutes as the page writes them: «45 min» up to 2 hours, then hours. */
export function lengthOf(mins) {
  return mins >= 120 ? { text: '{h} h|plan', vars: { h: Math.round(mins / 6) / 10 } } : { text: '{n} min', vars: { n: mins } };
}

/** Hours with one decimal: 12.5. */
export const hoursOf = (mins) => Math.round(mins / 6) / 10;

/** Share of the hours goal reached by the plan, 0 to 100. */
export const reachedPct = (mins, hours) => Math.min(100, Math.round((mins / 60 / Math.max(1, hours)) * 100));

/** A Monday in the middle of a season, for showing the plan of the other season (no date is shown with it). */
export const EXAMPLE_MONDAY = { winter: '2027-01-04', summer: '2027-05-03' };
