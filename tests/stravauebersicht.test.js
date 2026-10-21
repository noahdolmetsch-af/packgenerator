import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { dhms, clock } from '../src/lib/touren/strava/fmt.js';
import { rideWxOf, rideWxUrl, dirOf, skyOf, needsRideWx, DIRS, RIDE_WX_V } from '../src/lib/touren/ridewx.js';
import { withActs } from '../src/lib/review/rueckblick.js';
import { rideTime, rideTimeS, elapsed, elapsedS } from '../src/lib/review/fmt.js';
import DE from '../src/lib/i18n/de/index.js';

// «Wie Strava» (Noah 21.10.2026). Fictional rides only.
describe('elapsed time and pauses as dd:hh:mm:ss', () => {
  it('always with days and hours', () => {
    expect(dhms(1605)).toBe('00:00:26:45');
    expect(dhms(34289)).toBe('00:09:31:29');
    expect(dhms(94500)).toBe('01:02:15:00');
    expect(dhms(null)).toBe('–');
    expect(clock(1179)).toBe('19:39');
  });
});

describe('the weather at the start of a ride', () => {
  const data = { hourly: { time: ['2026-10-20T15:00', '2026-10-20T16:00'], temperature_2m: [18, 17.2], apparent_temperature: [17, 16], relative_humidity_2m: [60, 66], wind_speed_10m: [5, 6.8], wind_direction_10m: [20, 25], weather_code: [2, 3] } };
  it('the hour the ride started', () => {
    expect(rideWxOf(data, '16:05')).toEqual({ v: RIDE_WX_V, t: 17.2, feel: 16, hum: 66, wind: 6.8, dir: 25, code: 3 });
    expect(rideWxOf(data, '03:00')).toBeNull();
  });
  it('sky and compass point; the archive for older days', () => {
    expect(skyOf(3).key).toBe('Cloudy|sky');
    expect(dirOf(25)).toBe('NNE|wind');
    expect(dirOf(359)).toBe('N|wind');
    expect(rideWxUrl({ lat: 47.37, lon: 8.54 }, '2026-01-02', '2026-10-21')).toMatch(/^https:\/\/archive-api/);
    expect(needsRideWx({ line: 'abc', day: '2026-10-20' })).toBe(true);
    expect(needsRideWx({ line: 'abc', day: '2026-10-20', wxRide: { v: RIDE_WX_V } })).toBe(false);
  });
  it('every word has a German entry', () => {
    const keys = [...DIRS, 'Clear|sky', 'Mostly clear|sky', 'Partly cloudy|sky', 'Cloudy|sky', 'Fog|sky', 'Drizzle|sky', 'Rain|sky', 'Snow|sky', 'Thunderstorm|sky', 'Feels like', 'Wind speed', 'Humidity', 'Wind direction', 'Overview like Strava', 'Show more|strava', 'Show less|strava'];
    expect(keys.filter((k) => !DE[k])).toEqual([]);
  });
});

describe('the tiles of a tour ridden with Strava only («2 leere Kacheln»)', () => {
  const row = { id: 't1', rides: [], km: null, gainM: null, movingH: null, totalH: null, kmh: null, pauses: null };
  const acts = [
    { id: 'a1', kind: 'bike', km: 20.7, hm: 255, movingS: 4091, elapsedS: 34289, pauses: { n: 9, secs: 30000 } },
    { id: 'a2', kind: 'bike', km: 5.55, hm: 41, movingS: 1179, elapsedS: 1605, pauses: { n: 2, secs: 426 } },
    { id: 'w1', kind: 'walk', km: 3, movingS: 2000 },
  ];
  it('takes the numbers of the Strava rides', () => {
    const r = withActs(row, acts);
    // the pause time as Strava counts it: elapsed minus moving time of each ride (Strava check 21.10.2026)
    expect(r).toMatchObject({ km: 26.3, gainM: 296, movingH: 1.46, kmh: 17.9, pauses: { n: 11, secs: 30624 }, fromActs: true });
  });
  it('keeps a row with uploaded rides and a row without Strava rides', () => {
    const up = { ...row, rides: [{ id: 'r1' }], km: 12 };
    expect(withActs(up, acts)).toBe(up);
    expect(withActs(row, [])).toBe(row);
  });
});

