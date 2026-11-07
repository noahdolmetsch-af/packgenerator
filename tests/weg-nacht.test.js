// «Weg zum Ziel» › Schrittart «Nachtplan»: the suggested steps, ticking itself from the nights of a race, the nights
// written by hand (a free goal), the link, the German texts and the way it works with the frame. Fictional data.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { RACES_KEY } from '../src/lib/race/race.js';
import {
  newGoal, addGoal, wegOf, addSteps, applyAuto, setDone, timeline, typeProgress, templateOf,
} from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import nachtplan, { nightsOf, handNights, addNight, editNight, removeNight, moveNight, DECIDE } from '../src/lib/weg/types/nacht.js';
import DE from '../src/lib/i18n/de/weg-nacht.js';

const today = '2026-11-07';
const ids = (p) => { let n = 0; return () => `${p}${++n}`; };
const race = newGoal({ title: 'Testrennen', kind: 'race', start: '2027-06-12', tripId: 'trip-1' }, { id: 'g1', now: 'x' });
const free = newGoal({ title: 'Offener Sommer', kind: 'free' }, { id: 'g2', now: 'x' });
const withSteps = (g, p = 's') => addSteps(g, suggestions(g, [nachtplan]).map((s) => ({ ...s, type: s.type })), { ids: ids(p) });

const trips = [{ id: 'trip-1', title: 'Testrennen', days: 4, startDate: '2027-06-12' }];
const dataWith = (nights) => ({ trips, races: { 'trip-1': { nights } } });
const ctxWith = (nights) => ({ nacht: dataWith(nights) });

describe('registered and suggested', () => {
  it('is in the registry after the own step and can be found', () => {
    expect(TYPES[0].type).toBe('own');
    expect(TYPES.map((t) => t.type)).toContain('nacht');
    expect(typeOf('nacht')).toBe(nachtplan);
    expect(nachtplan).toMatchObject({ label: 'Night plan', icon: 'moon' });
  });
  it('a race with a trip gets the choice per night; every other goal the list by hand', () => {
    const r = nachtplan.defaults(race);
    expect(r.map((s) => s.title)).toEqual(['Decide where you sleep each night', 'Book the beds you need', 'Look at the beds along the route', 'Play one night through']);
    expect(r.map((s) => s.key)).toEqual([DECIDE, undefined, 'spots', 'sheet']);
    expect(r[0]).toMatchObject({ key: DECIDE, offset: 28 });
    expect(r.every((s) => Number.isFinite(s.offset))).toBe(true);
    const f = nachtplan.defaults(free);
    expect(f.map((s) => s.title)).toEqual(['Write down your nights', 'Book the beds you need']);
    expect(f.some((s) => s.key)).toBe(false);
    expect(nachtplan.defaults(newGoal({ title: 'Tour', kind: 'trip', start: '2027-05-01' }, { id: 'g3', now: 'x' }))[0].title).toBe('Write down your nights');
    expect(nachtplan.defaults(null)).toHaveLength(2);
  });
  it('the steps land on days counted back from the start and carry the type', () => {
    const g = withSteps(race);
    expect(g.steps.map((s) => s.type)).toEqual(['nacht', 'nacht', 'nacht', 'nacht']);
    expect(timeline(g, today).map((r) => r.due)).toEqual(['2027-05-15', '2027-05-22', '2027-05-29', '2027-06-02']);
    expect(typeProgress(g, 'nacht', today)).toMatchObject({ done: 0, total: 4 });
  });
  it('a free goal without a start has steps without a day', () => {
    expect(timeline(withSteps(free), today).every((r) => r.due === '' && r.phase === 'open')).toBe(true);
  });
});

