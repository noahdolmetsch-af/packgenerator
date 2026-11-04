// «Gründe für Planänderungen» (Persönliches Lernen Idee 4): kinds, answers and the «most often» line.
import { describe, it, expect } from 'vitest';
import { kindOf, whyOf, asked, whyChange, whySkip, pattern, REASONS_STD, isReason, MIN_ANSWERS, DEVIATION } from '../src/lib/gruende.js';
import { STANDARD_LISTS } from '../src/lib/standard.js';
import { APP_LISTS } from '../src/lib/applists.js';

const trip = (o = {}) => ({ id: 't', route: { km: 100 }, ...o });

describe('how a tour went against the plan', () => {
  it('«Not riding» is skipped', () => {
    expect(kindOf(trip({ skipped: true }))).toBe('skipped');
  });
  it('a quarter or more away from the planned km is shorter or longer', () => {
    expect(DEVIATION).toBe(0.25);
    expect(kindOf(trip(), 75)).toBe('shorter');
    expect(kindOf(trip(), 125)).toBe('longer');
    expect(kindOf(trip(), 80)).toBe(null);
    expect(kindOf(trip(), 120)).toBe(null);
  });
  it('says nothing without both numbers', () => {
    expect(kindOf(trip({ route: {} }), 60)).toBe(null);
    expect(kindOf(trip(), null)).toBe(null);
    expect(kindOf(null, 60)).toBe(null);
  });
});

describe('the answer on the trip', () => {
  it('knows the standard reasons and every own one', () => {
    expect(REASONS_STD.map((r) => r.id)).toEqual(['time', 'legs', 'weather', 'motivation', 'gear', 'unwell']);
    expect(isReason('weather')).toBe(true);
    expect(isReason('own-1')).toBe(true);
    expect(isReason('nope')).toBe(false);
  });
  it('is an app list that can be renamed, added to and hidden', () => {
    expect(APP_LISTS).toContain('changeReasons');
    expect(STANDARD_LISTS.find((l) => l.key === 'changeReasons').entries().map((e) => e.id)).toEqual(REASONS_STD.map((r) => r.id));
  });
  it('reads a whole answer only', () => {
    expect(whyOf(trip({ changeWhy: { kind: 'shorter', reason: 'legs' } }))).toEqual({ kind: 'shorter', reason: 'legs' });
    expect(whyOf(trip({ changeWhy: { kind: 'shorter', skip: true } }))).toEqual({ kind: 'shorter', skip: true });
    expect(whyOf(trip({ changeWhy: { kind: 'other', reason: 'legs' } }))).toBe(null);
    expect(whyOf(trip({ changeWhy: { kind: 'shorter', reason: 'nope' } }))).toBe(null);
    expect(whyOf(trip())).toBe(null);
  });
  it('asks once per kind of change: not after an answer or «Not now»', () => {
    expect(asked(trip({ skipped: true }))).toBe('skipped');
    expect(asked(trip({ skipped: true, changeWhy: { kind: 'skipped', reason: 'time' } }))).toBe(null);
    expect(asked(trip({ skipped: true, changeWhy: { kind: 'skipped', skip: true } }))).toBe(null);
    expect(asked(trip(), 60)).toBe('shorter');
    expect(asked(trip({ changeWhy: { kind: 'skipped', reason: 'time' } }), 60)).toBe('shorter');
    expect(asked(trip(), 95)).toBe(null);
  });
  it('a second tap on the chosen reason takes it away', () => {
    expect(whyChange(trip(), 'shorter', 'legs')).toEqual({ changeWhy: { kind: 'shorter', reason: 'legs' } });
    expect(whyChange(trip({ changeWhy: { kind: 'shorter', reason: 'legs' } }), 'shorter', 'legs')).toEqual({ changeWhy: null });
    expect(whyChange(trip({ changeWhy: { kind: 'shorter', reason: 'legs' } }), 'shorter', 'time')).toEqual({ changeWhy: { kind: 'shorter', reason: 'time' } });
    expect(whySkip('longer')).toEqual({ changeWhy: { kind: 'longer', skip: true } });
  });
});

describe('what came up most often', () => {
  const w = (reason, kind = 'shorter') => trip({ changeWhy: { kind, reason } });
  it('needs at least three answers; «Not now» is no answer', () => {
    expect(MIN_ANSWERS).toBe(3);
    expect(pattern([w('legs'), w('legs'), trip({ changeWhy: { kind: 'shorter', skip: true } })])).toBe(null);
    expect(pattern(null)).toBe(null);
  });
  it('counts the reasons, most often first, ties by name', () => {
    expect(pattern([w('weather'), w('legs'), w('weather'), w('time', 'skipped')])).toEqual({ n: 4, top: [{ reason: 'weather', count: 2 }, { reason: 'legs', count: 1 }, { reason: 'time', count: 1 }] });
  });
});
