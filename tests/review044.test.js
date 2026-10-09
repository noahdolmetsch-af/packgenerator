// v0.44.0 "Rueckblick 12 Monate": the rolling review of the last 12 months (yearreview.js).
import { describe, it, expect, afterEach } from 'vitest';
import { addMonths, reviewWindow, tripDone, deltas, kmByMonth, yearReview, cardNumbers, highlight, learnedOn } from '../src/lib/yearreview.js';
import { itemRecord, bulkOwnership } from '../src/lib/gear.js';
import { cardLabel, cardValue, factText } from '../src/lib/review/words.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const TODAY = '2026-10-09';
const P = 'test_data_gtp_';
const item = (id, extra = {}) => ({ id: `${P}${id}`, name: `${P} ${id}`, category: 'cook', weightG: 500, qty: 1, ownership: 'owned', role: null, sets: [], ...extra });
const trip = (id, startDate, extra = {}) => ({
  id: `${P}${id}`,
  title: `${P} ${id}`,
  startDate,
  days: 1,
  bikeId: `${P}bike`,
  bike: `${P} Velo`,
  setup: {},
  entries: (extra.items ?? ['A']).map((x) => ({ itemId: `${P}${x}`, slot: x === 'W' ? 'body' : 'seat', qty: 1 })),
  status: 'done',
  ...extra,
});
const done = (id, extra = {}) => ({ tripId: `${P}${id}`, status: 'done', items: {}, missing: [], ...extra });
const BIKE = { id: `${P}bike`, name: `${P} Velo`, km: 3000, parts: [] };

describe('the window', () => {
  it('rolls: the 12 months up to today, the 12 before end on today minus 12 months', () => {
    expect(reviewWindow(TODAY)).toEqual({ from: '2025-10-10', to: '2026-10-09', prevFrom: '2024-10-10', prevTo: '2025-10-09' });
  });

  it('adds months like a calendar, the 31st and 29 February fall back to the end of the month', () => {
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2024-02-29', -12)).toBe('2023-02-28');
    expect(addMonths('2026-01-15', -12)).toBe('2025-01-15');
    expect(reviewWindow('2028-02-29').from).toBe('2027-03-01');
  });

  it('a trip exactly 12 months ago belongs to the 12 months before, a day later to the window', () => {
    const r = yearReview({ today: TODAY, trips: [trip('edge', '2025-10-09'), trip('in', '2025-10-10')], items: [item('A')], bikes: [BIKE] });
    expect(r.ride.trips).toBe(1);
    expect(r.prev.trips).toBe(1);
    expect(r.ride.longest).toBeNull();
  });

  it('today counts, a trip that starts tomorrow does not', () => {
    const r = yearReview({ today: TODAY, trips: [trip('today', TODAY, { finished: TODAY }), trip('tomorrow', '2026-10-10')], items: [item('A')] });
    expect(r.ride.trips).toBe(1);
  });

  it('a multi-day trip that crosses the start counts by its start date, whole, in the period before', () => {
    const cross = trip('cross', '2025-10-08', { days: 4, overnight: 'outdoor' });
    const r = yearReview({ today: TODAY, trips: [cross], debriefs: [done('cross', { km: 300 })], items: [item('A')], bikes: [BIKE] });
    expect(r.empty).toBe(true);
    expect(r.ride.trips).toBe(0);
    expect(r.prev).toMatchObject({ trips: 1, days: 4, nights: 3, km: 300 });
  });
});

describe('what counts as a trip', () => {
  it('skipped trips and trips still ahead never count; debriefed, done or over ones do', () => {
    expect(tripDone(trip('s', '2026-05-01', { skipped: true }), [], TODAY)).toBe(false);
    expect(tripDone(trip('f', '2026-11-01'), [], TODAY)).toBe(false);
    expect(tripDone(trip('o', '2026-05-01', { status: 'planned' }), [], TODAY)).toBe(true);
    expect(tripDone(trip('d', '2026-10-09', { status: 'planned' }), [done('d')], TODAY)).toBe(true);
    expect(tripDone(trip('n', '2026-10-09', { status: 'planned' }), [], TODAY)).toBe(false);
  });
});

