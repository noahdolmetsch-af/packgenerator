import { describe, it, expect } from 'vitest';
import { dayPicture } from '../src/lib/analyse/daypicture.js';

describe('Tagesbild', () => {
  it('sleep from midnight to waking, hours, rides and ticks', () => {
    const hrH = Array.from({ length: 24 }, (_, i) => (i < 6 ? 50 : 70));
    const p = dayPicture(
      { night: { start: '23:20', end: '06:50' }, fit: { hrH, stepH: Array(24).fill(null) }, acts: [{ start: '2026-10-09T17:10:00', elapsedS: 5400, name: 'Ride' }] },
      [{ actId: 'sauna', at: '2026-10-09T20:30:00' }, { actId: 'x' }],
      (id) => id.toUpperCase(),
    );
    expect(p.sleep).toEqual([{ from: 0, to: 6 + 50 / 60 }]);
    expect(p.hr[0]).toBe(50);
    expect(p.steps).toBeNull();
    expect(p.rides).toEqual([{ from: 17 + 10 / 60, to: 18 + 40 / 60, name: 'Ride' }]);
    expect(p.ticks).toEqual([{ h: 20.5, name: 'SAUNA' }]);
    expect(p.any).toBe(true);
  });
  it('a night that starts after midnight; an empty day', () => {
    expect(dayPicture({ night: { start: '00:40', end: '07:00' } }).sleep).toEqual([{ from: 40 / 60, to: 7 }]);
    expect(dayPicture(null).any).toBe(false);
  });
});
