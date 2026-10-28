// «TSS vom Gerät zählt in der Form» (Noah 28.10.2026 «1a»): fictional rides and activities.
import { describe, it, expect } from 'vitest';
import { withFitLoad, sameRide } from '../src/lib/fitload.js';
import { loadOf, dayLoads } from '../src/lib/form.js';

const act = (o = {}) => ({ id: 'a1', day: '2026-10-08', start: '2026-10-08T07:00:00Z', kind: 'bike', km: 50, movingS: 7200, effort: 60, ...o });
const fit = (o = {}) => ({ id: 'ride-1', source: 'fit', date: '2026-10-08', startAt: '2026-10-08T07:05:00Z', km: 50.4, device: { tss: 95, te: 3.2, teAn: 1 }, ...o });

describe('TSS from the device', () => {
  it('a FIT ride that is also on Strava gives that activity its TSS, once', () => {
    const a = act();
    const r = withFitLoad([a], [fit()]);
    expect(r.extra).toEqual([]);
    expect(r.acts[0].tssDevice).toBe(95);
    expect(a.tssDevice).toBeUndefined();
    expect(loadOf(r.acts[0])).toEqual({ load: 95, how: 'device' });
  });
  it('a FIT ride without a Strava twin adds its TSS to its day', () => {
    const r = withFitLoad([act({ day: '2026-10-07' })], [fit()]);
    expect(r.extra).toEqual([{ day: '2026-10-08', tss: 95, rideId: 'ride-1' }]);
    const table = new Map([['2026-10-08', { day: '2026-10-08', acts: [], fitTss: 95 }]]);
    expect(dayLoads(r.acts, {}, table).get('2026-10-08')).toBe(95);
    expect(dayLoads(r.acts, {}, table).get('2026-10-07')).toBe(60);
  });
  it('other km, another start or another sport is not the same ride', () => {
    expect(sameRide(act({ km: 30 }), fit())).toBe(false);
    expect(sameRide(act({ start: '2026-10-08T12:00:00Z' }), fit())).toBe(false);
    expect(sameRide(act({ kind: 'run' }), fit())).toBe(false);
    expect(sameRide(act(), fit())).toBe(true);
  });
  it('rides without TSS, GPX rides and two FIT files for one activity', () => {
    expect(withFitLoad([act()], [fit({ device: { te: 3 } }), fit({ source: 'gpx' })])).toEqual({ acts: [act()], extra: [] });
    const r = withFitLoad([act()], [fit(), fit({ id: 'ride-2', device: { tss: 80 } })]);
    expect(r.acts[0].tssDevice).toBe(95);
    expect(r.extra).toEqual([{ day: '2026-10-08', tss: 80, rideId: 'ride-2' }]);
  });
});
