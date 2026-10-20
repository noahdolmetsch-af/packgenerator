// Gepäck nachtragen (Noah 20.10.2026 «1a 2b und a möglich 3a und b optional 4a 5a»), fictional data
import { describe, it, expect } from 'vitest';
import { entriesFor, tripFromActs, debriefFor, gearGroups, markItems, sourcesOf, pickGroups, noteLearning, domainFor, FOOD } from '../src/lib/touren/tourgear.js';
import { wxUrl, wxDays, wxSummary, startPlace, RECENT_DAYS } from '../src/lib/touren/tourwx.js';
import { activitiesForTrip } from '../src/lib/training.js';
import { unusedBefore } from '../src/lib/review/fromtemplate.js';

const items = [
  { id: 'KL01', name: 'test_ Weste', category: 'onbike', ownership: 'owned', defaultBag: 'top' },
  { id: 'WZ01', name: 'test_ Pumpe', category: 'tools', ownership: 'owned', defaultBag: 'frame' },
  { id: 'FD01', name: 'test_ Riegel', category: FOOD, ownership: 'owned' },
  { id: 'OB09', name: 'test_ Alt', category: 'offbike', ownership: 'gone' },
];
const acts = [
  { id: '11', day: '2026-10-18', time: '08:00', kind: 'bike', km: 40, movingS: 7200, elapsedS: 9000, line: '_p~iF~ps|U_ulLnnqC' },
  { id: '12', day: '2026-10-19', time: '09:00', kind: 'bike', km: 30 },
];

describe('the trip a ride becomes (1a)', () => {
  it('has the days of its activities, the chosen things and is finished', () => {
    const trip = tripFromActs(acts, { name: ' test_ Hochland ', bike: { id: 'b1', name: 'test_ Grau' }, ids: ['KL01', 'FD01', 'nope'], items, now: 1000 });
    expect(trip).toMatchObject({ title: 'test_ Hochland', startDate: '2026-10-18', days: 2, bikeId: 'b1', status: 'done', fromActs: ['11', '12'], domain: 'bikepacking' });
    expect(trip.entries.map((e) => e.itemId)).toEqual(['KL01', 'FD01']);
    expect(trip.entries[0]).toMatchObject({ slot: 'top', qty: 1, packed: true });
    expect(domainFor('hike')).toBe('hiking');
    expect(domainFor('bike')).toBe('bikepacking');
  });
  it('the trip has exactly its rides (not every ride of those days)', () => {
    const trip = tripFromActs([acts[0]], { name: 'x', now: 2 });
    const other = { id: '13', day: '2026-10-18', time: '18:00', kind: 'bike' };
    expect(activitiesForTrip(trip, [...acts, other]).map((a) => a.id)).toEqual(['11']);
  });
  it('the Rückblick is done, the km are already on the bike', () => {
    const deb = debriefFor({ id: 't1' }, { km: 40, diary: 'test_ schön' });
    expect(deb).toMatchObject({ tripId: 't1', status: 'done', km: 40, kmApplied: 40, items: {}, missing: [] });
    expect(deb.diary.text).toBe('test_ schön');
  });
  it('what was not used counts for the next trip', () => {
    const debs = [{ tripId: 't1', status: 'done', items: { KL01: 'unused' } }];
    expect(unusedBefore(debs, [{ id: 't1', startDate: '2026-10-18' }], { id: 't2', startDate: '2026-10-25' })).toEqual({ KL01: 1 });
  });
});

