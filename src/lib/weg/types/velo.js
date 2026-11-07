/**
 * Step kind «Bike ready» (type `velo`) of «Weg zum Ziel» (idea G, Noah 05.11.2026 20:30 «Schrittarten 1 2 3 4 5 7 8»):
 * the bike is in shape for the start. Five suggested steps, counted back from the start day. Everything is a
 * suggestion: each step can be renamed, moved, deleted and ticked by hand, and the days can be changed.
 *
 *   inspect  42 days (6 weeks) before  Inspect the whole bike    ticks by itself: a finished full inspection
 *                                                                  within 7 weeks before the start
 *   care     35 days (5 weeks) before  Do the care that is due   ticks by itself: Bike care says «nothing due»
 *                                                                  (and has data to judge by) for the bike
 *   wear     21 days (3 weeks) before  Chain and tyres: replace if worn, by hand
 *   kit      14 days before            Tools and spares ready, by hand
 *   check     2 days before            Quick check before the start   ticks by itself: any finished inspection in
 *                                                                  the last 3 days before the start
 *
 * Which bike: step.bikeId, else goal.bikeId, else the bike of the trip goal.tripId, else the only bike that is not
 * retired. With no bike to judge by nothing ticks by itself (auto gives null) and the links lead to the bike list.
 *
 * ctx: the page hands in `today` ('YYYY-MM-DD', no clock here) and, under ctx.velo, what `load(db)` returned:
 * { bikes: [{ id, retired?, archived?, status? }], trips: [{ id, bikeId }], inspections: [{ bikeId, date, level, done }],
 * care: { [bikeId]: 'ok' | 'due' | 'nodata' } }. `auto` reads only that. Pure; tested in tests/weg-velo.test.js.
 * Titles are English keys for t() (the page translates them when it adds the steps); typed names never go through t().
 */
import { shift, isDay } from '../weg.js';
import { activeBikes } from '../../bikeretire.js';

/** The suggested steps. key: which one it is (kept on the step, so a renamed step still works). before: how far back a tick still counts. */
export const STEPS = [
  { key: 'inspect', title: 'Inspect the whole bike', offset: 42, note: 'Full inspection, point by point. Order what turns out to be worn now.', before: 49 },
  { key: 'care', title: 'Do the care that is due', offset: 35, note: 'Service, sealant, chain wax: whatever Bike care lists as due.' },
  { key: 'wear', title: 'Chain and tyres: replace if worn', offset: 21, note: 'Measure the chain, look at tread and sidewalls. New tyres need a few rides.' },
  { key: 'kit', title: 'Get tools and spares ready', offset: 14, note: 'Tube or plugs, quick link, spare hanger, pump, multitool.' },
  { key: 'check', title: 'Quick check before the start', offset: 2, note: 'Air, brakes, axles, chain.', before: 3 },
];

/** Which suggested step this is: the key on the step, else the days it was suggested with (a way saved as template drops the key). */
export const keyOf = (step) => step?.key ?? STEPS.find((s) => s.offset === step?.offset)?.key ?? null;

const RANK = { quick: 0, monthly: 1, full: 2 };
const list = (x) => (Array.isArray(x) ? x : []);

/** The bike this step is about: its id, or null when it cannot be told. */
export function bikeIdOf(goal, step, v = {}) {
  const id = step?.bikeId || goal?.bikeId || (goal?.tripId ? list(v.trips).find((t) => t?.id === goal.tripId)?.bikeId : '') || '';
  if (id) return id;
  const only = activeBikes(list(v.bikes));
  return only.length === 1 ? only[0].id : null;
}

/** A finished inspection of the bike, at least this big, on a day in [from, today]. */
const inspected = (v, bikeId, minLevel, from, today) =>
  list(v.inspections).some((x) => x?.bikeId === bikeId && x.done && (RANK[x.level] ?? -1) >= RANK[minLevel] && isDay(x.date) && x.date >= from && x.date <= today);

export default {
  type: 'velo',
  label: 'Bike ready',
  icon: 'wrench',
  moment: 'velo',

  defaults: () => STEPS.map(({ key, title, offset, note }) => ({ key, title, offset, note })),

  auto(goal, step, ctx = {}) {
    const key = keyOf(step);
    const v = ctx.velo;
    const today = ctx.today ?? v?.today;
    if (!key || !v || !isDay(today)) return null;
    const bikeId = bikeIdOf(goal, step, v);
    if (!bikeId) return null;
    if (key === 'care') {
      const state = v.care?.[bikeId];
      return state ? state === 'ok' : null;
    }
    if (key !== 'inspect' && key !== 'check') return null;
    // Both need a start day to count back from.
    if (!goal.start) return null;
    const from = shift(goal.start, -STEPS.find((s) => s.key === key).before);
    return inspected(v, bikeId, key === 'inspect' ? 'full' : 'quick', from, today);
  },

  /** Where the step leads: the bike's care page, its inspection, its repair kit; the bike list when no bike is known. */
  link(goal, step, ctx = {}) {
    const id = bikeIdOf(goal, step, ctx.velo ?? ctx);
    if (!id) return '#/bikes';
    const key = keyOf(step);
    if (key === 'inspect') return `#/bikes?tab=care&view=inspect&bike=${id}&level=full`;
    if (key === 'check') return `#/bikes?tab=care&view=inspect&bike=${id}&level=quick`;
    if (key === 'kit') return `#/bikes?bike=${id}&sheet=kit`;
    return `#/bikes?tab=care&bike=${id}&open=1`;
  },

  /**
   * What `auto` needs, read from the device (nothing is written): the bikes, the trips' bikes, the inspections and
   * the Bike care state per bike ('ok' = nothing due and something recorded; 'due'; 'nodata' = nothing to judge by).
   * The care rules load only now (they pull in the texts), so the page itself stays light.
   */
  async load(db, today) {
    const [{ localDay }, { bikeCare }, { withVisits }, { ensureParts }] = await Promise.all([
      import('../../localday.js'), import('../../readiness.js'), import('../../workshop.js'), import('../../care.js'),
    ]);
    const day = isDay(today) ? today : localDay();
    const [bikes, trips, inspections, visits, tasks] = await Promise.all([db.bikes.toArray(), db.trips.toArray(), db.inspections.toArray(), db.visits.toArray(), db.maintenance.toArray()]);
    const care = {};
    for (const b of bikes) {
      try {
        care[b.id] = bikeCare(withVisits({ ...b, parts: ensureParts(b) }, visits), { tasks, visits, today: day }).status;
      } catch {
        care[b.id] = 'nodata';
      }
    }
    return {
      today: day,
      bikes: bikes.map(({ id, retired, archived, status }) => ({ id, retired, archived, status })),
      trips: trips.map(({ id, bikeId }) => ({ id, bikeId })),
      inspections: inspections.map(({ bikeId, date, level, done }) => ({ bikeId, date, level, done })),
      care,
    };
  },
};
