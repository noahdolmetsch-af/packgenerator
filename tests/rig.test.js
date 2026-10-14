// UC3 Velos › Setup (Noah 14.10.2026 «UC3-1-UC3-3 freigeben»): the bag plan, the total weight, the
// links you add yourself and the setup log. Fictional data only.
import { describe, it, expect } from 'vitest';
import { planTrips, bagPlan, sideShares, planHints, moveEntry, dismissHint, weightSplit, compareLoad, domainOf, guessTitle, guessYear, newLink, filterLinks, linkYears, racesOf, newLogEntry, logView, logYear, backHint, visitOffers, kindOfPart, feelOf, SIDES, HEAVY_G } from '../src/lib/rig.js';
import { SLOTS } from '../src/lib/bikes.js';

const items = [
  { id: 'tent', name: 'test_data_gtp_ Zelt', category: 'sleep', weightG: 1050, volumeL: 6 },
  { id: 'stove', name: 'test_data_gtp_ Kocher', category: 'cook', weightG: 420, volumeL: 1 },
  { id: 'jacket', name: 'test_data_gtp_ Regenjacke', category: 'rain', weightG: 250, volumeL: 1.5 },
  { id: 'bar', name: 'test_data_gtp_ Riegel', category: 'food', weightG: 300 },
  { id: 'lamp', name: 'test_data_gtp_ Stirnlampe', category: 'light', weightG: 90 },
  { id: 'quilt', name: 'test_data_gtp_ Quilt', category: 'sleep', weightG: 600, volumeL: 7 },
];
const bags = [
  { id: 'b-seat', name: 'Seat pack 13 L', slot: 'seat', volumeL: 13, weightG: 400 },
  { id: 'b-frame', name: 'Frame bag', slot: 'frame', volumeL: 5, weightG: 200 },
  { id: 'b-top', name: 'Top tube bag', slot: 'top', volumeL: 1.5, weightG: 120 },
  { id: 'b-bar', name: 'Front roll', slot: 'bar', volumeL: 14, weightG: 300 },
];
const bike = { id: 'g', name: 'test_data_gtp_ Gravel', weightG: 9400, slots: ['seat', 'frame', 'top', 'bar', 'fork'], setup: {} };
const trip = (over = {}) => ({
  id: 't1',
  title: 'test_data_gtp_ Jura',
  bikeId: 'g',
  startDate: '2026-10-17',
  days: 2,
  setup: { seat: 'b-seat', frame: 'b-frame', top: 'b-top', bar: 'b-bar' },
  entries: [
    { itemId: 'tent', slot: 'seat', qty: 1 },
    { itemId: 'stove', slot: 'seat', qty: 1 },
    { itemId: 'jacket', slot: 'seat', qty: 1 },
    { itemId: 'quilt', slot: 'bar', qty: 1 },
    { itemId: 'bar', slot: 'frame', qty: 1 },
    { itemId: 'lamp', slot: 'fork', qty: 1 },
  ],
  ...over,
});

