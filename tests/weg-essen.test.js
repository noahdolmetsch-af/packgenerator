// «Weg zum Ziel» › kind of step «Test the food» (Noah 05.11.2026 «1a 2a 3a»): the three steps with their days, the
// ticking by itself (plan made, long ride, success recipe), the links, the build-up tip, the German texts. Fictional data.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newGoal, addSteps, setDone, applyAuto, timeline, dueOf, wegOf } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import essenType, { planMade, longRides, tipOf, TEST_HOURS } from '../src/lib/weg/types/essen.js';
import DE from '../src/lib/i18n/de/index.js';

const goal0 = () => newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-05-15' }, { id: 'g1', now: '2027-03-01T10:00:00.000Z' });
const withSteps = (g = goal0()) => {
  let n = 0;
  return addSteps(g, suggestions(g).filter((s) => s.type === 'essen'), { ids: () => `f${++n}` });
};
const ticked = (g) => Object.fromEntries(g.steps.map((s) => [s.key, s.done]));
const auto = (g, c) => applyAuto(g, TYPES, { essen: c });

describe('the kind «Test the food»', () => {
  it('is in the registry after «Own step» and suggests three steps with their days', () => {
    expect(TYPES.map((t) => t.type)).toEqual(['own', 'essen']);
    expect(typeOf('essen')).toBe(essenType);
    const g = withSteps();
    expect(g.steps.map((s) => [s.key, s.type, s.offset])).toEqual([['plan', 'essen', 28], ['test', 'essen', 14], ['note', 'essen', 10]]);
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-04-17', '2027-05-01', '2027-05-05']);
    expect(timeline(g, '2027-03-02').map((r) => r.step.key)).toEqual(['plan', 'test', 'note']);
  });
  it('a free goal without a start gets the steps without days', () => {
    const g = withSteps(newGoal({ title: 'Irgendwann', kind: 'free' }, { id: 'g2', now: 'x' }));
    expect(g.steps).toHaveLength(3);
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['', '', '']);
  });
  it('every text has German', () => {
    const texts = [essenType.label, ...essenType.defaults().flatMap((s) => [s.title, s.note])];
    expect(texts.filter((x) => !(x in DE))).toEqual([]);
  });
  it('survives the store round trip with its key', () => {
    const g = withSteps();
    expect(wegOf({ goals: [g] }).goals[0].steps.map((s) => s.key)).toEqual(['plan', 'test', 'note']);
  });
  it('links to the food plan, and the last step to the success recipes', () => {
    const [plan, test, note] = withSteps().steps;
    expect([plan, test, note].map((s) => essenType.link(goal0(), s))).toEqual(['#/trips/fuel', '#/trips/fuel', '#/pack/templates']);
  });
});

describe('the food plan exists', () => {
  it('own numbers or products in settings fuel, or numbers of a trip', () => {
    expect(planMade({})).toBe(false);
    expect(planMade({ fuel: null })).toBe(false);
    expect(planMade({ fuel: { view: 'products' } })).toBe(false);
    expect(planMade({ fuel: { carbsGh: 70 } })).toBe(true);
    expect(planMade({ fuel: { products: [{ id: 'p1', carbs: 30 }] } })).toBe(true);
    expect(planMade({ fuel: {}, trips: [{ id: 't1' }, { id: 't2', fuelOwn: {} }] })).toBe(false);
    expect(planMade({ trips: [{ id: 't2', fuelOwn: { carbsGh: 80 } }] })).toBe(true);
  });
});

