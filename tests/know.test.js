// v0.25.1 (Noah 1a): Good to know: which cards show, in which order, and the numbers on them.
import { describe, it, expect } from 'vitest';
import {
  knowCards, wearForecast, wearWhat, weekendDays, weekendNear, weekendWeather, needsFetch, usable, season, bestUpgrade,
  weightTrend, sparkPath, longUnused, finishedTrips, avgTripKm, kmPerWeek, bikeRides,
} from '../src/lib/know.js';
import { homeForecast } from '../src/lib/home-weather.js';

const TODAY = '2026-10-07'; // a Wednesday
const item = (id, extra = {}) => ({ id, name: `test_data_gtp_ ${id}`, category: 'cook', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], ...extra });
const trip = (id, startDate, entries, extra = {}) => ({ id, title: id, startDate, days: 1, bikeId: 'b1', setup: { seat: 'bag-1' }, entries: entries.map((itemId) => ({ itemId, slot: 'seat', qty: 1 })), ...extra });
const done = (tripId, km = null) => ({ tripId, status: 'done', km, items: {}, missing: [] });
// A bike with 2000 km: chain waxed at 1900 km, the check points looked at at 1200 km.
const bike = (extra = {}) => ({
  id: 'b1', name: 'test_data_gtp_ Velo', km: 2000,
  parts: [
    { key: 'chain', history: [{ date: '2026-09-01', km: 1900, action: 'service', result: 'done' }] },
    { key: 'padsF', history: [{ date: '2026-06-01', km: 1200, action: 'check', result: 'ok' }] },
  ],
  ...extra,
});

describe('which cards show', () => {
  it('empty cards stay away; only the home place set-up shows without data', () => {
    const cards = knowCards({ today: TODAY });
    expect(cards.map((c) => c.key)).toEqual(['home']);
  });

  it('a due backup comes first, a demo only without a due backup', () => {
    const cards = knowCards({ today: TODAY, backup: { due: true, days: 20 }, notes: [{ id: 'n' }], todos: [{ key: 'pace' }] });
    expect(cards.map((c) => c.key)).toEqual(['backup', 'todo', 'inbox', 'home']);
    expect(knowCards({ today: TODAY, demo: { name: 'x' } }).map((c) => c.key)).toEqual(['demo', 'home']);
    expect(knowCards({ today: TODAY, backup: { due: false, days: 2 } }).some((c) => c.key === 'backup')).toBe(false);
  });

  it('Still open with a late row is urgent', () => {
    const cards = knowCards({ today: TODAY, notes: [{ id: 'n' }], todos: [{ key: 'x', late: true }] });
    expect(cards[0]).toMatchObject({ key: 'todo', prio: 1 });
  });

  it('next trip weather: only with a forecast or sun times; within 3 days it moves up', () => {
    const next = { id: 't', startDate: '2026-10-09' };
    expect(knowCards({ today: TODAY, next }).some((c) => c.key === 'weather')).toBe(false);
    const soon = knowCards({ today: TODAY, next, fc: { min: 4, max: 12, rain: 'none' }, tips: [{ rule: 'r' }] });
    expect(soon.map((c) => c.key)).toEqual(['weather', 'learnings', 'home']);
    expect(soon[0].prio).toBe(2);
    const later = knowCards({ today: TODAY, next: { ...next, startDate: '2026-10-20' }, sun: { rise: 1, set: 2 } });
    expect(later.find((c) => c.key === 'weather').prio).toBe(5);
  });

  it('learnings and pace only with content', () => {
    expect(knowCards({ today: TODAY, pace: { mine: false } }).map((c) => c.key)).toEqual(['home']);
    expect(knowCards({ today: TODAY, pace: { mine: true, kmh: 18 } }).map((c) => c.key)).toEqual(['pace', 'home']);
  });

  it('weekend weather: with a home place and a fresh forecast; Thursday to Sunday higher up', () => {
    const place = { name: 'Aarau', lat: 47.39, lon: 8.04 };
    const now = Date.parse('2026-10-08T10:00:00Z');
    const forecast = { fetchedAt: '2026-10-08T08:00:00Z', place, days: [{ date: '2026-10-10', min: 8, max: 18.4, rainMm: 0, rainPct: 10 }, { date: '2026-10-11', min: 6, max: 12, rainMm: 7, rainPct: 90 }] };
    const thu = knowCards({ today: '2026-10-08', now, homePlace: place, homeForecast: forecast, tips: [{ rule: 'r' }] });
    expect(thu.map((c) => [c.key, c.prio])).toEqual([['weekend', 4], ['learnings', 5]]);
    expect(thu[0].data.days).toEqual([{ date: '2026-10-10', max: 18, rain: 'none' }, { date: '2026-10-11', max: 12, rain: 'rain' }]);
    const wed = knowCards({ today: TODAY, now, homePlace: place, homeForecast: forecast });
    expect(wed[0]).toMatchObject({ key: 'weekend', prio: 5 });
    // older than 12 hours (offline, fetch failed): hidden, and no set-up card either
    expect(knowCards({ today: '2026-10-08', now: now + 13 * 36e5, homePlace: place, homeForecast: forecast })).toEqual([]);
  });
});

