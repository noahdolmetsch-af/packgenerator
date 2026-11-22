// «Meilensteine motivierender» PR 5: «Dein Jahr in Sternen» (yearOfStars). Fictional data.
import { describe, it, expect } from 'vitest';
import { yearOfStars } from '../src/lib/flow/sternjahr.js';

const r = (id, days, off = false) => ({ id, off, m: { id }, reached: days.map((day, i) => ({ star: i + 1, day, id: `${id}:${i + 1}` })) });
const T = '2026-11-12';

describe('yearOfStars', () => {
  it('counts the stars by month of this year, all years together, the strongest month and the newest star', () => {
    const list = [r('a', ['2025-12-30', '2026-01-05', '2026-10-02', '2026-10-20']), r('b', ['2026-10-09', '2026-11-12']), r('c', ['2026-03-01'])];
    const y = yearOfStars(list, T);
    expect(y.year).toBe('2026');
    expect(y.months).toEqual([1, 0, 1, 0, 0, 0, 0, 0, 0, 3, 1, 0]);
    expect(y.total).toBe(6);
    expect(y.all).toBe(7);
    expect(y.best).toEqual({ month: 9, n: 3 });
    expect(y.now).toBe(10);
    expect(y.last.day).toBe('2026-11-12');
    expect(y.last.r.id).toBe('b');
  });
  it('leaves hidden milestones out and has no strongest month without a star this year', () => {
    const y = yearOfStars([r('a', ['2025-05-05']), r('h', ['2026-02-02'], true)], T);
    expect(y.total).toBe(0);
    expect(y.all).toBe(1);
    expect(y.best).toBeNull();
    expect(y.last.day).toBe('2025-05-05');
  });
  it('is empty for an empty list', () => {
    const y = yearOfStars([], T);
    expect(y).toMatchObject({ total: 0, all: 0, best: null, last: null });
    expect(y.months).toHaveLength(12);
  });
  it('the newest of two stars on one day is the higher one', () => {
    const y = yearOfStars([r('a', ['2026-11-12', '2026-11-12'])], T);
    expect(y.last.star).toBe(2);
  });
});
