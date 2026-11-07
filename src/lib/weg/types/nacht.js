/**
 * Schrittart «Nachtplan» für «Weg zum Ziel» (Noah 05.11.2026 «b», Thread «Planen: Nachtplan im Weg»): look ahead at
 * where you sleep. Three steps that point to the Strategie of the race (`#/race/<tripId>/strategy`, bivy / hotel /
 * ride through per night, src/lib/race/race.js nightRows) and, for a race, tick themselves from the nights written
 * there. Nothing new is stored: the nights stay in the race.
 *
 *   plaetze – Choose a place for every night   ticks when every night has a place or is marked «ride through»
 *   hotels  – Check hotels and rooms ahead     ticks when every night marked «hotel» has a place
 *   wetter  – Match the nights to the weather  by hand (the forecast is only trustworthy a few days ahead)
 *
 * Every kind of goal gets the three steps suggested (Noah «b»: also free goals; there you tick them by hand, the
 * nights are written on the step note). `auto` reads `ctx.races` (`racesOf(...)`: { [tripId]: stored race }) and
 * `goal.tripId`; without a trip or a race it answers null (unknown) and the step stays by hand. A step carries `key`
 * (one of the three), which stays when the user renames or moves it. Everything is a suggestion: days, names, ticks,
 * order and deleting stay with the user (weg.js). Pure functions, tested in tests/weg-nacht.test.js.
 * Titles and notes are English keys for t().
 */
import { raceOf, offBlocks, msOf } from '../../race/race.js';

/** The three steps: key, title, days before the start, a note under the title. */
export const STEPS = [
  { key: 'plaetze', title: 'Choose a place for every night', offset: 21, note: 'Bivy spot, room or riding through: one place per night, written in the strategy.' },
  { key: 'hotels', title: 'Check hotels and rooms ahead', offset: 14, note: 'Look at the hotels near the evening position and ask early; answers can take days.' },
  { key: 'wetter', title: 'Match the nights to the weather', offset: 3, note: 'Look at the forecast for each night and swap bivy and room where it gets cold or wet.' },
];

const decided = (n) => n?.kind === 'through' || String(n?.place ?? '').trim() !== '';

/**
 * The nights of the goal's race: { expected: [n…] (the sleep blocks of the plan), own: [stored night…] }, or null
 * (no trip, no race stored yet). The sleep blocks come from the times of the race alone, no route needed.
 */
export function nightsOf(goal, ctx) {
  const stored = goal?.tripId ? ctx?.races?.[goal.tripId] : null;
  if (!stored || typeof stored !== 'object') return null;
  const race = raceOf(stored, goal.start ? { startDate: goal.start } : null);
  const end = msOf(race.start) + race.targetH * 36e5; // offBlocks reaches a day beyond the race
  const expected = offBlocks(race).filter((b) => b.kind === 'sleep' && b.from < end).map((b) => b.n);
  const own = race.nights.filter((n) => n && typeof n === 'object');
  return { expected, own };
}

/** Is the part behind one key done? true / false, or null when it cannot be known. */
export function nightDone(key, nights) {
  if (!nights) return null;
  const { expected, own } = nights;
  if (key === 'plaetze') {
    if (expected.length) return expected.every((n) => decided(own.find((o) => Number(o.n) === n)));
    return own.length ? own.every(decided) : null;
  }
  if (key === 'hotels') {
    const hotels = own.filter((o) => o.kind === 'hotel');
    return hotels.length ? hotels.every((o) => String(o.place ?? '').trim() !== '') : null;
  }
  return null;
}

export default {
  type: 'nacht',
  label: 'Night plan',
  icon: 'moon',
  /** Every goal gets the three steps; a free goal ticks them by hand. */
  defaults: () => STEPS.map(({ key, title, offset, note }) => ({ key, title, offset, note })),
  /** Ticks by itself from the nights of the race; never takes a tick back (weg.js applyAuto). */
  auto: (goal, step, ctx) => {
    const done = nightDone(step?.key, nightsOf(goal, ctx));
    return done === true ? true : done === false ? false : null;
  },
  /** The strategy of the goal's race; without a trip the list of the races. */
  link: (goal) => (goal?.tripId ? `#/race/${encodeURIComponent(goal.tripId)}/strategy` : '#/race'),
};