describe('weekend helpers', () => {
  it('the coming Saturday and Sunday', () => {
    expect(weekendDays('2026-10-07')).toEqual(['2026-10-10', '2026-10-11']);
    expect(weekendDays('2026-10-10')).toEqual(['2026-10-10', '2026-10-11']);
    expect(weekendDays('2026-10-11')).toEqual(['2026-10-11']);
    expect(['2026-10-07', '2026-10-08', '2026-10-11', '2026-10-12'].map(weekendNear)).toEqual([false, true, true, false]);
  });
  it('rain words like the trip weather; missing days are left out', () => {
    expect(weekendWeather({ days: [{ date: '2026-10-11', min: 5, max: 9, rainMm: 1.2, rainPct: 40 }] }, TODAY)).toEqual([{ date: '2026-10-11', max: 9, rain: 'showers' }]);
    expect(weekendWeather({ days: [] }, TODAY)).toBeNull();
  });
  it('fetch at most every 3 hours, again for another place; show for 12 hours', () => {
    const place = { lat: 1, lon: 2 };
    const f = { fetchedAt: '2026-10-07T10:00:00Z', place };
    const at = (h) => Date.parse('2026-10-07T10:00:00Z') + h * 36e5;
    expect(needsFetch(place, f, at(2))).toBe(false);
    expect(needsFetch(place, f, at(3))).toBe(true);
    expect(needsFetch({ lat: 9, lon: 9 }, f, at(1))).toBe(true);
    expect(needsFetch(null, null)).toBe(false);
    expect(usable(place, f, at(11))).toBe(true);
    expect(usable(place, f, at(12))).toBe(false);
  });
});

describe('wear forecast', () => {
  it('the soonest by km per bike, with trips and weeks from the debriefs', () => {
    // chain: waxed 100 km ago, every 150 km → 50 left; check: 800 km since → 200 left
    const trips = [trip('a', '2026-09-20', []), trip('b', '2026-09-27', [])];
    const debriefs = [done('a', 30), done('b', 50)];
    const [row] = wearForecast([bike()], trips, debriefs, TODAY);
    expect(row).toMatchObject({ bikeId: 'b1', kind: 'service', part: 'chain', left: 50, every: 150, trips: 1, prio: 2 });
    // 80 km in the last 12 weeks → 6.7 km per week → 50 km ≈ 7.5 → 8 weeks
    expect(row.weeks).toBe(8);
    expect(wearWhat(row)).toBe('Waxed chain');
  });

  it('due now when over the interval; no km or no history: no row', () => {
    const b = bike({ km: 2100 });
    const [row] = wearForecast([b], [], [], TODAY);
    expect(row).toMatchObject({ left: -50, prio: 1, trips: null, weeks: null });
    expect(wearForecast([bike({ km: null })], [], [], TODAY)).toEqual([]);
    expect(wearForecast([bike({ parts: [] })], [], [], TODAY)).toEqual([]);
  });

  it('the 1000 km check far away is an insight (prio 5), bikes soonest first', () => {
    const check = bike({ id: 'b2', name: 'B', parts: [{ key: 'padsF', history: [{ date: '2026-09-01', km: 1800, action: 'check', result: 'ok' }] }] });
    const rows = wearForecast([check, bike({ km: 2040 })], [], [], TODAY);
    expect(rows.map((r) => [r.bikeId, r.kind, r.left, r.prio])).toEqual([['b1', 'service', 10, 2], ['b2', 'check', 800, 5]]);
    expect(wearWhat(rows[1])).toBe('{km} km check');
  });

  it('more than 20 trips away is not said', () => {
    const [row] = wearForecast([bike({ km: 1920 })], [trip('a', '2026-09-20', [])], [done('a', 1)], TODAY);
    expect(row).toMatchObject({ left: 130, trips: null });
  });

  it('average and per-week km', () => {
    const rides = bikeRides('b1', [trip('a', '2026-01-10', []), trip('b', '2026-09-20', []), trip('c', '2026-09-27', [], { bikeId: 'x' })], [done('a', 100), done('b', 300), done('c', 999)]);
    expect(rides.map((r) => r.km)).toEqual([100, 300]);
    expect(avgTripKm(rides)).toBe(200);
    expect(kmPerWeek(rides, TODAY)).toBe(25);
    expect(avgTripKm([])).toBeNull();
    expect(kmPerWeek([], TODAY)).toBeNull();
  });
});

