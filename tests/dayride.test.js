// v0.25.1 (Noah 1a, 2a, 3a): a day ride in one tap, the prefilled New trip, weather from the forecast.
// Fictional bikes, trips and items only (test_data_gtp_).
import { describe, it, expect, afterEach } from 'vitest';
import { rideDate, rideName, bikeShort, shortDate, isDayRide, daySource, lastBikeId, presetFor, forecastPreset, dayRidePlan, buildBikeTrip, fetchHomeForecast, wxLabel } from '../src/lib/dayride.js';
import { lang } from '../src/lib/i18n.svelte.js';
import { newTrip } from '../src/lib/trips.js';
import { contextTrip } from '../src/lib/context.js';

afterEach(() => (lang.v = 'en'));

const bikes = [
  { id: 'b1', name: 'test_data_gtp_ Scale 940', setup: { seat: 'bag1', frame: 'bag2' }, slots: ['seat', 'frame'] },
  { id: 'b2', name: 'test_data_gtp_ Gravel', setup: { seat: 'bag1' }, slots: ['seat'] },
];
const trip = (id, f) => ({ id, title: id, bikeId: 'b1', startDate: '2026-09-01', days: 1, entries: [], ...f });

describe('date and name', () => {
  it('today before 14:00, tomorrow from 14:00 (local time)', () => {
    expect(rideDate(new Date(2026, 9, 11, 13, 59))).toBe('2026-10-11');
    expect(rideDate(new Date(2026, 9, 11, 14, 0))).toBe('2026-10-12');
    expect(rideDate(new Date(2026, 9, 31, 20, 0))).toBe('2026-11-01');
    expect(rideDate(new Date(2026, 11, 31, 18, 0))).toBe('2027-01-01');
  });

  it('bike short, day and month', () => {
    expect(bikeShort('Scott Scale 940 2021')).toBe('Scott Scale');
    expect(bikeShort('  Gravel ')).toBe('Gravel');
    expect(shortDate('2026-10-11')).toBe('11.10.');
    expect(shortDate('2026-03-05')).toBe('5.3.');
    expect(shortDate('')).toBe('');
  });

  it('"{bike} day ride {d.M.}", German «Tagestour», more days, no bike', () => {
    expect(rideName({ bike: 'Scott Scale 940', date: '2026-10-11' })).toBe('Scott Scale day ride 11.10.');
    expect(rideName({ bike: 'Scott Scale 940', date: '2026-10-11', days: 3 })).toBe('Scott Scale 3 days 11.10.');
    expect(rideName({ date: '2026-10-11' })).toBe('Ride day ride 11.10.');
    expect(rideName({ label: 'Ski touring', date: '2026-01-02' })).toBe('Ski touring day ride 2.1.');
    expect(rideName({ bike: 'Scott Scale' })).toBe('Scott Scale day ride');
    lang.v = 'de';
    expect(rideName({ bike: 'Scott Scale 940', date: '2026-10-11' })).toBe('Scott Scale Tagestour 11.10.');
    expect(rideName({ date: '2026-10-11' })).toBe('Velo Tagestour 11.10.');
    expect(rideName({ bike: 'Scott Scale', date: '2026-10-11', days: 2 })).toBe('Scott Scale 2 Tage 11.10.');
  });
});

