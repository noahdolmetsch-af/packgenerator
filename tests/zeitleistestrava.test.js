// Zeitleiste aus Strava (Noah 21.10.2026 «1 a und b»): the server lists every pause of 5 minutes and more with its
// clock time and km, the place of segments and climbs, and the photos; the Rückblick builds its timeline from them.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { pausesOf, clockAfter, placeOf, trimEfforts, trimClimbs, trimPhotos, PAUSE_LIST_S } from '../api/strava.js';
import { stravaRides, timeline } from '../src/lib/review/ganz.js';

// one point per 10 s over 2 h; 10 m per point; a stop of 20 min after 30 min, one of 3 min after 1 h
const time = [];
const dist = [];
const moving = [];
let tt = 0;
let dd = 0;
for (let i = 0; i < 720; i++) {
  time.push(tt);
  dist.push(dd);
  const still = (i >= 180 && i < 300) || (i >= 400 && i < 418);
  moving.push(!still);
  tt += 10;
  if (!still) dd += 50;
}

describe('the server: pauses, segments and photos with their place', () => {
  it('lists the pauses of 5 minutes and more with the clock time and km', () => {
    const p = pausesOf(time, moving, 60, dist, '2026-10-07T08:05:00Z');
    expect(p.n).toBe(2);
    expect(p.secs).toBe(1200 + 180);
    expect(PAUSE_LIST_S).toBe(300);
    expect(p.list).toEqual([{ t: 1800, at: '08:35', km: 9, min: 20 }]);
  });
  it('writes the clock time after the start, also past midnight', () => {
    expect(clockAfter('2026-10-07T08:05:00Z', 3600)).toBe('09:05');
    expect(clockAfter('2026-10-07T23:30:00Z', 3600)).toBe('00:30');
    expect(clockAfter('', 60)).toBe(null);
  });
  it('gives segments and climbs their km and clock time from start_index', () => {
    const where = { time, dist, startLocal: '2026-10-07T08:05:00Z' };
    expect(placeOf({ start_index: 100 }, where)).toEqual({ from: 5, t: 1000, at: '08:21' });
    expect(placeOf({}, where)).toEqual({});
    const [seg] = trimEfforts([{ name: 'test_data_gtp_ Seeweg', moving_time: 300, pr_rank: 1, start_index: 100 }], where);
    expect(seg).toEqual({ name: 'test_data_gtp_ Seeweg', s: 300, pr: 1, from: 5, t: 1000, at: '08:21' });
    const [c] = trimClimbs([{ name: 'test_data_gtp_ Hügel', moving_time: 600, start_index: 500, segment: { distance: 2000, average_grade: 6, elevation_high: 620, elevation_low: 500 } }], where);
    expect(c).toMatchObject({ name: 'test_data_gtp_ Hügel', km: 2, hm: 120, from: dist[500] / 1000, at: '09:28' });
  });
  it('keeps the photos with where they were taken, no position', () => {
    const list = [
      { unique_id: 'x', caption: ' test_data_gtp_ Aussicht ', created_at: '2026-10-07T06:25:00Z', urls: { 600: 'https://example.test/s.jpg', 1024: 'https://example.test/b.jpg' }, location: [47.3, 8.5] },
      { caption: 'kein Bild', urls: { 600: 'http://example.test/x.jpg' } },
    ];
    const out = trimPhotos(list, { time, dist, startLocal: '2026-10-07T08:05:00Z', start: '2026-10-07T06:05:00Z' });
    expect(out).toEqual([{ url: 'https://example.test/b.jpg', caption: 'test_data_gtp_ Aussicht', t: 1200, at: '08:25', km: 6 }]);
    expect(JSON.stringify(out)).not.toContain('47.3');
    expect(trimPhotos(null)).toEqual([]);
  });
});

describe('the Rückblick: a timeline from Strava rides', () => {
  const trip = { id: 'test_data_gtp_t', startDate: '2026-10-07', days: 1 };
  const act = {
    id: '9',
    day: '2026-10-07',
    time: '08:05',
    start: '2026-10-07T06:05:00Z',
    kind: 'bike',
    type: 'Ride',
    name: 'test_data_gtp_ Morgenrunde',
    km: 36,
    movingS: 6000,
    elapsedS: 7200,
    pauses: { n: 2, secs: 1380, list: [{ t: 1800, at: '08:35', km: 9, min: 20 }] },
    segs: [{ name: 'test_data_gtp_ Seeweg', s: 300, pr: 1, from: 5, t: 1000, at: '08:21' }, { name: 'test_data_gtp_ ohne Rang', s: 200, pr: null, from: 7, t: 1400 }],
    climbs: [{ name: 'test_data_gtp_ Hügel', s: 600, km: 2, grade: 6, hm: 120, from: 22, t: 4830 }],
    photos: [{ url: 'https://example.test/b.jpg', caption: 'test_data_gtp_ Aussicht', t: 1200, km: 6 }],
  };
  it('takes rides only, with start, end, pauses, best times, climbs and photos', () => {
    expect(stravaRides([{ ...act, id: '1', kind: 'run', type: 'Run' }])).toEqual([]);
    const [r] = stravaRides([act]);
    expect(r).toMatchObject({ date: '2026-10-07', startAt: '2026-10-07T06:05:00.000Z', totalH: 2, km: 36 });
    expect(r.pauses).toEqual([{ at: '2026-10-07T06:35:00.000Z', km: 9, min: 20 }]);
    expect(r.marks.map((m) => m.kind)).toEqual(['best', 'climb']);
    const line = timeline({ trip, rides: [r] });
    expect(line.map((e) => [e.kind, e.km])).toEqual([
      ['start', 0],
      ['best', 5],
      ['photo', 6],
      ['pause', 9],
      ['climb', 22],
      ['end', 36],
    ]);
    // numbers for start, pause and end (map and profile); best times, climbs and photos show their km only
    expect(line.filter((e) => e.n).map((e) => e.kind)).toEqual(['start', 'pause', 'end']);
  });
});