describe('season in numbers', () => {
  it('this year: finished trips, km from the debriefs per bike, workshop costs', () => {
    const trips = [trip('old', '2025-08-01', ['A']), trip('a', '2026-05-01', ['A']), trip('b', '2026-09-01', ['A']), trip('plan', '2026-12-01', ['A'])];
    const visits = [{ id: 'v1', bikeId: 'b1', date: '2026-03-01', totalChf: 120 }, { id: 'v2', bikeId: 'b1', date: '2026-04-01', parts: [] }, { id: 'v0', bikeId: 'b1', date: '2025-03-01', totalChf: 99 }];
    const s = season([bike()], trips, [done('old', 50), done('a', 80), done('b', 40)], visits, TODAY);
    expect(s).toMatchObject({ year: '2026', trips: 2, kmFrom: 'debriefs', km: [{ bikeId: 'b1', km: 120 }] });
    expect(s.cost).toMatchObject({ chf: 120, visits: 2, unknown: 1 });
    expect(season([bike()], [], [], [], TODAY)).toBeNull();
  });
  it('finished: debriefed, marked done or over; skipped and empty trips do not count', () => {
    const trips = [trip('over', '2026-09-01', ['A']), trip('skip', '2026-09-02', ['A'], { skipped: true }), trip('empty', '2026-09-03', []), trip('future', '2026-11-01', ['A'])];
    expect(finishedTrips(trips, [], TODAY).map((t) => t.id)).toEqual(['over']);
  });
});

describe('best upgrade', () => {
  const items = [
    item('OLD1', { weightG: 900 }),
    item('OLD2', { weightG: 500 }),
    item('W1', { ownership: 'wishlist', weightG: 500, priceChf: 400, replaces: 'OLD1' }), // 400 g / 400 CHF = 100 g per 100
    item('W2', { ownership: 'to-buy', weightG: 300, priceChf: 100, replaces: 'OLD2' }), // 200 g / 100 CHF = 200 g per 100
    item('W3', { ownership: 'wishlist', weightG: 100, priceChf: null, replaces: 'OLD1' }), // no price
    item('W4', { ownership: 'wishlist', weightG: null, priceChf: 10, replaces: 'OLD1' }), // no weight
  ];
  it('the most grams saved per franc', () => {
    const up = bestUpgrade(items);
    expect(up).toMatchObject({ savedG: 200, chf: 100, gPer100: 200 });
    expect(up.item.id).toBe('W2');
    expect(up.old.id).toBe('OLD2');
  });
  it('only when a wish has both numbers and is lighter', () => {
    expect(bestUpgrade(items.filter((i) => !['W1', 'W2'].includes(i.id)))).toBeNull();
    expect(bestUpgrade([item('O', { weightG: 100 }), item('W', { ownership: 'wishlist', weightG: 150, priceChf: 50, replaces: 'O' })])).toBeNull();
  });
});

describe('weight trend', () => {
  const items = [item('A', { weightG: 1000 }), item('B', { weightG: 400 }), item('C', { weightG: 200 })];
  it('base weight of the last up to 6 finished trips and the change', () => {
    const trips = [
      trip('t1', '2026-05-01', ['A', 'B', 'C']),
      trip('t2', '2026-06-01', ['A', 'B']),
      trip('t3', '2026-07-01', ['A', 'C']),
      trip('t4', '2026-12-01', ['A']), // not finished
    ];
    const tr = weightTrend(trips, [], items, [], [], TODAY);
    expect(tr.points.map((p) => p.g)).toEqual([1600, 1400, 1200]);
    expect(tr.diffG).toBe(-400);
    expect(tr.first.date).toBe('2026-05-01');
    const many = Array.from({ length: 8 }, (_, n) => trip(`m${n}`, `2026-0${n + 1}-01`, n % 2 ? ['A'] : ['B']));
    expect(weightTrend(many, [], items, [], [], TODAY).points.map((p) => p.id)).toEqual(['m2', 'm3', 'm4', 'm5', 'm6', 'm7']);
  });
  it('only with 2 or more trips that have a base weight', () => {
    expect(weightTrend([trip('t1', '2026-05-01', ['A']), trip('t2', '2026-06-01', ['X'])], [], items, [], [], TODAY)).toBeNull();
  });
  it('the sparkline: lightest at the bottom', () => {
    expect(sparkPath([2, 1], 20, 10, 0)).toBe('M0.0 0.0 L20.0 10.0');
    expect(sparkPath([1])).toBe('');
  });
});

