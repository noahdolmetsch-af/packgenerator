// Paket U4 «Schlafplätze im Rennen» (src/lib/race/sleep.js, outside.js roofs). Fictional data only
// (test_data_gtp_ names, a made-up line near Bern).
import { describe, it, expect } from 'vitest';
import { SPOTS, spotOf, ownSpots, quality, nightWx, nightMode, sleepOptions, eveningTarget, isAfternoon, hotelsToCall, langAt, lateText, telOf, napNeed, napLeft, nightsByWeather } from '../src/lib/race/sleep.js';
import { kindOf, poisFrom, poiQuery } from '../src/lib/race/outside.js';
import { lineKm, msOf } from '../src/lib/race/race.js';
import de from '../src/lib/i18n/de/index.js';

// a straight line north from Bern, about 111 km
const route = { km: 111, line: Array.from({ length: 21 }, (_, i) => [46.9 + i * 0.05, 7.45]) };
const pts = lineKm(route);
const at = (km, extra = {}) => ({ lat: 46.9 + km / 111.2, lon: 7.45, km, offKm: 0.1, ...extra });

// an hourly forecast from `start` (ms) for 48 h
const series = (start, temp, rain) => ({ hourly: { time: Array.from({ length: 48 }, (_, i) => start / 1000 + i * 3600), temperature_2m: Array(48).fill(temp), precipitation_probability: Array(48).fill(rain) } });

describe('1137 · more roofs from OpenStreetMap', () => {
  it('asks for bus stops with a roof, huts, waiting rooms, bivouac boxes and toilets', () => {
    const q = poiQuery(pts);
    expect(q).toContain('node["highway"="bus_stop"]["shelter"="yes"]');
    expect(q).toContain('node["tourism"="wilderness_hut"]');
    expect(q).toContain('node["amenity"="waiting_room"]');
    expect(q).toContain('node["amenity"="toilets"]');
  });
  it('sorts the roofs into the shelter kind with their sub kind', () => {
    expect(kindOf({ highway: 'bus_stop', shelter: 'yes' })).toBe('shelter');
    expect(kindOf({ tourism: 'wilderness_hut' })).toBe('shelter');
    expect(kindOf({ amenity: 'waiting_room' })).toBe('shelter');
    expect(kindOf({ amenity: 'toilets' })).toBe('toilet');
    expect(kindOf({ tourism: 'hotel' })).toBe('sleep');
    const json = {
      elements: [
        { type: 'node', id: 1, lat: 46.95, lon: 7.451, tags: { highway: 'bus_stop', shelter: 'yes', name: 'test_data_gtp_ Halt' } },
        { type: 'node', id: 2, lat: 47.0, lon: 7.451, tags: { amenity: 'shelter', shelter_type: 'picnic_shelter', drinking_water: 'yes' } },
        { type: 'node', id: 3, lat: 47.1, lon: 7.451, tags: { tourism: 'wilderness_hut', fireplace: 'yes' } },
        { type: 'node', id: 4, lat: 47.2, lon: 7.451, tags: { tourism: 'hotel', name: 'test_data_gtp_ Hotel', phone: '+41 31 000 00 00', 'contact:email': 'test@example.org' } },
      ],
    };
    const list = poisFrom(json, pts);
    expect(list.map((p) => [p.kind, p.sub])).toEqual([
      ['shelter', 'bus_stop'],
      ['shelter', 'picnic_shelter'],
      ['shelter', 'wilderness_hut'],
      ['sleep', 'hotel'],
    ]);
    expect(list[1].water).toBe(true);
    expect(list[3]).toMatchObject({ phone: '+41 31 000 00 00', mail: 'test@example.org' });
    expect(list.map(spotOf)).toEqual(['bus', 'hut', 'bivouac', 'hotel']);
  });
});

describe('1143 · open at night', () => {
  it('only 24/7 petrol stations, shops and stations count, and the rest is not a place to sleep', () => {
    expect(spotOf({ kind: 'fuel', hours: '24/7' })).toBe('night');
    expect(spotOf({ kind: 'station', hours: '24/7' })).toBe('night');
    expect(spotOf({ kind: 'fuel', hours: 'Mo-Su 06:00-22:00' })).toBeNull();
    expect(spotOf({ kind: 'water' })).toBeNull();
    expect(spotOf({ kind: 'sleep', sub: 'camp_site' })).toBe('camp');
  });
});

