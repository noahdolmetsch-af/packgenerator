// «Muster entdeckt» (Noah 03.11.2026, Idee 5): late sessions per day.
import { describe, it, expect } from 'vitest';
import { startHour, isLate, lateOf, LATE_HOUR } from '../src/lib/analyse/late.js';

describe('isLate', () => {
  it('counts the end of the session, not its start', () => {
    expect(isLate({ time: '17:30', movingS: 5400, elapsedS: 5400 })).toBe(true); // ends 19:00
    expect(isLate({ time: '17:30', movingS: 3600, elapsedS: 3600 })).toBe(false); // ends 18:30
    expect(isLate({ time: '18:45', movingS: 600 })).toBe(false); // ends 18:55
    expect(isLate({ time: '23:30', movingS: 3600 })).toBe(true);
    expect(LATE_HOUR).toBe(19);
  });
  it('uses the elapsed time before the moving time, and knows when it cannot tell', () => {
    expect(isLate({ time: '17:00', movingS: 3600, elapsedS: 8000 })).toBe(true);
    expect(isLate({ movingS: 3600 })).toBeNull();
    expect(startHour({ time: '07:05' })).toBeCloseTo(7.083, 2);
  });
});

describe('lateOf', () => {
  const late = { time: '18:00', movingS: 4000 };
  const early = { time: '07:00', movingS: 3600 };
  it('counts the late sessions; 0 for a day without one; null for a day off', () => {
    expect(lateOf({ acts: [early, late, late] })).toBe(2);
    expect(lateOf({ acts: [early] })).toBe(0);
    expect(lateOf({ acts: [] })).toBeNull();
    expect(lateOf({ acts: [{ movingS: 100 }] })).toBeNull();
    expect(lateOf(undefined)).toBeNull();
  });
});

import { strongest } from '../src/lib/analyse/links.js';

describe('the links find «late sessions → sleep the night after»', () => {
  it('ranks the pair when sleep is shorter after late days', () => {
    const days = Array.from({ length: 40 }, (_, i) => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10));
    const lateDay = new Map(days.map((d, i) => [d, (i * 7) % 5 < 2 ? 1 : 0]));
    // the night ends on the morning after a late day: shorter by about 40 minutes
    const sleep = (d) => {
      const prev = days[days.indexOf(d) - 1];
      return prev ? 450 - (lateDay.get(prev) ? 40 : 0) + (days.indexOf(d) % 3) * 5 : null;
    };
    const top = strongest(
      [
        { key: 'late', group: 'sports', get: (d) => lateDay.get(d) ?? null },
        { key: 'sleep', group: 'sleep', get: sleep },
      ],
      days,
    );
    expect(top[0]).toMatchObject({ x: 'late', y: 'sleep', offset: 1 });
    expect(top[0].r).toBeLessThan(-0.5);
  });
});
