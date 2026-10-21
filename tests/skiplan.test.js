import { describe, it, expect } from 'vitest';
import {
  dangerOf, dangerShort, minutesOf, morningRows, hasPlan, planVsReal, goalOf, goalProgress,
  addWish, renameWish, dropWish, moveWish, toggleWish, lvsOfSeason, courseDue, skiWeeks, daysToSeason,
  lastSeason, hmPerSki, DANGER_LEVELS,
} from '../src/lib/skiplan.js';

const trip = (id, day, ski = {}, extra = {}) => ({ id, domain: 'ski', startDate: day, days: 1, ski, ...extra });

describe('danger level', () => {
  it('knows five levels and shows the sub-level', () => {
    expect(DANGER_LEVELS).toHaveLength(5);
    expect(dangerOf(3).name).toBe('Considerable|danger');
    expect(dangerOf(9)).toBeNull();
    expect(dangerShort({ level: 3, sub: '+' })).toBe('3+');
    expect(dangerShort({ level: 2, sub: '=' })).toBe('2');
    expect(dangerShort({ level: 5, sub: '+' })).toBe('5');
    expect(dangerShort({})).toBe('');
  });
});

describe('the morning', () => {
  it('reads clock times', () => {
    expect(minutesOf('07:05')).toBe(425);
    expect(minutesOf('25:00')).toBeNull();
  });
  it('lists the filled times in order, turnaround and train from the start check', () => {
    const t = trip('a', '2026-12-13', { turnAt: '12:30', trainAt: '16:10', plan: { wakeAt: '05:40', ascentAt: '08:00', leaveAt: '' } });
    expect(morningRows(t).map((r) => r.key)).toEqual(['wakeAt', 'ascentAt', 'turnAt', 'trainAt']);
    expect(hasPlan(t)).toBe(true);
    expect(hasPlan(trip('b', '2026-12-13', { plan: { notes: '' } }))).toBe(false);
  });
});

describe('plan and reality', () => {
  it('compares metres, time and the peak', () => {
    const t = trip('a', '2026-12-13', { hm: 1250, activeMin: 230, peakAt: '11:50', plan: { hm: 1200, timeMin: 210, peakPlanAt: '11:30' } });
    expect(planVsReal(t)).toEqual([
      { key: 'hm', plan: 1200, real: 1250, diff: 50 },
      { key: 'time', plan: 210, real: 230, diff: 20 },
      { key: 'peak', plan: '11:30', real: '11:50', diff: 20 },
    ]);
  });
  it('leaves the real value open while it is missing, and shows nothing without a plan', () => {
    expect(planVsReal(trip('a', '2026-12-13', { plan: { hm: 900 } }))).toEqual([{ key: 'hm', plan: 900, real: null, diff: null }]);
    expect(planVsReal(trip('a', '2026-12-13', {}))).toEqual([]);
  });
});

describe('the season', () => {
  it('measures the goal', () => {
    const g = goalOf({ '2026/27': { tours: 10, hm: '12000' } }, '2026/27');
    expect(g).toEqual({ tours: 10, hm: 12000 });
    expect(goalOf({}, '2026/27')).toEqual({ tours: 0, hm: 0 });
    const p = goalProgress(g, { tours: 3, hm: 15000 });
    expect(p.tours.pct).toBe(30);
    expect(p.hm.pct).toBe(100);
  });
  it('adds, renames, ticks, moves and drops wish tours', () => {
    let w = addWish([], '  Piz Beispiel ', 'w1');
    w = addWish(w, 'Muster-Gipfel', 'w2');
    w = addWish(w, '   ', 'w3');
    expect(w.map((x) => x.name)).toEqual(['Piz Beispiel', 'Muster-Gipfel']);
    w = renameWish(w, 'w1', 'Piz Probe');
    expect(w[0].name).toBe('Piz Probe');
    expect(renameWish(w, 'w1', '')[0].name).toBe('Piz Probe');
    w = toggleWish(w, 'w2', '2026-12-13');
    expect(w[1].doneDay).toBe('2026-12-13');
    expect(toggleWish(w, 'w2', 'x')[1].doneDay).toBeUndefined();
    expect(moveWish(w, 1, 0).map((x) => x.id)).toEqual(['w2', 'w1']);
    expect(moveWish(w, 0, 5).map((x) => x.id)).toEqual(['w1', 'w2']);
    expect(dropWish(w, 'w1').map((x) => x.id)).toEqual(['w2']);
  });
  it('keeps the transceiver practice of the season and knows when a course is due', () => {
    const log = [{ id: 1, day: '2026-11-20' }, { id: 2, day: '2026-03-01' }, { id: 3, day: '2026-12-02' }];
    expect(lvsOfSeason(log, '2026/27').map((x) => x.id)).toEqual([3, 1]);
    expect(courseDue({ day: '2024-12-01' }, '2026-12-01')).toBe(true);
    expect(courseDue({ day: '2024-12-02' }, '2026-12-01')).toBe(false);
    expect(courseDue({}, '2026-12-01')).toBe(false);
  });
  it('counts ski days per week over eight weeks', () => {
    const trips = [trip('a', '2026-12-12', {}), trip('b', '2026-12-07', {}), trip('c', '2026-10-01', {}), trip('d', '2026-12-20', {}), trip('e', '2026-12-08', {}, { skipped: true })];
    const w = skiWeeks(trips, '2026-12-14');
    expect(w).toHaveLength(8);
    expect(w[7]).toEqual({ start: '2026-12-14', n: 0 });
    expect(w[6]).toEqual({ start: '2026-12-07', n: 2 });
    expect(w.reduce((s, x) => s + x.n, 0)).toBe(2);
  });
  it('counts down to the season in October only', () => {
    expect(daysToSeason('2026-10-21')).toBe(11);
    expect(daysToSeason('2026-11-02')).toBeNull();
  });
  it('sums last season and the metres per ski', () => {
    const trips = [
      trip('a', '2026-01-10', { hm: 1000, peak: 'Piz Beispiel', skiItemId: 'S1' }),
      trip('b', '2026-12-10', { hm: 800, skiItemId: 'S1' }),
      trip('c', '2026-12-11', { hm: 1500, skiItemId: 'S2' }),
    ];
    const last = lastSeason(trips, '2026-12-14');
    expect(last).toMatchObject({ id: '2025/26', tours: 1, hm: 1000 });
    expect(hmPerSki(trips, '2026-12-14')).toEqual([
      { itemId: 'S1', hm: 1800, tours: 2, seasonHm: 800 },
      { itemId: 'S2', hm: 1500, tours: 1, seasonHm: 1500 },
    ]);
  });
});
