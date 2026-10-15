// v0.121.0 «Strava-Fahrten zählen mit» (SZ1–SZ2): withStravaRides adds the counted Strava rides to the
// uploaded rides; a ride that is both a file and a Strava entry counts once. Fictional data.
import { describe, it, expect } from 'vitest';
import { withStravaRides, waitingThisMonth } from '../src/lib/kmbook.js';

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

describe('«Werte überall»: climbing from Strava', () => {
  it('keeps the metres climbed of a ride and passes them on as gainM', async () => {
    const { makeEntry, withStravaRides, hmSince } = await import('../src/lib/kmbook.js');
    const e = makeEntry({ date: '2026-10-07', km: 40, source: 'strava', kind: 'ride', bikeId: 'b1', hm: 620 });
    expect(e.hm).toBe(620);
    expect(withStravaRides([], [e])[0].gainM).toBe(620);
    expect(hmSince([e, makeEntry({ date: '2026-10-01', km: 5, source: 'strava', bikeId: 'b1', hm: 80 })], 'b1', '2026-10-02')).toBe(620);
    expect(hmSince([e], 'b2', '2026-10-02')).toBeNull();
  });
});

describe('waitingThisMonth (0.136.0)', () => {
  it('counts the Strava rides of this month that still wait in «Zum Prüfen»', () => {
    const rows = [
      strava('a', '2026-10-02', 40, { state: 'open', bikeId: null }),
      strava('b', '2026-10-09', 42.3, { state: 'open', bikeId: null }),
      strava('c', '2026-09-30', 40, { state: 'open', bikeId: null }), // last month
      strava('d', '2026-10-12', 40, { state: 'open', bikeId: null }), // after today
      strava('e', '2026-10-03', 40), // counted
    ];
    expect(waitingThisMonth(rows, '2026-10-09')).toBe(2);
    expect(waitingThisMonth([], '2026-10-09')).toBe(0);
  });
});

describe('withStravaRides with the Training activities (0.136.0)', () => {
  const act = (id, day, km, extra = {}) => ({ id, day, start: `${day}T06:00:00Z`, km, kind: 'bike', type: 'GravelRide', gearId: 'g1', trainer: false, ...extra });
  it('adds a Strava ride that has no ledger entry (it lies in a bike\'s start km)', () => {
    const out = withStravaRides([], [], [act('2001', '2026-10-08', 42.3)]);
    expect(out).toMatchObject([{ id: 'act:2001', date: '2026-10-08', km: 42.3, source: 'strava' }]);
  });
  it('a ride with a ledger entry follows the entry: counted once, open or removed not at all', () => {
    const acts = [act('1', '2026-10-06', 80), act('2', '2026-10-07', 50), act('3', '2026-10-08', 30)];
    const book = [strava('e1', '2026-10-06', 80, { stravaId: '1' }), strava('e2', '2026-10-07', 50, { stravaId: '2', state: 'open' }), strava('e3', '2026-10-08', 30, { stravaId: '3', state: 'removed' })];
    expect(withStravaRides([], book, acts).map((r) => r.id)).toEqual(['e1']);
  });
  it('leaves out runs, indoor rides without a bike and a ride also uploaded as a file', () => {
    const files = [{ id: 'f1', date: '2026-10-05', km: 40, startAt: '2026-10-05T06:10:00.000Z' }];
    const acts = [
      act('r', '2026-10-04', 9, { kind: 'run', type: 'Run' }),
      act('v', '2026-10-04', 25, { type: 'VirtualRide', gearId: null }),
      act('t', '2026-10-04', 25, { type: 'Ride', trainer: true, gearId: null }),
      act('f', '2026-10-05', 40.5),
    ];
    expect(withStravaRides(files, [], acts).map((r) => r.id)).toEqual(['f1']);
  });  it('a ride on a Strava bike set to «Ignorieren» does not count (Noah 15.10.2026 «2b»)', async () => {
    const { notIgnored, bikeActs } = await import('../src/lib/kmbook.js');
    const acts = [act('1', '2026-10-06', 80, { gearId: 'g1' }), act('2', '2026-10-07', 50, { gearId: 'g2' }), act('3', '2026-10-08', 20, { gearId: null })];
    expect(withStravaRides([], [], notIgnored(acts, ['g2'])).map((r) => r.id)).toEqual(['act:1', 'act:3']);
    expect(notIgnored(acts, undefined)).toHaveLength(3);
    const db = { activities: { where: () => ({ equals: () => ({ toArray: async () => acts }) }) }, settings: { get: async () => ({ value: { ignore: ['g1'] } }) } };
    expect((await bikeActs(db)).map((a) => a.id)).toEqual(['2', '3']);
    expect(await bikeActs({})).toEqual([]);
  });
});