describe('choosing (2b and a)', () => {
  it('keeps the entries already there and adds new ones', () => {
    const old = [{ itemId: 'WZ01', slot: 'seat', qty: 2, packed: true }];
    expect(entriesFor(['WZ01', 'KL01'], old, items)).toEqual([old[0], { itemId: 'KL01', slot: 'top', qty: 1, packed: true }]);
  });
  it('the things by category, food last, gone ones only when chosen, with search', () => {
    const g = pickGroups(items, new Set());
    expect(g.at(-1).key).toBe(FOOD);
    expect(g.flatMap((x) => x.items.map((i) => i.id))).not.toContain('OB09');
    expect(pickGroups(items, new Set(['OB09'])).flatMap((x) => x.items.map((i) => i.id))).toContain('OB09');
    expect(pickGroups(items, new Set(), 'xyz').length).toBe(0);
    expect(pickGroups(items, new Set(), 'pumpe').flatMap((x) => x.items.map((i) => i.id))).toEqual(['WZ01']);
  });
  it('takes over from templates and earlier trips, newest first, not itself', () => {
    const s = sourcesOf({ templates: [{ id: 'a', name: 'test_ Tag', entries: [{ itemId: 'KL01' }] }, { id: 'e', name: 'leer', entries: [] }], trips: [{ id: 'x', title: 'alt', startDate: '2026-01-01', entries: [{ itemId: 'WZ01' }] }, { id: 'y', title: 'neu', startDate: '2026-09-01', entries: [{ itemId: 'FD01' }] }, { id: 'me', title: 'me', entries: [{ itemId: 'KL01' }] }], self: 'me' });
    expect(s.map((x) => x.id)).toEqual(['tpl:a', 'trip:y', 'trip:x']);
    expect(s[1].ids).toEqual(['FD01']);
  });
});

describe('marks and notes (3a, b optional), food on its own (5a)', () => {
  const entries = [{ itemId: 'KL01' }, { itemId: 'WZ01' }, { itemId: 'FD01' }];
  it('without a Rückblick nothing was looked at; with one, unmarked means used', () => {
    expect(gearGroups(entries, null, items).gear.open.length).toBe(2);
    const g = gearGroups(entries, { items: { WZ01: 'broken', FD01: 'unused' }, itemText: { KL01: 'test_ zu warm' } }, items);
    expect(g.gear.used.map((x) => [x.id, x.text])).toEqual([['KL01', 'test_ zu warm']]);
    expect(g.gear.broken.map((x) => x.id)).toEqual(['WZ01']);
    expect(g.food.unused.map((x) => x.id)).toEqual(['FD01']);
  });
  it('«used» takes the exception away', () => {
    expect(markItems({ KL01: 'unused' }, 'KL01', 'used')).toEqual({});
    expect(markItems({}, 'KL01', 'broken')).toEqual({ KL01: 'broken' });
  });
  it('a note is a learning of that thing', () => {
    expect(noteLearning({ id: 't1', title: 'test_ T' }, 'KL01', ' zu warm ')).toMatchObject({ id: 'tg-t1-KL01', rule: 'zu warm', itemIds: ['KL01'], tripId: 't1' });
  });
});

describe('the weather of the ride (4a)', () => {
  it('asks the forecast service for recent days and the archive for older ones', () => {
    expect(wxUrl({ lat: 47, lon: 8 }, '2026-10-18', '2026-10-18', '2026-10-20')).toContain('https://api.open-meteo.com/v1/forecast?latitude=47&longitude=8&start_date=2026-10-18&end_date=2026-10-18');
    expect(wxUrl({ lat: 47, lon: 8 }, '2026-01-02', '2026-01-02', '2026-10-20')).toContain('https://archive-api.open-meteo.com/v1/archive?');
    expect(RECENT_DAYS).toBeGreaterThan(0);
  });
  it('the start of the line is the place', () => {
    const p = startPlace(acts);
    expect(p.lat).toBeCloseTo(38.5, 3);
    expect(p.lon).toBeCloseTo(-120.2, 3);
    expect(startPlace([], { place: { lat: 46, lon: 7 } })).toEqual({ lat: 46, lon: 7 });
    expect(startPlace([])).toBe(null);
  });
  it('days and hours, the day in a few numbers and while riding', () => {
    const t = Array.from({ length: 24 }, (_, h) => h);
    const days = wxDays({ daily: { time: ['2026-10-18'], temperature_2m_min: [4.04], temperature_2m_max: [14.2], precipitation_sum: [1.2], wind_speed_10m_max: [18], wind_gusts_10m_max: [35] }, hourly: { time: t.map((h) => `2026-10-18T${String(h).padStart(2, '0')}:00`), temperature_2m: t.map((h) => h / 2), precipitation: t.map((h) => (h === 9 ? 0.4 : 0)) } });
    expect(days[0]).toMatchObject({ date: '2026-10-18', min: 4, max: 14.2, rainMm: 1.2, wind: 18, gust: 35 });
    const s = wxSummary({ days }, acts[0]);
    expect(s).toMatchObject({ tmin: 4, tmax: 14, mm: 1.2, wind: 18, gust: 35 });
    // 08:00 for 2:30 elapsed: the hours 8, 9 and 10
    expect(s.ride).toEqual({ tmin: 4, tmax: 5, mm: 0.4 });
    expect(wxSummary(null)).toBe(null);
  });
});

