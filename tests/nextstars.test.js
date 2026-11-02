import { describe, it, expect } from 'vitest';
import { nextStars, nextOf } from '../src/lib/home/nextstars.js';
import { msContext } from '../src/lib/flowms.js';

const today = '2026-10-20';
const act = (id, o = {}) => ({ id, name: id, ring: 'move', goals: [{ days: 7, count: 3 }], ...o });
const tick = (actId, n, from = '2026-09-01') => Array.from({ length: n }, (_, i) => ({ id: `${actId}-${i}`, actId, day: `${from.slice(0, 8)}${String(i + 1).padStart(2, '0')}` }));

describe('nextStars (Meilensteine aktiver machen PR 1)', () => {
  it('picks the closest star per sport, closest sport first, at most three', () => {
    const acts = [act('tennis'), act('yoga'), act('gym'), act('swim')];
    const log = [...tick('tennis', 4), ...tick('yoga', 9), ...tick('gym', 2), ...tick('swim', 1)];
    const ctx = msContext({ acts, log, sessions: [], today });
    const rows = nextStars(ctx.acts, ctx, new Map());
    expect(rows.length).toBe(3);
    expect(rows[0].actId).toBe('yoga'); // 9 of 10
    expect(rows[0].left).toBe(1);
    expect(rows.map((r) => r.r.progress)).toEqual([...rows.map((r) => r.r.progress)].sort((a, b) => b - a));
  });
  it('skips paused sports and sports without a start', () => {
    const acts = [act('tennis', { paused: true }), act('yoga')];
    const ctx = msContext({ acts, log: tick('tennis', 4), sessions: [], today });
    expect(nextStars(ctx.acts, ctx, new Map())).toEqual([]);
    expect(nextOf([])).toBeNull();
  });
});