describe('riding', () => {
  const trips = [
    trip('one', '2026-03-14', { days: 3, overnight: 'outdoor' }),
    trip('hotel', '2026-05-02', { days: 2, overnight: 'lodging' }),
    trip('route', '2026-06-20', { route: { km: 88 } }),
    trip('ridden', '2026-07-04'),
  ];
  const debriefs = [done('one', { km: 240, clothing: 'cold' }), done('hotel', { km: 120, clothing: 'fit' })];
  const rides = [
    { id: 'r1', date: '2026-07-04', km: 61.4, gainM: 900, movingH: 3.2, tripId: `${P}ridden` },
    { id: 'r2', date: '2026-08-01', km: 40, gainM: 300, movingH: 1.8, tripId: null },
    { id: 'r3', date: '2025-01-01', km: 50, gainM: 100, movingH: 2, tripId: null },
  ];
  const r = yearReview({ today: TODAY, trips, debriefs, rides, items: [item('A')], bikes: [BIKE] });

  it('trips, days, nights outside (not in a hotel), km from debrief, route and rides', () => {
    expect(r.ride).toMatchObject({ trips: 4, days: 7, nights: 2, km: 240 + 120 + 88 + 61 + 40, climbM: 1200, movingH: 5 });
    expect(r.ride.longest).toMatchObject({ title: `${P} one`, km: 240 });
  });

  it('km per month: calendar months touching the window, to scale', () => {
    expect(r.months[0].month).toBe('2025-10');
    expect(r.months.at(-1).month).toBe('2026-10');
    expect(r.months.find((m) => m.month === '2026-03').km).toBe(240);
    expect(r.months.find((m) => m.month === '2026-08').km).toBe(40);
  });

  it('a ride on its own counts by its own date; the window is not empty with only a ride', () => {
    const only = yearReview({ today: TODAY, rides: [rides[1]] });
    expect(only.empty).toBe(false);
    expect(only.ride).toMatchObject({ trips: 0, km: 40, climbM: 300 });
    expect(cardNumbers(only).map((x) => x.key)).toEqual(['km']);
  });

  it('kmByMonth adds the trips and the rides on their own', () => {
    const rows = kmByMonth({ rows: [{ trip: { startDate: '2026-01-05' }, km: 10 }], solo: [{ date: '2026-01-20', km: 5 }] }, '2025-10-10', '2026-10-09');
    expect(rows.find((x) => x.month === '2026-01').km).toBe(15);
    expect(rows).toHaveLength(13);
  });
});

describe('compared with the 12 months before', () => {
  it('a delta only where both periods have a number and they differ', () => {
    expect(deltas({ trips: 5, km: 400, nights: 2, learnings: 0, chf: 100 }, { trips: 2, km: 400, nights: 0, learnings: 3, chf: 140 })).toEqual({ trips: 3, chf: -40 });
  });

  it('the review: +2 trips, more km, the fact names the km', () => {
    const trips = [trip('a', '2026-02-01'), trip('b', '2026-04-01'), trip('c', '2026-06-01'), trip('old', '2025-06-01')];
    const debriefs = [done('a', { km: 100 }), done('b', { km: 100 }), done('c', { km: 100 }), done('old', { km: 120 })];
    const r = yearReview({ today: TODAY, trips, debriefs, items: [item('A')], bikes: [BIKE] });
    expect(r.delta).toMatchObject({ trips: 2, days: 2, km: 180 });
    expect(r.delta.nights).toBeUndefined();
    expect(highlight(r)).toEqual({ key: 'moreKm', km: 180 });
    expect(factText(highlight(r))).toBe('180 km more than in the 12 months before.');
  });

  it('nothing to compare when the 12 months before are empty', () => {
    const r = yearReview({ today: TODAY, trips: [trip('a', '2026-02-01')], debriefs: [done('a', { km: 50 })], items: [item('A')] });
    expect(r.delta).toEqual({});
  });
});