describe('1141 · own spots and lists', () => {
  it('own points of kind sleep near the route become places; a list keeps its name', () => {
    const own = [
      { id: 'a', kind: 'sleep', name: 'test_data_gtp_ Scheune', lat: 47.0, lon: 7.452, stars: 4, night: '2025-06-20' },
      { id: 'b', kind: 'sleep', name: 'test_data_gtp_ Liste 1', lat: 47.1, lon: 7.45, src: 'test_data_gtp_ Veranstalter.gpx' },
      { id: 'c', kind: 'water', name: 'test_data_gtp_ Brunnen', lat: 47.0, lon: 7.45 },
      { id: 'd', kind: 'sleep', name: 'far away', lat: 47.0, lon: 8.2 },
    ];
    const list = ownSpots(own, pts);
    expect(list.map((p) => [p.spot, p.name])).toEqual([
      ['own', 'test_data_gtp_ Scheune'],
      ['list', 'test_data_gtp_ Liste 1'],
    ]);
    expect(list[0]).toMatchObject({ stars: 4, night: '2025-06-20' });
    expect(list[0].km).toBeGreaterThan(10);
  });
});

describe('1142 · spot quality and the night', () => {
  it('a hotel has a bed, water and WC; a roof finds water and WC within 400 m', () => {
    const roof = at(20, { kind: 'shelter', sub: 'bus_stop' });
    const water = at(20.2, { kind: 'water' });
    const wc = at(23, { kind: 'toilet' });
    expect(quality(roof, [roof, water, wc])).toMatchObject({ roof: true, bed: false, water: true, wc: false, offM: 100 });
    expect(quality(at(30, { kind: 'sleep', sub: 'hotel' }), [])).toMatchObject({ roof: true, bed: true, water: true, wc: true });
    expect(quality(at(30, { kind: 'sleep', sub: 'camp_site' }), [])).toMatchObject({ roof: false, wc: true });
  });
  it('the night: the coldest hour and the highest rain chance, and what that means for the order', () => {
    const s = series(0, 4, 70);
    expect(nightWx(s, 0, 8 * 36e5)).toEqual({ low: 4, rain: 70 });
    expect(nightWx(null, 0, 1)).toEqual({ low: null, rain: null });
    expect(nightMode({ rain: 70, low: 10 }, 5)).toBe('rain');
    expect(nightMode({ rain: 10, low: 2 }, 5)).toBe('cold');
    expect(nightMode({ rain: 10, low: 12 }, 5)).toBeNull();
  });
});

describe('1138 · Wo schlafe ich heute?', () => {
  const now = msOf('2026-07-01T18:00');
  const pois = [
    at(10, { id: 'h', kind: 'sleep', sub: 'hotel', name: 'test_data_gtp_ Hotel' }),
    at(15, { id: 'b', kind: 'shelter', sub: 'bus_stop' }),
    at(5, { id: 'w', kind: 'water' }),
    at(2, { id: 'past', kind: 'sleep', sub: 'hotel' }),
    at(40, { id: 'f', kind: 'fuel', hours: '24/7' }),
  ];
  it('the next places ahead by km, with km to go and the arrival at the pace', () => {
    const r = sleepOptions({ pois, pts, km: 4, now, kmh: 20 });
    expect(r.list.map((p) => p.id)).toEqual(['h', 'b', 'f']);
    expect(r.list[0]).toMatchObject({ spot: 'hotel', distKm: 6 });
    expect(r.list[0].at).toBe(now + 0.3 * 36e5);
    expect(r.mode).toBeNull();
  });
  it('only the kinds switched on, and the range', () => {
    expect(sleepOptions({ pois, pts, km: 4, now, kinds: ['bus', 'night'] }).list.map((p) => p.id)).toEqual(['b', 'f']);
    expect(sleepOptions({ pois, pts, km: 4, now, rangeKm: 20 }).list.map((p) => p.id)).toEqual(['h', 'b']);
  });
  it('roofs first when it rains, beds first when it is cold', () => {
    const camp = at(8, { id: 'c', kind: 'sleep', sub: 'camp_site' });
    const rain = { points: [{ km: 0 }], series: [series(now - 36e5, 12, 80)] };
    expect(sleepOptions({ pois: [camp, ...pois], pts, km: 4, now, wx: rain }).list.map((p) => p.id)).toEqual(['h', 'b', 'c', 'f']);
    const cold = { points: [{ km: 0 }], series: [series(now - 36e5, 1, 0)] };
    const r = sleepOptions({ pois: [camp, ...pois], pts, km: 4, now, wx: cold, bagC: 5 });
    expect(r.mode).toBe('cold');
    expect(r.list.map((p) => p.id)).toEqual(['h', 'b', 'c', 'f']);
    expect(r.list[0].low).toBe(1);
  });
});

