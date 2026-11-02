// «Bereit für den Traum?» (Träume und Neuland N16, Noah 27.10.2026 «1-5 a»): what you have and what is missing.
import { describe, it, expect } from 'vitest';
import { needOf, ridesOf, daysInRow, readiness, DAY_KM } from '../src/lib/dreams/bereit.js';

const TODAY = '2026-10-27';
const P = 'test_data_gtp_';

describe('what a dream asks', () => {
  it('splits km and climb over the days', () => {
    expect(needOf({ days: 3, route: { km: 360, gainM: 6000 } })).toEqual({ days: 3, kmDay: 120, gainDay: 2000 });
    expect(needOf({ days: 2, facts: { km: 100, gainM: null } })).toEqual({ days: 2, kmDay: 50, gainDay: null });
    expect(needOf({})).toEqual({ days: 1, kmDay: null, gainDay: null });
  });
});

describe('your rides of the last year', () => {
  it('takes Strava bike rides and uploads on other days, not runs, trainer rides or old ones', () => {
    const list = ridesOf(
      {
        activities: [
          { day: '2026-09-01', type: 'Ride', km: 140, hm: 1800 },
          { day: '2026-09-02', type: 'Run', km: 30, hm: 300 },
          { day: '2026-09-03', type: 'VirtualRide', trainer: true, km: 60 },
          { day: '2025-09-01', type: 'Ride', km: 300 },
        ],
        rides: [
          { date: '2026-09-01', km: 140 },
          { date: '2026-08-01', km: 90, gainM: 900 },
        ],
      },
      TODAY,
    );
    expect(list).toEqual([
      { day: '2026-09-01', km: 140, gainM: 1800 },
      { day: '2026-08-01', km: 90, gainM: 900 },
    ]);
  });

  it('counts days in a row with enough km', () => {
    const r = (day, km) => ({ day, km, gainM: 0 });
    expect(daysInRow([r('2026-07-01', 50), r('2026-07-02', 60), r('2026-07-03', 10), r('2026-07-03', 15), r('2026-07-05', 80)])).toBe(3);
    expect(daysInRow([r('2026-07-01', DAY_KM - 1)])).toBe(0);
  });
});

describe('ready for the dream', () => {
  const activities = [
    { day: '2026-07-01', type: 'Ride', km: 110, hm: 1200 },
    { day: '2026-07-02', type: 'GravelRide', km: 95, hm: 1500 },
  ];
  it('says what you have and what is still missing', () => {
    const r = readiness({ title: `${P}Alpen`, days: 3, route: { km: 360, gainM: 6000 } }, { activities, items: [], today: TODAY });
    expect(r).toEqual([
      { key: 'km', ok: true, have: 110, need: 120, missing: 0 },
      { key: 'gain', ok: false, have: 1500, need: 2000, missing: 500 },
      { key: 'days', ok: false, have: 2, need: 3, missing: 1 },
      { key: 'sleep', ok: false, have: 0, need: 1, missing: 1 },
    ]);
  });

  it('counts sleeping gear you still own, and a day trip needs neither', () => {
    const items = [{ category: 'sleep' }, { category: 'sleep', ownership: 'gone' }];
    expect(readiness({ days: 2, facts: { km: 100 } }, { activities, items, today: TODAY }).find((x) => x.key === 'sleep')).toMatchObject({ ok: true, have: 1 });
    expect(readiness({ days: 1, facts: { km: 80 } }, { activities, items: [], today: TODAY }).map((x) => x.key)).toEqual(['km']);
    expect(readiness({ days: 1 }, { activities, today: TODAY })).toEqual([]);
  });
});
