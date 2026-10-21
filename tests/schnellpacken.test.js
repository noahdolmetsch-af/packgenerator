import { describe, it, expect } from 'vitest';
import { CLOTHING_CATEGORIES } from '../src/lib/gear.js';
import { twoOf, whoCarries, switchCarry, splitWeights, clothesOf, inWash, washDay, washSrc, morningOf, startMorning, packTimeOf, startClock, stopClock, packTrend, minutesOf } from '../src/lib/schnellpacken/spack.js';

// Paket SP «Schneller packen» (Noah 20.10.2026): fictional data only
const shirt = { id: 'c1', name: 'Jersey', category: CLOTHING_CATEGORIES[0], weightG: 150 };
const tent = { id: 'g1', name: 'Tent', category: 'Camping', weightG: 1200 };
const phone = { id: 'g2', name: 'Phone', category: 'Electronics' };
const byId = { c1: shirt, g1: tent, g2: phone };
const trip = { id: 't1', startDate: '2026-08-10', entries: [{ itemId: 'c1', qty: 2 }, { itemId: 'g1' }, { itemId: 'g2' }, { itemId: 'gone' }] };

describe('two people (1124)', () => {
  it('nobody else by default; switching moves an item and back', () => {
    expect(twoOf(trip)).toBeNull();
    expect(whoCarries(trip, 'g1')).toBe('me');
    const two = switchCarry({ ...trip, two: { name: 'Lea', carry: {} } }, 'g1');
    expect(two).toEqual({ name: 'Lea', carry: { g1: 'them' } });
    expect(switchCarry({ ...trip, two }, 'g1').carry).toEqual({});
  });
  it('the weight per person, items without a weight counted apart', () => {
    const t = { ...trip, two: { name: 'Lea', carry: { g1: 'them' } } };
    expect(splitWeights(t, byId)).toEqual({ me: 300, them: 1200, unweighed: 1 });
  });
});

describe('laundry (1125)', () => {
  it('only clothes; the ones in the wash', () => {
    expect(clothesOf(trip, byId).map((r) => r.item.id)).toEqual(['c1']);
    expect(inWash(trip, byId)).toEqual([]);
    expect(inWash(trip, { ...byId, c1: { ...shirt, laundry: true } }).map((i) => i.id)).toEqual(['c1']);
  });
  it('the reminder two days before, today when that is past, none after the start', () => {
    expect(washDay(trip, '2026-08-01')).toBe('2026-08-08');
    expect(washDay(trip, '2026-08-09')).toBe('2026-08-09');
    expect(washDay(trip, '2026-08-11')).toBeNull();
    expect(washDay({ id: 'x' }, '2026-08-01')).toBeNull();
    expect(washDay({ startDate: '2026-03-01' }, '2026-02-20')).toBe('2026-02-27');
    expect(washSrc(trip)).toBe('laundry:t1');
  });
});

describe('the morning list (1126)', () => {
  it('marked items, only on the start day', () => {
    expect(morningOf(trip, { ...byId, g2: { ...phone, morning: true } }).map((r) => r.item.id)).toEqual(['g2']);
    expect(startMorning(trip, '2026-08-10')).toBe(true);
    expect(startMorning(trip, '2026-08-11')).toBe(false);
    expect(startMorning({ ...trip, finished: true }, '2026-08-10')).toBe(false);
  });
});

describe('packing time (1127)', () => {
  it('start, stop and adding up', () => {
    expect(packTimeOf({})).toEqual({ start: null, ms: null });
    const started = { ...trip, ...startClock(trip, new Date('2026-08-09T18:00:00Z')) };
    expect(stopClock(trip)).toBeNull();
    const stopped = { ...trip, ...stopClock(started, new Date('2026-08-09T18:20:00Z').getTime()) };
    expect(packTimeOf(stopped)).toEqual({ start: null, ms: 20 * 6e4 });
    const again = { ...stopped, ...startClock(stopped, new Date('2026-08-10T06:00:00Z')) };
    expect(packTimeOf({ ...again, ...stopClock(again, new Date('2026-08-10T06:05:00Z').getTime()) }).ms).toBe(25 * 6e4);
  });
  it('the trend against the last earlier trip', () => {
    const a = { id: 'a', title: 'Spring', startDate: '2026-05-01', packTime: { ms: 40 * 6e4 } };
    const b = { id: 'b', title: 'Summer', startDate: '2026-07-01', packTime: { ms: 30 * 6e4 } };
    const c = { id: 'c', title: 'Winter', startDate: '2026-12-01', packTime: { ms: 10 * 6e4 } };
    const now = { ...trip, packTime: { ms: 25 * 6e4 } };
    expect(packTrend(now, [a, b, c, now])).toEqual({ ms: 30 * 6e4, title: 'Summer', diffMs: -5 * 6e4 });
    expect(packTrend(trip, [a]).diffMs).toBeNull();
    expect(packTrend(trip, [])).toBeNull();
    expect(minutesOf(0)).toBe(0);
    expect(minutesOf(10_000)).toBe(1);
  });
});
