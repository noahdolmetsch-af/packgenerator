// «Gestern nachtragen» (Noah 21.11.2026): the day and the moment of an entry ticked for an earlier day
import { describe, it, expect } from 'vitest';
import { quickDays, pickedDay, pickedTime, momentOf, BACK_MAX } from '../src/lib/flow/nachtragen.js';
import { newEntry } from '../src/lib/flow.js';

const TODAY = '2026-11-10';
const NOW = new Date('2026-11-10T09:00:00+01:00');

describe('quickDays', () => {
  it('is today, yesterday and the day before, also over a month and year end', () => {
    expect(quickDays(TODAY)).toEqual(['2026-11-10', '2026-11-09', '2026-11-08']);
    expect(quickDays('2027-01-01')).toEqual(['2027-01-01', '2026-12-31', '2026-12-30']);
  });
});

describe('pickedDay', () => {
  it('takes a real day from a year ago up to today', () => {
    expect(pickedDay('2026-11-10', TODAY)).toBe('2026-11-10');
    expect(pickedDay('2026-10-01', TODAY)).toBe('2026-10-01');
    expect(pickedDay('2025-11-10', TODAY)).toBe('2025-11-10');
    expect(BACK_MAX).toBe(365);
  });
  it('refuses the future, older than a year, empty, wrong text and days that do not exist', () => {
    expect(pickedDay('2026-11-11', TODAY)).toBeNull();
    expect(pickedDay('2025-11-09', TODAY)).toBeNull();
    expect(pickedDay('', TODAY)).toBeNull();
    expect(pickedDay(null, TODAY)).toBeNull();
    expect(pickedDay('10.11.2026', TODAY)).toBeNull();
    expect(pickedDay('2026-02-31', TODAY)).toBeNull();
  });
});

describe('pickedTime', () => {
  it('takes HH:MM, nothing else', () => {
    expect(pickedTime('07:30')).toBe('07:30');
    expect(pickedTime('23:59')).toBe('23:59');
    expect(pickedTime('24:00')).toBeNull();
    expect(pickedTime('7:30')).toBeNull();
    expect(pickedTime('')).toBeNull();
  });
});

describe('momentOf', () => {
  it('is undefined for today without a time (the entry takes «now»)', () => {
    expect(momentOf(TODAY, '', TODAY, NOW)).toBeUndefined();
  });
  it('sits at noon of an earlier day without a time, and at the time when there is one', () => {
    const noon = momentOf('2026-11-09', '', TODAY, NOW);
    expect(new Date(noon).getHours()).toBe(12);
    expect(new Date(noon).getDate()).toBe(9);
    const at = momentOf('2026-11-09', '07:30', TODAY, NOW);
    expect(new Date(at).getHours()).toBe(7);
    expect(new Date(at).getMinutes()).toBe(30);
  });
  it('lets today have a time, but never one in the future', () => {
    const early = momentOf(TODAY, '06:15', TODAY, NOW);
    expect(new Date(early).getTime()).toBeLessThan(NOW.getTime());
    expect(momentOf(TODAY, '23:00', TODAY, NOW)).toBe(NOW.toISOString());
  });
});

describe('the entry', () => {
  it('counts on the chosen day and keeps the same fields as every entry', () => {
    const act = { id: 'yoga', perTap: 1 };
    const e = newEntry(act, { day: '2026-11-09', at: momentOf('2026-11-09', '07:30', TODAY, NOW), min: 60 });
    expect(e.day).toBe('2026-11-09');
    expect(e.min).toBe(60);
    expect(Object.keys(e).sort()).toEqual(['actId', 'at', 'day', 'id', 'min', 'n']);
  });
});
