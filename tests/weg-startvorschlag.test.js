import { describe, it, expect } from 'vitest';
import { periodOf, goalPeriod, windowsIn, suggestion } from '../src/lib/weg/startvorschlag.js';
import { newGoal, addGoal, wegOf, setPeriod, setStart } from '../src/lib/weg/weg.js';

const day = (n) => `2026-11-${String(n).padStart(2, '0')}`;
const fc = (pcts) => pcts.map((p, i) => ({ date: day(10 + i), rainPct: p, rainMm: p / 40 }));
const TODAY = '2026-11-08';

describe('weg start suggestion', () => {
  it('periodOf wants two days in order', () => {
    expect(periodOf({ from: '2026-11-10', to: '2026-11-14' })).toEqual({ from: '2026-11-10', to: '2026-11-14' });
    expect(periodOf({ from: '2026-11-14', to: '2026-11-10' })).toBeNull();
    expect(periodOf({ from: 'x', to: '2026-11-10' })).toBeNull();
    expect(periodOf(null)).toBeNull();
  });
  it('only a goal without a start day has a period', () => {
    expect(goalPeriod({ start: '', period: { from: day(10), to: day(14) } })).toEqual({ from: day(10), to: day(14) });
    expect(goalPeriod({ start: day(12), period: { from: day(10), to: day(14) } })).toBeNull();
  });
  it('windowsIn finds runs of 3 dry days, earliest first', () => {
    // 10 wet, 11-13 dry, 14 wet, 15-18 dry
    const days = fc([80, 10, 5, 10, 70, 10, 10, 20, 15]);
    const w = windowsIn(days, { from: day(10), to: day(20) }, TODAY);
    expect(w).toEqual([{ from: day(11), to: day(13), n: 3, start: day(11) }, { from: day(15), to: day(18), n: 4, start: day(15) }]);
  });
  it('windowsIn stays inside the period and from today on, and a missing day breaks a run', () => {
    const days = fc([10, 10, 10, 10]);
    expect(windowsIn(days, { from: day(11), to: day(12) }, TODAY)).toEqual([]);
    expect(windowsIn(days, { from: day(1), to: day(30) }, '2026-11-12')).toEqual([]);
    const gap = [{ date: day(10), rainPct: 0, rainMm: 0 }, { date: day(11), rainPct: 0, rainMm: 0 }, { date: day(13), rainPct: 0, rainMm: 0 }];
    expect(windowsIn(gap, { from: day(10), to: day(14) }, TODAY)).toEqual([]);
  });
  it('suggestion says why there is none', () => {
    const goal = { start: '', period: { from: day(10), to: day(20) } };
    expect(suggestion({ start: '' }, null, TODAY)).toBeNull();
    expect(suggestion(goal, null, TODAY, { hasPlace: false }).state).toBe('noplace');
    expect(suggestion(goal, { days: [] }, TODAY).state).toBe('nodata');
    expect(suggestion({ start: '', period: { from: day(28), to: day(30) } }, { days: fc([10, 10, 10]) }, TODAY).state).toBe('far');
    expect(suggestion(goal, { days: fc([80, 80, 80, 80]) }, TODAY).state).toBe('none');
  });
  it('suggestion offers a window and cycles through the others', () => {
    const goal = { start: '', period: { from: day(10), to: day(20) } };
    const kept = { days: fc([80, 10, 5, 10, 70, 10, 10, 20, 15]) };
    const a = suggestion(goal, kept, TODAY);
    expect(a).toMatchObject({ state: 'window', count: 2, i: 0, win: { start: day(11) } });
    expect(suggestion(goal, kept, TODAY, { skip: 1 }).win.start).toBe(day(15));
    expect(suggestion(goal, kept, TODAY, { skip: 2 }).win.start).toBe(day(11));
  });
});

describe('weg period in the store', () => {
  const w0 = addGoal({ goals: [], onToday: true }, newGoal({ title: 'Tour', kind: 'free', start: '' }));
  const id = w0.goals[0].id;
  it('setPeriod keeps a valid period, drops an invalid one', () => {
    const w = setPeriod(w0, id, day(10), day(20));
    expect(wegOf(w).goals[0].period).toEqual({ from: day(10), to: day(20) });
    expect(setPeriod(w, id, day(20), day(10)).goals[0].period).toBeUndefined();
    expect(setPeriod(w, id, '', '').goals[0].period).toBeUndefined();
  });
  it('setting the start day ends the period; clearing the start keeps it', () => {
    const w = setPeriod(w0, id, day(10), day(20));
    expect(setStart(w, id, day(12)).goals[0].period).toBeUndefined();
    expect(setStart(w, id, '').goals[0].period).toEqual({ from: day(10), to: day(20) });
  });
});
