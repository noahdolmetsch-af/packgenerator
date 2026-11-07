// «Weg zum Ziel», Schrittart «Nachtplan»: three steps that point to the Strategie of the race; for a race they tick
// themselves from the nights written there. Fictional data.
import { describe, it, expect } from 'vitest';
import { newGoal, addSteps, applyAuto, setDone, dueOf, typeProgress, templateOf } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import nacht, { STEPS, nightsOf, nightDone } from '../src/lib/weg/types/nacht.js';
import DE from '../src/lib/i18n/de/weg-nacht.js';

const today = '2027-03-01';
const ids = (p) => { let n = 0; return () => `${p}${++n}`; };
const goal = (extra = {}) => newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-05-15', tripId: 'trip1', ...extra }, { id: 'g1', now: 'x' });
const withSteps = (g) => addSteps(g, suggestions(g, [nacht]), { ids: ids('s') });
const byKey = (g, key) => g.steps.find((s) => s.key === key);
// 50 h from 15.05. 06:00: the nights 0 and 1 (23:00) fall inside, the third does not
const stored = (nights, extra = {}) => ({ start: '2027-05-15T06:00', targetH: 50, nights, ...extra });
const ctx = (race) => ({ races: { trip1: race } });
const doneKeys = (g) => g.steps.filter((s) => s.done).map((s) => s.key).sort();

describe('suggestions', () => {
  it('is in the registry, after the own step', () => {
    expect(TYPES.map((t) => t.type)).toContain('nacht');
    expect(typeOf('nacht')).toBe(nacht);
  });
  it('every kind of goal gets the three steps, counted back from the start', () => {
    for (const kind of ['race', 'trip', 'free']) {
      const g = withSteps(goal({ kind, tripId: '' }));
      expect(g.steps.map((s) => s.key).sort()).toEqual(['hotels', 'plaetze', 'wetter']);
      expect(g.steps.every((s) => s.type === 'nacht' && !s.done)).toBe(true);
    }
    const g = withSteps(goal());
    expect(g.steps.map((s) => dueOf(g, s)).sort()).toEqual(['2027-04-24', '2027-05-01', '2027-05-12']);
  });
  it('a free goal without a start has steps without a day until the start is set', () => {
    const g = withSteps(newGoal({ title: 'Frei' }, { id: 'f', now: 'x' }));
    expect(g.steps).toHaveLength(3);
    expect(g.steps.every((s) => dueOf(g, s) === '')).toBe(true);
  });
  it('the offsets fall in a sensible order', () => {
    const o = (k) => STEPS.find((s) => s.key === k).offset;
    expect(o('plaetze')).toBeGreaterThan(o('hotels'));
    expect(o('hotels')).toBeGreaterThan(o('wetter'));
  });
});

