// «Weg zum Ziel» › «Test packing» (Noah 05.11.2026 «a»): three steps with standard distances, the dress rehearsal
// ticks by itself once the trip's rehearsal (trip.probe) is done. Fictional trips.
import { describe, it, expect } from 'vitest';
import { newGoal, addSteps, applyAuto, setDone, dueOf, templateOf } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import packen, { PACKEN_OFFSETS, tripOfGoal, probeDone } from '../src/lib/weg/types/packen.js';
import { PROBE_STEPS, stepsFor } from '../src/lib/probe/probe.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = () => { let n = 0; return () => `p${++n}`; };
const goal = (extra = {}) => addSteps(newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-06-12', ...extra }, { id: 'g1', now: 'x' }), suggestions({ start: '2027-06-12' }, [packen]), { ids: ids() });
const trip = (probe, extra = {}) => ({ id: 't1', title: 'Testtour', startDate: '2027-06-12', days: 3, bikeId: 'b1', probe, ...extra });
/** A rehearsal with every step of the trip answered by the user. */
const answeredAll = (tr) => ({ steps: Object.fromEntries(stepsFor(PROBE_STEPS, tr).map((s) => [s.key, { r: 'ok', at: 'x' }])) });

describe('registry', () => {
  it('is in the registry', () => {
    expect(TYPES.map((t) => t.type)).toContain('packen');
    expect(typeOf('packen')).toBe(packen);
  });
  it('suggests three steps: night 21, packing 14, rehearsal 7 days before the start', () => {
    const s = suggestions({ start: '2027-06-12' }).filter((x) => x.type === 'packen');
    expect(s.map((x) => [x.key, x.offset, x.type])).toEqual([['night', 21, 'packen'], ['probe', 14, 'packen'], ['dress', 7, 'packen']]);
    expect(PACKEN_OFFSETS).toEqual({ night: 21, probe: 14, dress: 7 });
  });
  it('the days are counted back from the start, no start gives no day, and the steps stay changeable', () => {
    const g = goal();
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-05-22', '2027-05-29', '2027-06-05']);
    expect(addSteps({ ...g, start: '' }, [], {}).steps.map((s) => dueOf({ ...g, start: '' }, s))).toEqual(['', '', '']);
    expect(templateOf(g).map((s) => [s.type, s.offset])).toEqual([['packen', 21], ['packen', 14], ['packen', 7]]);
  });
});

describe('the trip of a goal', () => {
  const trips = [trip(null), trip(null, { id: 't2', startDate: '2027-07-01' }), trip(null, { id: 't3', startDate: '2027-06-12', skipped: true })];
  it('the named trip wins, else the trip starting on the start day, skipped trips never', () => {
    expect(tripOfGoal({ tripId: 't2', start: '2027-06-12' }, trips).id).toBe('t2');
    expect(tripOfGoal({ start: '2027-06-12' }, trips).id).toBe('t1');
    expect(tripOfGoal({ tripId: 't3' }, trips)).toBeNull();
    expect(tripOfGoal({ start: '' }, trips)).toBeNull();
    expect(tripOfGoal({ start: '2027-06-12' }, null)).toBeNull();
  });
});

describe('the dress rehearsal ticks by itself', () => {
  const tr = trip(null);
  it('done only when every step is answered and the user answered at least one', () => {
    expect(probeDone(trip(null))).toBe(false);
    expect(probeDone(trip({ steps: { offline: { r: 'ok' } } }))).toBe(false);
    expect(probeDone(trip(answeredAll(tr)))).toBe(true);
    // all steps answered, by skipping: still done
    expect(probeDone(trip({ steps: Object.fromEntries(stepsFor(PROBE_STEPS, tr).map((s) => [s.key, { r: 'skip' }])) }))).toBe(true);
  });
  it('a rehearsal the app answered alone (backup, saved route …) is not a rehearsal', () => {
    const ctx = { offlineAt: 'x', backupAt: '2027-06-10T10:00:00Z', today: '2027-06-10', chargeTotal: 1, chargeDone: 1, debriefDone: true };
    expect(probeDone(trip({ steps: {} }), ctx)).toBe(false);
  });
  it('ticks the rehearsal step, never the other two, and never takes a tick back', () => {
    const g = goal();
    const r = applyAuto(g, TYPES, { trips: [trip(answeredAll(tr))] });
    expect(r.steps.map((s) => [s.key, s.done, s.by])).toEqual([['night', false, ''], ['probe', false, ''], ['dress', true, 'auto']]);
    expect(applyAuto(r, TYPES, { trips: [trip(null)] })).toBe(r);
  });
  it('without a trip, with an open rehearsal or after the user unticked, nothing changes', () => {
    const g = goal();
    expect(applyAuto(g, TYPES, { trips: [] })).toBe(g);
    expect(applyAuto(g, TYPES, {})).toBe(g);
    expect(applyAuto(g, TYPES, { trips: [trip({ steps: { offline: { r: 'ok' } } })] })).toBe(g);
    const dress = g.steps.find((s) => s.key === 'dress');
    const unticked = setDone(setDone(g, dress.id, true), dress.id, false);
    expect(applyAuto(unticked, TYPES, { trips: [trip(answeredAll(tr))] })).toBe(unticked);
  });
  it('finds the trip by the goal\'s tripId as well', () => {
    const g = { ...goal(), start: '2027-09-01', tripId: 't1' };
    expect(applyAuto(g, TYPES, { trips: [trip(answeredAll(tr))] }).steps.find((s) => s.key === 'dress').done).toBe(true);
  });
});

describe('load', () => {
  it('reads the trips from the database; auto reads them from ctx.packen', async () => {
    const tr = trip(answeredAll(trip(null)));
    const got = await packen.load({ trips: { toArray: async () => [tr] } });
    expect(got).toEqual({ trips: [tr] });
    const g = goal();
    expect(applyAuto(g, TYPES, { packen: got }).steps.find((s) => s.key === 'dress').done).toBe(true);
  });
});

describe('links', () => {
  it('the rehearsal leads to the trip\'s page, packing to Pack, the night nowhere', () => {
    expect(packen.link({ tripId: 'a b' }, { key: 'dress' })).toBe('#/trip/a%20b/probe');
    expect(packen.link({}, { key: 'dress' })).toBe('#/pack');
    expect(packen.link({}, { key: 'probe' })).toBe('#/pack');
    expect(packen.link({}, { key: 'night' })).toBe('');
  });
});

describe('German', () => {
  it('every text of the type has a German entry', () => {
    const texts = [packen.label, ...packen.defaults().flatMap((d) => [d.title, d.note])];
    expect(texts.filter((t) => !(t in DE))).toEqual([]);
  });
});