// Noah 21.10.2026 «fahrtzeit wird aktuell in m geliefert. dringend korrigieren auf geeignetes format (auch bei
// mehrtägigen touren)»: one format for the riding time everywhere
describe('the riding time never reads as minutes', () => {
  it('one day with the unit h, several days as dd:hh:mm:ss', () => {
    expect(rideTime(2.97)).toBe('2:58 h');
    expect(rideTimeS(1179)).toBe('0:20 h');
    expect(rideTimeS(6 * 3600 + 45 * 60)).toBe('6:45 h');
    // a tour of four days: 31 h 20 min in the saddle
    expect(rideTime(31 + 20 / 60)).toBe('01:07:20:00');
    expect(rideTimeS(3 * 86400 + 4 * 3600 + 5 * 60 + 6)).toBe('03:04:05:06');
    expect(rideTime(null)).toBe('–');
    expect(rideTimeS(0)).toBe('–');
  });
  it('the elapsed time always as dd:hh:mm:ss', () => {
    expect(elapsed(9.5)).toBe('00:09:30:00');
    expect(elapsedS(1605)).toBe('00:00:26:45');
    expect(elapsedS(null)).toBe('–');
  });
});

// Strava check 21.10.2026: «1:60» on the axis, and the pause time as Strava counts it
describe('no «1:60», pauses as elapsed minus moving', () => {
  it('rounds the minutes before splitting hours', async () => {
    const { durationText } = await import('../src/lib/touren/tour.js');
    expect(durationText(7180)).toBe('2:00');
    expect(durationText(9000)).toBe('2:30');
  });
  it('pause time = elapsed − moving; the counted stops only without both', async () => {
    const { pauseSecs } = await import('../src/lib/training.js');
    expect(pauseSecs({ elapsedS: 1605, movingS: 1179, pauses: { n: 2, secs: 300 } })).toBe(426);
    expect(pauseSecs({ elapsedS: 1605, movingS: 1179, own: { movingS: 1200 } })).toBe(405);
    expect(pauseSecs({ movingS: 1179, pauses: { n: 2, secs: 300 } })).toBe(300);
    expect(pauseSecs({})).toBe(null);
  });
});

// Strava check 21.10.2026: the own FTP or Strava's instead of the estimate (180 against 255 W)
describe('the FTP in use', () => {
  it('own first, then Strava, else the estimate; NP of several rides one way', async () => {
    const { ftpEstimate, ftpGuess } = await import('../src/lib/training.js');
    const review = await import('../src/lib/review/power.js');
    const { applyFtp, cleanFtp } = await import('../src/lib/strava/ftp.svelte.js');
    const { ftpLabel } = await import('../src/lib/strava/ftpstate.svelte.js');
    const { npOfRides } = await import('../src/lib/training/act/power.js');
    const acts = [{ day: '2026-10-07', w20: 190, wDevice: true }];
    expect(ftpEstimate(acts, '2026-10-09')).toBe(181);
    expect(ftpLabel()).toBe('FTP estimated');
    applyFtp(null, { w: 255 });
    expect(ftpEstimate(acts, '2026-10-09')).toBe(255);
    expect(review.ftpEstimate(acts, '2026-10-09')).toBe(255);
    expect(ftpGuess(acts, '2026-10-09')).toBe(181);
    expect(ftpLabel()).toBe('FTP from Strava');
    applyFtp({ own: 262 }, { w: 255 });
    expect(ftpEstimate([], '2026-10-09')).toBe(262);
    expect(ftpLabel()).toBe('Your FTP');
    // an FTP typed in the live map's data pages counts as own
    applyFtp(null, { w: 255 }, { ftp: 248 });
    expect(ftpEstimate([], '2026-10-09')).toBe(248);
    applyFtp(null, null);
    expect(ftpEstimate([], '2026-10-09')).toBe(null);
    expect(cleanFtp('30')).toBe(null);
    expect(cleanFtp('254.6')).toBe(255);
    // 4th-power mean weighted by time: one function for the tour page and the Rückblick
    expect(npOfRides([{ wNorm: 200, movingS: 3600 }, { wNorm: 100, movingS: 3600 }])).toBe(171);
    expect(npOfRides([{ wNorm: 200 }])).toBe(null);
  });
});

