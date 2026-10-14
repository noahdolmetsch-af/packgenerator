// v0.119.0 «Schnellstart» (mockups Q1–Q3, Noah 13.10.2026 «Q1–Q3 freigegeben»): one click on Today
// makes a trip for today. Fictional bikes, trips and items only (test_data_gtp_).
import { describe, it, expect } from 'vitest';
import { stampName, quickPlan, quickStart, QUICK_HOURS, NO_WX } from '../src/lib/quickstart.js';

const bikes = [
  { id: 'b1', name: 'test_data_gtp_ Scale', setup: { seat: 'bag1' }, slots: ['seat'], order: 1 },
  { id: 'b2', name: 'test_data_gtp_ Gravel', setup: { seat: 'bag1' }, slots: ['seat'], order: 2 },
];
const trip = (id, f) => ({ id, title: id, bikeId: 'b1', startDate: '2026-09-01', days: 1, entries: [], ...f });
// a forecast as home-weather.js gives it (days by local date)
const forecast = { days: [{ date: '2026-10-13', min: 9, max: 15, rainMm: 0, rainPct: 5 }] };

describe('the name', () => {
  it('is the local time stamp YYYYMMDDHHmm', () => {
    expect(stampName(new Date(2026, 9, 13, 0, 0))).toBe('202610130000');
    expect(stampName(new Date(2026, 0, 2, 7, 5))).toBe('202601020705');
    expect(stampName(new Date(2026, 11, 31, 23, 59))).toBe('202612312359');
  });
});

describe('quickPlan', () => {
  const now = new Date(2026, 9, 13, 21, 30); // late in the evening: still today (no 14:00 rule)

  it('today, 2.5 h, the bike ridden last (setting «last»), the forecast for today', () => {
    const trips = [trip('old', { bikeId: 'b2', startDate: '2026-10-10', hours: 6, wx: { min: -2, max: 4, rain: 'rain' } })];
    // VS1: with the setting «standard» (or not asked yet) the standard bike comes, the first in the order
    expect(quickPlan(trips, bikes, { now, forecast, mode: 'standard' }).bike.id).toBe('b1');
    expect(quickPlan(trips, bikes, { now, forecast, mode: null }).bike.id).toBe('b1');
    const p = quickPlan(trips, bikes, { now, forecast, mode: 'last' });
    expect(p.startDate).toBe('2026-10-13');
    expect(p.hours).toBe(QUICK_HOURS);
    expect(QUICK_HOURS).toBe(2.5);
    expect(p.bike.id).toBe('b2');
    expect(p.wx).toEqual({ min: 9, max: 15, rain: 'none' });
    expect(p.wxFrom).toBe('forecast');
    expect(p.title).toBe('202610132130');
  });

  it('offline or a forecast without today: no weather, never the last ride\'s weather', () => {
    const trips = [trip('old', { startDate: '2026-10-10', wx: { min: -2, max: 4, rain: 'rain' } })];
    expect(quickPlan(trips, bikes, { now }).wx).toEqual(NO_WX);
    expect(quickPlan(trips, bikes, { now }).wxFrom).toBeNull();
    expect(quickPlan(trips, bikes, { now, forecast: { days: [{ date: '2026-10-14', min: 1, max: 2 }] } }).wx).toEqual(NO_WX);
  });

  it('a chosen bike wins; a second one in the same minute gets « (2)»; no bike: null', () => {
    expect(quickPlan([], bikes, { now, bikeId: 'b2' }).bike.id).toBe('b2');
    expect(quickPlan([], bikes, { now }).bike.id).toBe('b1');
    expect(quickPlan([trip('x', { title: '202610132130' })], bikes, { now }).title).toBe('202610132130 (2)');
    expect(quickPlan([], [], { now })).toBeNull();
  });
});

describe('quickStart', () => {
  const fakeDb = () => {
    const saved = [];
    return {
      saved,
      settings: { get: async () => undefined },
      trips: { put: async (x) => saved.push(x) },
    };
  };
  const items = [
    { id: 'i1', name: 'test_data_gtp_ Pump', standard: true, owned: 'yes' },
    { id: 'i2', name: 'test_data_gtp_ Stove', owned: 'yes' },
  ];

  it('saves one trip with the standard items only, never a copy of the last day ride', async () => {
    const db = fakeDb();
    const last = trip('last', { startDate: '2026-10-12', entries: [{ itemId: 'i2', qty: 1 }] });
    const t = await quickStart(db, { trips: [last], bikes, items, forecast, now: new Date(2026, 9, 13, 0, 0) });
    expect(db.saved).toHaveLength(1);
    expect(t.title).toBe('202610130000');
    expect(t.startDate).toBe('2026-10-13');
    expect(t.hours).toBe(2.5);
    expect(t.days).toBe(1);
    expect(t.overnight).toBe('none');
    expect(t.copiedFrom ?? null).toBeNull();
    expect(t.entries.some((e) => e.itemId === 'i2')).toBe(false);
    expect(t.wx).toMatchObject({ min: 9, max: 15, rain: 'none' });
  });

  it('no bike: nothing is saved', async () => {
    const db = fakeDb();
    expect(await quickStart(db, { trips: [], bikes: [], items })).toBeNull();
    expect(db.saved).toHaveLength(0);
  });
});
