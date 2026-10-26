// Paket Y «Meine Webcams», «Klimawerte weit voraus», «Prognose gegen Wirklichkeit» (Noah 20.10.2026), made-up data.
import { describe, it, expect } from 'vitest';
import { cleanUrl, isImage, camsOf, addCam, renameCam, removeCam, setHome, moveCam, homeCam, freshSrc, camLabel, WEBCAMS_KEY } from '../src/lib/wetter/webcams.js';
import { DEVICE_SETTINGS } from '../src/lib/db.js';
import { climateFor, archiveUrl } from '../src/lib/wetter/klima.js';
import { noteSaid, hits } from '../src/lib/wetter/treffer.js';
import { parseCore } from '../src/lib/wetter/kern.js';

describe('webcams', () => {
  it('stay on this device: never synced, never in a backup', () => expect(DEVICE_SETTINGS).toContain(WEBCAMS_KEY));
  it('clean addresses only', () => {
    expect(cleanUrl('example.org/cam.jpg')).toBe('https://example.org/cam.jpg');
    expect(cleanUrl('javascript:alert(1)')).toBeNull();
    expect(cleanUrl('nohost')).toBeNull();
    expect(cleanUrl('')).toBeNull();
    expect(isImage('https://x.org/a.JPG?t=1')).toBe(true);
    expect(isImage('https://x.org/live')).toBe(false);
  });
  it('add, rename, home, order, delete', () => {
    let l = addCam([], { name: 'See', url: 'https://x.org/see.jpg' }, 1);
    l = addCam(l, { name: 'Pass', url: 'https://y.org/pass', home: true }, 2);
    expect(l).toHaveLength(2);
    expect(homeCam(l).name).toBe('Pass');
    l = setHome(l, l[0].id);
    expect(homeCam(l).name).toBe('See');
    l = renameCam(l, l[0].id, '  Seeblick ');
    expect(l[0].name).toBe('Seeblick');
    l = moveCam(l, 0, 1);
    expect(l.map((c) => c.name)).toEqual(['Pass', 'Seeblick']);
    expect(moveCam(l, 0, 5)).toBe(l);
    l = removeCam(l, l[0].id);
    expect(l).toHaveLength(1);
    expect(addCam(l, { url: 'nope' })).toBe(l);
  });
  it('a stored value is made safe', () => {
    expect(camsOf([{ id: 'a', url: 'https://x.org/c.png', home: 'yes' }, { id: 'b', url: 'ftp://x' }, null, 'x'])).toEqual([{ id: 'a', name: '', url: 'https://x.org/c.png', home: false }]);
    expect(camsOf(null)).toEqual([]);
  });
  it('a fresh picture every 5 minutes and a label from the host', () => {
    expect(freshSrc('https://x.org/c.jpg', 0)).toBe('https://x.org/c.jpg?pg=0');
    expect(freshSrc('https://x.org/c.jpg?a=1', 6 * 6e4)).toBe('https://x.org/c.jpg?a=1&pg=1');
    expect(camLabel({ name: '', url: 'https://www.cams.example/1' })).toBe('cams.example');
  });
});

describe('climate far ahead', () => {
  const years = [2016, 2017, 2018];
  const time = [];
  const max = [];
  const rain = [];
  for (const y of years)
    for (const d of ['06-28', '06-30', '07-02', '07-20']) {
      time.push(`${y}-${d}`);
      max.push(d === '07-20' ? 40 : 24);
      rain.push(d === '06-30' ? 5 : 0);
    }
  const j = { daily: { time, temperature_2m_max: max, temperature_2m_min: max.map((x) => x - 10), precipitation_sum: rain, wind_speed_10m_max: max.map(() => 20) } };
  it('the usual weather around a day, from the years before', () => {
    const c = climateFor(j, '2027-06-30');
    expect(c).toMatchObject({ tmax: 24, tmin: 14, windMax: 20, days: 9, years: 3 });
    expect(c.rainShare).toBeCloseTo(0.33, 2);
    expect(climateFor({}, '2027-06-30')).toBeNull();
    expect(archiveUrl({ lat: 47.37, lon: 8.54 }, 2016, 2025)).toContain('start_date=2016-01-01');
  });
});

