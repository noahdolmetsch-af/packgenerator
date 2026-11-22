// «Paket G» (Noah 03.11.2026 «a»): what the picture on top of Today says, and its sky.
import { describe, it, expect } from 'vitest';
import { bildOf, moodOf } from '../src/lib/home/heutebild.js';

const trip = (startDate, days = 1) => ({ id: 't', title: 'Bodensee-Runde', startDate, days });

describe('bildOf', () => {
  it('counts the days to go, tomorrow and today', () => {
    expect(bildOf(trip('2026-11-15'), '2026-11-03')).toEqual({ kind: 'days', n: 12, m: 1 });
    expect(bildOf(trip('2026-11-04'), '2026-11-03')).toEqual({ kind: 'tomorrow', n: 1, m: 1 });
    expect(bildOf(trip('2026-11-03'), '2026-11-03')).toEqual({ kind: 'today', n: 1, m: 1 });
  });
  it('says the day of a trip under way', () => {
    expect(bildOf(trip('2026-11-02', 3), '2026-11-03')).toEqual({ kind: 'under', n: 2, m: 3 });
  });
  it('says nothing without a date or after the trip', () => {
    expect(bildOf(trip(null), '2026-11-03')).toBe(null);
    expect(bildOf(trip('2026-10-20'), '2026-11-03')).toBe(null);
    expect(bildOf(null, '2026-11-03')).toBe(null);
  });
});

describe('moodOf', () => {
  it('follows the day clock', () => {
    expect(moodOf(7)).toBe('morning');
    expect(moodOf(14)).toBe('day');
    expect(moodOf(19)).toBe('evening');
    expect(moodOf(23)).toBe('night');
    expect(moodOf(3)).toBe('night');
  });
  it('turns grey with rain, but the night stays', () => {
    expect(moodOf(14, true)).toBe('rain');
    expect(moodOf(7, true)).toBe('rain');
    expect(moodOf(23, true)).toBe('night');
  });
});
