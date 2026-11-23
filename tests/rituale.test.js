import { describe, it, expect } from 'vitest';
import { rituale, ritualeWeek, goalPerWeek } from '../src/lib/flow/rituale.js';

const act = (id, ring, goals = [], extra = {}) => ({ id, name: id, ring, goals, ...extra });
const tick = (id, actId, day, extra = {}) => ({ id, actId, day, at: `${day}T10:00:00.000Z`, ...extra });
const W = '2026-11-16'; // Monday

describe('Erholung und Rituale', () => {
  const acts = [act('sauna', 'rest', [{ count: 2, days: 7 }]), act('meditation', 'mind', [{ count: 1, days: 1 }], { minMin: 10 }), act('ride', 'move', [{ count: 3, days: 7 }]), act('nap', 'rest', [])];

  it('the goal is times per week', () => {
    expect(goalPerWeek(acts[0], W)).toBe(2);
    expect(goalPerWeek(acts[1], W)).toBe(7);
    expect(goalPerWeek(acts[3], W)).toBeNull();
    expect(goalPerWeek({ id: 'x', ring: 'rest', goals: [{ count: 1, days: 14 }] }, W)).toBe(0.5);
  });

  it('counts the times of the rings rest and mind, never movement, never the ride to work', () => {
    const log = [tick('a', 'sauna', '2026-11-17'), tick('b', 'sauna', '2026-11-20'), tick('c', 'meditation', '2026-11-17', { min: 12 }), tick('d', 'ride', '2026-11-18'), tick('e', 'sauna', '2026-11-10')];
    const { rows } = ritualeWeek({ log, flowActs: acts }, W, '2026-11-22');
    expect(rows.map((r) => [r.id, r.n])).toEqual([['sauna', 2], ['meditation', 1]]);
    const sauna = rows.find((r) => r.id === 'sauna');
    expect(sauna.goal).toBe(2);
    expect(sauna.days).toBe(2);
    expect(rows.find((r) => r.id === 'meditation').measuredMin).toBe(12);
  });

  it('the usual duration is not added up for rituals, only measured time', () => {
    const log = [tick('a', 'meditation', '2026-11-17'), tick('b', 'meditation', '2026-11-18', { min: 20 })];
    const { rows } = ritualeWeek({ log, flowActs: acts }, W, '2026-11-22');
    expect(rows[0].n).toBe(2);
    expect(rows[0].measuredMin).toBe(20);
  });

  it('an activity with a goal but no tick shows with 0; one without a goal and no tick is left out; a paused one too', () => {
    const { rows } = ritualeWeek({ log: [], flowActs: [...acts, act('cold', 'rest', [{ count: 3, days: 7 }], { paused: true })] }, W, '2026-11-22');
    expect(rows.map((r) => [r.id, r.n])).toEqual([['sauna', 0], ['meditation', 0]]);
  });

  it('ticks of trip days do not count', () => {
    const { rows } = ritualeWeek({ log: [tick('a', 'sauna', '2026-11-17', { via: 'trip' })], flowActs: acts }, W, '2026-11-22');
    expect(rows.find((r) => r.id === 'sauna').n).toBe(0);
  });

  it('a window of many weeks gives the mean per week', () => {
    const log = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'].map((d, i) => tick(`s${i}`, 'sauna', d));
    const units = ritualeWeek({ log, flowActs: acts }, W).rows; // sanity: window of one week
    expect(units.find((r) => r.id === 'sauna').n).toBe(0);
    const all = rituale(
      log.map((e) => ({ id: e.id, day: e.day, actId: 'sauna', ring: 'rest', quelle: 'hand', minQuelle: null, min: null })),
      acts,
      '2026-10-05',
      '2026-11-01',
    );
    expect(all.find((r) => r.id === 'sauna')).toMatchObject({ n: 4, perWeek: 1 });
  });
});
