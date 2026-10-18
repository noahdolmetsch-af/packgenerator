import { describe, it, expect } from 'vitest';
import { byDay, byMonthOf, activeOf, shownRows, SHOW_ROWS, OWN_DAYS } from '../src/lib/list/listen.js';
import { WHATS_NEW } from '../src/lib/whatsnew.js';

describe('SL lists', () => {
  it('groups by day: the newest days alone, the rest in one group', () => {
    const list = [{ date: '2026-10-13' }, { date: '2026-10-13' }, { date: '2026-10-12' }, { date: '2026-10-10' }, { date: '2026-10-09' }, { date: '2026-10-08' }, { date: '2026-10-05' }, { date: '2026-10-04' }];
    const g = byDay(list, '2026-10-14');
    expect(g.map((x) => [x.key, x.entries.length, x.ago])).toEqual([
      ['2026-10-13', 2, 1],
      ['2026-10-12', 1, 2],
      ['2026-10-10', 1, 4],
      ['2026-10-09', 1, 5],
      ['2026-10-08', 1, 6],
      ['older', 2, 9],
    ]);
    expect(g.at(-1)).toMatchObject({ older: true, from: '2026-10-04', to: '2026-10-05' });
  });
  it('keeps every version once', () => {
    const g = byDay(WHATS_NEW, WHATS_NEW[0].date);
    expect(g.reduce((n, x) => n + x.entries.length, 0)).toBe(WHATS_NEW.length);
    expect(g.length).toBeLessThanOrEqual(OWN_DAYS + 1);
    expect(g[0].ago).toBe(0);
  });
  it('groups by month', () => {
    expect(byMonthOf([{ d: '2026-10-02' }, { d: '2026-09-30' }, { d: '2026-09-01' }], (e) => e.d).map((m) => [m.key, m.entries.length])).toEqual([
      ['2026-10', 1],
      ['2026-09', 2],
    ]);
  });
  it('finds the group you are in', () => {
    expect(activeOf([200, 600, 900], 150)).toBe(0);
    expect(activeOf([-400, 100, 900], 150)).toBe(1);
    expect(activeOf([-900, -400, -10], 150)).toBe(2);
  });
  it('shows five rows, all when only one more would hide', () => {
    const r = Array.from({ length: 9 }, (_, i) => i);
    expect(shownRows(r, false)).toHaveLength(SHOW_ROWS);
    expect(shownRows(r, true)).toHaveLength(9);
    expect(shownRows(r.slice(0, SHOW_ROWS + 1), false)).toHaveLength(SHOW_ROWS + 1);
  });
});
