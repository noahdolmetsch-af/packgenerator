import { describe, it, expect } from 'vitest';
import { lampPlan, LAMP_FRAC } from '../src/lib/live/lamp.js';

// a made-up place and day: Zurich in July, sunset about 21:30 local, sunrise about 05:30
const lat = 47.4;
const lon = 8.5;
const at = (h, m = 0) => Date.UTC(2026, 6, 10, h, m); // UTC; local = UTC + 2

describe('lampPlan', () => {
  it('needs a position', () => {
    expect(lampPlan({ lat: null, lon, now: at(10) })).toBeNull();
  });
  it('says day when no darkness is ahead', () => {
    const r = lampPlan({ lat, lon, now: at(8), endAt: at(14) });
    expect(r.state).toBe('day');
    expect(r.darkH).toBe(0);
  });
  it('counts the dark hours up to the finish and compares them with the lamp', () => {
    // ride from 12:00 UTC (14:00 local) to 23:00 UTC (01:00 local): about 3.5 h of dark
    const now = at(12);
    const endAt = at(23);
    const ok = lampPlan({ lat, lon, now, endAt, burnH: 10, frac: LAMP_FRAC.full });
    expect(ok.darkH).toBeGreaterThan(2.5);
    expect(ok.darkH).toBeLessThan(4.5);
    expect(ok.state).toBe('ok');
    const short = lampPlan({ lat, lon, now, endAt, burnH: 10, frac: LAMP_FRAC.low });
    expect(short.state).toBe('short');
    const tight = lampPlan({ lat, lon, now, endAt, burnH: ok.darkH + 0.2, frac: 1 });
    expect(tight.state).toBe('tight');
  });
  it('says until when the lamp lasts', () => {
    const now = at(12);
    expect(lampPlan({ lat, lon, now, endAt: at(23), burnH: 10, frac: 0.5 }).untilAt).toBe(now + 5 * 36e5);
  });
  it('looks 10 hours ahead without a finish', () => {
    const r = lampPlan({ lat, lon, now: at(17), burnH: 10, frac: 1 });
    expect(r.darkH).toBeGreaterThan(0);
  });
});
