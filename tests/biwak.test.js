// «Feierabend-Biwak» (Träume und Neuland N6, Noah 27.10.2026 «1-5 a»): the evening, the places to sleep, the night.
import { describe, it, expect } from 'vitest';
import { biwakCfg, nextEvening, biwakSpots, osmSpots, rideMin, nightWx, weekdayOf, BIWAK_DEFAULT } from '../src/lib/dreams/biwak.js';

const P = 'test_data_gtp_';
const HOME = { lat: 47.38, lon: 8.54 };

describe('the evening', () => {
  it('cleans the setting', () => {
    expect(biwakCfg(null)).toEqual(BIWAK_DEFAULT);
    expect(biwakCfg({ weekday: 9, start: '25:00', back: '08:15', maxKm: 'x' })).toEqual({ ...BIWAK_DEFAULT, back: '08:15' });
    expect(biwakCfg({ weekday: 6, maxKm: 50 })).toMatchObject({ weekday: 6, maxKm: 50 });
  });

  it('takes the next chosen weekday; today only before the start', () => {
    expect(weekdayOf('2026-10-27')).toBe(2); // a Tuesday
    expect(nextEvening('2026-10-27', '08:00', null)).toEqual({ day: '2026-10-30', next: '2026-10-31' });
    expect(nextEvening('2026-10-30', '16:00', null).day).toBe('2026-10-30');
    expect(nextEvening('2026-10-30', '18:00', null).day).toBe('2026-11-06');
    expect(nextEvening('2026-10-27', '08:00', { weekday: 6 })).toEqual({ day: '2026-10-31', next: '2026-11-01' });
  });
});

describe('places to sleep', () => {
  const pts = [
    { id: 'a', kind: 'sleep', name: `${P}Lichtung`, lat: 47.45, lon: 8.6, stars: 3 },
    { id: 'b', kind: 'sleep', name: `${P}Hütte`, lat: 47.5, lon: 8.7, stars: 5 },
    { id: 'c', kind: 'sleep', name: `${P}Nah`, lat: 47.39, lon: 8.55 },
    { id: 'd', kind: 'water', name: `${P}Brunnen`, lat: 47.39, lon: 8.55 },
    { id: 'e', kind: 'sleep', name: `${P}Weit`, lat: 46.5, lon: 8.0 },
  ];

  it('only own places to sleep in reach, best rated first, then nearest', () => {
    const got = biwakSpots(pts, HOME, 30);
    expect(got.map((p) => p.id)).toEqual(['b', 'a', 'c']);
    expect(got[2].km).toBeLessThan(2);
    expect(biwakSpots(pts, HOME, 5).map((p) => p.id)).toEqual(['c']);
    expect(biwakSpots(pts, null)).toEqual([]);
  });

  it('rides there at about 18 km/h on a road 1.3 times the straight line', () => {
    expect(rideMin(12)).toBe(50);
    expect(rideMin(0.5)).toBe(5);
  });
});

describe('the night', () => {
  it('rain of the evening, the coldest of both days', () => {
    const days = [
      { date: '2026-10-30', min: 6, rain: 'none' },
      { date: '2026-10-31', min: 3, rain: 'rain' },
    ];
    expect(nightWx(days, { day: '2026-10-30', next: '2026-10-31' })).toEqual({ min: 3, rain: 'none' });
    expect(nightWx(days, { day: '2026-11-06', next: '2026-11-07' })).toBe(null);
  });
});

describe('free places from OpenStreetMap (Noah 28.10.2026 «2b»)', () => {
  const list = [
    { id: 'node/1', name: `${P}Zeltplatz`, lat: 47.42, lon: 8.56 },
    { id: 'node/2', name: `${P}Hütte`, lat: 47.4, lon: 8.55 },
    { id: 'node/3', name: `${P}Weit`, lat: 46.6, lon: 8.1 },
    { id: 'node/4', name: `${P}Ohne Ort` },
  ];
  it('keeps the places in reach, nearest first, with km', () => {
    const r = osmSpots(list, HOME, 30);
    expect(r.map((p) => p.id)).toEqual(['node/2', 'node/1']);
    expect(r[0].km).toBeGreaterThan(0);
  });
  it('no home: nothing', () => expect(osmSpots(list, null)).toEqual([]));
  it('at most max', () => expect(osmSpots(list, HOME, 30, 1)).toHaveLength(1));
});