describe('1139 · hotels late', () => {
  it('the evening target: the next planned night, else 21:00 at the pace', () => {
    const now = msOf('2026-07-01T15:00');
    const plan = { blocks: [{ kind: 'sleep', from: msOf('2026-07-01T22:00'), to: msOf('2026-07-02T03:00') }], kmAt: () => 180 };
    expect(eveningTarget({ plan, km: 100, now })).toMatchObject({ km: 180, planned: true });
    expect(eveningTarget({ km: 100, now, kmh: 20 })).toMatchObject({ km: 220, at: msOf('2026-07-01T21:00'), planned: false });
    expect(eveningTarget({ km: 100, now: msOf('2026-07-01T22:30'), kmh: 20 })).toMatchObject({ km: 120 });
    expect(isAfternoon(msOf('2026-07-01T12:00'))).toBe(true);
    expect(isAfternoon(msOf('2026-07-01T11:59'))).toBe(false);
  });
  it('the hotels near the target with the arrival and the reception', () => {
    const now = msOf('2026-07-01T15:00');
    const pois = [
      at(60, { id: 'a', kind: 'sleep', sub: 'hotel', phone: '+41 31 000 00 01', hours: 'Mo-Su 07:00-20:00' }),
      at(50, { id: 'b', kind: 'sleep', sub: 'guest_house', hours: 'Mo-Su 07:00-23:00' }),
      at(90, { id: 'far', kind: 'sleep', sub: 'hotel' }),
      at(55, { id: 'camp', kind: 'sleep', sub: 'camp_site' }),
    ];
    const list = hotelsToCall({ pois, target: { km: 58 }, now, km: 0, kmh: 15 });
    expect(list.map((p) => p.id)).toEqual(['a', 'b']);
    expect(list[0]).toMatchObject({ late: false, closes: '20:00' });
    expect(list[0].at).toBe(now + 4 * 36e5);
    expect(hotelsToCall({ pois, target: { km: 58 }, now, km: 0, kmh: 5 })[0]).toMatchObject({ late: true });
  });
  it('the sentence in the language of the place', () => {
    expect(langAt(46.95, 7.45)).toBe('de');
    expect(langAt(46.52, 6.63)).toBe('fr');
    expect(langAt(46.0, 8.95)).toBe('it');
    expect(langAt(45.0, 9.0, 'IT')).toBe('it');
    expect(langAt(48.0, 11.5)).toBe('de');
    expect(langAt(45.8, 4.8)).toBe('fr');
    expect(langAt(52.0, -1.0)).toBe('en');
    expect(lateText('fr', '22:30')).toContain('vers 22:30');
    expect(lateText('it', '22:30')).toContain('verso le 22:30');
    expect(lateText('de', '22:30')).toContain('etwa um 22:30');
    expect(lateText('xx', '22:30')).toContain('around 22:30');
    expect(telOf('+41 31 000 00 00; +41 79 000 00 00')).toBe('+41310000000');
  });
});

describe('1140 · power naps', () => {
  it('suggests a nap after X hours awake, earlier in the small hours', () => {
    expect(napNeed({ awakeH: 19, hour: 14 })).toBe('long');
    expect(napNeed({ awakeH: 12, hour: 3 })).toBe('night');
    expect(napNeed({ awakeH: 8, hour: 3 })).toBeNull();
    expect(napNeed({ awakeH: 13, hour: 14, afterH: 12 })).toBe('long');
    expect(napLeft(10_000, 4_000)).toBe(6);
    expect(napLeft(1_000, 4_000)).toBe(0);
    expect(napLeft(NaN, 0)).toBeNull();
  });
});

describe('1144 · nights by the weather', () => {
  const from = msOf('2026-07-01T23:00');
  const nights = [{ n: 1, km: 100, from, to: from + 6 * 36e5, kind: 'bivy' }];
  it('a drier place within reach is suggested, with the km and hours to shift', () => {
    const wx = { points: [{ km: 50 }, { km: 100 }, { km: 130 }], series: [series(from - 12 * 36e5, 10, 30), series(from - 12 * 36e5, 10, 80), series(from - 12 * 36e5, 9, 20)] };
    const [r] = nightsByWeather({ nights, wx, kmh: 20 });
    expect(r).toMatchObject({ n: 1, rain: 80, low: 10 });
    expect(r.best).toMatchObject({ km: 130, rain: 20, shiftKm: 30 });
    expect(r.best.shiftH).toBeCloseTo(1.5);
  });
  it('nothing when no place is clearly better, and a night ridden through is left out', () => {
    const wx = { points: [{ km: 100 }, { km: 120 }], series: [series(from - 12 * 36e5, 10, 30), series(from - 12 * 36e5, 11, 20)] };
    expect(nightsByWeather({ nights, wx })[0].best).toBeNull();
    expect(nightsByWeather({ nights: [{ ...nights[0], kind: 'through' }], wx })).toEqual([]);
    expect(nightsByWeather({ nights, wx: null })).toEqual([]);
  });
  it('a warmer place counts too', () => {
    const wx = { points: [{ km: 90 }, { km: 100 }], series: [series(from - 12 * 36e5, 8, 20), series(from - 12 * 36e5, 2, 20)] };
    expect(nightsByWeather({ nights, wx, bagC: 5 })[0].best).toMatchObject({ km: 90, low: 8, shiftKm: -10 });
  });
});

describe('the words', () => {
  it('every spot kind has a German name', () => {
    for (const s of SPOTS) expect(de[s.name], s.name).toBeTruthy();
  });
});
