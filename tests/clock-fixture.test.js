// Noah 26.10.2026 «1a» (test proposal T2): no browser test depends on the hour it runs at.
// Every spec either imports `test` from tests/e2e/clock.js (12:00 Zurich) or sets its own clock.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { noonToday, midMonthNoon, shiftDate } from './e2e/clock.js';

const dir = new URL('./e2e/', import.meta.url);
const specs = readdirSync(dir).filter((f) => f.endsWith('.spec.js'));

describe('fixed clock in the browser tests', () => {
  it('every spec has a clock', () => {
    const without = specs.filter((f) => {
      const src = readFileSync(new URL(f, dir), 'utf8');
      return !src.includes("from './clock.js'") && !/clock\.(install|setFixedTime|setSystemTime)/.test(src);
    });
    expect(without, 'import { test } from \'./clock.js\' or set a clock in the spec').toEqual([]);
  });

  // 21.11.2026: Playwright writes Date.now() into the page when a spec sets a clock. With the shift on, a spec that sets its
  // own clock but does not import the fixture (150 of them) got a page clock 2–3 days ahead whenever a spec with the
  // fixture had run before it in the same worker (ruhetag, timer, sporttasche … red in a full run, green alone).
  it('Playwright itself reads the real time, the spec and the app read the test day', () => {
    const real = globalThis.__realDate ?? Date;
    shiftDate(-3 * 24 * 3600 * 1000); // the file already shifted at import; this keeps it on whatever the real date is
    try {
      const inPlaywright = new Function('return Date.now();\n//# sourceURL=/x/node_modules/playwright-core/lib/coreBundle.js');
      const inSpec = new Function('return Date.now();\n//# sourceURL=/x/tests/e2e/ruhetag.spec.js');
      const now = real.now();
      expect(Math.abs(inPlaywright() - now), 'Playwright: the real time').toBeLessThan(5000);
      expect(inSpec() - now, 'a spec: shifted').toBeLessThan(-2 * 24 * 3600 * 1000);
    } finally {
      globalThis.__pgShift = 0;
    }
  });

  it('noon is 12:00 in Zurich on the Zurich day', () => {
    expect(noonToday(new Date('2026-10-26T20:00:00Z')).toISOString()).toBe('2026-10-26T11:00:00.000Z');
    expect(noonToday(new Date('2026-07-01T23:30:00Z')).toISOString()).toBe('2026-07-02T10:00:00.000Z');
  });

  it('the test day is a mid-month Wednesday, whatever the real day is', () => {
    for (const real of ['2026-11-01T01:00:00Z', '2026-10-31T23:30:00Z', '2026-12-31T12:00:00Z', '2027-02-28T12:00:00Z', '2026-03-15T12:00:00Z']) {
      const d = midMonthNoon(new Date(real));
      const zurich = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
      expect(zurich.getDay(), real).toBe(3);
      expect(zurich.getDate(), real).toBeGreaterThanOrEqual(15);
      expect(zurich.getDate(), real).toBeLessThanOrEqual(21);
      expect(zurich.getHours(), real).toBe(12);
    }
    expect(midMonthNoon(new Date('2026-11-01T01:00:00Z')).toISOString()).toBe('2026-11-18T11:00:00.000Z');
  });
});
