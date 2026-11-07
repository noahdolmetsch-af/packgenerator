// «Weg zum Ziel», Schrittart «Bike ready»: four steps that point to the care pages of the bike and tick when the
// care is done. Fictional data.
import { describe, it, expect } from 'vitest';
import { newGoal, addSteps, applyAuto, setDone, dueOf, typeProgress, templateOf } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import bikeready, { STEPS, WINDOW, careDone, bikeOf } from '../src/lib/weg/types/bikeready.js';
import DE from '../src/lib/i18n/de/weg-bikeready.js';

const today = '2027-03-01';
const START = '2027-05-15';
const ids = (p) => { let n = 0; return () => `${p}${++n}`; };
const trip = (extra = {}) => newGoal({ title: 'Test Tour', kind: 'trip', start: START, tripId: 't1', ...extra }, { id: 'g1', now: 'x' });
const withSteps = (g) => addSteps(g, suggestions(g, [bikeready]), { ids: ids('s') });
const byKey = (g, key) => g.steps.find((s) => s.key === key);
const doneKeys = (g) => g.steps.filter((s) => s.done).map((s) => s.key).sort();

// A fictional bike. Inside the window (8 weeks before 2027-05-15 = 2027-03-20) a look counts.
const LOOK = '2027-03-25';
const OLD = '2026-09-01';
const part = (key, history = []) => ({ key, model: '', history });
const look = (date, extra = {}) => ({ date, km: 1000, action: 'check', result: 'ok', ...extra });
const bike = (parts, extra = {}) => ({ id: 'b1', name: 'Test Gravel', km: 1200, parts, ...extra });
const ctxOf = (b, extra = {}) => ({ bikes: [b], trips: { t1: { bikeId: 'b1' } }, ...extra });

describe('suggestions', () => {
  it('is in the registry, after the own step', () => {
    expect(TYPES.map((t) => t.type)).toContain('bikeready');
    expect(typeOf('bikeready')).toBe(bikeready);
  });
  it('a trip and a race get the four steps counted back from the start', () => {
    const g = withSteps(trip());
    expect(g.steps.map((s) => s.key).sort()).toEqual(['care', 'chain', 'tools', 'tyres']);
    expect(g.steps.every((s) => s.type === 'bikeready' && !s.done)).toBe(true);
    expect(g.steps.map((s) => dueOf(g, s)).sort()).toEqual(['2027-04-03', '2027-04-10', '2027-04-24', '2027-05-01']);
    expect(bikeready.defaults(trip({ kind: 'race' }))).toHaveLength(4);
  });
  it('a free goal gets the steps only when a bike was chosen for it', () => {
    expect(bikeready.defaults(newGoal({ title: 'Frei' }))).toEqual([]);
    expect(bikeready.defaults({ ...newGoal({ title: 'Frei' }), bikeId: 'b1' })).toHaveLength(4);
  });
  it('the countdown is 6, 5, 3 and 2 weeks, in that order', () => {
    expect(STEPS.map((s) => s.offset / 7)).toEqual([6, 5, 3, 2]);
  });
});

describe('which bike', () => {
  it('the bike chosen on the goal wins over the bike of the trip', () => {
    const other = { id: 'b2', parts: [] };
    const ctx = { bikes: [bike([]), other], trips: { t1: { bikeId: 'b1' } } };
    expect(bikeOf(trip(), ctx).id).toBe('b1');
    expect(bikeOf({ ...trip(), bikeId: 'b2' }, ctx).id).toBe('b2');
  });
  it('no bike, no trip, a gone bike or no context give null', () => {
    expect(bikeOf(trip({ tripId: '' }), ctxOf(bike([])))).toBeNull();
    expect(bikeOf(trip(), { bikes: [], trips: { t1: { bikeId: 'b1' } } })).toBeNull();
    expect(bikeOf(trip(), {})).toBeNull();
    expect(bikeOf(null, null)).toBeNull();
  });
});