describe('long not used', () => {
  const items = [
    item('A'), // on a trip 2 months ago
    item('B', { weightG: 300 }), // on a trip 14 months ago only
    item('C', { weightG: null }), // never on a trip, not weighed
    item('W', { role: 'worn' }),
    item('S', { role: 'standard' }),
    item('AL', { always: true }),
    item('FX'), // bike fixture
    item('BAG'), // a bag on the bike
    item('BK', { category: 'bike' }),
    item('FD', { category: 'food' }),
    item('WL', { ownership: 'wishlist' }),
    item('P'), // on a planned trip
  ];
  const trips = [trip('old', '2025-08-01', ['B']), trip('recent', '2026-08-01', ['A']), trip('plan', '2026-11-01', ['P'])];
  it('owned packing items on no trip for 12 months, heaviest first, with the weight', () => {
    const r = longUnused(items, trips, [{ id: 'b1', fixtures: ['FX'] }], [{ id: 'bag-1', itemId: 'BAG' }], TODAY);
    expect(r.items.map((i) => i.id)).toEqual(['B', 'C']);
    expect(r).toMatchObject({ g: 300, missing: 1, since: '2025-10-07', full: true });
  });
  it('a shorter history says since when; under 3 months, only planned trips or no trips: nothing to say', () => {
    expect(longUnused(items, [trip('june', '2026-06-01', ['A'])], [], [], TODAY)).toMatchObject({ since: '2026-06-01', full: false });
    expect(longUnused(items, [trip('recent', '2026-08-01', ['A'])], [], [], TODAY)).toBeNull();
    expect(longUnused(items, [trip('plan', '2026-10-15', ['A'])], [], [], TODAY)).toBeNull();
    expect(longUnused(items, [], [], [], TODAY)).toBeNull();
  });
  it('shows as a card only with at least one item', () => {
    const cards = knowCards({ today: TODAY, items, trips, homePlace: { lat: 1, lon: 1 } });
    expect(cards.find((c) => c.key === 'unused').data.items.length).toBeGreaterThan(0);
    expect(knowCards({ today: TODAY, items: [item('A')], trips: [trip('r', '2026-05-01', ['A'])], homePlace: { lat: 1, lon: 1 } }).some((c) => c.key === 'unused')).toBe(false);
  });
});

describe('home forecast (home-weather.js)', () => {
  const fakeDb = (place, saved = null) => {
    const meta = new Map(saved ? [['homeForecast', saved]] : []);
    return {
      settings: { get: async (k) => (k === 'homePlace' && place ? { key: k, value: place } : undefined) },
      meta: { get: async (k) => meta.get(k), put: async (r) => meta.set(r.key, r) },
      saved: meta,
    };
  };
  const place = { name: 'test_data_gtp_ Ort', lat: 47.1, lon: 8.1 };
  const now = Date.parse('2026-10-08T10:00:00Z');
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return { ok: true, json: async () => ({ daily: { time: ['2026-10-10'], temperature_2m_min: [5], temperature_2m_max: [15], precipitation_sum: [6], precipitation_probability_max: [80] } }) };
  };
  it('no home place: null and no fetch', async () => {
    calls = 0;
    expect(await homeForecast(fakeDb(null), { fetcher, now })).toBeNull();
    expect(calls).toBe(0);
  });
  it('fetches, saves and gives the days with rain words; a fresh one is not fetched again', async () => {
    calls = 0;
    const db = fakeDb(place);
    const f = await homeForecast(db, { fetcher, now, online: true });
    expect(f.days).toEqual([{ date: '2026-10-10', min: 5, max: 15, rainMm: 6, rainPct: 80, rain: 'rain' }]);
    expect(db.saved.get('homeForecast').place).toEqual({ name: place.name, lat: 47.1, lon: 8.1 });
    await homeForecast(db, { fetcher, now: now + 2 * 36e5, online: true });
    expect(calls).toBe(1);
  });
  it('offline or failed: the saved one up to 12 hours, then null', async () => {
    const saved = { key: 'homeForecast', fetchedAt: '2026-10-08T00:00:00Z', place, days: [] };
    const failing = async () => ({ ok: false, status: 500 });
    expect(await homeForecast(fakeDb(place, saved), { fetcher: failing, now, online: true })).toMatchObject({ days: [] });
    expect(await homeForecast(fakeDb(place, saved), { fetcher, now: now + 3 * 36e5, online: false })).toBeNull();
  });
});
