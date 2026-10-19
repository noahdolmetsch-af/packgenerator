// Paket G extras (Noah 19.10.2026 «1a 2a 3a», «4-6»): Licht, Sonne, Rückenwind on the packing list,
// the air card's numbers, rain on the way and the air words on the server. Fictional data only.
import { describe, it, expect } from 'vitest';
import { lightTip, sunTip, windTip, intoWind, compass, WORDS } from '../src/lib/toursky.js';
import { airDay, airHigh, airPrefs } from '../src/lib/air.js';
import { cleanRain, keepRain, placeNow, rainSoon, rainMessage, airVerdict, airText, cleanAir, RAIN_EVERY_MS } from '../api/_lib/push.js';
import { buildList, atMs, KINDS } from '../src/lib/push/schedule.js';

const own = (id, name, extra = {}) => ({ id, name, ownership: 'owned', ...extra });
const items = [own('l1', 'Stirnlampe'), own('v1', 'Reflexweste'), own('s1', 'Sonnencreme LSF 50'), own('g1', 'Sonnenbrille'), own('gg', 'Gletscherbrille Kat. 4')];
const place = { lat: 47.37, lon: 8.54 };

describe('Licht and Sonne on the packing list', () => {
  it('a ride after sunset asks for light and vest, with the sunset time', () => {
    const trip = { id: 't', startDate: '2026-11-07', days: 1, rideStart: ['15:00'], hours: 5, entries: [{ itemId: 'l1' }] };
    const tip = lightTip(trip, items, place);
    expect(tip.set).toMatch(/^1[67]:\d\d$/);
    expect(tip.want).toEqual([expect.objectContaining({ kind: 'lamp', onList: true }), expect.objectContaining({ kind: 'vest', onList: false, item: expect.objectContaining({ id: 'v1' }) })]);
    expect(lightTip({ ...trip, rideStart: ['08:00'], hours: 3 }, items, place)).toBe(null);
  });
  it('UV from 6 brings sunscreen and sunglasses; on a ski tour from 3 the glacier glasses', () => {
    const fc = (uv) => ({ days: [{ date: '2026-07-04', uv }] });
    const trip = { id: 't', startDate: '2026-07-04', days: 1, entries: [] };
    expect(sunTip({ ...trip, forecast: fc(5) }, items)).toBe(null);
    expect(sunTip({ ...trip, forecast: fc(7.4) }, items)).toMatchObject({ uv: 7, snow: false, want: [{ kind: 'sunscreen' }, { kind: 'sunglasses', item: { id: 'g1' } }] });
    expect(sunTip({ ...trip, domain: 'ski', forecast: fc(3.2) }, items)).toMatchObject({ snow: true, want: [{ kind: 'sunscreen' }, { kind: 'glacier', item: { id: 'gg' } }] });
    expect(sunTip(trip, items)).toBe(null);
    expect(WORDS.sunglasses(items[4])).toBe(false);
  });
});

describe('Rückenwind on a round tour', () => {
  // a triangle: 22 km north, then a long way southeast, then west home (crosswind with a north wind)
  const sq = [[47.0, 8.0], [47.1, 8.0], [47.2, 8.0], [47.13, 8.1], [47.07, 8.2], [47.0, 8.3], [47.0, 8.2], [47.0, 8.1], [47.0, 8.0]];
  const trip = (dir, line = sq) => ({ id: 't', startDate: '2026-07-04', days: 1, route: { line }, forecast: { days: [{ date: '2026-07-04', windDir: dir, wind: 20 }] } });
  it('wind from the north: the planned way ends with a crosswind; the other way round ends going south → reverse', () => {
    expect(intoWind(sq, 0).first).toBeGreaterThan(0);
    expect(windTip(trip(0))).toMatchObject({ way: 'reverse', windFrom: 0, wind: 20 });
  });
  it('wind from the south: the other way round would end into the wind → keep', () => {
    expect(windTip(trip(180))).toMatchObject({ way: 'keep' });
  });
  it('no loop, little wind or several days: nothing', () => {
    expect(windTip(trip(0, sq.slice(0, 5)))).toBe(null);
    expect(windTip({ ...trip(0), forecast: { days: [{ date: '2026-07-04', windDir: 0, wind: 6 }] } })).toBe(null);
    expect(windTip({ ...trip(0), days: 2 })).toBe(null);
  });
  it('names 16 directions', () => {
    expect([0, 45, 180, 270, 350].map(compass)).toEqual(['north', 'northeast', 'south', 'west', 'north']);
  });
});

