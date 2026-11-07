// «Nebelmeer-Tage» (Noah 06.11.2026 «4a»): the days above the fog, kept on the Sammel-Wand.
import { describe, it, expect } from 'vitest';
import { cleanDay, daysOf, valueOf, hasDay, addDay, patchDay, removeDay, winterOf, winterCount, MAX_DAYS } from '../src/lib/sammlung/nebelmeer.js';

describe('cleanDay', () => {
  it('keeps the known fields and rounds the height', () => {
    expect(cleanDay({ id: 'a', date: '2026-11-06', title: '  Hochplateau ', topM: 812.4, tripId: 't1', photoId: 'p1', extra: 1 })).toEqual({ id: 'a', date: '2026-11-06', title: 'Hochplateau', topM: 812, tripId: 't1', photoId: 'p1' });
  });
  it('drops what is not a day and wrong heights', () => {
    expect(cleanDay(null)).toBeNull();
    expect(cleanDay({ date: '6.11.2026' })).toBeNull();
    expect(cleanDay({ date: '2026-11-06', topM: -5 }).topM).toBeNull();
    expect(cleanDay({ date: '2026-11-06', topM: 'x' }).topM).toBeNull();
    expect(cleanDay({ date: '2026-11-06' }).title).toBe('');
  });
});

describe('daysOf / valueOf', () => {
  it('sorts newest first and ignores broken entries', () => {
    const v = { days: [{ id: 'a', date: '2026-01-02' }, { date: 'x' }, { id: 'b', date: '2026-12-01' }] };
    expect(daysOf(v).map((d) => d.id)).toEqual(['b', 'a']);
    expect(daysOf(undefined)).toEqual([]);
    expect(daysOf({ days: 'no' })).toEqual([]);
  });
  it('keeps at most MAX_DAYS', () => {
    const many = Array.from({ length: MAX_DAYS + 20 }, (_, i) => ({ id: `d${i}`, date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}` }));
    expect(daysOf({ days: many })).toHaveLength(MAX_DAYS);
  });
  it('valueOf round-trips', () => {
    const days = daysOf({ days: [{ id: 'a', date: '2026-11-06', title: 'X' }] });
    expect(daysOf(valueOf(days))).toEqual(days);
  });
});

describe('add, change, remove', () => {
  const base = daysOf({ days: [{ id: 'a', date: '2026-11-01', title: 'A', photoId: 'p' }] });
  it('adds a day and finds it', () => {
    const list = addDay(base, { date: '2026-11-06', title: 'Neu' }, 'n');
    expect(list.map((d) => d.id)).toEqual(['n', 'a']);
    expect(hasDay(list, '2026-11-06')).toBe(true);
    expect(hasDay(list, '2026-11-07')).toBe(false);
  });
  it('a bad day changes nothing', () => {
    expect(addDay(base, { date: 'nope' })).toBe(base);
  });
  it('changes title, date and photo link, nothing else', () => {
    const list = patchDay(base, 'a', { title: 'B', date: '2026-10-30', photoId: null });
    expect(list[0]).toEqual({ id: 'a', date: '2026-10-30', title: 'B', topM: null, tripId: null, photoId: null });
    expect(patchDay(base, 'a', { date: 'bad' })[0].date).toBe('2026-11-01');
    expect(patchDay(base, 'zzz', { title: 'B' })).toEqual(base);
  });
  it('removes by id', () => {
    expect(removeDay(base, 'a')).toEqual([]);
    expect(removeDay(base, 'zzz')).toEqual(base);
  });
});

describe('winter', () => {
  it('October to March belong to the winter that starts in October', () => {
    expect(winterOf('2026-10-01')).toBe(2026);
    expect(winterOf('2026-12-31')).toBe(2026);
    expect(winterOf('2027-01-01')).toBe(2026);
    expect(winterOf('2027-03-31')).toBe(2026);
    expect(winterOf('2027-04-01')).toBeNull();
    expect(winterOf('2026-09-30')).toBeNull();
    expect(winterOf('bad')).toBeNull();
  });
  it('counts the days of this winter, in summer the winter that just ended', () => {
    const days = daysOf({ days: [{ id: 'a', date: '2026-11-06' }, { id: 'b', date: '2027-01-10' }, { id: 'c', date: '2025-12-01' }, { id: 'd', date: '2026-07-01' }] });
    expect(winterCount(days, '2026-11-20')).toEqual({ winter: 2026, n: 2 });
    expect(winterCount(days, '2027-02-01')).toEqual({ winter: 2026, n: 2 });
    expect(winterCount(days, '2027-06-01')).toEqual({ winter: 2026, n: 2 });
    expect(winterCount(days, '2026-07-15')).toEqual({ winter: 2025, n: 1 });
    expect(winterCount([], '2026-11-20')).toEqual({ winter: 2026, n: 0 });
  });
});
