// «Kochen» after training (Noah «a»): which groups fit after today's or yesterday's ride
import { describe, it, expect } from 'vitest';
import { trainingOf, LONG_KM, MIN_KM } from '../src/lib/kochen/training.js';
import { STD_GROUPS } from '../src/lib/kochen/rezepte.js';

const T = '2026-10-30';

describe('trainingOf', () => {
  it('nothing without a ride or with a short one', () => {
    expect(trainingOf([], T)).toBeNull();
    expect(trainingOf([{ date: T, km: MIN_KM - 1 }], T)).toBeNull();
    expect(trainingOf([{ date: '2026-10-28', km: 100 }], T)).toBeNull();
  });
  it('a ride adds up over the day; protein, and carbs after a long one', () => {
    expect(trainingOf([{ date: T, km: 15 }, { date: T, km: 10 }], T)).toMatchObject({ day: 'today', km: 25, groups: ['protein'] });
    expect(trainingOf([{ date: '2026-10-29', km: LONG_KM }], T)).toMatchObject({ day: 'yesterday', groups: ['carbs', 'protein'] });
  });
  it('today wins over yesterday', () => {
    expect(trainingOf([{ date: T, km: 30 }, { date: '2026-10-29', km: 90 }], T).day).toBe('today');
  });
  it('the groups are standard groups', () => {
    for (const g of ['carbs', 'protein']) expect(STD_GROUPS.some((x) => x.key === g)).toBe(true);
  });
});
