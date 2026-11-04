// «Regen in den nächsten 24 Stunden» (Noah 04.11.2026 «2a»): the strip, the first wet hour, the peak, the end.
import { describe, it, expect } from 'vitest';
import { rainStrip, barPct } from '../src/lib/wetter/regen24.js';

const H = 36e5;
const t0 = Date.UTC(2026, 10, 4, 12); // 04.11.2026 12:00 UTC (fictional place)
const hour = (i, mm, p) => ({ ms: t0 + i * H, rainMm: mm, rainP: p, temp: 8 });
const core = (rows) => ({ hours: rows.map(([i, mm, p]) => hour(i, mm, p)) });
const dryDay = () => Array.from({ length: 30 }, (_, i) => [i, 0, 5]);

describe('rainStrip', () => {
  it('is null without hours in the range', () => {
    expect(rainStrip({ hours: [] }, t0)).toBeNull();
    expect(rainStrip(null, t0)).toBeNull();
  });
  it('says dry when no hour is wet', () => {
    const s = rainStrip(core(dryDay()), t0 + 10 * 60 * 1000);
    expect(s.dry).toBe(true);
    expect(s.from).toBeNull();
    expect(s.bars).toHaveLength(24);
    expect(s.total).toBe(0);
  });
  it('finds the first wet hour and the strongest hour', () => {
    const rows = dryDay();
    rows[4] = [4, 0.4, 70];
    rows[5] = [5, 2.2, 90];
    rows[6] = [6, 1.1, 80];
    const s = rainStrip(core(rows), t0);
    expect(s.dry).toBe(false);
    expect(s.nowWet).toBe(false);
    expect(s.from).toBe(t0 + 4 * H);
    expect(s.peak).toBe(t0 + 5 * H);
    expect(s.total).toBe(3.7);
  });
  it('knows when the rain that falls now ends', () => {
    const rows = dryDay();
    rows[0] = [0, 1.5, 90];
    rows[1] = [1, 0.8, 80];
    const s = rainStrip(core(rows), t0);
    expect(s.nowWet).toBe(true);
    expect(s.to).toBe(t0 + 2 * H);
  });
  it('starts at the current hour and keeps 24 bars', () => {
    const s = rainStrip(core(dryDay()), t0 + 3 * H + 5 * 60000);
    expect(s.bars[0].ms).toBe(t0 + 3 * H);
    expect(s.bars).toHaveLength(24);
  });
});

describe('barPct', () => {
  it('keeps a dry hour thin and scales a wet hour to the strongest', () => {
    expect(barPct({ mm: 0, wet: false }, 2)).toBe(3);
    expect(barPct({ mm: 2, wet: true }, 2)).toBe(100);
    expect(barPct({ mm: 0.1, wet: true }, 5)).toBe(8);
  });
});
