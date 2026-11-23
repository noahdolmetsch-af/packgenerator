// «Erlebtes Wetter im Rückblick» (Wetter-Ausbau E, Noah 22.11.2026 «a»): the answer «Weather» from what came.
import { describe, it, expect } from 'vitest';
import { plannedRange, livedWeather, weatherVerdict, prefill, tripDays, ensureTripWeather, livedText, FELT_DIFF } from '../src/lib/wetter/erlebt.js';

const day = (date, min, max, rainMm = 0, wind = 10) => ({ date, min, max, rainMm, wind, gust: wind + 8, hourly: { t: [], r: [] } });
const trip = (plan, days, extra = {}) => ({ id: 't1', startDate: '2026-10-01', days: 1, place: { lat: 47.39, lon: 8.04 }, ...(plan ? { wx: plan } : {}), ...(days ? { wxReal: { fetchedAt: 'x', place: { lat: 1, lon: 2 }, days } } : {}), ...extra });
const say = { t: (k, v = {}) => k.replace(/\{(\w+)\}/g, (_, n) => v[n]), num: (n) => String(n) };

describe('planned and lived weather', () => {
  it('reads the plan and what came', () => {
    expect(plannedRange(trip({ min: 6, max: 14 }))).toEqual({ min: 6, max: 14 });
    expect(plannedRange(trip(null))).toBeNull();
    expect(plannedRange(trip({ min: 6 }))).toBeNull();
    expect(livedWeather(trip(null, [day('2026-10-01', 3, 9, 2, 25)]))).toEqual({ tmin: 3, tmax: 9, mm: 2, wind: 25 });
    expect(livedWeather(trip(null, null))).toBeNull();
  });
});

describe('weatherVerdict', () => {
  const plan = { min: 6, max: 14 }; // the middle is 10
  it('is «planned» within three degrees', () => {
    expect(weatherVerdict(trip(plan, [day('2026-10-01', 7, 15)]))).toBe('planned');
    expect(weatherVerdict(trip(plan, [day('2026-10-01', 5, 11)]))).toBe('planned');
  });
  it('is «colder» and «warmer» from the limit on', () => {
    expect(FELT_DIFF).toBe(3);
    expect(weatherVerdict(trip(plan, [day('2026-10-01', 2, 10)]))).toBe('colder'); // middle 6
    expect(weatherVerdict(trip(plan, [day('2026-10-01', 10, 16)]))).toBe('warmer'); // middle 13
  });
  it('says nothing without a plan or without what came', () => {
    expect(weatherVerdict(trip(null, [day('2026-10-01', 2, 10)]))).toBeNull();
    expect(weatherVerdict(trip(plan, null))).toBeNull();
  });
});

describe('prefill', () => {
  const t = trip({ min: 6, max: 14 }, [day('2026-10-01', 2, 8)]);
  it('suggests for a draft nobody has answered', () => expect(prefill({ status: 'draft', weather: 'planned' }, t)).toBe('colder'));
  it('never overwrites a tapped answer or a finished debrief', () => {
    expect(prefill({ status: 'draft', weather: 'planned', weatherTouched: true }, t)).toBeNull();
    expect(prefill({ status: 'done', weather: 'planned' }, t)).toBeNull();
  });
  it('does nothing when the answer already fits', () => expect(prefill({ status: 'draft', weather: 'colder' }, t)).toBeNull());
  it('does nothing without a verdict', () => expect(prefill({ status: 'draft', weather: 'planned' }, trip(null, null))).toBeNull());
});

describe('ensureTripWeather', () => {
  const answer = { daily: { time: ['2026-10-01'], temperature_2m_min: [4], temperature_2m_max: [11], precipitation_sum: [1], wind_speed_10m_max: [20], wind_gusts_10m_max: [30] }, hourly: { time: [] } };
  const fetcher = async (u) => { fetcher.url = u; return { ok: true, json: async () => answer }; };
  const store = () => { const log = []; return { log, trips: { update: async (id, v) => log.push([id, v]) } }; };

  it('asks once for a trip that is over and keeps the answer with it', async () => {
    const db = store();
    const w = await ensureTripWeather(db, trip({ min: 6, max: 14 }), '2026-10-09', { fetcher, online: true });
    expect(w.days).toHaveLength(1);
    expect(fetcher.url).toContain('start_date=2026-10-01');
    expect(db.log[0][0]).toBe('t1');
    expect(db.log[0][1].wxReal.days[0].min).toBe(4);
  });
  it('does not ask when it is kept, offline, not over yet, or without a place', async () => {
    const db = store();
    expect(await ensureTripWeather(db, trip(null, [day('2026-10-01', 1, 2)]), '2026-10-09', { fetcher, online: true })).toBeNull();
    expect(await ensureTripWeather(db, trip(null, null), '2026-10-09', { fetcher, online: false })).toBeNull();
    expect(await ensureTripWeather(db, trip(null, null), '2026-10-01', { fetcher, online: true })).toBeNull();
    expect(await ensureTripWeather(db, trip(null, null, { place: null }), '2026-10-09', { fetcher, online: true })).toBeNull();
    expect(db.log).toEqual([]);
  });
  it('lets a failing service throw and stores nothing', async () => {
    const db = store();
    await expect(ensureTripWeather(db, trip(null, null), '2026-10-09', { fetcher: async () => ({ ok: false, status: 500 }), online: true })).rejects.toThrow();
    expect(db.log).toEqual([]);
  });
});

describe('tripDays and livedText', () => {
  it('names the days of the trip', () => {
    expect(tripDays(trip(null, null, { days: 3 }))).toEqual({ from: '2026-10-01', to: '2026-10-03' });
    expect(tripDays({})).toBeNull();
  });
  it('writes one line', () => {
    expect(livedText({ tmin: 4, tmax: 11, mm: 3, wind: 28 }, say)).toBe('4–11 °C, {mm} mm rain, wind up to 28 km/h'.replace('{mm}', '3'));
    expect(livedText({ tmin: 5, tmax: 5, mm: 0, wind: null }, say)).toBe('5 °C, dry');
    expect(livedText(null, say)).toBe('');
  });
});