import { gearWeight, tripBefore, routeSeries, personalLine, tempOf, clothesAt } from '../src/lib/touren/tourextra.js';

describe('the ideas on top (Noah «1a 2a 3a 4a 5a»)', () => {
  const its = [
    { id: 'KL01', name: 'test_ Weste', category: 'onbike', ownership: 'owned', weightG: 120 },
    { id: 'KL02', name: 'test_ Knielinge', category: 'onbike', ownership: 'owned', weightG: 150 },
    { id: 'FD01', name: 'test_ Riegel', category: FOOD, ownership: 'owned', weightG: 50 },
    { id: 'WZ01', name: 'test_ Pumpe', category: 'tools', ownership: 'owned' },
  ];
  it('4: the gear weight, food apart, unknown weights counted', () => {
    expect(gearWeight([{ itemId: 'KL01', qty: 2 }, { itemId: 'FD01', qty: 3 }, { itemId: 'WZ01' }], its)).toEqual({ g: 240, foodG: 150, missing: 1, n: 3 });
    const trips = [{ id: 'a', startDate: '2026-09-01', entries: [{ itemId: 'KL01' }] }, { id: 'b', startDate: '2026-10-01', entries: [{ itemId: 'KL02' }] }, { id: 'c', startDate: '2026-10-02', entries: [] }];
    expect(tripBefore(trips, { id: 'x', startDate: '2026-10-18' }).id).toBe('b');
    expect(tripBefore(trips, { id: 'x', startDate: '2026-08-01' })).toBe(null);
  });
  it('2 and 3: the same route over time and the sentence', () => {
    const list = [
      { id: 3, day: '2026-10-18', time: '08:00', movingS: 4080, hrAvg: 116 },
      { id: 1, day: '2026-06-26', time: '08:00', movingS: 6180 },
      { id: 2, day: '2026-08-01', time: '08:00', movingS: 4320 },
    ];
    const s = routeSeries(list, 3);
    expect(s.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(s[2]).toMatchObject({ me: true, hf: 116 });
    expect(personalLine(s, 3)).toEqual({ key: 'Your {n}th time on this route, {m} min faster than on {day}.', vars: { n: 3, m: 4, day: '2026-08-01' } });
    expect(personalLine(s, 1).vars).toEqual({ k: 2 });
    expect(personalLine(s.slice(0, 1), 1)).toBe(null);
  });
  it('5: the clothes of finished tours at a similar temperature', () => {
    const trips = [
      { id: 't1', startDate: '2026-10-01', entries: [{ itemId: 'KL01' }, { itemId: 'KL02' }, { itemId: 'WZ01' }], wxReal: { days: [{ date: '2026-10-01', min: 6, max: 12 }] } },
      { id: 't2', startDate: '2026-10-08', entries: [{ itemId: 'KL01' }], wxReal: { days: [{ date: '2026-10-08', min: 8, max: 10 }] } },
      { id: 't3', startDate: '2026-07-08', entries: [{ itemId: 'KL02' }], wxReal: { days: [{ date: '2026-07-08', min: 20, max: 30 }] } },
    ];
    expect(tempOf(trips[0])).toBe(9);
    const debriefs = [{ tripId: 't1', status: 'done', items: { KL02: 'unused' } }, { tripId: 't2', status: 'done', items: {} }, { tripId: 't3', status: 'done', items: {} }];
    const c = clothesAt(10, { trips, debriefs, items: its });
    expect(c.n).toBe(2);
    expect(c.items).toEqual([{ id: 'KL01', worn: 2, unused: 0 }, { id: 'KL02', worn: 0, unused: 1 }]);
    expect(clothesAt(null, { trips })).toBe(null);
    expect(clothesAt(-5, { trips, debriefs, items: its })).toBe(null);
  });
});
