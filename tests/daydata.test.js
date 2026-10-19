// Tageswerte für die Erkenntnisse (Noah 19.10.2026 «2a 3a»): fictional data only, calendar days.
import { describe, it, expect } from 'vitest';
import { weatherDays, mergeDays, eventCounts, keepDayWeather, keepDayEvents, weatherUrl, DAY_WEATHER, DAY_EVENTS, KEEP_DAYS, PAST_DAYS } from '../src/lib/daydata.js';
import { HOME_PLACE } from '../src/lib/know.js';

const TODAY = '2026-10-19';
const PLACE = { name: 'Testdorf', lat: 46.9, lon: 7.4 };

/** A tiny in-memory stand-in for the two tables the module touches. */
function fakeDb(settings = {}, meta = {}) {
  const table = (rows) => ({
    get: async (k) => rows[k],
    put: async (r) => {
      rows[r.key] = r;
    },
  });
  return { settings: table(settings), meta: table(meta), transaction: async (_m, _t, fn) => fn(), rows: { settings, meta } };
}
const answer = (daily) => ({ ok: true, json: async () => ({ daily }) });

describe('Tageswerte', () => {
  it('the weather: past days only, seconds as hours', () => {
    const w = weatherDays({ daily: { time: ['2026-10-17', '2026-10-18', TODAY], temperature_2m_max: [14.26, 9, 12], precipitation_sum: [0, 7.4, 1], sunshine_duration: [36000, 0, 100], daylight_duration: [39600, 39400, 39200] } }, TODAY);
    expect(Object.keys(w)).toEqual(['2026-10-17', '2026-10-18']);
    expect(w['2026-10-17']).toEqual({ tmax: 14.3, rainMm: 0, sunH: 10, lightH: 11 });
    expect(weatherUrl(PLACE)).toContain(`past_days=${PAST_DAYS}`);
  });

  it('merging keeps the newest days and the new values win', () => {
    const old = { '2026-10-01': { sunH: 1 }, '2026-10-02': { sunH: 2 } };
    expect(mergeDays(old, { '2026-10-02': { sunH: 5 } })['2026-10-02'].sunH).toBe(5);
    const many = Object.fromEntries(Array.from({ length: KEEP_DAYS + 5 }, (_, i) => [new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10), i]));
    const kept = mergeDays(many, {});
    expect(Object.keys(kept)).toHaveLength(KEEP_DAYS);
    expect(kept['2025-01-01']).toBeUndefined();
  });

  it('appointments: timed events per day, 0 on empty days, nothing after today', () => {
    const events = [
      { day: '2026-10-17', allDay: false },
      { day: '2026-10-17', allDay: false },
      { day: '2026-10-17', allDay: true },
      { day: '2026-10-25', allDay: false },
    ];
    expect(eventCounts(events, '2026-10-16', '2026-10-30', '2026-10-18')).toEqual({ '2026-10-16': 0, '2026-10-17': 2, '2026-10-18': 0 });
  });

  it('fetches once a day and only with a home place', async () => {
    let calls = 0;
    const fetcher = async () => (calls++, answer({ time: ['2026-10-18'], sunshine_duration: [7200] }));
    const none = fakeDb();
    expect(await keepDayWeather(none, { fetcher, today: TODAY, online: true })).toBe(false);
    expect(calls).toBe(0);
    const db = fakeDb({ [HOME_PLACE]: { key: HOME_PLACE, value: PLACE } });
    expect(await keepDayWeather(db, { fetcher, today: TODAY, online: true })).toBe(true);
    expect(db.rows.meta[DAY_WEATHER].days['2026-10-18'].sunH).toBe(2);
    expect(await keepDayWeather(db, { fetcher, today: TODAY, online: true })).toBe(false);
    expect(calls).toBe(1);
    expect(await keepDayWeather(db, { fetcher: async () => ({ ok: false }), today: '2026-10-20', online: true })).toBe(false);
    expect(db.rows.meta[DAY_WEATHER].days['2026-10-18']).toBeTruthy(); // a failed call keeps what was there
  });

  it('notes the appointment counts beyond the calendar copy', async () => {
    const db = fakeDb({}, { [DAY_EVENTS]: { key: DAY_EVENTS, days: { '2026-10-01': 4 } } });
    await keepDayEvents(db, [{ day: '2026-10-18', allDay: false }], '2026-10-12', '2026-12-18', TODAY);
    const days = db.rows.meta[DAY_EVENTS].days;
    expect(days['2026-10-01']).toBe(4);
    expect(days['2026-10-18']).toBe(1);
    expect(days['2026-10-19']).toBe(0);
    expect(days['2026-10-20']).toBeUndefined();
  });
});
