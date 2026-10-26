// Paket «Touren b» (996 Ideen 50–58): the pure parts.
import { describe, it, expect } from 'vitest';
import { packStories, storyOff } from '../src/lib/tourenb/stories.js';
import { breakCheckText, withBreakCheck, BREAK_CHECKS } from '../src/lib/tourenb/breakcheck.js';
import { BREAK_KINDS, breakdownsOf } from '../src/lib/tourlernen/tourlernen.js';
import { untilOf, ruleHolds, untilOver, setUntil, rulesOver, ruleOff, seasonEnd } from '../src/lib/tourenb/ruleuntil.js';

const voice = (id) => ({ id, src: 'data:audio/webm;base64,AAAA', s: 12, at: '2026-10-26T10:00:00Z' });

describe('51 little stories while packing', () => {
  const items = { a: { id: 'a', name: 'Pump', inputs: { voices: [voice('v1')] } }, b: { id: 'b', name: 'Tube' }, c: { id: 'c', name: 'Tool', inputs: { voices: [voice('v2')] } } };
  const trip = { id: 't', entries: [{ itemId: 'b' }, { itemId: 'a' }, { itemId: 'c' }, { itemId: 'a' }] };
  it('lists the items on the trip with a voice note, in list order, once', () => {
    expect(packStories(trip, items).map((s) => s.item.id)).toEqual(['a', 'c']);
  });
  it('leaves out what was taken out for this trip, and brings it back', () => {
    const off = storyOff(trip, 'a');
    expect(packStories({ ...trip, storiesOff: off }, items).map((s) => s.item.id)).toEqual(['c']);
    expect(storyOff({ storiesOff: off }, 'a', true)).toEqual([]);
  });
});

describe('53 a check from a real breakdown', () => {
  it('has a check for every kind of breakdown', () => {
    for (const k of BREAK_KINDS) expect(BREAK_CHECKS[k.key]).toBeTruthy();
  });
  it('suggests the check of the kind with the part', () => {
    expect(breakCheckText('flat', ' rear tube ')).toBe('Check the tyres and the sealant: rear tube');
    expect(breakCheckText('nope')).toBe(BREAK_CHECKS.other);
  });
  it('adds the row to the saved standard once, or starts from the suggestion', () => {
    const a = withBreakCheck(null, 'bikepacking', 'Kette prüfen', { now: 1 });
    expect(a.list.at(-1)).toEqual({ id: a.id, label: 'Kette prüfen' });
    expect(a.list.length).toBeGreaterThan(1);
    const b = withBreakCheck(a.list, 'bikepacking', 'kette prüfen ', { now: 2 });
    expect(b.list).toHaveLength(a.list.length);
    expect(b.id).toBe(a.id);
    expect(withBreakCheck([{ id: 'x', label: 'X', done: true }], 'ski', '').list).toEqual([{ id: 'x', label: 'X' }]);
  });
  it('the breakdown keeps the id of its check', () => {
    expect(breakdownsOf({ breakdowns: [{ id: 'b1', kind: 'flat', checkId: 'std-break-1' }] })[0].checkId).toBe('std-break-1');
  });
});

describe('50 a rule with an end', () => {
  const trips = [
    { id: 't1', startDate: '2026-10-20', days: 2 },
    { id: 't2', startDate: '2026-10-30', days: 1 },
    { id: 't3', startDate: '2026-10-01', days: 1, finished: false },
  ];
  it('holds always, for one tour, or until a day', () => {
    expect(ruleHolds(null, trips[0])).toBe(true);
    expect(ruleHolds({ tripId: 't2' }, trips[1])).toBe(true);
    expect(ruleHolds({ tripId: 't2' }, trips[0])).toBe(false);
    expect(ruleHolds({ date: '2026-10-25' }, trips[0])).toBe(true);
    expect(ruleHolds({ date: '2026-10-25' }, trips[1])).toBe(false);
    expect(untilOf({ date: 'soon' })).toBe(null);
  });
  it('is over after the tour or the day', () => {
    expect(untilOver({ tripId: 't1' }, trips, '2026-10-21')).toBe(false);
    expect(untilOver({ tripId: 't1' }, trips, '2026-10-22')).toBe(true);
    expect(untilOver({ tripId: 'gone' }, trips, '2026-10-22')).toBe(true);
    expect(untilOver({ date: '2026-10-25' }, trips, '2026-10-25')).toBe(false);
    expect(untilOver({ date: '2026-10-25' }, trips, '2026-10-26')).toBe(true);
  });
  it('stores, asks and answers on the block record', () => {
    let v = setUntil([{ key: 'rain', name: 'Nass' }], 'rain', { tripId: 't1' });
    expect(v).toEqual([{ key: 'rain', name: 'Nass', until: { tripId: 't1' } }]);
    v = setUntil(v, 'cold', { date: '2027-04-30' });
    expect(rulesOver(v, trips, '2026-10-26').map((r) => r.key)).toEqual(['rain']);
    expect(setUntil(v, 'cold', null).some((s) => s.key === 'cold')).toBe(false);
    const off = ruleOff(v, 'rain');
    expect(off.find((s) => s.key === 'rain')).toEqual({ key: 'rain', name: 'Nass', rule: { on: false } });
    expect(rulesOver(off, trips, '2026-10-26')).toEqual([]);
  });
  it('offers the end of the season', () => {
    expect(seasonEnd('2026-06-10')).toEqual({ key: 'summer', date: '2026-09-30' });
    expect(seasonEnd('2026-10-26')).toEqual({ key: 'winter', date: '2027-04-30' });
    expect(seasonEnd('2026-02-01')).toEqual({ key: 'winter', date: '2026-04-30' });
  });
});
