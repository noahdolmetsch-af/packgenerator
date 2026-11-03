// «Meine Sportarten» goal suggestion from the own data (Noah 02.11.2026 «5a»). Fictional data only.
import { describe, it, expect } from 'vitest';
import { goalHint } from '../src/lib/flow/goalhint.js';
import { SPORT_TEMPLATES, applyTemplate } from '../src/lib/flow/sporttemplates.js';
import { blankAct, addDays } from '../src/lib/flow.js';

const T = '2026-10-09';
const act = (count, days = 7) => ({ id: 'x', name: 'Test', icon: 'run', ring: 'move', goals: [{ id: 'g', count, days }], order: 0 });
const log = (n, step = 3) => Array.from({ length: n }, (_, i) => ({ id: `e${i}`, actId: 'x', day: addDays(T, -1 - i * step), n: 1 }));

describe('goalHint', () => {
  it('suggests the weekly average when it differs from the goal', () => {
    expect(goalHint(act(1), log(8), T)).toEqual({ count: 2, total: 8, now: 1 });
  });
  it('says nothing when the goal already fits', () => {
    expect(goalHint(act(2), log(8), T)).toBe(null);
  });
  it('says nothing with fewer than 4 entries in 4 weeks', () => {
    expect(goalHint(act(1), log(3), T)).toBe(null);
  });
  it('only counts the last 4 weeks', () => {
    expect(goalHint(act(1), log(8, 10), T)).toBe(null); // only 3 of them lie within 28 days
  });
  it('skips daily goals, several goals and seasons', () => {
    expect(goalHint(act(1, 1), log(8), T)).toBe(null);
    expect(goalHint({ ...act(1), goals: [...act(1).goals, { id: 'h', count: 1, days: 7 }] }, log(8), T)).toBe(null);
    expect(goalHint({ ...act(1), season: { summer: [4, 5], winter: [] } }, log(8), T)).toBe(null);
  });
});

describe('templates', () => {
  it('have unique keys, known rings and a goal', () => {
    expect(new Set(SPORT_TEMPLATES.map((t) => t.key)).size).toBe(SPORT_TEMPLATES.length);
    for (const t of SPORT_TEMPLATES) {
      expect(['move', 'mind', 'rest']).toContain(t.ring);
      expect(t.count).toBeGreaterThan(0);
    }
  });
  it('fill a blank activity', () => {
    const a = applyTemplate(blankAct(0), SPORT_TEMPLATES[0], 'Kraft');
    expect(a).toMatchObject({ name: 'Kraft', icon: 'gym', ring: 'move', minMin: 30, goals: [{ count: 2, days: 7 }], season: null });
  });
});
