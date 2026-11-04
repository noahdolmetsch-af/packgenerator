// «Belastungslandschaft» (Cockpit-Idee 1): the planned load is an estimate; the past days keep the numbers of «Form und Erholung».
import { describe, it, expect } from 'vitest';
import { plannedLoad, plannedByDay, landscapeDays, smoothPath, hillPath, ZONE_IF } from '../src/lib/flow/form/landschaft.js';
import { formSeries } from '../src/lib/form.js';

const TODAY = '2026-10-20';
const s = (day, mins, zone = 2, extra = {}) => ({ id: `${day}-${mins}`, day, kind: 'bike', name: 'Ride', mins, zone, ...extra });

describe('planned load', () => {
  it('counts like a ride at the middle of the zone: IF² × hours × 100', () => {
    expect(plannedLoad(s('2026-10-21', 60, 2))).toBe(Math.round(ZONE_IF[2] ** 2 * 100)); // 42
    expect(plannedLoad(s('2026-10-21', 90, 4))).toBe(Math.round(ZONE_IF[4] ** 2 * 1.5 * 100));
    expect(plannedLoad(s('2026-10-21', 60, 5))).toBeGreaterThan(plannedLoad(s('2026-10-21', 60, 1)));
  });
  it('no zone counts as Z2, no minutes as nothing', () => {
    expect(plannedLoad(s('2026-10-21', 60, null))).toBe(plannedLoad(s('2026-10-21', 60, 2)));
    expect(plannedLoad({ mins: 0, zone: 3 })).toBe(0);
    expect(plannedLoad(null)).toBe(0);
  });
});

describe('planned by day', () => {
  it('only after today, within the horizon, and not what is done', () => {
    const sessions = [s('2026-10-20', 60), s('2026-10-21', 60), s('2026-10-22', 60), s('2026-10-23', 60, 3, { done: true }), s('2026-11-30', 60), s('2026-10-24', 30)];
    const acts = new Map([['2026-10-22', [{ day: '2026-10-22', kind: 'bike' }]]]);
    const p = plannedByDay(sessions, acts, TODAY, 14);
    expect([...p.keys()]).toEqual(['2026-10-21', '2026-10-24']);
    expect(p.get('2026-10-21').sessions).toHaveLength(1);
  });
  it('two sessions on a day add up', () => {
    const p = plannedByDay([s('2026-10-21', 60), s('2026-10-21', 30, 3, { kind: 'run' })], new Map(), TODAY);
    expect(p.get('2026-10-21').sessions).toHaveLength(2);
    expect(p.get('2026-10-21').load).toBe(plannedLoad(s('', 60, 2)) + plannedLoad(s('', 30, 3)));
  });
});

describe('landscape days', () => {
  const loads = new Map([['2026-10-10', 80], ['2026-10-15', 60], ['2026-10-19', 100]]);
  it('without a plan it ends today and equals formSeries day for day', () => {
    const days = landscapeDays({ loads, today: TODAY, past: 14 });
    const base = formSeries(loads, '2026-10-07', TODAY);
    expect(days).toHaveLength(14);
    expect(days.at(-1).day).toBe(TODAY);
    expect(days.every((d) => !d.future)).toBe(true);
    expect(days.map(({ day, fit, fat, form, load }) => ({ day, fit, fat, form, load }))).toEqual(base);
  });
  it('with a plan the past keeps its numbers and the future carries the estimate', () => {
    const planned = plannedByDay([s('2026-10-22', 120, 4)], new Map(), TODAY);
    const days = landscapeDays({ loads, planned, today: TODAY, past: 14, ahead: 14 });
    const without = landscapeDays({ loads, today: TODAY, past: 14 });
    expect(days).toHaveLength(14 + 14);
    expect(days.slice(0, 14).map((d) => [d.fit, d.fat])).toEqual(without.map((d) => [d.fit, d.fat]));
    const d22 = days.find((d) => d.day === '2026-10-22');
    expect(d22).toMatchObject({ future: true, planned: plannedLoad(s('', 120, 4)), load: plannedLoad(s('', 120, 4)) });
    expect(d22.fat).toBeGreaterThan(days.find((d) => d.day === '2026-10-21').fat);
    expect(days.filter((d) => d.future)).toHaveLength(14);
  });
});

describe('paths', () => {
  const pts = [{ x: 0, y: 50 }, { x: 10, y: 20 }, { x: 20, y: 40 }];
  it('a smooth line and a closed hill', () => {
    expect(smoothPath(pts)).toMatch(/^M0\.00,50\.00 Q10\.00,20\.00 15\.00,30\.00 L20\.00,40\.00$/);
    expect(hillPath(pts, 100)).toMatch(/^M.* L20\.00,100 L0\.00,100 Z$/);
    expect(smoothPath([{ x: 0, y: 1 }])).toBeNull();
    expect(hillPath([], 100)).toBeNull();
  });
});
