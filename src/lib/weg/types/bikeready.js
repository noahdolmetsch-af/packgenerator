/**
 * Schrittart «Bike ready» für «Weg zum Ziel» (Noah 05.11.2026 «a», Thread «Planen: Bike ready im Weg»): the bike
 * counts down to the start in four steps that point to the care pages of the bike and tick when the care is done.
 *
 *   care   – Do the care that is due   6 weeks before   ticks when nothing is due or open and the bike was looked at lately
 *   tyres  – Check the tyres           5 weeks before   ticks when the tyres were checked, serviced or replaced lately
 *   chain  – Check the chain           3 weeks before   ticks when the chain was looked at lately and is not worn
 *   tools  – Check tools and repair kit 2 weeks before  by hand (the app does not know what lies in the bag)
 *
 * Which bike: the bike chosen on the goal (`goal.bikeId`, picked when a free goal is made), else the bike of the
 * goal's trip (`ctx.trips[goal.tripId].bikeId`). `ctx.bikes` is the list of the bikes with their parts. «Lately» =
 * a look on or after 8 weeks before the start (WINDOW), so an old check from last season never ticks a step.
 * Nothing new is stored: the care stays in the bike. Without a bike, a start day or a part the answer is null
 * (unknown). Everything is a suggestion: days, names, ticks, order and deleting stay with the user (weg.js).
 * A race or a trip gets the four steps; a free goal only when a bike was chosen for it.
 * Pure functions, tested in tests/weg-bikeready.test.js. Titles and notes are English keys for t().
 */
import { needsWork, serviceDue, checkState, wear } from '../../care.js';

/** A look counts when it is not older than this many days before the start. */
export const WINDOW = 56;

/** The four steps: key, title, days before the start, a note under the title. */
export const STEPS = [
  { key: 'care', title: 'Do the care that is due', offset: 42, note: 'Clear what the care page shows as due, then go through the bike once.' },
  { key: 'tyres', title: 'Check the tyres', offset: 35, note: 'Wear, cuts, sealant and pressure. Order new ones in time.' },
  { key: 'chain', title: 'Check the chain', offset: 21, note: 'Measure it and lube or wax it. A new chain needs a few rides to settle.' },
  { key: 'tools', title: 'Check tools and repair kit', offset: 14, note: 'Tube or plug, pump, multi-tool, quick link and spare bolts: all there and in the bag?' },
];

const day = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** The bike of a goal, or null (none chosen, no trip, bike gone). */
export function bikeOf(goal, ctx) {
  const id = goal?.bikeId || ctx?.trips?.[goal?.tripId]?.bikeId;
  return id ? ((ctx?.bikes ?? []).find((b) => b?.id === id) ?? null) : null;
}

/** Was the part looked at, serviced or replaced (with a good result) on or after `from`? */
const lookedSince = (part, from) => (part?.history ?? []).some((h) => typeof h?.date === 'string' && h.date >= from && h.result !== 'needed');

/** Is the care behind one key done? true / false, or null when it cannot be known. */
export function careDone(key, goal, bike) {
  if (!bike || !goal?.start || !Array.isArray(bike.parts)) return null;
  const from = day(goal.start, -WINDOW);
  const part = (k) => bike.parts.find((p) => p?.key === k);
  switch (key) {
    case 'care': {
      if (!bike.parts.length) return null;
      const clear = !bike.parts.some(needsWork) && serviceDue(bike).length === 0 && checkState(bike).due === 0;
      return clear && bike.parts.some((p) => lookedSince(p, from));
    }
    case 'tyres': { const p = part('tyres'); return p ? !needsWork(p) && lookedSince(p, from) : null; }
    case 'chain': { const p = part('chain'); return p ? !needsWork(p) && wear(p) !== 'worn' && lookedSince(p, from) : null; }
    default: return null; // tools: by hand
  }
}

const enc = encodeURIComponent;

export default {
  type: 'bikeready',
  label: 'Bike ready',
  icon: 'bike',
  /** Races and trips get the four steps; a free goal only when a bike was chosen for it. */
  defaults: (goal) => (goal?.kind === 'race' || goal?.kind === 'trip' || goal?.bikeId ? STEPS.map(({ key, title, offset, note }) => ({ key, title, offset, note })) : []),
  /** Ticks by itself when the care is done; never takes a tick back (weg.js applyAuto). */
  auto: (goal, step, ctx) => {
    const done = careDone(step?.key, goal, bikeOf(goal, ctx));
    return done === true ? true : done === false ? false : null;
  },
  /** The care page of the goal's bike; the repair kit for the tools; without a bike the care overview. */
  link: (goal, step, ctx) => {
    const id = goal?.bikeId || ctx?.trips?.[goal?.tripId]?.bikeId;
    if (!id) return '#/bikes?tab=care';
    if (step?.key === 'tools') return `#/bikes?bike=${enc(id)}&sheet=kit`;
    return `#/bikes?tab=care&view=${step?.key === 'care' ? 'inspect' : 'wear'}&bike=${enc(id)}`;
  },
};
