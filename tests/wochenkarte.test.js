// «Wochenrückblick» card on Heute (Noah 10.11.2026 «1b»): Sunday 17:00 to Monday 12:00. Fictional data only; no clock.
import { describe, it, expect } from 'vitest';
import { cardWeek, cardShown, cardAway, cardDone, cardNumbers, cardOpen, CARD_FROM, CARD_UNTIL } from '../src/lib/home/wochenkarte.js';

// 2026-11-15 is a Sunday, 2026-11-16 a Monday
describe('the week card on Heute', () => {
  it('shows Sunday from 17:00 and Monday until 12:00, never in between', () => {
    expect(CARD_FROM).toBe('17:00');
    expect(CARD_UNTIL).toBe('12:00');
    expect(cardWeek('2026-11-15T16:59')).toBe(null);
    expect(cardWeek('2026-11-15T17:00')).toEqual({ monday: '2026-11-09', sunday: '2026-11-15', isSunday: true });
    expect(cardWeek('2026-11-16T11:59')).toEqual({ monday: '2026-11-09', sunday: '2026-11-15', isSunday: false });
    expect(cardWeek('2026-11-16T12:00')).toBe(null);
    expect(cardWeek('2026-11-14T20:00')).toBe(null); // a Saturday
    expect(cardWeek('')).toBe(null);
  });

  it('«Not today» keeps it away until tomorrow, the main button until next Sunday', () => {
    const sun = '2026-11-15T18:00';
    expect(cardShown({}, sun)?.sunday).toBe('2026-11-15');
    const off = cardAway({}, sun);
    expect(cardShown(off, '2026-11-15T23:00')).toBe(null);
    expect(cardShown(off, '2026-11-16T08:00')?.sunday).toBe('2026-11-15'); // tomorrow it comes once more
    const done = cardDone(off, cardWeek(sun));
    expect(cardShown(done, '2026-11-16T08:00')).toBe(null);
    expect(cardShown(done, '2026-11-22T18:00')?.sunday).toBe('2026-11-22'); // the next week
    expect(cardShown(null, sun)?.sunday).toBe('2026-11-15');
  });

  it('takes hours, km and sessions out of the five numbers, in that order', () => {
    const five = [
      { key: 'hm', value: 900, prev: 0, diff: 900 },
      { key: 'n', value: 5, prev: 5, diff: 0 },
      { key: 'hours', value: 23400, prev: 18000, diff: 5400 },
      { key: 'km', value: 142, prev: 162, diff: -20 },
      { key: 'goals', value: 3, prev: 2, diff: 1, of: 5 },
    ];
    expect(cardNumbers(five).map((x) => x.key)).toEqual(['hours', 'km', 'n']);
    expect(cardNumbers([])).toEqual([]);
  });

  it('counts the own tasks that slide to Monday and names the first three', () => {
    const move = ['A', 'B', 'C', 'D'].map((title, i) => ({ id: `t${i}`, title, day: '2026-11-15', kind: 'todo' }));
    expect(cardOpen({ move })).toEqual({ n: 4, titles: ['A', 'B', 'C'] });
    expect(cardOpen({ move: [] })).toEqual({ n: 0, titles: [] });
    expect(cardOpen(null)).toEqual({ n: 0, titles: [] });
  });
});