describe('ticking by itself from the nights of the race', () => {
  const g = withSteps(goal());

  it('the nights come from the times of the race, no route needed', () => {
    expect(nightsOf(g, ctx(stored([]))).expected).toEqual([0, 1]);
  });
  it('nothing ticks while no night has a place', () => {
    expect(applyAuto(g, [nacht], ctx(stored([])))).toBe(g);
    expect(applyAuto(g, [nacht], ctx(stored([{ n: 0, kind: 'bivy', place: '' }])))).toBe(g);
  });
  it('one place of two nights does not tick «places»; both do', () => {
    expect(doneKeys(applyAuto(g, [nacht], ctx(stored([{ n: 0, kind: 'bivy', place: 'Forest hut' }]))))).toEqual([]);
    const both = applyAuto(g, [nacht], ctx(stored([{ n: 0, kind: 'bivy', place: 'Forest hut' }, { n: 1, kind: 'hotel', place: 'Hotel Test' }])));
    expect(byKey(both, 'plaetze')).toMatchObject({ done: true, by: 'auto' });
  });
  it('«ride through» counts as decided without a place', () => {
    const r = applyAuto(g, [nacht], ctx(stored([{ n: 0, kind: 'through' }, { n: 1, kind: 'through' }])));
    expect(doneKeys(r)).toEqual(['plaetze']);
  });
  it('«hotels» ticks when every hotel night has a place; no hotel night means unknown, the step stays by hand', () => {
    const open = [{ n: 0, kind: 'hotel', place: '' }, { n: 1, kind: 'bivy', place: 'Hut' }];
    expect(byKey(applyAuto(g, [nacht], ctx(stored(open))), 'hotels').done).toBe(false);
    const placed = [{ n: 0, kind: 'hotel', place: 'Hotel Test' }, { n: 1, kind: 'bivy', place: 'Hut' }];
    expect(doneKeys(applyAuto(g, [nacht], ctx(stored(placed))))).toEqual(['hotels', 'plaetze']);
    const none = [{ n: 0, kind: 'bivy', place: 'Hut' }, { n: 1, kind: 'bivy', place: 'Hut 2' }];
    expect(byKey(applyAuto(g, [nacht], ctx(stored(none))), 'hotels').done).toBe(false);
    expect(nightDone('hotels', nightsOf(g, ctx(stored(none))))).toBeNull();
  });
  it('«weather» never ticks by itself', () => {
    const all = [{ n: 0, kind: 'hotel', place: 'A' }, { n: 1, kind: 'hotel', place: 'B' }];
    expect(byKey(applyAuto(g, [nacht], ctx(stored(all))), 'wetter').done).toBe(false);
    expect(nacht.auto(g, { key: 'wetter' }, ctx(stored(all)))).toBeNull();
  });
  it('a tick is not taken back when the place is deleted; an untick by the user stays', () => {
    const full = stored([{ n: 0, kind: 'bivy', place: 'A' }, { n: 1, kind: 'bivy', place: 'B' }]);
    const ticked = applyAuto(g, [nacht], ctx(full));
    expect(applyAuto(ticked, [nacht], ctx(stored([])))).toBe(ticked);
    const unticked = setDone(ticked, byKey(ticked, 'plaetze').id, false);
    expect(byKey(applyAuto(unticked, [nacht], ctx(full)), 'plaetze').done).toBe(false);
  });
  it('without a start in the race the start of the goal is used', () => {
    const r = { targetH: 50, nights: [{ n: 0, kind: 'bivy', place: 'A' }, { n: 1, kind: 'bivy', place: 'B' }] };
    expect(nightsOf(g, ctx(r)).expected).toEqual([0, 1]);
    expect(doneKeys(applyAuto(g, [nacht], ctx(r)))).toEqual(['plaetze']);
  });
  it('without a start anywhere the written nights decide', () => {
    const free = withSteps(goal({ start: '' }));
    const r = { nights: [{ n: 0, kind: 'bivy', place: 'A' }] };
    expect(nightsOf(free, ctx(r)).expected).toEqual([]);
    expect(doneKeys(applyAuto(free, [nacht], ctx(r)))).toEqual(['plaetze']);
    expect(applyAuto(free, [nacht], ctx({ nights: [] }))).toBe(free);
  });
  it('a renamed or moved step keeps ticking, because the key stays', () => {
    const renamed = { ...g, steps: g.steps.map((s) => (s.key === 'plaetze' ? { ...s, title: 'Meine Nächte', due: '2027-01-01' } : s)) };
    const full = stored([{ n: 0, kind: 'bivy', place: 'A' }, { n: 1, kind: 'bivy', place: 'B' }]);
    expect(byKey(applyAuto(renamed, [nacht], ctx(full)), 'plaetze').done).toBe(true);
  });
  it('the strip «x of 3 sorted» counts the three steps', () => {
    const r = applyAuto(g, [nacht], ctx(stored([{ n: 0, kind: 'hotel', place: 'A' }, { n: 1, kind: 'hotel', place: 'B' }])));
    expect(typeProgress(r, 'nacht', today)).toMatchObject({ done: 2, total: 3 });
  });
});

describe('free goals and broken data', () => {
  it('a goal without a trip: nothing ticks by itself, the user ticks by hand', () => {
    const free = withSteps(goal({ kind: 'free', tripId: '' }));
    expect(applyAuto(free, [nacht], ctx(stored([{ n: 0, kind: 'bivy', place: 'A' }])))).toBe(free);
    expect(doneKeys(setDone(free, free.steps[0].id, true))).toEqual([free.steps[0].key]);
  });
  it('no race, a broken record or a renamed type never throws and answers unknown', () => {
    const g = withSteps(goal());
    expect(applyAuto(g, [nacht], {})).toBe(g);
    expect(applyAuto(g, [nacht], { races: { other: stored([]) } })).toBe(g);
    expect(applyAuto(g, [nacht], { races: { trip1: 'kaputt' } })).toBe(g);
    expect(applyAuto(g, [nacht], ctx({ nights: 'kaputt', start: 5 }))).toBe(g);
    expect(applyAuto(g, [nacht], ctx(stored([null, 7, 'x'])))).toBe(g);
    expect(nacht.auto(g, { type: 'nacht' }, ctx(stored([])))).toBeNull();
    expect(nightDone('nope', { expected: [], own: [] })).toBeNull();
    expect(nightDone('plaetze', null)).toBeNull();
  });
});

describe('link, texts, template', () => {
  it('the link leads to the strategy of the race, else to the list of races', () => {
    expect(nacht.link(goal())).toBe('#/race/trip1/strategy');
    expect(nacht.link(goal({ tripId: 'a b' }))).toBe('#/race/a%20b/strategy');
    expect(nacht.link(goal({ tripId: '' }))).toBe('#/race');
  });
  it('every title, note and the label has German', () => {
    for (const s of STEPS) {
      expect(DE[s.title], s.title).toBeTruthy();
      expect(DE[s.note], s.note).toBeTruthy();
    }
    expect(DE[nacht.label]).toBe('Nachtplan');
  });
  it('the steps stay in a template (offsets), and no tick is carried over', () => {
    const t = templateOf(setDone(withSteps(goal()), 's1', true));
    expect(t).toHaveLength(3);
    expect(t.every((x) => x.type === 'nacht' && Number.isFinite(x.offset))).toBe(true);
  });
});
