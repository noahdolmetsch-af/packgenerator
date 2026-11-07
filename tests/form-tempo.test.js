import { describe, it, expect } from 'vitest';
import { readinessOf, readiness, recoveryParts, formSeries } from '../src/lib/form.js';
import { addDays } from '../src/lib/health.js';

// Tempo-Runde (Noah 05.11.2026): readinessOf and recoveryParts were made lighter (no copy of the series per day, days looked up).
// The numbers must stay those of the plain way: readiness() of the series up to that day, recoveryParts of that day.
const from = '2026-01-01';
const to = '2026-12-31';
const days = Array.from({ length: 365 }, (_, i) => addDays(from, i));
const table = new Map(days.filter((_, i) => i % 9 !== 4).map((d, i) => [d, { rhr: 48 + (i % 7), hrv: 55 + (i % 11), sleep: 380 + (i % 6) * 15 }]));
const loads = new Map(days.filter((_, i) => i % 3 !== 1 && i > 20).map((d, i) => [d, 30 + (i % 40)]));
const checks = new Map(days.filter((_, i) => i % 4 === 0).map((d, i) => [d, { sleep: 4 + (i % 6), energy: 3 + (i % 7) }]));

describe('readinessOf, tempo', () => {
  it('gives the same score for every day as readiness() of the series up to that day', () => {
    const got = readinessOf(loads, table, checks, '2026-03-01', to);
    const series = formSeries(loads, addDays('2026-03-01', -7), to);
    const want = new Map();
    series.forEach((s, i) => {
      if (s.day < '2026-03-01') return;
      const c = checks.get(s.day);
      const r = readiness({ series: series.slice(0, i + 1), parts: recoveryParts(table, s.day, c ? { sleep: c.sleep, energy: c.energy } : null) });
      if (r) want.set(s.day, r.score);
    });
    expect(got.size).toBeGreaterThan(250);
    expect([...got]).toEqual([...want]);
  });

  it('counts a load that came before the first shown day', () => {
    // a single load a few days before the first shown day, then nothing: it counts on the shown days (hasLoad is counted from the start of the series)
    const one = new Map([['2026-02-05', 80]]);
    const r = readinessOf(one, new Map(), new Map(), '2026-02-10', '2026-02-12');
    expect(r.size).toBe(3);
    const none = readinessOf(new Map(), new Map(), new Map(), '2026-02-10', '2026-02-12');
    expect(none.size).toBe(0);
  });

  it('recoveryParts looks at the 30 days before, also across a month and year end', () => {
    const t = new Map();
    for (let i = 1; i <= 30; i++) t.set(addDays('2027-01-05', -i), { rhr: 50, hrv: 60 });
    t.set('2027-01-05', { rhr: 56, hrv: 48 });
    const p = recoveryParts(t, '2027-01-05');
    expect(p.find((x) => x.key === 'rhr')).toMatchObject({ normal: 50, delta: 6 });
    expect(p.find((x) => x.key === 'hrv')).toMatchObject({ normal: 60, delta: -20 });
  });
});