describe('which trip a day ride starts from', () => {
  it('the newest day ride: one day, no night or unknown, not skipped, by bike', () => {
    expect(isDayRide(trip('a', { overnight: 'none' }))).toBe(true);
    expect(isDayRide(trip('a', {}))).toBe(true);
    expect(isDayRide(trip('a', { overnight: 'lodging' }))).toBe(false);
    expect(isDayRide(trip('a', { days: 2 }))).toBe(false);
    expect(isDayRide(trip('a', { skipped: true }))).toBe(false);
    expect(isDayRide(trip('a', { packs: [] }))).toBe(false);
    const trips = [
      trip('old', { startDate: '2026-08-01' }),
      trip('new', { startDate: '2026-09-20', bikeId: 'b2' }),
      trip('weekend', { startDate: '2026-10-01', days: 2, overnight: 'outdoor' }),
      trip('skipped', { startDate: '2026-10-02', skipped: true }),
    ];
    expect(daySource(trips).id).toBe('new');
    expect(daySource([])).toBeNull();
  });

  it('the last bike: newest trip by bike that still exists, else the first bike', () => {
    expect(lastBikeId([trip('a', { bikeId: 'b2', startDate: '2026-10-01', days: 3 }), trip('b', { startDate: '2026-09-01' })], bikes)).toBe('b2');
    expect(lastBikeId([trip('a', { bikeId: 'gone' })], bikes)).toBe('b1');
    expect(lastBikeId([], [])).toBeNull();
  });

  it('plan: from the last day ride, else bike of the last trip, 2 h, Chilly; forecast wins', () => {
    const now = new Date(2026, 9, 11, 9, 0);
    const p0 = dayRidePlan([trip('w', { bikeId: 'b2', days: 3, overnight: 'outdoor' })], bikes, { now });
    expect(p0).toMatchObject({ hours: 2, wx: { min: 6, max: 12, rain: 'none' }, wxFrom: null, startDate: '2026-10-11', title: 'test_data_gtp_ Gravel day ride 11.10.' });
    expect(p0.bike.id).toBe('b2');
    const src = trip('d', { bikeId: 'b1', hours: 3, wx: { min: 16, max: 24, rain: 'showers' } });
    const p1 = dayRidePlan([src], bikes, { now });
    expect(p1).toMatchObject({ hours: 3, wx: { min: 16, max: 24, rain: 'showers' }, source: src });
    expect(p1.bike.id).toBe('b1');
    const p2 = dayRidePlan([src], bikes, { now, forecastWx: { min: -2, max: 4, rain: 'rain' } });
    expect(p2).toMatchObject({ wx: { min: -2, max: 4, rain: 'rain' }, wxFrom: 'forecast' });
    expect(dayRidePlan([], [])).toBeNull();
  });
});

describe('weather from the forecast', () => {
  it('presetFor: the nearest preset by the middle of the range', () => {
    expect(presetFor(-5, 2).name).toBe('Cold');
    expect(presetFor(5, 11).name).toBe('Chilly');
    expect(presetFor(11, 17).name).toBe('Mild');
    expect(presetFor(15, 25).name).toBe('Warm');
    expect(presetFor(24, 34).name).toBe('Hot');
    expect(presetFor(null, 10)).toBeNull();
  });

  const fc = { place: { name: 'test_data_gtp_ Home' }, days: [
    { date: '2026-10-11', min: 4.6, max: 11.2, rainMm: 0, rainPct: 10 },
    { date: '2026-10-12', min: 9, max: 17, rainMm: 7, rainPct: 90 },
    { date: '2026-10-13', min: 9, max: 17, rainMm: 1.5, rainPct: 40 },
  ] };
  it('forecastPreset: the preset for that day, rain by the weather.js rules', () => {
    expect(forecastPreset(fc, '2026-10-11')).toEqual({ min: 6, max: 12, rain: 'none' });
    expect(forecastPreset(fc, '2026-10-12')).toEqual({ min: 10, max: 18, rain: 'rain' });
    expect(forecastPreset(fc, '2026-10-13')).toEqual({ min: 10, max: 18, rain: 'showers' });
    expect(forecastPreset(fc, '2026-11-01')).toBeNull();
    expect(forecastPreset(null, '2026-10-11')).toBeNull();
  });

  const place = { name: 'test_data_gtp_ Home', lat: 47.1, lon: 8.5 };
  const answer = { daily: { time: ['2026-10-11'], temperature_2m_min: [5], temperature_2m_max: [11], precipitation_sum: [0], precipitation_probability_max: [0] } };
  it('fetchHomeForecast: forecast online, null offline, without place, on error or timeout', async () => {
    const ok = async () => ({ ok: true, json: async () => answer });
    expect((await fetchHomeForecast(place, { fetcher: ok, online: true })).days[0]).toMatchObject({ date: '2026-10-11', min: 5, max: 11 });
    expect(await fetchHomeForecast(place, { fetcher: ok, online: false })).toBeNull();
    expect(await fetchHomeForecast(null, { fetcher: ok, online: true })).toBeNull();
    expect(await fetchHomeForecast({ name: 'x' }, { fetcher: ok, online: true })).toBeNull();
    expect(await fetchHomeForecast(place, { fetcher: async () => ({ ok: false, status: 500 }), online: true })).toBeNull();
    const never = () => new Promise(() => {});
    expect(await fetchHomeForecast(place, { fetcher: never, online: true, timeoutMs: 20 })).toBeNull();
  });

  it('wxLabel: preset name, range, rain', () => {
    expect(wxLabel({ min: 6, max: 12, rain: 'none' })).toBe('Chilly');
    expect(wxLabel({ min: 6, max: 12, rain: 'rain' })).toBe('Chilly, rain');
    expect(wxLabel({ min: 8, max: 14, rain: 'showers' })).toBe('8–14 °C, showers');
    lang.v = 'de';
    expect(wxLabel({ min: 6, max: 12, rain: 'rain' })).toBe('Kühl, Regen');
  });
});

