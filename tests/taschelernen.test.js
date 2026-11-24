// «Tasche lernen» (Noah 23.11.2026 «3a»): an item you keep putting into another bag than its usual one gets a suggestion.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { learnedBags, withOff, LEARN_MIN } from '../src/lib/pack/taschelernen.js';

const P = 'test_data_gtp_';
const item = (id, f = {}) => ({ id, name: `${P}${id}`, ownership: 'owned', defaultBag: 'seat', ...f });
const SETUP = { seat: 'b1', frame: 'b2', top: 'b3' };
const trip = (id, slot, f = {}) => ({ id, startDate: `2026-0${Number(id.slice(1))}-10`, setup: SETUP, entries: [{ itemId: 'bar', slot, qty: 1 }], ...f });
const done = (...ids) => ids.map((tripId) => ({ tripId, status: 'done' }));
const open = { id: 'open', startDate: '2026-11-30', setup: SETUP, entries: [{ itemId: 'bar', slot: 'seat', qty: 1 }] };
const BAR = item('bar');

describe('learnedBags', () => {
  it('suggests the place you moved the item to on three finished trips', () => {
    const trips = [trip('t1', 'top'), trip('t2', 'top'), trip('t3', 'top')];
    const r = learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2', 't3') });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: 'bar', slot: 'top', n: 3, of: 3 });
  });
  it(`needs ${LEARN_MIN} trips`, () => {
    const trips = [trip('t1', 'top'), trip('t2', 'top')];
    expect(learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2') })).toEqual([]);
  });
  it('trips without a finished debrief do not count', () => {
    const trips = [trip('t1', 'top'), trip('t2', 'top'), trip('t3', 'top')];
    expect(learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2') })).toEqual([]);
  });
  it('an item that was only in the usual bag, or mixed places, gives nothing', () => {
    const trips = [trip('t1', 'seat'), trip('t2', 'top'), trip('t3', 'frame'), trip('t4', 'top')];
    expect(learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2', 't3', 't4') })).toEqual([]);
  });
  it('a trip without a bag at the usual place does not count as moved by you', () => {
    // no seat bag: the list puts the item into the first bag it finds, which is the seat fallback → frame is not a choice
    const setup = { frame: 'b2' };
    const trips = ['t1', 't2', 't3'].map((id) => trip(id, 'frame', { setup }));
    expect(learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2', 't3') })).toEqual([]);
  });
  it('worn places, other items and the open trip itself are left out', () => {
    const trips = [trip('t1', 'body'), trip('t2', 'body'), trip('t3', 'body'), { ...trip('open', 'top') }];
    expect(learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2', 't3', 'open') })).toEqual([]);
  });
  it('«Do not ask again» keeps the item out', () => {
    const trips = [trip('t1', 'top'), trip('t2', 'top'), trip('t3', 'top')];
    expect(learnedBags({ trip: open, items: [BAR], trips, debriefs: done('t1', 't2', 't3'), off: withOff([], 'bar') })).toEqual([]);
  });
  it('an item that already has the place as its usual bag gives nothing', () => {
    const trips = [trip('t1', 'top'), trip('t2', 'top'), trip('t3', 'top')];
    expect(learnedBags({ trip: open, items: [item('bar', { defaultBag: 'top' })], trips, debriefs: done('t1', 't2', 't3') })).toEqual([]);
  });
  it('withOff never lists an id twice', () => {
    expect(withOff(['a'], 'a')).toEqual(['a']);
    expect(withOff(null, 'b')).toEqual(['b']);
  });
});
