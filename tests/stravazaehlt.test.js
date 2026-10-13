// v0.119.0 «Strava-Fahrten zählen mit» (SZ1–SZ2): withStravaRides adds the counted Strava rides to the
// uploaded rides; a ride that is both a file and a Strava entry counts once. Fictional data.
import { describe, it, expect } from 'vitest';
import { withStravaRides } from '../src/lib/kmbook.js';

const strava = (id, date, km, extra = {}) => ({ id, date, time: `${date}T06:00:00.000Z`, km, kind: 'ride', source: 'strava', state: 'counted', bikeId: 'b1', ...extra });

describe('withStravaRides', () => {
  it('adds the counted Strava rides to the files', () => {
    const files = [{ id: 'f1', date: '2026-10-01', km: 40, startAt: '2026-10-01T07:00:00.000Z' }];
    const out = withStravaRides(files, [strava('s1', '2026-10-06', 80), strava('s2', '2026-10-08', 35)]);
    expect(out.map((r) => r.id)).toEqual(['f1', 's1', 's2']);
    expect(out[1]).toMatchObject({ date: '2026-10-06', km: 80, bikeId: 'b1', source: 'strava' });
  });

  it('leaves out open, manual and non-ride entries', () => {
    const out = withStravaRides([], [
      strava('open', '2026-10-06', 80, { state: 'open' }),
      strava('manual', '2026-10-06', 80, { source: 'manual' }),
      strava('reading', '2026-10-06', 80, { kind: 'reading' }),
    ]);
    expect(out).toEqual([]);
  });

  it('counts a ride that is a file and a Strava entry once (the file)', () => {
    const files = [{ id: 'f1', date: '2026-09-27', km: 30, startAt: '2026-09-27T06:10:00.000Z' }];
    expect(withStravaRides(files, [strava('s1', '2026-09-27', 30.5)]).map((r) => r.id)).toEqual(['f1']);
    // same day, other start: two rides
    expect(withStravaRides(files, [strava('s2', '2026-09-27', 30, { time: '2026-09-27T15:00:00.000Z' })]).map((r) => r.id)).toEqual(['f1', 's2']);
    // same day, very different km: two rides
    expect(withStravaRides(files, [strava('s3', '2026-09-27', 80)]).map((r) => r.id)).toEqual(['f1', 's3']);
  });

  it('copes with nothing', () => {
    expect(withStravaRides()).toEqual([]);
    expect(withStravaRides(null, null)).toEqual([]);
  });
});