describe('ticking by itself from the care of the bike', () => {
  const g = withSteps(trip());
  const good = bike([part('tyres', [look(LOOK)]), part('chain', [look(LOOK)])]);

  it('tyres and chain tick when they were looked at inside the window', () => {
    const r = applyAuto(g, [bikeready], ctxOf(good));
    expect(doneKeys(r)).toEqual(['care', 'chain', 'tyres']);
    expect(r.steps.filter((s) => s.done).every((s) => s.by === 'auto')).toBe(true);
  });
  it('an old check from last season ticks nothing', () => {
    const old = bike([part('tyres', [look(OLD)]), part('chain', [look(OLD)])]);
    expect(applyAuto(g, [bikeready], ctxOf(old))).toBe(g);
    expect(careDone('tyres', g, old)).toBe(false);
  });
  it('the window starts WINDOW days before the start (the border day counts)', () => {
    expect(WINDOW).toBe(56);
    const edge = bike([part('tyres', [look('2027-03-20')])]);
    const before = bike([part('tyres', [look('2027-03-19')])]);
    expect(careDone('tyres', g, edge)).toBe(true);
    expect(careDone('tyres', g, before)).toBe(false);
  });
  it('work still needed (last entry «needed») keeps the step open', () => {
    const b = bike([part('tyres', [look(LOOK), look('2027-03-26', { result: 'needed' })]), part('chain', [look(LOOK)])]);
    expect(careDone('tyres', g, b)).toBe(false);
    expect(careDone('care', g, b)).toBe(false);
    expect(doneKeys(applyAuto(g, [bikeready], ctxOf(b)))).toEqual(['chain']);
  });
  it('a worn chain keeps the chain step open even after a look', () => {
    const worn = bike([part('chain', [look(LOOK, { value: 0.8 })])]);
    expect(careDone('chain', g, worn)).toBe(false);
    const fine = bike([part('chain', [look(LOOK, { value: 0.3 })])]);
    expect(careDone('chain', g, fine)).toBe(true);
  });
  it('«care» stays open while a service of its own km interval is due', () => {
    const fresh = bike([{ key: 'chain', everyKm: 150, history: [{ date: LOOK, km: 1100, action: 'service', result: 'ok' }] }]);
    expect(careDone('care', g, fresh)).toBe(true);
    const due = bike([{ key: 'chain', everyKm: 150, history: [{ date: LOOK, km: 900, action: 'service', result: 'ok' }] }]);
    expect(careDone('care', g, due)).toBe(false);
  });
  it('«care» needs a look inside the window, not only an empty to-do list', () => {
    expect(careDone('care', g, bike([part('tyres', [look(OLD)])]))).toBe(false);
    expect(careDone('care', g, bike([part('tyres')]))).toBe(false);
  });
  it('the tools step never ticks by itself', () => {
    expect(careDone('tools', g, good)).toBeNull();
    expect(byKey(applyAuto(g, [bikeready], ctxOf(good)), 'tools').done).toBe(false);
  });
  it('a tick is not taken back; an untick by the user stays', () => {
    const ticked = applyAuto(g, [bikeready], ctxOf(good));
    expect(applyAuto(ticked, [bikeready], ctxOf(bike([part('tyres', [look(OLD)])])))).toBe(ticked);
    const unticked = setDone(ticked, byKey(ticked, 'tyres').id, false);
    expect(byKey(applyAuto(unticked, [bikeready], ctxOf(good)), 'tyres').done).toBe(false);
  });
  it('without a bike, a start day, a part or parts nothing ticks and nothing throws', () => {
    expect(applyAuto(g, [bikeready], {})).toBe(g);
    expect(applyAuto(g, [bikeready], { bikes: [good] })).toBe(g);
    expect(applyAuto(withSteps(trip({ start: '' })), [bikeready], ctxOf(good)).steps.some((s) => s.done)).toBe(false);
    expect(careDone('chain', g, bike([part('tyres', [look(LOOK)])]))).toBeNull();
    expect(careDone('care', g, bike([]))).toBeNull();
    expect(careDone('tyres', g, { id: 'b1' })).toBeNull();
    expect(careDone('tyres', g, null)).toBeNull();
    expect(bikeready.auto(g, { type: 'bikeready' }, ctxOf(good))).toBeNull();
  });
  it('a renamed or moved step keeps ticking, because the key stays', () => {
    const renamed = { ...g, steps: g.steps.map((s) => (s.key === 'tyres' ? { ...s, title: 'Meine Pneus', due: '2027-01-01' } : s)) };
    expect(byKey(applyAuto(renamed, [bikeready], ctxOf(good)), 'tyres').done).toBe(true);
  });
  it('the strip «x of 4 sorted» counts the four steps', () => {
    const r = applyAuto(g, [bikeready], ctxOf(good));
    expect(typeProgress(r, 'bikeready', today)).toMatchObject({ done: 3, total: 4 });
  });
});

describe('link, texts, template', () => {
  it('the links lead to the pages of the goal\'s bike, the kit for the tools', () => {
    const ctx = ctxOf(bike([]));
    const g = trip();
    expect(bikeready.link(g, { key: 'care' }, ctx)).toBe('#/bikes?tab=care&view=inspect&bike=b1');
    expect(bikeready.link(g, { key: 'tyres' }, ctx)).toBe('#/bikes?tab=care&view=wear&bike=b1');
    expect(bikeready.link(g, { key: 'chain' }, ctx)).toBe('#/bikes?tab=care&view=wear&bike=b1');
    expect(bikeready.link(g, { key: 'tools' }, ctx)).toBe('#/bikes?bike=b1&sheet=kit');
    expect(bikeready.link({ ...g, bikeId: 'a b' }, { key: 'tools' }, ctx)).toBe('#/bikes?bike=a%20b&sheet=kit');
  });
  it('without a bike the link leads to the care overview', () => {
    expect(bikeready.link(trip({ tripId: '' }), { key: 'care' }, {})).toBe('#/bikes?tab=care');
    expect(bikeready.link(trip(), { key: 'care' })).toBe('#/bikes?tab=care');
  });
  it('every title, note and the label has German', () => {
    for (const s of STEPS) {
      expect(DE[s.title], s.title).toBeTruthy();
      expect(DE[s.note], s.note).toBeTruthy();
    }
    expect(DE[bikeready.label]).toBe('Velo bereit');
  });
  it('the steps stay in a template (offsets), and no tick is carried over', () => {
    const t = templateOf(setDone(withSteps(trip()), 's1', true));
    expect(t).toHaveLength(4);
    expect(t.every((x) => x.type === 'bikeready' && Number.isFinite(x.offset))).toBe(true);
  });
});