describe('bag plan', () => {
  it('every place belongs to exactly one side', () => {
    const all = Object.values(SIDES).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const s of SLOTS.filter((x) => !x.worn)) expect(all).toContain(s.key);
  });
  it('numbers the bags in the order of the places and splits the weight', () => {
    const plan = bagPlan(trip(), items, bags, bike);
    const order = SLOTS.map((s) => s.key);
    expect(plan.bags.map((b) => b.key)).toEqual(['seat', 'frame', 'top', 'bar'].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
    expect(plan.bags.map((b) => b.n)).toEqual([1, 2, 3, 4]);
    expect(plan.sides.rear).toBe(1050 + 420 + 250);
    expect(plan.sides.front).toBe(600);
    expect(plan.sides.middle).toBe(300);
    // The lamp sits at the fork, where this trip has no bag.
    expect(plan.loose).toEqual([{ itemId: 'lamp', slot: 'fork', grams: 90 }]);
    const s = sideShares(plan.sides);
    expect(s.front + s.middle + s.rear).toBe(100);
  });
  it('shows the fill only when every litre is known', () => {
    const plan = bagPlan(trip(), items, bags, bike);
    expect(plan.bags.find((b) => b.key === 'seat').fill).toBe(Math.round((8.5 / 13) * 100));
    expect(plan.bags.find((b) => b.key === 'frame').fill).toBeNull(); // the bar has no litres
    expect(plan.bags.find((b) => b.key === 'top').tags).toContain('handy');
  });
  it('hints: heavy item to the frame bag, rain item within reach; dismissed ones stay away', () => {
    const t1 = trip();
    const plan = bagPlan(t1, items, bags, bike);
    const hints = planHints(plan, t1, items);
    expect(hints[0]).toMatchObject({ kind: 'heavy', itemId: 'tent', to: 'frame' });
    expect(hints[1]).toMatchObject({ kind: 'handy', itemId: 'jacket', to: 'top' });
    expect(HEAVY_G).toBe(300);
    const t2 = { ...t1, planDismissed: dismissHint(t1, hints[0]) };
    expect(planHints(bagPlan(t2, items, bags, bike), t2, items)[0]).toMatchObject({ kind: 'heavy', itemId: 'quilt' });
  });
  it('moving an item opens it to pack again', () => {
    const t1 = trip({ entries: [{ itemId: 'stove', slot: 'seat', qty: 1, packed: true }] });
    expect(moveEntry(t1, 'stove', 'frame')).toEqual([{ itemId: 'stove', slot: 'frame', qty: 1, packed: false }]);
  });
  it('the trips to choose: next ones first, then the last ones, only with a list on this bike', () => {
    const trips = [trip({ id: 'past', startDate: '2026-09-01' }), trip({ id: 'next', startDate: '2026-10-20' }), trip({ id: 'soon', startDate: '2026-10-15' }), trip({ id: 'other', bikeId: 'x' }), trip({ id: 'empty', entries: [] })];
    expect(planTrips(trips, 'g', '2026-10-14').map((x) => x.id)).toEqual(['soon', 'next', 'past']);
  });
});

describe('total weight and saved rigs', () => {
  it('bike, luggage and food add up', () => {
    const plan = bagPlan(trip(), items, bags, bike);
    const w = weightSplit(plan.stats, bike);
    expect(w.bikeG).toBe(9400);
    expect(w.eatG).toBe(300);
    expect(w.totalG).toBe(w.bikeG + w.packG + w.eatG);
    expect(w.missing).toBe(0);
  });
  it('compares the luggage with a rig only when you typed its kg', () => {
    expect(compareLoad(7800, 6)).toBe('heavier');
    expect(compareLoad(7800, 9)).toBe('lighter');
    expect(compareLoad(7800, 8)).toBe('same');
    expect(compareLoad(7800, null)).toBeNull();
  });
});

describe('links you add yourself', () => {
  it('reads site, title and year from the address only', () => {
    expect(domainOf('https://www.example.org/bikes/2026-colorado-trail-race-rigs/')).toBe('example.org');
    expect(guessTitle('example.org/bikes/2026-colorado-trail-race-rigs/')).toBe('2026 Colorado Trail Race Rigs');
    expect(guessYear('Rigs of Doom 2025')).toBe(2025);
    const l = newLink({ url: 'example.org/bikes/rigs-of-doom-2025/', notes: ['Über 90 Rigs', ' '] }, { id: 'l1', now: '2026-10-14T00:00:00Z' });
    expect(l).toMatchObject({ url: 'https://example.org/bikes/rigs-of-doom-2025/', title: 'Rigs Of Doom 2025', year: 2025, kind: 'rig', notes: ['Über 90 Rigs'], star: false });
  });
  it('filters by year and star, races count their rigs', () => {
    const race = newLink({ url: 'example.org/race', title: 'test_data_gtp_ Rennen Alpen 2027', kind: 'race', raceDate: '2027-08-14', raceEnd: '2027-08-22' }, { id: 'r1' });
    const a = { ...newLink({ url: 'example.org/a-2026', raceId: 'r1' }, { id: 'a', now: '2026-01-01' }), star: true };
    const b = newLink({ url: 'example.org/b-2025' }, { id: 'b', now: '2026-02-01' });
    const links = [race, a, b];
    expect(linkYears(links)).toEqual([2026, 2025]);
    expect(filterLinks(links, 'all').map((x) => x.id)).toEqual(['a', 'b']);
    expect(filterLinks(links, 2025).map((x) => x.id)).toEqual(['b']);
    expect(filterLinks(links, 'star').map((x) => x.id)).toEqual(['a']);
    expect(racesOf(links, '2026-10-14')).toMatchObject([{ id: 'r1', rigs: 1, past: false }]);
  });
});

