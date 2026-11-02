import { describe, it, expect } from 'vitest';
import { lapsed, limitFor, daysSince, snooze, setNudge } from '../src/lib/home/nudge.js';
import { normAct } from '../src/lib/flow.js';

const today = '2026-10-30';
const act = (id, o = {}) => normAct({ id, name: id, ring: 'move', goals: [{ id: 'g', count: 2, days: 7 }], ...o });
const tick = (actId, days) => days.map((day, i) => ({ id: `${actId}-${i}`, actId, day, n: 1 }));

describe('Schon lange nicht (Meilensteine aktiver machen PR 2)', () => {
  it('limit comes from the weekly goal: twice the gap, at least 7 days, own number wins', () => {
    expect(limitFor(act('a'))).toBe(7);
    expect(limitFor(act('b', { goals: [{ id: 'g', count: 1, days: 14 }] }))).toBe(14);
    expect(limitFor(act('a'), { a: { days: 20 } })).toBe(20);
  });
  it('lists sports that wait longer than their limit, longest first; needs two ticks', () => {
    const a = act('yoga');
    const b = act('tennis');
    const c = act('run');
    const log = [...tick('yoga', ['2026-10-01', '2026-10-05']), ...tick('tennis', ['2026-10-10', '2026-10-15']), ...tick('run', ['2026-10-01'])];
    const rows = lapsed([a, b, c], log, today);
    expect(rows.map((r) => r.act.id)).toEqual(['yoga', 'tennis']);
    expect(daysSince(a, log, today)).toBe(25);
  });
  it('skips paused, switched off and snoozed sports; later comes back after three days', () => {
    const log = tick('yoga', ['2026-10-01', '2026-10-05']);
    expect(lapsed([act('yoga', { paused: true })], log, today)).toEqual([]);
    expect(lapsed([act('yoga')], log, today, { yoga: { off: true } })).toEqual([]);
    const later = snooze({}, 'yoga', today);
    expect(later.yoga.until).toBe('2026-11-02');
    expect(lapsed([act('yoga')], log, today, later)).toEqual([]);
    expect(lapsed([act('yoga')], log, '2026-11-02', later).length).toBe(1);
  });
  it('an empty setting is removed', () => {
    expect(setNudge({ yoga: { days: 9 } }, 'yoga', { days: null })).toEqual({});
  });
});