describe('the nights of a race', () => {
  it('counts the nights from the days of the trip and the choices of your own', () => {
    const n = nightsOf(race, null, dataWith([{ n: 1, kind: 'hotel', place: ' Gasthof Test ' }, { n: 2, kind: 'bivy' }, { n: 3, kind: 'nonsense' }]));
    expect(n).toMatchObject({ source: 'race', needed: 3, decided: 2 });
    expect(n.rows).toEqual([
      { n: 1, kind: 'hotel', place: 'Gasthof Test', decided: true },
      { n: 2, kind: 'bivy', place: '', decided: true },
      { n: 3, kind: '', place: '', decided: false },
    ]);
  });
  it('the plan may know better than the days of the trip (nightCounts); a choice for a night beyond the plan does not count', () => {
    const data = { ...dataWith([{ n: 1, kind: 'through' }, { n: 5, kind: 'hotel' }]), nightCounts: { 'trip-1': 2 } };
    expect(nightsOf(race, null, data)).toMatchObject({ needed: 2, decided: 1 });
  });
  it('a one-day race has no night, a goal without race data falls back to the list by hand', () => {
    const one = { trips: [{ id: 'trip-1', days: 1 }], races: { 'trip-1': {} } };
    expect(nightsOf(race, null, one)).toMatchObject({ source: 'race', needed: 0, decided: 0 });
    expect(nightsOf(race, { nights: [{ id: 'a', place: 'Hütte' }] }, {})).toMatchObject({ source: 'hand', needed: 1, decided: 1 });
    expect(nightsOf(free, null, dataWith([]))).toMatchObject({ source: 'hand', needed: 0 });
  });
  it('a trip that is a race by its event flag counts too, without a stored race', () => {
    const t = [{ id: 'trip-1', days: 3, event: true }];
    expect(nightsOf(race, null, { trips: t, races: {} })).toMatchObject({ source: 'race', needed: 2, decided: 0 });
    expect(nightsOf(race, null, { trips: [{ id: 'trip-1', days: 3 }], races: {} }).source).toBe('hand');
  });
});

describe('ticking by itself', () => {
  const g = withSteps(race);
  const decide = g.steps[0];
  it('ticks when every night has a choice, says false while some are open, null when it cannot know', () => {
    expect(nachtplan.auto(race, decide, ctxWith([{ n: 1, kind: 'hotel' }, { n: 2, kind: 'bivy' }, { n: 3, kind: 'through' }]))).toBe(true);
    expect(nachtplan.auto(race, decide, ctxWith([{ n: 1, kind: 'hotel' }]))).toBe(false);
    expect(nachtplan.auto(race, decide, { nacht: { trips: [{ id: 'trip-1', days: 1 }], races: { 'trip-1': {} } } })).toBe(false);
    expect(nachtplan.auto(race, decide, {})).toBeNull();
    expect(nachtplan.auto(race, g.steps[1], ctxWith([{ n: 1, kind: 'hotel' }, { n: 2, kind: 'bivy' }, { n: 3, kind: 'through' }]))).toBeNull();
  });
  it('works with applyAuto: only the decide step is ticked, a rename does not break it, an untick is kept, nothing is taken back', () => {
    const all = ctxWith([{ n: 1, kind: 'hotel' }, { n: 2, kind: 'bivy' }, { n: 3, kind: 'through' }]);
    const r = applyAuto(g, TYPES, all);
    expect(r.steps.map((s) => s.done)).toEqual([true, false, false, false]);
    expect(r.steps[0].by).toBe('auto');
    const renamed = applyAuto({ ...g, steps: g.steps.map((s, i) => (i ? s : { ...s, title: 'Meine Nächte' })) }, TYPES, all);
    expect(renamed.steps[0].done).toBe(true);
    expect(applyAuto(r, TYPES, ctxWith([]))).toBe(r);
    expect(applyAuto(setDone(r, r.steps[0].id, false), TYPES, all).steps[0].done).toBe(false);
  });
  it('a free goal never ticks by itself, even with every night written', () => {
    let f = withSteps(free, 'f');
    f = addNight(f, 'f1', { place: 'Zelt am See' }, { id: 'n1' });
    expect(nachtplan.auto(f, f.steps[0], {})).toBeNull();
    expect(applyAuto(f, TYPES, {})).toBe(f);
  });
});

