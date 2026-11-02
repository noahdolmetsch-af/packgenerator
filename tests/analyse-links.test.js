// «Was hängt zusammen?» (D5): the rules of lib/analyse/links.js. Fictional days only.
import { describe, it, expect } from 'vitest';
import { pairsOf, fitOf, strengthOf, niceStep, strongest, afterTicks, MIN_PAIRS } from '../src/lib/analyse/links.js';
import { addDays } from '../src/lib/analyse.js';

const days = Array.from({ length: 30 }, (_, i) => addDays('2026-09-10', i));
const idx = (d) => days.indexOf(d);

describe('pairs and the straight line', () => {
  it('y comes offset days later; keep drops days', () => {
    const p = pairsOf(days.slice(0, 3), (d) => idx(d), (d) => idx(d) * 10, 1);
    expect(p).toEqual([{ d: days[0], x: 0, y: 10 }, { d: days[1], x: 1, y: 20 }, { d: days[2], x: 2, y: 30 }]);
    expect(pairsOf(days.slice(0, 3), idx, idx, 0, (d) => d !== days[1])).toHaveLength(2);
  });
  it('a perfect line: r 1, slope and intercept; too few days: null', () => {
    const f = fitOf(days.map((d) => ({ d, x: idx(d), y: 3 + 2 * idx(d) })));
    expect(f.r).toBeCloseTo(1);
    expect(f.b).toBeCloseTo(2);
    expect(f.a).toBeCloseTo(3);
    expect(fitOf(days.slice(0, MIN_PAIRS - 1).map((d) => ({ x: idx(d), y: idx(d) })))).toBeNull();
    expect(fitOf(days.map((d) => ({ x: 1, y: idx(d) })))).toBeNull();
  });
  it('words and round steps', () => {
    expect([0.05, -0.2, 0.41, -0.8].map(strengthOf)).toEqual(['none', 'weak', 'medium', 'strong']);
    expect(niceStep(27)).toBe(20);
    expect(niceStep(38)).toBe(50);
    expect(niceStep(0.3)).toBeCloseTo(0.2);
    expect(niceStep(0)).toBe(1);
  });
});

describe('strongest links and after-tick days', () => {
  const sauna = new Set(days.filter((_, i) => i % 3 === 0));
  const items = [
    { key: 'act:sauna', group: 'aktiv', tick: true, get: (d) => (sauna.has(d) ? 1 : 0) },
    { key: 'sleep', group: 'sleep', get: (d) => (sauna.has(addDays(d, -1)) ? 450 : 400) + (idx(d) % 2) },
    { key: 'eff', group: 'sleep', get: (d) => 90 + (idx(d) % 2) },
    { key: 'rhr', group: 'heart', get: (d) => 50 + ((idx(d) * 7) % 5) },
  ];
  it('finds sauna → sleep the night after, the strongest first; never the same group the same day', () => {
    const list = strongest(items, days);
    expect(list[0]).toMatchObject({ x: 'act:sauna', y: 'sleep', offset: 1 });
    expect(list[0].r).toBeGreaterThan(0.9);
    expect(list.some((l) => l.x === 'sleep' && l.y === 'eff' && l.offset === 0)).toBe(false);
    expect(list.some((l) => l.y === 'act:sauna')).toBe(false);
  });
  it('after the days of an activity', () => {
    const a = afterTicks(days.slice(0, 29), sauna, items[1].get, 1);
    expect(a.diff).toBeCloseTo(50, 0);
    expect(a.above).toBe(a.n);
    expect(afterTicks(days.slice(0, 4), sauna, items[1].get, 1)).toBeNull();
  });
});
