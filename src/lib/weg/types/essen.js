/**
 * «Weg zum Ziel» › step kind «Test the food» (type `essen`; Noah 05.11.2026 «1a 2a 3a», idea G, kind 7). Three steps
 * that lead from a food plan to a food plan that has been tried on a long ride:
 *   plan  – «Make the food plan»                 28 days before the start, ticks when a food plan exists
 *   test  – «Test the food on a long ride»       14 days before, ticks after a ride of 3 hours or more
 *   note  – «Write down what worked»             10 days before, ticks when a success recipe with food exists
 * Everything is a suggestion: the days, the titles and the ticks can be changed by hand, and a step the user
 * unticked is never ticked again by the app (weg.js applyAuto). The build-up tip (40 → 60 g an hour) only
 * advises, it changes no number of the food plan. A step is found by its `key`, not by its title (the user may rename it).
 *
 * `load(db)` reads what `auto` needs; the page puts it under ctx.essen. `auto` reads only that:
 *   { fuel: settings 'fuel' value, trips: [{ fuelOwn }], activities: [{ day, kind, movingS }] (Strava, kind 'bike'),
 *     rides: [{ date, movingH }] (uploaded GPX rides), recipes: settings 'recipes' value }
 * A field that is missing (undefined) makes `auto` answer null (unknown); null or [] means «known to be empty».
 * Pure apart from `load`. Tested in tests/weg-essen.test.js.
 */
import { FUEL_KEY, LIMITS, tripOwnOf, valuesOf } from '../../fuel.js';
import { RECIPES_KEY, recipesOf } from '../../rezept.js';
import { localDay } from '../../localday.js';

/** A ride counts as a test from this length (hours of moving time; Noah «2a»: 3 h). */
export const TEST_HOURS = 3;
/** The build-up tip starts here (g of carbohydrates an hour; Noah «3a»: 40 → 60). */
export const TIP_FROM = 40;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);

/** The day (YYYY-MM-DD, device clock) of an ISO time, or '' when it is not one. */
function dayOfIso(iso) {
  const d = new Date(iso);
  return typeof iso === 'string' && iso && !Number.isNaN(d.getTime()) ? localDay(d) : '';
}

/** Is there a food plan? Your own numbers or products saved in settings 'fuel', or a trip with numbers of its own. */
export function planMade(c = {}) {
  const f = c.fuel && typeof c.fuel === 'object' ? c.fuel : null;
  if (f && (Object.keys(LIMITS).some((k) => fin(f[k])) || (Array.isArray(f.products) && f.products.length))) return true;
  return Array.isArray(c.trips) && c.trips.some((t) => Object.keys(tripOwnOf(t) ?? {}).length > 0);
}

/** Long rides (moving time of TEST_HOURS or more) with their day: [{ day, hours }], Strava and uploaded rides together. */
export function longRides(c = {}) {
  const strava = (Array.isArray(c.activities) ? c.activities : [])
    .filter((a) => a?.kind === 'bike' && fin(a.movingS))
    .map((a) => ({ day: a.day, hours: a.movingS / 3600 }));
  const gpx = (Array.isArray(c.rides) ? c.rides : []).filter((r) => fin(r?.movingH)).map((r) => ({ day: r.date, hours: r.movingH }));
  return [...strava, ...gpx].filter((r) => typeof r.day === 'string' && r.hours >= TEST_HOURS);
}

/** The build-up tip for the test ride: { from, to } in g an hour, or null when your own number is not above the start. */
export function tipOf(c = {}) {
  const to = valuesOf(c.fuel).carbsGh;
  return to > TIP_FROM ? { from: TIP_FROM, to } : null;
}

export default {
  type: 'essen',
  label: 'Test the food',
  icon: 'fuel',
  moment: 'planen',
  defaults: () => [
    { key: 'plan', title: 'Make the food plan', offset: 28, note: 'Carbohydrates and water for each section of the way, with your bottles and stocks.' },
    { key: 'test', title: 'Test the food on a long ride', offset: 14, note: 'Ride at least 3 hours and eat as planned. Build up slowly, for example from 40 to 60 g of carbohydrates an hour.' },
    { key: 'note', title: 'Write down what worked', offset: 10, note: 'Keep what worked as a success recipe, and change the food plan where it did not.' },
  ],
  /** What `auto` reads: the food plan, the trips, the bike rides and the success recipes. */
  async load(db) {
    const [fuel, trips, activities, rides, recipes] = await Promise.all([
      db.settings.get(FUEL_KEY),
      db.trips.toArray(),
      db.activities.toArray(),
      db.rides.toArray(),
      db.settings.get(RECIPES_KEY),
    ]);
    return {
      fuel: fuel?.value ?? null,
      trips: trips.map((t) => ({ id: t.id, fuelOwn: t.fuelOwn })),
      activities: activities.map((a) => ({ day: a.day, kind: a.kind, movingS: a.movingS })),
      rides: rides.map((r) => ({ date: r.date, movingH: r.movingH })),
      recipes: recipes?.value ?? [],
    };
  },
  auto(goal, step, ctx = {}) {
    const c = ctx?.essen;
    if (!c || typeof c !== 'object') return null;
    // the day the way was made: old rides and old recipes do not tick a new way
    const since = dayOfIso(goal?.at);
    if (step?.key === 'plan') {
      if (c.fuel === undefined && c.trips === undefined) return null;
      return planMade(c);
    }
    if (step?.key === 'test') {
      if (c.activities === undefined && c.rides === undefined) return null;
      // after the plan: the plan exists or its step is ticked
      const planned = planMade(c) || !!goal?.steps?.some((s) => s.type === 'essen' && s.key === 'plan' && s.done);
      if (!planned) return false;
      return longRides(c).some((r) => (!since || r.day >= since) && (!goal?.start || r.day < goal.start));
    }
    if (step?.key === 'note') {
      if (c.recipes === undefined) return null;
      return recipesOf(c.recipes).some((r) => {
        const day = dayOfIso(r.createdAt);
        return r.food && (!since || (day && day >= since));
      });
    }
    return null;
  },
  link: (goal, step) => (step?.key === 'note' ? '#/pack/templates' : '#/trips/fuel'),
};