describe('the FTP is kept and saved', () => {
  it('keeps Strava’s FTP once, an own one wins and can be taken back', async () => {
    const { createDb } = await import('../src/lib/db.js');
    const { keepStravaFtp, saveOwnFtp, STRAVA_FTP_KEY, OWN_FTP_KEY } = await import('../src/lib/strava/ftp.svelte.js');
    const db = createDb(`ftp-${Math.random()}`);
    await keepStravaFtp(db, 255, new Date('2026-10-21T10:00:00Z'));
    await keepStravaFtp(db, null);
    expect((await db.settings.get(STRAVA_FTP_KEY)).value).toEqual({ w: 255, at: '2026-10-21T10:00:00.000Z' });
    expect(await saveOwnFtp('20', db)).toBe(false);
    expect(await saveOwnFtp('262', db)).toBe(true);
    expect((await db.settings.get(OWN_FTP_KEY)).value).toEqual({ own: 262 });
    await saveOwnFtp(null, db);
    expect(await db.settings.get(OWN_FTP_KEY)).toBe(undefined);
  });
});

// Strava check 21.10.2026: the NP from the watts stream (Strava's weighted average was 147, the ride's NP ~168)
describe('NP from the watts stream', () => {
  it('30-second rolling average, 4th-power mean, stops left out', async () => {
    const { npOf } = await import('../api/strava.js');
    const time = Array.from({ length: 1201 }, (_, i) => i);
    expect(npOf(time, time.map(() => 200))).toBe(200);
    // 10 min hard, 10 min easy: NP above the average of 175
    const hard = time.map((i) => (i < 600 ? 300 : 50));
    const np = npOf(time, hard);
    expect(np).toBeGreaterThan(220);
    expect(np).toBeLessThan(300);
    // a stop of 10 min at 0 W pulls the NP down unless the moving flag leaves it out
    const stop = time.map((i) => (i < 600 ? 200 : 0));
    const moving = time.map((i) => i < 600);
    expect(npOf(time, stop, moving)).toBe(200);
    expect(npOf(time, stop)).toBeLessThan(200);
    expect(npOf([0, 1], [100, 100])).toBe(null);
  });
});

describe('the NP from the stream stays', () => {
  it('replaces Strava’s weighted average and stays when the list comes again', async () => {
    const { createDb } = await import('../src/lib/db.js');
    const { keepActivities, loadDetail } = await import('../src/lib/strava/client.svelte.js');
    const db = createDb(`np-${Math.random()}`);
    const act = { id: '71', type: 'GravelRide', startLocal: '2026-10-07T08:05:00Z', km: 40, movingS: 6000, wNorm: 147, wDevice: true };
    await keepActivities(db, [act]);
    await loadDetail(db, '71', { call: async () => ({ ok: true, np: 168, dv: 5 }) });
    expect(await db.activities.get('71')).toMatchObject({ wNorm: 168, npS: 168, wStrava: 147 });
    await keepActivities(db, [act]);
    expect(await db.activities.get('71')).toMatchObject({ wNorm: 168, wStrava: 147 });
    await loadDetail(db, '71', { call: async () => ({ ok: true, np: 169, dv: 5 }) });
    expect(await db.activities.get('71')).toMatchObject({ wNorm: 169, wStrava: 147 });
  });
});