describe('setup log', () => {
  const entry = (id, date, extra = {}) => newLogEntry({ date, kind: 'drive', title: `test_data_gtp_ ${id}`, before: '40 Z.', after: '38 Z.', deltaG: '+0', ...extra }, { id, now: `${date}T10:00:00Z` });
  it('shows km since, the first trip after it and its debrief sentence', () => {
    const b = { ...bike, setupLog: [entry('e1', '2026-10-03')] };
    const trips = [trip({ id: 'j', startDate: '2026-10-10', title: 'test_data_gtp_ Jura' })];
    const debriefs = [{ tripId: 'j', note: 'Anstiege leichter. Beine frischer.' }];
    const kmBook = [
      { id: 'k1', bikeId: 'g', date: '2026-09-01', km: 1000, state: 'counted' },
      { id: 'k2', bikeId: 'g', date: '2026-10-10', km: 212, state: 'counted' },
    ];
    const [v] = logView(b, { trips, debriefs, kmBook, today: '2026-10-14' });
    expect(v).toMatchObject({ kmSince: 212, firstTrip: { id: 'j' }, feel: 'Anstiege leichter.' });
  });
  it('counts this year and asks once to go back after 3 trips', () => {
    const b = { ...bike, setupLog: [entry('e1', '2026-06-02', { kind: 'tyres', deltaG: 180 }), entry('e2', '2026-08-21', { deltaG: 570 })] };
    expect(logYear(b.setupLog, 2026)).toMatchObject({ n: 2, deltaG: 750, byKind: { tyres: 1, drive: 1 } });
    const trips = ['2026-08-30', '2026-09-12', '2026-10-01'].map((d, n) => trip({ id: `t${n}`, startDate: d }));
    expect(backHint(b, trips.slice(0, 2), '2026-10-14')).toBeNull();
    expect(backHint(b, trips, '2026-10-14')).toMatchObject({ id: 'e2', n: 3, before: '40 Z.', after: '38 Z.' });
    const answered = { ...b, setupLog: b.setupLog.map((e) => ({ ...e, backAsked: true })) };
    expect(backHint(answered, trips, '2026-10-14')).toBeNull();
  });
  it('offers workshop jobs that replaced a part, until logged or skipped', () => {
    const visits = [{ id: 'v1', bikeId: 'g', date: '2026-09-20', parts: [{ part: 'tyres', action: 'replace', model: 'test_data_gtp_ Reifen' }, { part: 'chain', action: 'check' }] }];
    expect(visitOffers(bike, visits, '2026-10-14')).toEqual([{ visitId: 'v1', part: 'tyres', date: '2026-09-20', model: 'test_data_gtp_ Reifen', what: '', kind: 'tyres' }]);
    const logged = { ...bike, setupLog: [newLogEntry({ date: '2026-09-20', title: 'x', source: { type: 'visit', id: 'v1' }, part: 'tyres' }, { id: 'e' })] };
    expect(visitOffers(logged, visits, '2026-10-14')).toEqual([]);
    expect(visitOffers({ ...bike, logSkipped: ['v1:tyres'] }, visits, '2026-10-14')).toEqual([]);
    expect(visitOffers(bike, visits, '2027-06-01')).toEqual([]);
    expect(kindOfPart('chain')).toBe('drive');
    expect(kindOfPart('saddle')).toBe('cockpit');
  });
  it('keeps a debrief sentence short', () => {
    expect(feelOf('x'.repeat(120)).length).toBe(90);
  });
});
