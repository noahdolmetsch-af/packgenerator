// «Weg zum Ziel», Schrittart «Bike ready» (velo): the five suggested steps, which bike a step is about, what ticks by
// itself (finished inspections, «nothing due» in Bike care), what never does, the links and load(db). Fictional data.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newGoal, addSteps, applyAuto, dueOf, setDone, timeline } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import velo, { STEPS, keyOf, bikeIdOf } from '../src/lib/weg/types/velo.js';
import DE from '../src/lib/i18n/de/weg-velo.js';
import { ensureParts, logPart, CHECK_PARTS } from '../src/lib/care.js';

const today = '2027-04-20';
const race = () => newGoal({ title: 'Testrennen', kind: 'race', start: '2027-05-15' }, { id: 'g1', now: '2027-02-01T10:00:00Z' });
const withSteps = (g = race()) => {
  let n = 0;
  return addSteps(g, suggestions(g, [velo]), { ids: () => `s${++n}` });
};
const stepOfKey = (g, key) => g.steps.find((s) => s.key === key);
const bikeA = { id: 'bA', name: 'Rennvelo' };
const bikeB = { id: 'bB', name: 'Gravel' };
const insp = (o) => ({ bikeId: 'bA', date: '2027-04-10', level: 'full', done: true, ...o });
const ctxOf = (v = {}, o = {}) => ({ today, velo: { bikes: [bikeA], trips: [], inspections: [], care: {}, ...v }, ...o });

describe('the kind is registered', () => {
  it('is in the registry after the own step, with label and moment', () => {
    expect(TYPES.map((t) => t.type)).toEqual(['own', 'velo']);
    expect(typeOf('velo')).toBe(velo);
    expect(velo).toMatchObject({ label: 'Bike ready', moment: 'velo' });
  });
  it('suggests five steps counted back from the start (6, 5, 3, 2 weeks, 2 days), in time order', () => {
    const g = withSteps();
    expect(g.steps.map((s) => [s.key, s.type, s.offset])).toEqual([['inspect', 'velo', 42], ['care', 'velo', 35], ['wear', 'velo', 21], ['kit', 'velo', 14], ['check', 'velo', 2]]);
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-04-03', '2027-04-10', '2027-04-24', '2027-05-01', '2027-05-13']);
    expect(timeline(g, today).map((r) => r.step.key)).toEqual(['inspect', 'care', 'wear', 'kit', 'check']);
  });
  it('has a German text for every title, every note and the label', () => {
    for (const s of STEPS) {
      expect(DE[s.title], s.title).toBeTruthy();
      expect(DE[s.note], s.note).toBeTruthy();
    }
    expect(DE['Bike ready']).toBe('Velo bereit');
  });
  it('a goal without a start gets the steps without a day', () => {
    const g = withSteps(newGoal({ title: 'Irgendwann', kind: 'free' }, { id: 'f', now: '2027-02-01T10:00:00Z' }));
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['', '', '', '', '']);
  });
});

describe('which bike', () => {
  const g = race();
  const step = { type: 'velo', key: 'inspect' };
  it('the step first, then the goal, then the bike of the trip, then the only bike that is still ridden', () => {
    expect(bikeIdOf(g, { ...step, bikeId: 'bB' }, { bikes: [bikeA] })).toBe('bB');
    expect(bikeIdOf({ ...g, bikeId: 'bA' }, step, { bikes: [bikeA, bikeB] })).toBe('bA');
    expect(bikeIdOf({ ...g, tripId: 't1' }, step, { trips: [{ id: 't1', bikeId: 'bB' }], bikes: [bikeA, bikeB] })).toBe('bB');
    expect(bikeIdOf(g, step, { bikes: [bikeA] })).toBe('bA');
    expect(bikeIdOf(g, step, { bikes: [bikeA, { id: 'old', retired: { at: '2026-01-01' } }] })).toBe('bA');
  });
  it('nothing to judge by with two bikes and no choice', () => {
    expect(bikeIdOf(g, step, { bikes: [bikeA, bikeB] })).toBeNull();
    expect(bikeIdOf(g, step, {})).toBeNull();
  });
});

