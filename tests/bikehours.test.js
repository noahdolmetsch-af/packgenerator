// «Velo im Griff» #193 (Noah 19.10.2026): riding hours per bike from Strava moving times, else km ÷ average speed («≈»).
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { hourSeries, hoursSince, hoursOn, hoursText, speedOf } from '../src/lib/bikehours.js';

const B = 'test_data_gtp_gravel';
const e = (date, km, extra = {}) => ({ id: `${date}-${km}`, bikeId: B, date, km, state: 'counted', kind: 'ride', stravaId: null, ...extra });

describe('riding hours', () => {
  it('takes the speed of the bike, else of its kind', () => {
    expect(speedOf({ kind: 'road' })).toBe(25);
    expect(speedOf({ type: 'Gravel' })).toBe(20);
    expect(speedOf({ type: 'Hardtail' })).toBe(14);
    expect(speedOf({ kind: 'mtb', avgKmh: 16 })).toBe(16);
  });

  it('counts Strava moving time exactly and estimates the rest', () => {
    const bike = { id: B, kind: 'gravel', km: 1000 };
    const entries = [
      e('2026-01-01', 800, { kind: 'start' }),
      e('2026-05-01', 60, { stravaId: '111' }),
      e('2026-05-02', 40),
      e('2026-05-03', 100, { state: 'open' }), // not counted
      { ...e('2026-05-04', 50), bikeId: 'other' },
    ];
    const s = hourSeries(bike, entries, [{ id: 111, movingS: 3 * 3600 }]);
    expect(s.exact).toBe(3);
    expect(s.est).toBe(42); // (800 + 40) / 20
    expect(s.total).toBe(45);
    expect(s.days.map((d) => d.day)).toEqual(['2026-01-01', '2026-05-01', '2026-05-02']);
    expect(hoursOn(s, '2026-05-01')).toBe(43);
    // since a service on 1 May: only the ride of 2 May, estimated
    expect(hoursSince(s, { date: '2026-05-01', km: 860 })).toEqual({ hours: 2, est: true });
    // since 30 April: the Strava ride and the estimate
    expect(hoursSince(s, { date: '2026-04-30' })).toEqual({ hours: 5, est: true });
    // only exact hours after
    const s2 = hourSeries(bike, entries.slice(0, 2), [{ id: '111', movingS: 7200 }]);
    expect(hoursSince(s2, { date: '2026-04-30' })).toEqual({ hours: 2, est: false });
  });

  it('estimates from the km without a ledger, nothing without km', () => {
    const s = hourSeries({ id: B, kind: 'mtb', km: 1400 }, [], []);
    expect(s).toMatchObject({ total: 100, est: 100, exact: 0 });
    expect(hoursSince(s, { date: '2026-01-01', km: 700 })).toEqual({ hours: 50, est: true });
    expect(hoursSince(s, { date: '2026-01-01', hours: 90 })).toEqual({ hours: 10, est: true });
    expect(hoursSince(s, { date: '2026-01-01' })).toBe(null);
    expect(hourSeries({ id: B }, [], []).total).toBe(null);
    expect(hoursSince(null, { date: '2026-01-01' })).toBe(null);
  });

  it('writes hours with «≈» when estimated', () => {
    expect(hoursText(45)).toBe('45 h');
    expect(hoursText(45.4, true)).toBe('≈ 45 h');
    expect(hoursText(2.25)).toBe('2.3 h');
    expect(hoursText(null)).toBe('');
  });
});
