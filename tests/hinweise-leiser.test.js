// «Hinweise lernen aus dem Wegtippen» (S5, Noah 21.11.2026 «4a»): pure rules, calendar days as strings.
import { describe, it, expect } from 'vitest';
import { noteSkip, askDue, skippedDays, keepAsIs, clearKind, cleanSkips, dayDiff, ASK_AFTER, REASK_DAYS } from '../src/lib/hinweise/leiser.js';

const skip = (state, ...days) => days.reduce((s, d) => noteSkip(s, 'ruhetag', d), state);

describe('sending a hint away', () => {
  it('counts different days once and sorts them', () => {
    const s = skip({}, '2026-11-12', '2026-11-10', '2026-11-12');
    expect(s.ruhetag.days).toEqual(['2026-11-10', '2026-11-12']);
  });

  it('ignores unknown kinds and broken days', () => {
    expect(noteSkip({}, 'nope', '2026-11-10')).toEqual({});
    expect(noteSkip({}, 'ruhetag', 'heute')).toEqual({});
    expect(cleanSkips({ ruhetag: { days: ['x', '2026-11-01'], no: 'y' } })).toEqual({ ruhetag: { days: ['2026-11-01'], no: null } });
    expect(cleanSkips(null)).toEqual({});
  });

  it('keeps only the last ten days', () => {
    const days = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    expect(skip({}, ...days).ruhetag.days).toHaveLength(10);
  });
});

describe('the question', () => {
  it('comes on the third different day within two weeks, on that day only', () => {
    expect(ASK_AFTER).toBe(3);
    const two = skip({}, '2026-11-10', '2026-11-12');
    expect(askDue(two, 'ruhetag', '2026-11-12')).toBe(false);
    const three = skip(two, '2026-11-14');
    expect(askDue(three, 'ruhetag', '2026-11-14')).toBe(true);
    expect(askDue(three, 'ruhetag', '2026-11-15')).toBe(false); // the next day it is not asked again by itself
    expect(skippedDays(three, 'ruhetag', '2026-11-14')).toBe(3);
  });

  it('does not count days older than two weeks', () => {
    const s = skip({}, '2026-10-01', '2026-10-02', '2026-11-14');
    expect(askDue(s, 'ruhetag', '2026-11-14')).toBe(false);
    expect(skippedDays(s, 'ruhetag', '2026-11-14')).toBe(1);
  });

  it('keeps the other kind apart', () => {
    const s = skip({}, '2026-11-10', '2026-11-12', '2026-11-14');
    expect(askDue(s, 'sonne', '2026-11-14')).toBe(false);
  });

  it('is quiet for 60 days after «Keep it», then asks again', () => {
    expect(REASK_DAYS).toBe(60);
    let s = skip({}, '2026-11-10', '2026-11-12', '2026-11-14');
    s = keepAsIs(s, 'ruhetag', '2026-11-14');
    s = skip(s, '2026-11-15', '2026-11-16', '2026-11-17');
    expect(askDue(s, 'ruhetag', '2026-11-17')).toBe(false);
    s = skip(s, '2027-01-14', '2027-01-15', '2027-01-16');
    expect(dayDiff('2026-11-14', '2027-01-16')).toBeGreaterThanOrEqual(60);
    expect(askDue(s, 'ruhetag', '2027-01-16')).toBe(true);
  });

  it('forgets the days once the kind is switched off', () => {
    const s = skip({}, '2026-11-10', '2026-11-12', '2026-11-14');
    expect(clearKind(s, 'ruhetag')).toEqual({});
  });
});
