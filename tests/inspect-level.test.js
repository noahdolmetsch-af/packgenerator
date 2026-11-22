// «Seite umbauen» (Noah 21.11.2026, Schritt B): what a check asks for before it starts, for the three cards.
import { describe, it, expect } from 'vitest';
import { levelInfo } from '../src/lib/inspect/levelinfo.js';
import { normList } from '../src/lib/inspect/inspect.js';

const bike = { id: 'b1', name: 'Demo Gravel', type: 'gravel', parts: [] };

describe('levelInfo', () => {
  it('a bigger check has at least as many points and tools as a smaller one', () => {
    const list = normList(null);
    const q = levelInfo(bike, 'quick', list);
    const m = levelInfo(bike, 'monthly', list);
    const f = levelInfo(bike, 'full', list);
    expect(q.points).toBeGreaterThan(0);
    expect(m.points).toBeGreaterThanOrEqual(q.points);
    expect(f.points).toBeGreaterThanOrEqual(m.points);
    expect(m.tools.length).toBeGreaterThanOrEqual(q.tools.length);
    for (const t of q.tools) expect(m.tools).toContain(t);
  });
  it('lists every tool once', () => {
    const f = levelInfo(bike, 'full', normList(null));
    expect(new Set(f.tools).size).toBe(f.tools.length);
  });
  it('a point the person deleted is not counted', () => {
    const list = normList(null);
    const all = levelInfo(bike, 'quick', list).points;
    const some = levelInfo(bike, 'quick', normList({ gone: ['pressure'] })).points;
    expect(some).toBeLessThanOrEqual(all);
  });
});