describe('forecast against what came', () => {
  const OFF = 7200;
  const mk = (day0, temps, rainMm = 0) => {
    const t0 = Date.parse(`${day0}T00:00:00Z`) - OFF * 1000;
    const n = temps.length * 24;
    const time = Array.from({ length: n }, (_, i) => (t0 + i * 36e5) / 1000);
    return parseCore({ utc_offset_seconds: OFF, hourly: { time, temperature_2m: time.map((_, i) => temps[Math.floor(i / 24)]), precipitation: time.map(() => rainMm), precipitation_probability: time.map(() => 0) }, daily: { time: [] } });
  };
  it('keeps tomorrow once, then fills in what came', () => {
    const day1 = Date.parse('2026-07-10T10:00:00Z');
    let said = noteSaid({}, mk('2026-07-09', [20, 21, 22]), day1);
    expect(said['2026-07-11'].said.tmax).toBe(22);
    said = noteSaid(said, mk('2026-07-09', [20, 21, 30]), day1); // the first saying counts
    expect(said['2026-07-11'].said.tmax).toBe(22);
    said = noteSaid(said, mk('2026-07-11', [19, 25], 0.5), day1 + 2 * 864e5); // on the 12th: the 11th came with 19 °C and rain
    const h = hits(said);
    expect(h[0]).toMatchObject({ date: '2026-07-11', dT: -3, rainHit: false });
  });
});

describe('webcams on the live map', async () => {
  const { setPlace, camsOnMap, placeOf } = await import('../src/lib/wetter/webcams.js');
  it('a cam gets a place, shows on the map, and leaves it again', () => {
    let l = addCam([], { name: 'Passhöhe', url: 'https://example.org/pass.jpg' }, 1);
    l = addCam(l, { name: 'See', url: 'https://example.org/see' }, 2);
    expect(camsOnMap(l)).toEqual([]);
    l = setPlace(l, l[0].id, { name: 'Testpass', lat: 46.5, lon: 8.4 });
    expect(camsOf(l)[0].place).toEqual({ name: 'Testpass', lat: 46.5, lon: 8.4 });
    const pts = camsOnMap(l);
    expect(pts).toEqual([{ id: l[0].id, cam: l[0].id, lat: 46.5, lon: 8.4, kind: 'webcam', name: 'Passhöhe', minZoom: 0 }]);
    l = setPlace(l, l[0].id, null);
    expect(camsOf(l)[0].place).toBeUndefined();
    expect(camsOnMap(l)).toEqual([]);
  });
  it('drops a broken place', () => {
    expect(placeOf({ lat: 'x', lon: 8 })).toBeNull();
    expect(placeOf({ lat: 120, lon: 8 })).toBeNull();
    expect(placeOf(null)).toBeNull();
    expect(camsOf([{ id: 'cam-1', url: 'https://example.org/a.jpg', place: { lat: 999, lon: 0 } }])[0].place).toBeUndefined();
  });
  it('has its own map symbol', async () => {
    const { KIND_ICON, ICON_SVG } = await import('../src/lib/map/symbols.js');
    expect(ICON_SVG[KIND_ICON.webcam]).toMatch(/<circle/);
    const { KIND_TOKEN } = await import('../src/lib/map/maplib.js');
    expect(KIND_TOKEN.webcam).toBeTruthy();
  });
});

describe('Paket A: what a cam is for, and cams not opened for long (UC-109-I1, I2)', () => {
  it('keeps the purpose and the last day it was opened; old ones show for a tidy-up', async () => {
    const w = await import('../src/lib/wetter/webcams.js');
    let list = w.addCam([], { name: 'test_data_gtp_ Pass', url: 'https://example.org/cam.jpg' });
    const id = list[0].id;
    list = w.setWhy(list, id, '  test_data_gtp_ Passstrasse offen? ');
    expect(w.camsOf(list)[0].why).toBe('test_data_gtp_ Passstrasse offen?');
    expect(w.setWhy(list, id, '')[0].why).toBeUndefined();
    expect(w.staleCams(w.camsOf(list), '2026-10-25')).toEqual([]);
    list = w.markSeen(list, id, '2026-05-01');
    expect(w.staleCams(w.camsOf(list), '2026-10-25').map((c) => c.id)).toEqual([id]);
    expect(w.staleCams(w.camsOf(w.markSeen(list, id, '2026-10-01')), '2026-10-25')).toEqual([]);
  });
});