describe('Ozon und Pollen', () => {
  const hourly = { time: ['2026-07-04T12:00', '2026-07-04T15:00', '2026-07-05T12:00'], ozone: [150, 195.4, 90], birch_pollen: [0, 0, 0], grass_pollen: [20, 80, 10], alder_pollen: [0, 0, 0], mugwort_pollen: [0, 0, 0], ragweed_pollen: [0, 0, 0] };
  it('the day maximum, strong after the Swiss classes, as chosen', () => {
    const d = airDay(hourly, '2026-07-04');
    expect(d).toMatchObject({ ozone: 195, pollen: { grass: 80 } });
    expect(airHigh(d)).toEqual({ ozone: 195, pollen: [{ key: 'grass', max: 80 }] });
    expect(airHigh(d, airPrefs({ ozone: false, pollen: ['birch'] }))).toEqual({ ozone: null, pollen: [] });
    expect(airHigh(airDay(hourly, '2026-07-05'))).toEqual({ ozone: null, pollen: [] });
  });
  it('the server words the morning message the same way', () => {
    const v = airVerdict(hourly, '2026-07-04', cleanAir(null));
    expect(v).toEqual({ ozone: 195, pollen: [{ key: 'grass', max: 80 }] });
    expect(airText(v, { ozone: 'Viel Ozon ({n}).', pollen: 'Pollen: {list}.', pollenNames: { grass: 'Gräser' } })).toBe('Viel Ozon (195). Pollen: Gräser.');
    expect(airText({ ozone: null, pollen: [] }, {})).toBe('');
  });
});

describe('Regen unterwegs', () => {
  const T = Date.parse('2026-07-04T08:00:00Z');
  const w = cleanRain({ key: 'rain:t', title: 'Testtour', url: '#/pack', points: [{ at: T, lat: 47, lon: 8 }, { at: T + 1800e3, lat: 47.1, lon: 8.1 }, { at: 'x' }] });
  it('keeps clean points; the place now is the last one passed, until 30 min after the end', () => {
    expect(w.points).toHaveLength(2);
    expect(w.at).toBe(T);
    expect(placeNow(w, T - 1)).toBe(null);
    expect(placeNow(w, T + 1900e3)).toMatchObject({ lat: 47.1 });
    expect(placeNow(w, T + 1800e3 + 1801e3)).toBe(null);
    expect(keepRain([w], [{ ...w, at: T + RAIN_EVERY_MS, warned: 5 }])[0]).toMatchObject({ at: T + RAIN_EVERY_MS, warned: 5 });
  });
  it('dry now and rain within 45 minutes → minutes; already raining or dry → nothing', () => {
    expect(rainSoon({ precipitation: [0, 0, 0.5, 1] })).toBe(30);
    expect(rainSoon({ precipitation: [0.4, 0.8, 1, 1] })).toBe(null);
    expect(rainSoon({ precipitation: [0, 0.1, 0, 0] })).toBe(null);
    expect(rainMessage(w, 30, { rain: 'Regen in {min} Min auf {trip}.' })).toMatchObject({ body: 'Regen in 30 Min auf Testtour.', tag: 'rain:t' });
  });
  it('the app sends the expected places every 30 minutes of the ride, the light alarm the evening before', () => {
    const now = new Date(2026, 6, 3, 10, 0);
    const trips = [{ id: 'a', title: 'Testtour', status: 'planned', startDate: '2026-07-04', days: 1, rideStart: ['16:00'], hours: 6, route: { km: 60, start: { lat: 47, lon: 8 }, line: [[47, 8], [47.2, 8.2], [47.4, 8.4]] } }];
    const all = { on: true, kinds: Object.fromEntries(KINDS.map((k) => [k.key, true])) };
    const l = buildList({ trips, repairs: [], bikes: [], settings: { push: all, air: { pollen: ['grass'] } }, lastBackup: null, now });
    expect(l.rain).toHaveLength(1);
    expect(l.rain[0].points[0]).toMatchObject({ at: atMs('2026-07-04', '16:00'), lat: 47, lon: 8 });
    expect(l.rain[0].points.length).toBeGreaterThan(3);
    expect(l.items.find((i) => i.key.startsWith('dark:'))).toMatchObject({ at: atMs('2026-07-03', '19:00') });
    expect(l.air).toEqual({ ozone: true, pollen: ['grass'] });
    expect(l.texts.pollenNames.grass).toBeTruthy();
  });
});
