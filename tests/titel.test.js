import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { looksLikeFile, readableTitle, needsTitle, tidyTitles, fileOf, dayText } from '../src/lib/touren/titel.js';

describe('looksLikeFile (tour critique 2b)', () => {
  it('finds file names', () => {
    for (const s of ['COURSE_2026-10-12_143022', 'Tour_Zuerich_Uetliberg.gpx', 'track.GPX', 'test_data_gtp_ride', 'tour-am-see-2', 'MorningRideAmSee', '20261012143022', 'activity_123456']) expect(looksLikeFile(s), s).toBe(true);
  });
  it('leaves names people give', () => {
    for (const s of ['Morning Ride', 'Herbsttour am See', 'Uetliberg', 'Zürich–Bern', 'Ride 2', 'Sankt-Gallen', '', null]) expect(looksLikeFile(s), String(s)).toBe(false);
  });
});

describe('readableTitle', () => {
  const trip = { id: 'trip-1', startDate: '2026-10-10', days: 1, title: 'test_data_gtp_track.gpx' };
  it('takes the ride name when it is readable, the own name first', () => {
    expect(readableTitle(trip, [{ name: 'Lunch Ride' }])).toBe('Lunch Ride');
    expect(readableTitle(trip, [{ name: 'Lunch Ride', own: { name: 'Seerunde' } }])).toBe('Seerunde');
  });
  it('skips file-like ride names and falls back to the day', () => {
    expect(readableTitle(trip, [{ name: 'test_data_gtp_upload' }], { fmtDay: (d) => `D${d}` })).toBe('Ride on D2026-10-10');
    expect(readableTitle({}, [])).toBe('Ride');
  });
  it('writes the day with the weekday', () => {
    expect(dayText('2026-10-10', 'de-CH')).toMatch(/10\.10\.2026/);
  });
});

describe('tidyTitles', () => {
  it('renames file-like trips once, keeps the file name, never touches own names', async () => {
    const db = new Dexie(`titel-${Math.random()}`);
    db.version(1).stores({ trips: 'id' });
    await db.trips.bulkPut([
      { id: 'a', title: 'test_data_gtp_track.gpx', startDate: '2026-10-10', days: 1 },
      { id: 'b', title: 'Herbsttour', startDate: '2026-10-11', days: 1 },
      { id: 'c', title: 'test_data_gtp_mine', titleOwn: true, startDate: '2026-10-12', days: 1 },
    ]);
    const acts = [{ id: '1', kind: 'bike', day: '2026-10-10', time: '08:00', name: 'Morning Ride' }];
    expect(await tidyTitles(db, { acts })).toBe(1);
    const a = await db.trips.get('a');
    expect(a.title).toBe('Morning Ride');
    expect(a.fileTitle).toBe('test_data_gtp_track.gpx');
    expect(fileOf(a)).toBe('test_data_gtp_track.gpx');
    expect(needsTitle(a)).toBe(false);
    expect((await db.trips.get('b')).title).toBe('Herbsttour');
    expect((await db.trips.get('c')).title).toBe('test_data_gtp_mine');
    expect(await tidyTitles(db, { acts })).toBe(0);
  });
});