describe('one create path for the dialog and the day ride', () => {
  const it_ = (id, f = {}) => ({ id, name: `test_data_gtp_ ${id}`, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], ...f });
  const items = [
    it_('JERSEY', { role: 'worn', defaultBag: 'body' }),
    it_('GEL', { role: 'standard', defaultBag: 'frame', perHours: 1, maxQty: 8 }),
    it_('SLEEPBAG', { sets: ['sleep'] }),
    it_('TOWEL', { sets: ['base'] }),
  ];
  const fields = { hours: 3, overnight: 'none', cook: false, wx: { min: 6, max: 12, rain: 'none' }, event: false };
  const draft = { title: 'test_data_gtp_ Ride', startDate: '2026-10-11', days: 1 };

  it('the same as newTrip + contextTrip (what Create trip did before)', () => {
    const weekend = { ...newTrip({ title: 'test_data_gtp_ Bivvy', startDate: '2026-10-01', days: 2, bike: bikes[0], overnight: 'outdoor' }, [], items, 1), entries: [
      { itemId: 'JERSEY', slot: 'body', qty: 1, packed: true }, { itemId: 'SLEEPBAG', slot: 'seat', qty: 1, packed: true },
    ] };
    const made = buildBikeTrip({ draft, bike: bikes[0], trips: [weekend], items, fields }, 42);
    const base = newTrip({ ...draft, bike: bikes[0], overnight: 'none' }, [weekend], items, 42);
    expect(made).toEqual(contextTrip({ ...base, ...fields }, items, { fromCopy: true }));
    const ids = made.entries.map((e) => e.itemId);
    expect(ids).not.toContain('SLEEPBAG'); // a day ride after a bivvy weekend
    expect(made.entries.find((e) => e.itemId === 'GEL').qty).toBe(3);
    expect(made.entries.every((e) => !e.packed)).toBe(true);
  });

  it('standard set and template starts', () => {
    const std = buildBikeTrip({ draft, bike: bikes[0], start: 'standard', trips: [], items, fields }, 42);
    expect(std.entries.map((e) => e.itemId).sort()).toEqual(['GEL', 'JERSEY']);
    const tpl = { id: 'tp1', name: 'test_data_gtp_ T', entries: [{ itemId: 'TOWEL', slot: 'seat', qty: 1 }], hours: 5 };
    const fromTpl = buildBikeTrip({ draft, bike: bikes[0], start: 'tp1', templates: [tpl], items, fields: { ...fields, hours: null } }, 42);
    expect(fromTpl.templateId).toBe('tp1');
    expect(fromTpl.hours).toBe(5);
  });
});
