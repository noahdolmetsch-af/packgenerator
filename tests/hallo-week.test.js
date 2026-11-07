// Gruss C «Letzte 7 Tage»: seven dots, observation only
import { describe, it, expect } from 'vitest';
import { weekDots, daysBefore, answeredDays, keyCounts } from '../src/lib/home/hallo-week.js';
import { MOODS } from '../src/lib/home/hallo.js';

describe('daysBefore: calendar days', () => {
  it('crosses a month and a year, and the clock change', () => {
    expect(daysBefore('2026-11-01', 1)).toBe('2026-10-31');
    expect(daysBefore('2027-01-02', 6)).toBe('2026-12-27');
    expect(daysBefore('2026-10-26', 1)).toBe('2026-10-25'); // the night the clocks change
  });
});

describe('weekDots', () => {
  const row = (day, value, at = `${day}T08:00`, qid = 'hallo.gaht') => ({ qid, day, value, at });
  it('seven days, oldest first, today last; days without an answer are empty', () => {
    const dots = weekDots([row('2026-11-07', 'guet'), row('2026-11-05', 'muede')], '2026-11-07', MOODS);
    expect(dots.map((d) => d.day)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
    expect(dots[6]).toMatchObject({ key: 'guet', label: 'Guet', v: 0.75 });
    expect(dots[4]).toMatchObject({ key: 'muede', label: 'Müed' });
    expect(dots[5]).toMatchObject({ key: null, v: null });
    expect(answeredDays(dots)).toBe(2);
  });
  it('the latest answer of a day counts; other questions and older days are left out', () => {
    const dots = weekDots(
      [row('2026-11-07', 'okay', '2026-11-07T07:00'), row('2026-11-07', 'super', '2026-11-07T19:00'), row('2026-11-07', ['wach'], '2026-11-07T20:00', 'hallo.gefuehl'), row('2026-10-20', 'guet')],
      '2026-11-07',
    );
    expect(dots[6].key).toBe('super');
    expect(answeredDays(dots)).toBe(1);
  });
  it('a deleted or renamed face still shows its word', () => {
    const dots = weekDots([row('2026-11-07', 'ownface')], '2026-11-07', [{ key: 'okay', label: 'Okay', v: 0.5 }]);
    expect(dots[6]).toMatchObject({ key: 'ownface', label: 'ownface', v: 0.5 });
  });
});

describe('keyCounts (Woran liegt\'s?): only counting', () => {
  const r = (value, qid = 'hallo.grund') => ({ qid, value });
  it('counts each button once per answer, most often first; other questions and plain values are left out', () => {
    const c = keyCounts([r(['r-schlaf', 'r-arbeit']), r(['r-schlaf', 'r-schlaf']), r(['r-wetter']), r('guet', 'hallo.gaht'), r(['x'], 'hallo.gefuehl')], 'hallo.grund');
    expect(c).toEqual([{ key: 'r-schlaf', count: 2 }, { key: 'r-arbeit', count: 1 }, { key: 'r-wetter', count: 1 }]);
    expect(keyCounts([], 'hallo.grund')).toEqual([]);
  });
});
