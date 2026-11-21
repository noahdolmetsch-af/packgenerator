/**
 * Schrittart «Rennplanung» für «Weg zum Ziel» (Noah 05.11.2026 «a», Thread «Planen: Rennplanung im Weg»):
 * four steps that point to the Rennen-Check of the race (`#/racecheck/<tripId>`, src/lib/race/check-lib.js) and
 * tick themselves when the matching sheet is filled in. Nothing new is stored: the answers stay in the race.
 *
 *   setup  – Pack the target setup      ticks when at least one bag has a weight (sheet 2)
 *   liste  – Check the basic list       ticks when sheet 3 has an answer
 *   schlaf – Decide how you sleep       ticks when sheet 4 has an answer
 *   vorher – Go through the day before  ticks when every point of sheet 6 is ticked off
 *
 * The step carries `key` (one of the four); a step without a known key never ticks by itself (a step the user
 * renamed keeps its key, because `title` and `key` are separate). Only goals of kind `race` get the four steps
 * suggested; the user can add them to any other goal. `auto` reads `ctx.races` (the settings record of the races,
 * `racesOf(...)`: { [tripId]: stored race }) and `goal.tripId`. Without a trip or a race it answers null (unknown).
 * Everything is a suggestion: days, names, ticks, order and deleting stay with the user (weg.js).
 * Pure functions, tested in tests/weg-rennplanung.test.js. Titles and notes are English keys for t().
 */
import { filled, setupWeight, dayBeforeDone } from '../../race/check-lib.js';

/** The four steps: key, title, days before the start, a note under the title. */
export const STEPS = [
  { key: 'schlaf', title: 'Decide how you sleep', offset: 56, note: 'Play the sleep variants through on the race check; booking early gives you the choice.' },
  { key: 'liste', title: 'Check the basic list', offset: 42, note: 'What always comes along, what only with a reason, what stays at home.' },
  { key: 'setup', title: 'Pack the target setup', offset: 35, note: 'Weigh every bag. Nothing new from five weeks before the start.' },
  { key: 'vorher', title: 'Go through the day before', offset: 1, note: 'Charging, food, clothes, start time, bike, bottles and sleep.' },
];

/** The race check of a goal, or null (no trip, no race stored yet). */
function checkOf(goal, ctx) {
  const race = goal?.tripId ? ctx?.races?.[goal.tripId] : null;
  return race && typeof race === 'object' ? (race.check ?? {}) : null;
}

/** Is the part of the check behind one key done? true / false, or null when it cannot be known. */
export function checkDone(key, check) {
  if (!check) return null;
  switch (key) {
    case 'setup': return setupWeight(check).counted > 0;
    case 'liste': return filled(check, 'liste').done > 0;
    case 'schlaf': return filled(check, 'schlaf').done > 0;
    case 'vorher': { const d = dayBeforeDone(check); return d.of > 0 && d.done === d.of; }
    default: return null;
  }
}

export default {
  order: 10,
  type: 'rennplanung',
  label: 'Race planning',
  icon: 'flag',
  /** Races get the four steps; a trip or a free goal gets none (the user can add them). */
  defaults: (goal) => (goal?.kind === 'race' ? STEPS.map(({ key, title, offset, note }) => ({ key, title, offset, note })) : []),
  /** Ticks by itself when the sheet is filled in; never takes a tick back (weg.js applyAuto). */
  auto: (goal, step, ctx) => {
    const done = checkDone(step?.key, checkOf(goal, ctx));
    return done === true ? true : done === false ? false : null;
  },
  /** The race check of the goal's race; without a trip the list of the races. */
  link: (goal) => (goal?.tripId ? `#/racecheck/${encodeURIComponent(goal.tripId)}` : '#/racecheck'),
};