describe('ticking by itself', () => {
  it('the plan step ticks when the plan exists, never before', () => {
    expect(ticked(auto(withSteps(), { fuel: null, trips: [] })).plan).toBe(false);
    expect(ticked(auto(withSteps(), { fuel: { carbsGh: 60 } })).plan).toBe(true);
    expect(auto(withSteps(), { fuel: { carbsGh: 60 } }).steps[0].by).toBe('auto');
  });
  it('without any data nothing ticks (unknown is not «no»)', () => {
    const g = withSteps();
    expect(auto(g, {})).toBe(g);
    expect(applyAuto(g, TYPES, {})).toBe(g); // the page has not loaded anything yet
    expect(essenType.auto(g, g.steps[0], {})).toBeNull();
    expect(essenType.auto(g, g.steps[1], {})).toBeNull();
    expect(essenType.auto(g, g.steps[2], {})).toBeNull();
  });
  it('the test ticks after a bike ride of 3 hours or more after the way was made, before the start', () => {
    const plan = { fuel: { carbsGh: 60 } };
    const ride = (day, movingS) => ({ activities: [{ day, kind: 'bike', movingS }], ...plan });
    expect(ticked(auto(withSteps(), ride('2027-04-10', 3 * 3600))).test).toBe(true);
    expect(ticked(auto(withSteps(), ride('2027-04-10', 3 * 3600 - 1))).test).toBe(false); // under 3 hours
    expect(ticked(auto(withSteps(), ride('2027-02-20', 5 * 3600))).test).toBe(false); // before the way was made
    expect(ticked(auto(withSteps(), ride('2027-05-15', 5 * 3600))).test).toBe(false); // the start day itself is the event
    expect(ticked(auto(withSteps(), { activities: [{ day: '2027-04-10', kind: 'run', movingS: 5 * 3600 }], ...plan })).test).toBe(false); // a run
    expect(ticked(auto(withSteps(), { ...plan, activities: [], rides: [{ date: '2027-04-11', movingH: 3.5 }] })).test).toBe(true); // an uploaded ride
  });
  it('the test waits for the plan', () => {
    const ctx = { fuel: null, activities: [{ day: '2027-04-10', kind: 'bike', movingS: 4 * 3600 }] };
    expect(ticked(auto(withSteps(), ctx)).test).toBe(false);
    // the plan step ticked by hand counts as a plan
    const g = setDone(withSteps(), 'f1', true);
    expect(ticked(auto(g, ctx)).test).toBe(true);
  });
  it('the last step ticks with a success recipe that has food, made since the way was made', () => {
    const rec = (over) => ({ id: 'r1', name: 'Jura', food: 'Riegel jede Stunde', createdAt: '2027-04-20T08:00:00.000Z', ...over });
    expect(ticked(auto(withSteps(), { recipes: [rec()] })).note).toBe(true);
    expect(ticked(auto(withSteps(), { recipes: [] })).note).toBe(false);
    expect(ticked(auto(withSteps(), { recipes: [rec({ food: '', breakfast: 'Porridge' })] })).note).toBe(false); // no food written
    expect(ticked(auto(withSteps(), { recipes: [rec({ createdAt: '2027-01-02T08:00:00.000Z' })] })).note).toBe(false); // older than the way
    expect(ticked(auto(withSteps(), { recipes: [rec({ createdAt: '' })] })).note).toBe(false); // no date: not counted
  });
  it('a step the user unticked is never ticked again, and a tick is never taken back', () => {
    const ctx = { fuel: { carbsGh: 60 } };
    const user = setDone(setDone(withSteps(), 'f1', true), 'f1', false);
    expect(ticked(auto(user, ctx)).plan).toBe(false);
    const done = auto(withSteps(), ctx);
    expect(ticked(auto(done, { fuel: null })).plan).toBe(true);
  });
  it('a broken context never breaks the page', () => {
    const g = withSteps();
    expect(() => auto(g, { fuel: 5, trips: 'x', activities: [null, 3, { kind: 'bike' }], rides: [{}], recipes: 'x' })).not.toThrow();
    expect(() => essenType.auto(null, {}, undefined)).not.toThrow();
  });
});

describe('long rides and the build-up tip', () => {
  it('long rides take Strava bike rides and uploaded rides of 3 hours or more', () => {
    expect(TEST_HOURS).toBe(3);
    expect(longRides({
      activities: [{ day: '2027-04-01', kind: 'bike', movingS: 11000 }, { day: '2027-04-02', kind: 'bike', movingS: 9000 }, { day: '2027-04-03', kind: 'hike', movingS: 20000 }],
      rides: [{ date: '2027-04-04', movingH: 4 }, { date: '2027-04-05', movingH: 1 }],
    })).toEqual([{ day: '2027-04-01', hours: 11000 / 3600 }, { day: '2027-04-04', hours: 4 }]);
  });
  it('the tip builds up from 40 g an hour to your own number, and is silent when there is nothing to build up to', () => {
    expect(tipOf({})).toEqual({ from: 40, to: 60 }); // the standard is 60
    expect(tipOf({ fuel: { carbsGh: 90 } })).toEqual({ from: 40, to: 90 });
    expect(tipOf({ fuel: { carbsGh: 40 } })).toBeNull();
    expect(tipOf({ fuel: { carbsGh: 30 } })).toBeNull();
  });
});

describe('load(db)', () => {
  it('reads the food plan, trips, bike rides and recipes from the database; an empty database gives «known to be empty»', async () => {
    const db = createDb('essen-1');
    const none = await essenType.load(db);
    expect(none).toEqual({ fuel: null, trips: [], activities: [], rides: [], recipes: [] });
    expect(planMade(none)).toBe(false);
    await db.settings.put({ key: 'fuel', value: { carbsGh: 70 } });
    await db.settings.put({ key: 'recipes', value: [{ id: 'r1', name: 'Jura', food: 'Riegel', createdAt: '2027-04-20T08:00:00.000Z' }] });
    await db.activities.put({ id: 'a1', day: '2027-04-10', kind: 'bike', movingS: 4 * 3600, name: 'x' });
    await db.rides.put({ id: 'r1', date: '2027-04-11', movingH: 3.5 });
    const got = await essenType.load(db);
    expect(got.fuel).toEqual({ carbsGh: 70 });
    expect(got.activities).toEqual([{ day: '2027-04-10', kind: 'bike', movingS: 14400 }]);
    expect(got.rides).toEqual([{ date: '2027-04-11', movingH: 3.5 }]);
    expect(ticked(auto(withSteps(), got))).toEqual({ plan: true, test: true, note: true });
  });
});
