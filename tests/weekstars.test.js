import { describe, it, expect } from 'vitest';
import { cardMonday, weekStars } from '../src/lib/home/weekstars.js';
import { msContext } from '../src/lib/flowms.js';

const act = (id) => ({ id, name: id, ring: 'move', goals: [{ days: 7, count: 3 }] });
const tick = (actId, days) => days.map((day, i) => ({ id: `${actId}-${i}`, actId, day }));

describe('Montag-Karte (Meilensteine aktiver machen PR 5)', () => {
  it('shows on Monday and Tuesday only', () => {
    expect(cardMonday('2026-10-12')).toBe('2026-10-12');
    expect(cardMonday('2026-10-13')).toBe('2026-10-12');
    expect(cardMonday('2026-10-14')).toBeNull();
    expect(cardMonday('2026-10-18')).toBeNull();
  });
  it('lists the stars reached last week, newest first; older ones are left out', () => {
    const acts = [act('run'), act('yoga')];
    const log = [...tick('run', ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']), ...tick('yoga', ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'])];
    const today = '2026-10-12';
    const ctx = msContext({ acts, log, sessions: [], today });
    const rows = weekStars(ctx.acts, ctx, new Map(), {}, '2026-10-12');
    expect(rows.some((x) => x.actId === 'yoga' && x.day === '2026-10-10')).toBe(true);
    expect(rows.every((x) => x.day >= '2026-10-05' && x.day <= '2026-10-11')).toBe(true);
    expect(rows.some((x) => x.actId === 'run' && x.day === '2026-10-05')).toBe(true);
    expect(rows[0].day >= rows.at(-1).day).toBe(true);
  });
  it('a paused sport adds nothing', () => {
    const acts = [{ ...act('run'), paused: true }];
    const log = tick('run', ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
    const ctx = msContext({ acts, log, sessions: [], today: '2026-10-12' });
    expect(weekStars(ctx.acts, ctx, new Map(), {}, '2026-10-12')).toEqual([]);
  });
});