describe('hidden when empty', () => {
  it('no data: empty, no card numbers, no fact, no section', () => {
    const r = yearReview({ today: TODAY });
    expect(r.empty).toBe(true);
    expect(cardNumbers(r)).toEqual([]);
    expect(highlight(r)).toBeNull();
    expect(r.has).toEqual({ ride: false, pack: false, learn: false, bikes: false });
  });

  it('only data older than 12 months: still empty', () => {
    const r = yearReview({ today: TODAY, trips: [trip('old', '2025-03-01')], debriefs: [done('old', { km: 80 })], items: [item('A')] });
    expect(r.empty).toBe(true);
    expect(r.prev.trips).toBe(1);
  });

  it('a section without data stays out; the card shows only numbers it has', () => {
    const r = yearReview({ today: TODAY, trips: [trip('a', '2026-02-01')], items: [item('A')] });
    expect(r.has).toEqual({ ride: true, pack: false, learn: false, bikes: false });
    expect(cardNumbers(r)).toEqual([
      { key: 'trips', value: 1 },
      { key: 'days', value: 1 },
    ]);
  });
});

describe('packing', () => {
  const items = [item('A', { weightG: 800 }), item('B', { weightG: 400 }), item('C', { weightG: 200 }), item('W', { role: 'worn', weightG: 300 }), item('F', { category: 'food', weightG: 300 })];
  const trips = [
    trip('t1', '2026-01-10', { items: ['A', 'B', 'C', 'W', 'F'] }),
    trip('t2', '2026-04-10', { items: ['A', 'B', 'W'] }),
    trip('t3', '2026-08-10', { items: ['A', 'C', 'W'] }),
  ];
  const debriefs = [done('t1', { items: { [`${P}B`]: 'unused' } }), done('t2', { items: { [`${P}B`]: 'unused' } }), done('t3')];
  const r = yearReview({ today: TODAY, trips, debriefs, items, bikes: [BIKE] });

  it('base weight per trip, first against last (food and worn left out)', () => {
    expect(r.pack.trend.points.map((p) => p.g)).toEqual([1400, 1200, 1000]);
    expect(r.pack.trend.diffG).toBe(-400);
    expect(cardNumbers(r).find((x) => x.key === 'base').value).toBe(-400);
    expect(highlight(r)).toEqual({ key: 'lighter', g: 400 });
  });

  it('dead weight in the window, the most used items (not worn, not food)', () => {
    expect(r.pack.dead.map((d) => d.item.id)).toEqual([`${P}B`]);
    expect(r.pack.top.map((x) => [x.item.id, x.n])).toEqual([
      [`${P}A`, 3],
      [`${P}C`, 2],
    ]);
  });

  it('wishlist items bought: a wish that becomes owned gets boughtAt', () => {
    const wish = item('X', { ownership: 'wishlist' });
    const rec = itemRecord({ ...wish, ownership: 'owned', grams: '' }, { item: wish, items: [wish], weightG: null, now: '2026-09-01T10:00:00.000Z' });
    expect(rec.boughtAt).toBe('2026-09-01T10:00:00.000Z');
    const plain = itemRecord({ ...items[0], grams: '' }, { item: items[0], items, weightG: 800 });
    expect('boughtAt' in plain).toBe(false);
    const [bulk] = bulkOwnership([item('Y', { ownership: 'to-buy' })], [`${P}Y`], 'owned', '2026-02-01T08:00:00.000Z');
    expect(bulk.boughtAt).toBe('2026-02-01T08:00:00.000Z');
    const old = { ...item('Z'), boughtAt: '2024-01-01T08:00:00.000Z' };
    const rv = yearReview({ today: TODAY, trips, items: [...items, rec, bulk, old] });
    expect(rv.pack.bought.map((i) => i.id)).toEqual([`${P}X`, `${P}Y`]);
  });
});