describe('ticking by itself', () => {
  const g = withSteps();
  const done = (goal, c) => applyAuto(goal, TYPES, c).steps.filter((s) => s.done).map((s) => s.key);

  it('nothing is known: nothing ticks', () => {
    expect(done(g, ctxOf())).toEqual([]);
    expect(velo.auto(g, stepOfKey(g, 'inspect'), ctxOf())).toBe(false);
  });
  it('a finished full inspection within 7 weeks before the start ticks the inspection; quick, monthly, open or old ones do not', () => {
    expect(done(g, ctxOf({ inspections: [insp({})] }))).toEqual(['inspect']);
    expect(done(g, ctxOf({ inspections: [insp({ date: '2027-03-27' })] }))).toEqual(['inspect']);
    for (const bad of [{ level: 'monthly' }, { level: 'quick' }, { done: false }, { date: '2027-03-20' }, { bikeId: 'bB' }, { date: '2027-04-25' }]) {
      expect(done(g, ctxOf({ inspections: [insp(bad)] })), JSON.stringify(bad)).toEqual([]);
    }
  });
  it('«nothing due» in Bike care ticks the care step; due or no data do not', () => {
    expect(done(g, ctxOf({ care: { bA: 'ok' } }))).toEqual(['care']);
    expect(done(g, ctxOf({ care: { bA: 'due' } }))).toEqual([]);
    expect(done(g, ctxOf({ care: { bA: 'nodata' } }))).toEqual([]);
    expect(velo.auto(g, stepOfKey(g, 'care'), ctxOf())).toBeNull();
  });
  it('the quick check counts only in the last 3 days before the start, any finished level', () => {
    expect(done(g, ctxOf({ inspections: [insp({ level: 'quick', date: '2027-05-10' })] }, { today: '2027-05-10' }))).toEqual([]);
    expect(done(g, ctxOf({ inspections: [insp({ level: 'quick', date: '2027-05-13' })] }, { today: '2027-05-13' }))).toEqual(['check']);
    expect(done(g, ctxOf({ inspections: [insp({ date: '2027-05-12' })] }, { today: '2027-05-13' }))).toEqual(['inspect', 'check']);
  });
  it('chain/tyres and tools never tick by themselves', () => {
    const c = ctxOf({ inspections: [insp({})], care: { bA: 'ok' } });
    expect(velo.auto(g, stepOfKey(g, 'wear'), c)).toBeNull();
    expect(velo.auto(g, stepOfKey(g, 'kit'), c)).toBeNull();
  });
  it('with two bikes and no choice nothing ticks (null, not false); a bike on the step decides', () => {
    const c = ctxOf({ bikes: [bikeA, bikeB], inspections: [insp({})] });
    expect(velo.auto(g, stepOfKey(g, 'inspect'), c)).toBeNull();
    expect(done(g, c)).toEqual([]);
    const picked = { ...g, steps: g.steps.map((s) => (s.key === 'inspect' ? { ...s, bikeId: 'bA' } : s)) };
    expect(done(picked, c)).toEqual(['inspect']);
  });
  it('a renamed step still works; a way saved as template (key dropped) is told by its days', () => {
    const renamed = { ...g, steps: g.steps.map((s) => (s.key === 'inspect' ? { ...s, title: 'Alles prüfen' } : s)) };
    expect(done(renamed, ctxOf({ inspections: [insp({})] }))).toEqual(['inspect']);
    expect(keyOf({ offset: 35 })).toBe('care');
    expect(keyOf({ offset: 9 })).toBeNull();
    expect(velo.auto(g, { type: 'velo', offset: 9 }, ctxOf())).toBeNull();
  });
  it('a step the user unticked is never ticked again; a tick is never taken back', () => {
    const c = ctxOf({ care: { bA: 'ok' } });
    const unticked = setDone(setDone(g, g.steps[1].id, true), g.steps[1].id, false);
    expect(done(unticked, c)).toEqual([]);
    const ticked = applyAuto(g, TYPES, c);
    expect(stepOfKey(ticked, 'care')).toMatchObject({ done: true, by: 'auto' });
    expect(done(ticked, ctxOf({ care: { bA: 'due' } }))).toEqual(['care']);
  });
  it('without the clock, without load data or with broken data it gives null and never throws', () => {
    expect(velo.auto(g, stepOfKey(g, 'inspect'), { velo: { bikes: [bikeA] } })).toBeNull();
    expect(velo.auto(g, stepOfKey(g, 'inspect'), { today })).toBeNull();
    expect(() => velo.auto(g, stepOfKey(g, 'inspect'), ctxOf({ inspections: [null, { bikeId: 'bA' }], bikes: [null, bikeA] }))).not.toThrow();
    expect(done(g, ctxOf({ inspections: 'nope', trips: 7, bikes: [bikeA] }))).toEqual([]);
  });
  it('a goal without a start has no day to count from: inspection and quick check stay open', () => {
    const free = withSteps(newGoal({ title: 'Irgendwann', kind: 'free' }, { id: 'f', now: '2027-04-01T09:00:00Z' }));
    const c = ctxOf({ inspections: [insp({ date: '2027-04-05' })], care: { bA: 'ok' } });
    expect(done(free, c)).toEqual(['care']);
  });
});

