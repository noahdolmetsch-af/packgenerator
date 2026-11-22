// «Sonnen-Ausfahrt» step C (Noah 06.11.2026 «3a»): the quiet extras of the card (week line, shorter ride after short sleep).
import { describe, it, expect } from 'vitest';
import { weakSleep, weekLine, shorter, hours, WEAK_SLEEP } from '../src/lib/wetter/sonnenrest.js';
import { addDays } from '../src/lib/health.js';

const TODAY = '2026-10-09'; // a Friday
// 30 days before «today» with 450 minutes asleep each, so the normal is 450
const base = Array.from({ length: 30 }, (_, i) => ({ date: addDays(TODAY, -30 + i), sleep: { asleepMin: 450 } }));
const withLast = (min, date = TODAY) => [...base, { date, sleep: { asleepMin: min } }];

describe('weakSleep', () => {
  it('is false at your normal and just above the limit', () => {
    expect(weakSleep(withLast(450), TODAY)).toBe(false);
    expect(weakSleep(withLast(Math.ceil(450 * WEAK_SLEEP)), TODAY)).toBe(false);
  });
  it('is true clearly under your normal', () => {
    expect(weakSleep(withLast(330), TODAY)).toBe(true);
    expect(weakSleep(withLast(330, addDays(TODAY, -1)), TODAY)).toBe(true);
  });
  it('is false without a normal, without last night, or when the value is older than yesterday', () => {
    expect(weakSleep([{ date: TODAY, sleep: { asleepMin: 200 } }], TODAY)).toBe(false);
    expect(weakSleep(base, TODAY)).toBe(false);
    expect(weakSleep(withLast(200, addDays(TODAY, -3)), TODAY)).toBe(false);
    expect(weakSleep([], TODAY)).toBe(false);
    expect(weakSleep(undefined, TODAY)).toBe(false);
  });
});

describe('weekLine', () => {
  const rows = [
    { date: '2026-10-04', azm: 90 }, // the Sunday before: not this week
    { date: '2026-10-05', azm: 30 },
    { date: '2026-10-07', azm: 32 },
    { date: '2026-10-09', azm: 0 },
  ];
  it('sums Monday to today against the standard goal', () => {
    expect(weekLine(rows, TODAY)).toEqual({ sum: 62, of: 150, left: 88, reached: false });
  });
  it('uses the goal of the settings', () => {
    expect(weekLine(rows, TODAY, { of: 60 })).toEqual({ sum: 62, of: 60, left: 0, reached: true });
  });
  it('is null without a zone-minute value this week', () => {
    expect(weekLine([{ date: '2026-10-04', azm: 90 }], TODAY)).toBeNull();
    expect(weekLine([], TODAY)).toBeNull();
    expect(weekLine(undefined, TODAY)).toBeNull();
  });
});

describe('shorter', () => {
  const list = [
    { id: 'a', totalMin: 180 },
    { id: 'b', totalMin: 120 },
    { id: 'c', totalMin: 100 },
    { id: 'd', totalMin: 170 },
  ];
  it('picks the shortest ride that is clearly shorter', () => {
    expect(shorter(list, list[0])).toEqual({ ride: list[2], index: 2 });
  });
  it('gives nothing when the ride shown is the shortest or the others are about as long', () => {
    expect(shorter(list, list[2])).toBeNull();
    expect(shorter(list, list[3])).toEqual({ ride: list[2], index: 2 });
    expect(shorter([{ id: 'a', totalMin: 100 }, { id: 'b', totalMin: 90 }], { id: 'a', totalMin: 100 })).toBeNull();
    expect(shorter([], list[0])).toBeNull();
    expect(shorter(list, null)).toBeNull();
  });
});

describe('hours', () => {
  it('writes hours and minutes', () => {
    expect(hours(80)).toBe('1:20');
    expect(hours(125)).toBe('2:05');
    expect(hours(45)).toBe('0:45');
  });
});