describe('nights by hand: add, rename, delete, order', () => {
  const base = withSteps(free, 'h');
  const step = 'h1';
  const three = () => {
    let g = addNight(base, step, { place: ' Zelt am See ', note: 'Wasser dabei' }, { id: 'a' });
    g = addNight(g, step, { place: 'Hütte Test' }, { id: 'b' });
    return addNight(g, step, {}, { id: 'c' });
  };
  it('adds nights (trimmed, empty allowed) and reads them safely', () => {
    const g = three();
    expect(handNights(g.steps[0])).toEqual([{ id: 'a', place: 'Zelt am See', note: 'Wasser dabei' }, { id: 'b', place: 'Hütte Test', note: '' }, { id: 'c', place: '', note: '' }]);
    expect(nightsOf(g, g.steps[0], {})).toMatchObject({ source: 'hand', needed: 3, decided: 2 });
    expect(handNights({ nights: [null, { place: 'ohne Id' }, 'x'] })).toEqual([]);
    expect(handNights(undefined)).toEqual([]);
    expect(addNight(base, step, {}).steps[0].nights[0].id).toMatch(/^wn-/);
  });
  it('renames, deletes and orders; other steps stay as they are', () => {
    let g = three();
    g = editNight(g, step, 'c', { place: 'Bahnhofsdach' });
    g = editNight(g, step, 'a', { note: '' });
    expect(handNights(g.steps[0]).map((n) => [n.id, n.place, n.note])).toEqual([['a', 'Zelt am See', ''], ['b', 'Hütte Test', ''], ['c', 'Bahnhofsdach', '']]);
    expect(handNights(moveNight(g, step, 2, 0).steps[0]).map((n) => n.id)).toEqual(['c', 'a', 'b']);
    expect(handNights(moveNight(g, step, 0, 7).steps[0]).map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(handNights(removeNight(g, step, 'b').steps[0]).map((n) => n.id)).toEqual(['a', 'c']);
    expect(removeNight(g, step, 'b').steps[1]).toBe(g.steps[1]);
    expect(handNights(editNight(g, 'unknown', 'a', { place: 'x' }).steps[0]).map((n) => n.place)).toEqual(['Zelt am See', 'Hütte Test', 'Bahnhofsdach']);
  });
  it('the nights survive the store and stay in the step', () => {
    const g = three();
    const w = wegOf(JSON.parse(JSON.stringify(addGoal(wegOf(null), g))));
    expect(handNights(w.goals[0].steps[0]).map((n) => n.place)).toEqual(['Zelt am See', 'Hütte Test', '']);
  });
});

describe('load reads the races and the trips from the database', () => {
  it('gives what auto needs, an empty database gives empty lists, and auto then ticks from it', async () => {
    const db = createDb('nacht-1');
    expect(await nachtplan.load(db)).toEqual({ races: {}, trips: [] });
    await db.trips.put({ id: 'trip-1', title: 'Testrennen', days: 3, startDate: '2027-06-12' });
    await db.settings.put({ key: RACES_KEY, value: { races: { 'trip-1': { nights: [{ n: 1, kind: 'bivy' }, { n: 2, kind: 'hotel', place: 'Test' }] } } } });
    const nacht = await nachtplan.load(db);
    expect(nacht.trips.map((t) => t.id)).toEqual(['trip-1']);
    const g = withSteps(race);
    expect(applyAuto(g, TYPES, { nacht }).steps[0]).toMatchObject({ done: true, by: 'auto' });
  });
});

describe('link and template', () => {
  it('a race with a trip leads to the plan of the race, everything else has no link', () => {
    const [decide, , spots, sheet] = withSteps(race).steps;
    expect(nachtplan.link(race, decide)).toBe('#/race/trip-1/plan');
    expect(nachtplan.link(race)).toBe('#/race/trip-1/plan');
    expect(nachtplan.link(race, spots)).toBe('#/race/trip-1/route');
    expect(nachtplan.link(race, sheet)).toBe('#/racecheck/trip-1');
    expect(nachtplan.link(free)).toBe('');
    expect(nachtplan.link({ kind: 'race' })).toBe('');
    expect(nachtplan.link(newGoal({ title: 'Tour', kind: 'trip', start: '2027-05-01', tripId: 't9' }, { id: 'g4', now: 'x' }))).toBe('');
  });
  it('a way saved as a template keeps the type and the offsets', () => {
    const t = templateOf(withSteps(race));
    expect(t.map((s) => [s.type, s.offset])).toEqual([['nacht', 28], ['nacht', 21], ['nacht', 14], ['nacht', 10]]);
  });
});

describe('German texts', () => {
  it('every title, note and the label of the type has its German text', () => {
    const keys = new Set(['Night plan']);
    for (const g of [race, free, null]) for (const s of nachtplan.defaults(g)) { keys.add(s.title); if (s.note) keys.add(s.note); }
    for (const k of keys) expect(DE[k], k).toBeTruthy();
    expect(Object.keys(DE).every((k) => keys.has(k))).toBe(true);
  });
});