describe('learning and bikes', () => {
  it('learnings added by their day (an imported one by its own date), the newest 3', () => {
    const ls = [
      { id: 1, rule: `${P} a`, createdAt: '2026-01-01T10:00:00.000Z' },
      { id: 2, rule: `${P} b`, createdAt: '2026-05-01T10:00:00.000Z' },
      { id: 3, rule: `${P} c`, createdAt: '2026-06-01T10:00:00.000Z' },
      { id: 4, rule: `${P} d`, createdAt: '2026-07-01T10:00:00.000Z' },
      { id: 5, rule: `${P} e`, source: 'import', date: '2020-05-01', createdAt: '2026-07-02T10:00:00.000Z' },
      { id: 6, rule: `${P} f`, createdAt: '2025-03-01T10:00:00.000Z' },
    ];
    expect(learnedOn(ls[4])).toBe('2020-05-01');
    const r = yearReview({ today: TODAY, learnings: ls, rides: [{ id: 'r', date: '2026-02-01', km: 30, movingH: 1.5 }] });
    expect(r.learn.n).toBe(4);
    expect(r.learn.newest.map((l) => l.id)).toEqual([4, 3, 2]);
    expect(r.delta.learnings).toBe(3);
  });

  it('the clothing answers of the trips in the window', () => {
    const r = yearReview({ today: TODAY, trips: [trip('a', '2026-02-01'), trip('b', '2026-03-01'), trip('c', '2026-04-01')], debriefs: [done('a', { clothing: 'cold' }), done('b', { clothing: 'cold' }), done('c', { clothing: 'fit' })], items: [item('A')] });
    expect(r.learn.clothing).toEqual({ cold: 2, fit: 1, warm: 0 });
  });

  it('pace change from the rides in "Your pace", only with both periods', () => {
    const ride = (date, km, movingH) => ({ id: date, date, km, gainM: 0, movingH, totalH: movingH });
    const pace = { rides: [ride('2025-05-01', 64, 4), ride('2026-05-01', 72, 4)] };
    const r = yearReview({ today: TODAY, pace, rides: [{ id: 'x', date: '2026-05-01', km: 72, movingH: 4 }] });
    expect(r.learn.pace).toMatchObject({ kmh: 18, before: 16, diff: 2 });
    const one = yearReview({ today: TODAY, pace: { rides: [pace.rides[1]] }, rides: [{ id: 'x', date: '2026-05-01', km: 72, movingH: 4 }] });
    expect(one.learn.pace).toMatchObject({ kmh: 18, before: null, diff: null });
  });

  it('km per bike, workshop visits with their cost, parts replaced (shop and own work), no double count', () => {
    const bike = { ...BIKE, parts: [{ key: 'chain', history: [{ date: '2026-03-01', km: 2000, action: 'replace', result: 'done', by: 'self' }] }] };
    const visits = [
      { id: 'v1', bikeId: BIKE.id, date: '2026-05-10', totalChf: 129, parts: [{ part: 'cassette', action: 'replace', chf: 129 }] },
      { id: 'v2', bikeId: BIKE.id, date: '2026-07-10', parts: [{ part: 'fork', action: 'service' }] },
      { id: 'v0', bikeId: BIKE.id, date: '2025-05-10', totalChf: 200, parts: [{ part: 'shock', action: 'service' }] },
    ];
    const trips = [trip('a', '2026-02-01'), trip('b', '2026-06-01', { bikeId: `${P}other`, bike: `${P} Gravel` })];
    const r = yearReview({ today: TODAY, trips, debriefs: [done('a', { km: 90 }), done('b', { km: 150 })], items: [item('A')], bikes: [bike], visits });
    expect(r.bikes.km).toEqual([
      { bikeId: `${P}other`, bike: `${P} Gravel`, km: 150 },
      { bikeId: BIKE.id, bike: BIKE.name, km: 90 },
    ]);
    expect(r.bikes).toMatchObject({ visits: 2, chf: 129, chfUnknown: 1 });
    expect(r.bikes.parts.map((p) => [p.part, p.by])).toEqual([
      ['cassette', 'shop'],
      ['chain', 'self'],
    ]);
    expect(r.delta.chf).toBe(-71);
    expect(r.delta.visits).toBe(1);
  });
});

describe('the words', () => {
  it('card labels and values in German', () => {
    lang.v = 'de';
    expect(cardLabel({ key: 'trips', value: 3 })).toBe('Touren');
    expect(cardLabel({ key: 'nights', value: 1 })).toBe('Nacht draussen');
    expect(cardValue({ key: 'base', value: -1200 })).toBe('−1.2 kg');
    expect(cardValue({ key: 'base', value: 300 })).toBe('+300 g');
    expect(factText({ key: 'longest', title: 'X', km: 1234 })).toMatch(/^Längste Tour: X, 1.234 km\.$/);
  });
});