describe('links', () => {
  const g = race();
  const link = (key, extra = {}, velo_ = { bikes: [bikeA] }) => velo.link(g, { type: 'velo', key, ...extra }, { velo: velo_ });
  it('lead to the care page, the inspection, the repair kit; the bike list when no bike is known', () => {
    expect(link('care')).toBe('#/bikes?tab=care&bike=bA&open=1');
    expect(link('wear')).toBe('#/bikes?tab=care&bike=bA&open=1');
    expect(link('inspect')).toBe('#/bikes?tab=care&view=inspect&bike=bA&level=full');
    expect(link('check')).toBe('#/bikes?tab=care&view=inspect&bike=bA&level=quick');
    expect(link('kit')).toBe('#/bikes?bike=bA&sheet=kit');
    expect(link('inspect', {}, { bikes: [bikeA, bikeB] })).toBe('#/bikes');
    expect(link('inspect', { bikeId: 'bB' }, { bikes: [bikeA, bikeB] })).toContain('bike=bB');
    expect(velo.link(g, { type: 'velo', key: 'kit' })).toBe('#/bikes');
  });
});

describe('load(db): what auto needs, read from the device', () => {
  const checked = (bike, date, km) => {
    let parts = ensureParts(bike);
    for (const k of CHECK_PARTS) parts = logPart(parts, k, { date, km, value: null, action: 'check', result: 'ok', by: 'self' });
    return { ...bike, parts };
  };
  it('gives the bikes, the trips, the inspections and the care state per bike; writes nothing', async () => {
    const db = createDb(`weg-velo-${Math.random()}`);
    await db.bikes.bulkPut([
      checked({ id: 'hard', name: 'Hardtail', type: 'Hardtail', km: 2287, tyreSetup: { front: 'tube', rear: 'tube' } }, '2026-09-01', 2200),
      { id: 'blank', name: 'Neues Velo', type: 'Gravel', km: null, parts: [] },
    ]);
    await db.trips.put({ id: 't1', title: 'Tour', startDate: '2026-11-20', bikeId: 'hard' });
    await db.inspections.put({ id: 'i1', bikeId: 'hard', date: '2026-09-20', level: 'full', done: true, results: [], extra: 'x' });
    const before = JSON.stringify([await db.bikes.toArray(), await db.inspections.toArray()]);
    const v = await velo.load(db, '2026-10-07');
    expect(v.today).toBe('2026-10-07');
    expect(v.bikes.map((b) => b.id).sort()).toEqual(['blank', 'hard']);
    expect(v.trips).toEqual([{ id: 't1', bikeId: 'hard' }]);
    expect(v.inspections).toEqual([{ bikeId: 'hard', date: '2026-09-20', level: 'full', done: true }]);
    expect(v.care.blank).toBe('nodata');
    expect(['ok', 'due']).toContain(v.care.hard);
    expect(JSON.stringify([await db.bikes.toArray(), await db.inspections.toArray()])).toBe(before);
    // the data feeds auto: the trip goal picks the hard-tail, its full inspection counts
    const goal = { ...newGoal({ title: 'Tour', kind: 'trip', start: '2026-10-20', tripId: 't1' }, { id: 'g', now: '2026-09-01T00:00:00Z' }) };
    const g = addSteps(goal, suggestions(goal, [velo]), { ids: (() => { let n = 0; return () => `x${++n}`; })() });
    expect(applyAuto(g, TYPES, { today: '2026-10-07', velo: v }).steps.find((s) => s.key === 'inspect')).toMatchObject({ done: true, by: 'auto' });
  });
});
