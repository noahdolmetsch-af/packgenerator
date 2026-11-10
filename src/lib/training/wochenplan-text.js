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

/**
 * «Why here?» (part 4): what the planner's reason code (`unit.why`) says. Returns { text, a?, b? }; text goes through t(),
 * a and b are further English texts for the placeholders {a} and {b}. An unknown code gives the plain «best free place».
 */
export function whyOf(why) {
  const key = why?.key;
  if (key === 'best') {
    const reasons = [why.empty && 'the day was still empty', why.calm && 'no hard day is next to it'].filter(Boolean);
    if (reasons.length === 2) return { text: 'Here, because {a} and {b}.', a: reasons[0], b: reasons[1] };
    if (reasons.length === 1) return { text: 'Here, because {a}.', a: reasons[0] };
    return { text: 'The best free place.' };
  }
  if (key === 'intervals') return { text: why.calm ? 'Intervals here, because no hard day is next to it.' : 'Intervals here, because it is the calmest place.' };
  if (key === 'ski') return { text: why.sunday ? 'The ski tour is on Sunday, because the ice hockey is on Saturday.' : 'The ski tour is on {day}.' };
  return { text: WHY_TEXT[key] ?? 'The best free place.' };
}
const WHY_TEXT = {
  fixed: 'A fixed day you chose.',
  pinned: 'Moved by you.',
  rest: 'Before or after a hard day, on a day with little else.',
  'after-gym': 'Right after the gym.',
  'stretch-after': 'Right after the unit.',
  'earlier-yoga': 'Earlier, because yoga is already at 7.',
  rain: 'Rain week: indoors instead of outdoors.',
};
export const WHY_KEYS = ['best', 'intervals', 'ski', ...Object.keys(WHY_TEXT)];

/** The start times offered for a unit: every half hour from 06:00 to 21:30, plus the current one when it falls between. */
export function timeChoices(current) {
  const out = [];
  for (let m = 360; m <= 1290; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  if (current && !out.includes(current)) out.push(current);
  return out.sort();
}

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
