// SN2x «SN2 extra» (Noah 13.10.2026 «SN2j–SN2k freigegeben»): the numbers behind the whole Rückblick of one
// trip: the five comparison groups (Bikepacking only by kind, the others by bike, km and Hm ±20 %), the power
// parts with watts, estimated and without, the load, W/kg with and without weight, the day switch, «Für
// nächstes Mal» only when relevant, the wear and «Packliste, wie gepackt». Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { powerBounds, powerZoneSecs, powerLoad, ftpEstimate, wkg, curveOf, tripPower, effortOf, loadOf } from '../src/lib/review/power.js';
import { GROUPS, openOf, isBikepacking, compareGroup, within, similarRows, dayTabs, dayFacts, timeline, tripNoteList, wearRows, chainLeft, packedList, packedTotals, NEXT_WHEN, guessWhen, cleanPoint, pointsOf, pointSuggestions, pointFits, remindersFor, tripNumbers, compareRows, lastSeries, SIMILAR_TOL } from '../src/lib/review/ganz.js';
import { kgOf, loadGanz, WEIGHT_KEY } from '../src/lib/review/actdata.js';
import { SITUATION_BLOCKS } from '../src/lib/situation.js';
import { createDb } from '../src/lib/db.js';

const P = 'test_data_gtp_';
const BIKES = [
  { id: 'b-road', name: 'Rennvelo Blau' },
  { id: 'b-gravel', name: 'Gravel Grinder' },
];
const trip = (extra = {}) => ({ id: `${P}t`, title: 'Napf-Tagestour', domain: 'bikepacking', startDate: '2026-10-06', days: 1, overnight: 'none', bikeId: 'b-road', entries: [], ...extra });
const row = (id, extra = {}, t = {}) => ({ kind: 'trip', id, start: extra.start ?? '2026-09-01', end: extra.end ?? extra.start ?? '2026-09-01', km: 62, gainM: 1180, title: id, trip: trip({ id, ...t }), rides: [], ...extra });

// a power meter (with detail), Strava's estimate, no power
const A_METER = { id: 1, day: '2026-10-06', movingS: 11100, hrAvg: 138, wAvg: 186, wMax: 742, wDevice: true, w20: 248, wNorm: 196, effort: 118, pHist: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 600, 0, 0, 0, 1200, 0, 0, 0, 0, 0, 900, 0, 0, 0, 0, 300, 0, 0, 0, 0, 120], pCurve: [[5, 980], [60, 520], [300, 330], [1200, 248], [3600, 212]] };
const A_EST = { id: 2, day: '2026-09-19', movingS: 18120, hrAvg: 134, wAvg: 151, wMax: 560, wDevice: false, w20: null, effort: 142 };
const A_NONE = { id: 3, day: '2026-09-12', movingS: 10000, hrAvg: 128, wAvg: null, effort: 96 };

describe('the five groups of the page (answer 1a)', () => {
  it('only «Die Tour» is open at the start; a remembered state is taken, a broken one ignored', () => {
    expect(GROUPS.map((g) => g.key)).toEqual(['tour', 'body', 'way', 'pack', 'next']);
    expect(openOf(null)).toEqual({ tour: true, next: true });
    expect(openOf('{"tour":false,"body":true,"nope":true}')).toEqual({ tour: false, body: true, next: true });
    expect(openOf('{"next":false}')).toEqual({ tour: true, next: false });
    expect(openOf('not json')).toEqual({ tour: true, next: true });
  });
});

describe('the comparison groups (answer 4, 20:18 «b»)', () => {
  it('Bikepacking holds only trips of the kind Bikepacking; every other trip goes by its bike', () => {
    const multi = trip({ days: 3, overnight: 'outdoor', bikeId: 'b-gravel' });
    expect(isBikepacking(multi)).toBe(true);
    expect(compareGroup(multi, BIKES)).toMatchObject({ key: 'bikepacking' });
    // a day ride without a night: its bike
    expect(isBikepacking(trip())).toBe(false);
    expect(compareGroup(trip(), BIKES)).toEqual({ key: 'bike:b-road', name: 'Rennvelo Blau', bikeId: 'b-road' });
    // one day with a night on the way is Bikepacking
    expect(compareGroup(trip({ overnight: 'outdoor' }), BIKES).key).toBe('bikepacking');
    // the kind «Velo» (round TA) goes by its bike even with days
    expect(compareGroup(trip({ domain: 'velo', days: 2, overnight: 'lodging' }), BIKES).key).toBe('bike:b-road');
    // no bike (ski, a backpack): no group
    expect(compareGroup(trip({ domain: 'ski', packs: [{ key: 'pack' }], bikeId: null }), BIKES)).toBeNull();
  });
  it('km and Hm each within ±20 %, only in the same group, earlier trips first', () => {
    expect(SIMILAR_TOL).toBe(0.2);
    expect(within(62, 74)).toBe(true);
    expect(within(62, 75)).toBe(false);
    expect(within(62, null)).toBe(false);
    const me = row('me', { start: '2026-10-06' });
    const rows = [
      me,
      row('same', { start: '2026-09-12', km: 65, gainM: 1240 }),
      row('older', { start: '2026-08-01', km: 58, gainM: 1000 }),
      row('later', { start: '2026-10-20', km: 60, gainM: 1100 }),
      row('toolong', { start: '2026-09-20', km: 80, gainM: 1180 }),
      row('toosteep', { start: '2026-09-21', km: 62, gainM: 1500 }),
      row('otherbike', { start: '2026-09-22' }, { bikeId: 'b-gravel' }),
      row('bikepacking', { start: '2026-09-23' }, { days: 2, overnight: 'outdoor' }),
      { ...row('ride'), kind: 'ride' },
    ];
    expect(similarRows(rows, me, BIKES).map((r) => r.id)).toEqual(['same', 'older', 'later']);
    // a Bikepacking trip compares with Bikepacking trips of any bike
    const bp = row('bp', { start: '2026-10-01' }, { days: 3, overnight: 'outdoor', bikeId: 'b-gravel' });
    const bp2 = row('bp2', { start: '2026-09-01' }, { days: 2, overnight: 'lodging', bikeId: 'b-road' });
    expect(similarRows([bp, bp2, me], bp, BIKES).map((r) => r.id)).toEqual(['bp2']);
  });
  it('the rows of «Vergleich»: only what both trips know, Relative Effort and load each a row', () => {
    const a = { kmh: 20.1, movingH: 3.08, pauseMin: 35, hrAvg: 138, wAvg: 186, effort: 118, load: 213 };
    const b = { kmh: 19.4, movingH: 3.35, pauseMin: 50, hrAvg: 141, wAvg: 179, effort: 131, load: null };
    const rows = compareRows(a, b);
    expect(rows.map((r) => r.key)).toEqual(['kmh', 'movingH', 'pauseMin', 'hrAvg', 'wAvg', 'effort']);
    expect(rows.find((r) => r.key === 'kmh').diff).toBe(0.7);
    expect(rows.find((r) => r.key === 'effort').diff).toBe(-13);
  });
  it('tripNumbers: heart rate from the activities, else the ledger; Relative Effort and load', () => {
    const r = { kmh: 20.1, movingH: 3.08, pauses: { n: 3, min: 35 }, end: '2026-10-06' };
    const n = tripNumbers(r, { acts: [A_METER], history: [A_METER] });
    expect(n).toMatchObject({ kmh: 20.1, pauseMin: 35, hrAvg: 138, wAvg: 186, west: false, effort: 118 });
    expect(n.load).toBeGreaterThan(0);
    const led = tripNumbers(r, { entries: [{ source: 'strava', kind: 'ride', hrAvg: 130, hrMax: 170, km: 62 }] });
    expect(led).toMatchObject({ hrAvg: 130, wAvg: null, effort: null, load: null });
  });
});

describe('power with watts, estimated and without (answer 2 «a und b»)', () => {
  it('the Coggan bounds and the seconds per zone from a 10 W histogram', () => {
    expect(powerBounds(236)).toEqual([130, 177, 212, 248, 283, 354]);
    expect(powerBounds(null)).toBeNull();
    const z = powerZoneSecs(A_METER.pHist, 236);
    // 105 W → Z1, 145 W → Z2, 205 W → Z3, 255 W → Z5, 305 W → Z6
    expect(z).toEqual([600, 1200, 900, 0, 300, 120, 0]);
    // an object histogram works too; nothing without FTP or histogram
    expect(powerZoneSecs({ 400: 60 }, 236)).toEqual([0, 0, 0, 0, 0, 0, 60]);
    expect(powerZoneSecs(null, 236)).toBeNull();
    expect(powerZoneSecs(A_METER.pHist, null)).toBeNull();
  });
  it('the estimated FTP: the best 20 min with a power meter in the 90 days up to the day × 0.95', () => {
    const acts = [A_METER, { ...A_METER, id: 9, day: '2026-09-01', w20: 260 }, { ...A_METER, id: 10, day: '2026-03-01', w20: 400 }, { ...A_EST, w20: 300 }];
    expect(ftpEstimate(acts, '2026-10-06')).toBe(Math.round(260 * 0.95));
    expect(ftpEstimate([A_EST], '2026-10-06')).toBeNull();
    // the day counts: before the better ride only the older one
    expect(ftpEstimate(acts, '2026-08-31')).toBeNull();
  });
  it('with a power meter: NP, Ø, max, zones, curve, FTP, load and W/kg', () => {
    const p = tripPower({ acts: [A_METER], history: [A_METER], kg: 72, end: '2026-10-06' });
    expect(p).toMatchObject({ measured: true, np: 196, avg: 186, max: 742, w20: 248, ftp: 236, wkgAvg: 2.6, wkg20: 3.4, kg: 72 });
    expect(p.zones.map((z) => z.s)).toEqual([600, 1200, 900, 0, 300, 120, 0]);
    expect(p.zones.reduce((s, z) => s + z.pct, 0)).toBeGreaterThanOrEqual(99);
    expect(p.curve).toEqual([{ s: 5, w: 980 }, { s: 60, w: 520 }, { s: 300, w: 330 }, { s: 1200, w: 248 }, { s: 3600, w: 212 }]);
    expect(p.load).toBe(powerLoad(A_METER, 236));
  });
  it('estimated by Strava: Ø and max marked estimated, no NP, zones, curve, FTP or load', () => {
    const p = tripPower({ acts: [A_EST], history: [A_EST], kg: 72 });
    expect(p).toEqual({ measured: false, avg: 151, max: 560, wkgAvg: 2.1, kg: 72 });
  });
  it('without watts: nothing (one quiet line on the page); Relative Effort stays', () => {
    expect(tripPower({ acts: [A_NONE] })).toBeNull();
    expect(tripPower({ acts: [] })).toBeNull();
    expect(effortOf([A_NONE])).toBe(96);
    expect(effortOf([A_METER, A_EST])).toBe(260);
    expect(effortOf([{ id: 4 }])).toBeNull();
  });
  it('a curve needs at least two durations', () => {
    expect(curveOf([{ pCurve: [[5, 900]] }])).toBeNull();
    expect(curveOf([{ pCurve: [[5, 900], [60, 400]] }, { pCurve: [[5, 950], [17, 999]] }])).toEqual([{ s: 5, w: 950 }, { s: 60, w: 400 }]);
  });
});

describe('the load (NP ÷ FTP)', () => {
  it('one hour at the FTP is 100; only with a power meter, NP and FTP', () => {
    expect(powerLoad({ wNorm: 236, movingS: 3600, wDevice: true }, 236)).toBe(100);
    expect(powerLoad({ wNorm: 196, movingS: 11100, wDevice: true }, 236)).toBe(Math.round((11100 / 3600) * (196 / 236) ** 2 * 100));
    expect(powerLoad({ wNorm: 196, movingS: 11100, wDevice: false }, 236)).toBeNull();
    expect(powerLoad({ wNorm: null, movingS: 11100, wDevice: true }, 236)).toBeNull();
    expect(powerLoad({ wNorm: 196, movingS: 11100, wDevice: true }, null)).toBeNull();
  });
  it('the load of a trip sums its days; none without watts', () => {
    const d2 = { ...A_METER, id: 5, day: '2026-10-07' };
    expect(loadOf([A_METER, d2], [A_METER, d2], '2026-10-07')).toBe(2 * powerLoad(A_METER, 236));
    expect(loadOf([A_EST, A_NONE], [A_EST], '2026-10-07')).toBeNull();
  });
});

describe('W/kg with and without weight (answer 3a)', () => {
  it('watts per kg with one decimal; no weight: null (the page shows «Gewicht unter Ich › Meine Daten»)', () => {
    expect(wkg(186, 72)).toBe(2.6);
    expect(wkg(186, null)).toBeNull();
    expect(wkg(null, 72)).toBeNull();
    expect(tripPower({ acts: [A_METER], history: [A_METER], kg: null })).toMatchObject({ wkgAvg: null, wkg20: null, kg: null });
  });
  it('the weight comes from the existing setting (grams), read through the adapter', async () => {
    expect(WEIGHT_KEY).toBe('riderWeightG');
    expect(kgOf(72000)).toBe(72);
    expect(kgOf(72.4)).toBe(72.4);
    expect(kgOf(null)).toBeNull();
    expect(kgOf('x')).toBeNull();
    const db = createDb(`${P}sn2x-${Math.random()}`);
    expect((await loadGanz(db)).kg).toBeNull();
    await db.settings.put({ key: WEIGHT_KEY, value: 71500 });
    const g = await loadGanz(db);
    expect(g.kg).toBe(71.5);
    // without the activities table (the Training PR adds it): no activities, no error
    expect(g.acts).toEqual([]);
    db.close();
  });
});

describe('the day switch (answer 5a)', () => {
  const t3 = trip({ id: 'drei', title: 'Drei-Seen-Runde', startDate: '2026-09-18', days: 3, overnight: 'outdoor', route: { km: 214, gainM: 2380 }, stages: { start: 'Bern', days: [{ km: 72, name: 'Murten' }, { km: 153, name: 'Ins' }, { km: null, name: 'Bern' }] }, forecast: { days: [{ date: '2026-09-18', min: 12, max: 19, rainMm: 0 }, { date: '2026-09-19', min: 9, max: 13, rainMm: 6 }, { date: '2026-09-20', min: 10, max: 17, rainMm: 0 }] } });
  const ride = (n, km, gainM, movingH, pauses = []) => ({ id: `r${n}`, date: `2026-09-${18 + n}`, startAt: `2026-09-${18 + n}T06:15:00.000Z`, km, gainM, movingH, totalH: movingH + 1, pauses });
  const r3 = { trip: t3, rides: [ride(0, 72, 620, 4.08), ride(1, 81, 1140, 5.03, [{ km: 28, at: '2026-09-19T09:05:00.000Z', min: 30 }]), ride(2, 61, 620, 3.55)] };
  it('a trip of several days: «Ganze Tour» and one tab per day; a day trip: none', () => {
    expect(dayTabs(t3)).toEqual([null, 0, 1, 2]);
    expect(dayTabs(trip())).toEqual([]);
  });
  it('the numbers of one day: its rides, the stage names and its forecast', () => {
    const d2 = dayFacts(r3, 1);
    expect(d2).toMatchObject({ n: 2, date: '2026-09-19', from: 'Murten', to: 'Ins', km: 81, gainM: 1140, movingH: 5.03, totalH: 6.03, kmh: 16.1, wet: true, rain: 6, tmin: 9, tmax: 13, pauses: { n: 1, min: 30 } });
    expect(dayFacts(r3, 0)).toMatchObject({ from: 'Bern', to: 'Murten', wet: false });
    // a day without a ride: the stage's km, no time
    const noRide = dayFacts({ trip: t3, rides: [] }, 2);
    expect(noRide).toMatchObject({ km: 61, movingH: null, kmh: null, pauses: null });
    expect(dayFacts(r3, null)).toBeNull();
  });
  it('the timeline of one day counts its km from that day, the whole trip from the start', () => {
    const notes = [{ at: '2026-09-19T07:30:00.000Z', day: 1, text: 'Mont Vully im Nebel' }, { at: '2026-09-18T12:00:00.000Z', day: 0, text: 'Tag eins' }];
    const day2 = timeline({ trip: t3, rides: r3.rides, notes, day: 1 });
    expect(day2.map((e) => e.kind)).toEqual(['start', 'note', 'pause', 'end']);
    expect(day2.every((e) => e.day === 1)).toBe(true);
    expect(day2[0]).toMatchObject({ km: 0, tkm: 72, n: 1 });
    const pause = day2.find((e) => e.kind === 'pause');
    expect(pause).toMatchObject({ km: 28, tkm: 100, min: 30, n: 3 });
    // a note gets its km from the ride it falls in
    expect(day2.find((e) => e.kind === 'note').km).toBeGreaterThan(0);
    const all = timeline({ trip: t3, rides: r3.rides, notes });
    expect(all.filter((e) => e.kind === 'start')).toHaveLength(3);
  });
});

describe('Zeitleiste and Notizen (U4)', () => {
  it('a round trip ends with the start number; short pauses fold away', () => {
    const r = { id: 'r', date: '2026-10-06', startAt: '2026-10-06T05:52:00.000Z', km: 62, totalH: 5.08, pauses: [{ km: 31, at: '2026-10-06T07:55:00.000Z', min: 25 }, { km: 40, at: '2026-10-06T08:40:00.000Z', min: 3 }] };
    const tl = timeline({ trip: trip(), rides: [r], notes: [{ at: '2026-10-06T06:40:00.000Z', day: 0, text: 'Nebel bis Menzberg' }], loop: true });
    expect(tl.map((e) => [e.kind, e.n ?? null])).toEqual([['start', 1], ['note', 2], ['pause', 3], ['pause', null], ['end', 1]]);
    expect(tl.find((e) => e.short)).toMatchObject({ min: 3 });
  });
  it('every note with time and place, also after the trip and the sentence for next time', () => {
    const d = { rideNotes: [{ at: '2026-10-06T06:40:00.000Z', day: 0, text: 'Nebel bis Menzberg' }], note: 'Sonnencreme fehlte', doneAt: '2026-10-06T18:30:00.000Z' };
    const notes = [{ id: 'n1', tripId: `${P}t`, at: '2026-10-06T09:10:00.000Z', day: 0, text: 'Kette knackt' }, { id: 'n2', tripId: `${P}t`, at: '2026-10-07T08:00:00.000Z', text: 'Nachher notiert' }, { id: 'n3', tripId: 'other', at: '2026-10-06T09:00:00.000Z', day: 0, text: 'fremd' }];
    const list = tripNoteList({ trip: trip(), debrief: d, notes });
    expect(list.map((n) => [n.text, n.after])).toEqual([['Nebel bis Menzberg', false], ['Kette knackt', false], ['Sonnencreme fehlte', true], ['Nachher notiert', true]]);
  });
});

describe('Abnutzung (U2) and the bike after the trip', () => {
  const bike = { id: 'b-road', name: 'Rennvelo Blau', km: 4312, parts: [{ key: 'chain', history: [{ action: 'replace', km: 1432 }, { action: 'service', km: 4282 }] }, { key: 'tyres', history: [{ action: 'replace', km: 902 }] }] };
  it('chain and tyres +km with their state now, brake pads +Hm', () => {
    expect(wearRows(bike, { km: 62, gainM: 1180 })).toEqual([
      { key: 'chain', addKm: 62, addHm: null, nowKm: 2880 },
      { key: 'tyres', addKm: 62, addHm: null, nowKm: 3410 },
      { key: 'pads', addKm: null, addHm: 1180, nowKm: null },
    ]);
  });
  it('nothing without a bike or the trip\'s km; parts without a record have no state', () => {
    expect(wearRows(null, { km: 62 })).toEqual([]);
    expect(wearRows(bike, { km: null })).toEqual([]);
    expect(wearRows({ id: 'x', km: 100, parts: [] }, { km: 40 }).map((x) => x.nowKm)).toEqual([null, null]);
  });
  it('the chain: km to the next wax (150 km), negative when due', () => {
    expect(chainLeft(bike)).toBe(120);
    expect(chainLeft({ ...bike, km: 4500 })).toBe(-68);
    expect(chainLeft({ id: 'x', parts: [] })).toBeNull();
  });
});

describe('Packliste, wie gepackt (U5)', () => {
  const items = [
    { id: 'A', name: 'Rain jacket', nameDe: 'Regenjacke', weightG: 250 },
    { id: 'B', name: 'Arm warmers', nameDe: 'Armlinge', weightG: 120 },
    { id: 'C', name: 'Power bank', weightG: null },
  ];
  const t = trip({ entries: [{ itemId: 'A', slot: 'seat', qty: 1 }, { itemId: 'B', slot: 'seat', qty: 2 }, { itemId: 'C', slot: 'top', qty: 1 }, { itemId: 'gone', slot: 'top', qty: 1 }], setup: { seat: 'bag1' } });
  it('by bag in the order of the trip, with the weight; an unweighed bag has none', () => {
    const list = packedList(t, items, [{ id: 'bag1', name: 'Saddle bag 10 L' }]);
    expect(list.map((b) => [b.slot, b.n, b.g])).toEqual([['seat', 2, 490], ['top', 1, null]]);
    expect(list[0].items[1]).toEqual({ id: 'B', name: 'Arm warmers', nameDe: 'Armlinge', g: 240, qty: 2 });
    expect(packedTotals(list)).toEqual({ bags: 2, n: 3, g: 490 });
  });
  it('the list kept on the saved debrief stays fixed, also when the gear changes later', () => {
    const snap = packedList(t, items, []);
    const later = items.map((i) => ({ ...i, weightG: 999, name: 'changed' }));
    expect(packedList(t, later, [], structuredClone(snap))).toEqual(snap);
    expect(packedTotals([])).toEqual({ bags: 0, n: 0, g: null });
  });
});

describe('Für nächstes Mal (U6, answer 7 «immer nur wenn relevant»)', () => {
  const debriefs = [
    { tripId: 'old', status: 'done', nextTime: [{ id: 'p1', text: 'Handschuhe zu dünn', when: 'cold' }, { id: 'p2', text: 'Licht vergessen', when: 'dark' }, { id: 'p3', text: 'Regenjacke dicker', when: 'rain' }, { id: 'p4', text: 'Rösti reservieren', when: 'any' }, { id: 'p5', text: '', when: 'cold' }] },
    { tripId: 'draft', status: 'draft', nextTime: [{ id: 'p6', text: 'nicht fertig', when: 'any' }] },
  ];
  const trips = [{ id: 'old', title: 'Herbstrunde', startDate: '2026-09-01' }, { id: 'draft', title: 'Entwurf', startDate: '2026-09-05' }];
  const plan = (extra) => ({ id: 'new', title: 'Neue Tour', startDate: '2026-10-20', days: 1, overnight: 'none', ...extra });
  it('the situations are the seven rules plus dark plus every trip', () => {
    expect(NEXT_WHEN).toEqual(['any', ...SITUATION_BLOCKS, 'dark']);
  });
  it('cold only on a cold trip, dark only into the dark, rain only with rain; «every trip» always', () => {
    const show = (t) => remindersFor(t, { debriefs, trips }).map((r) => r.text);
    expect(show(plan({ wx: { min: 14, max: 22, rain: 'none' } }))).toEqual(['Rösti reservieren']);
    expect(show(plan({ wx: { min: 2, max: 8, rain: 'none' } }))).toEqual(['Handschuhe zu dünn', 'Rösti reservieren']);
    expect(show(plan({ wx: { min: 12, max: 18, rain: 'rain' } }))).toEqual(['Regenjacke dicker', 'Rösti reservieren']);
    expect(show(plan({ wx: { min: 12, max: 18, rain: 'none' }, dark: true }))).toEqual(['Licht vergessen', 'Rösti reservieren']);
    // across groups: a point of a Bikepacking trip also on a day ride with another bike
    expect(remindersFor(plan({ wx: { min: 1, max: 4 }, bikeId: 'b-gravel' }), { debriefs, trips })[0]).toMatchObject({ text: 'Handschuhe zu dünn', when: 'cold', from: 'Herbstrunde', fromId: 'old' });
    // never the trip's own points, never from a draft
    expect(remindersFor({ ...plan({ wx: { min: 1, max: 4 } }), id: 'old' }, { debriefs, trips })).toEqual([]);
  });
  it('a ride into the dark from the riding time and the sun when not set on the trip', () => {
    const late = plan({ startDate: '2026-12-15', rideStart: ['14:00'], hours: 5, wx: { min: 10, max: 14 } });
    expect(pointFits({ when: 'dark' }, late, null, { lat: 47.1, lon: 8.0 })).toBe(true);
    expect(pointFits({ when: 'dark' }, plan({ wx: { min: 10, max: 14 } }), null, { lat: 47.1, lon: 8.0 })).toBe(false);
  });
  it('a rule switched off in «Bausteine» brings no reminder', () => {
    const sets = [{ key: 'cold', rule: { on: false, metric: 'minC', cmp: 'lt', limit: 5 } }];
    expect(pointFits({ when: 'cold' }, plan({ wx: { min: 1, max: 4 } }), sets)).toBe(false);
    expect(pointFits({ when: 'cold' }, plan({ wx: { min: 1, max: 4 } }), null)).toBe(true);
  });
  it('the situation is guessed from the words, else from the trip it came from', () => {
    expect(guessWhen('Handschuhe zu dünn')).toBe('cold');
    expect(guessWhen('Stirnlampe vergessen')).toBe('dark');
    expect(guessWhen('Sonnencreme einpacken')).toBe('heat');
    expect(guessWhen('Regenhose')).toBe('rain');
    expect(guessWhen('Rösti reservieren')).toBe('any');
    expect(guessWhen('Rösti reservieren', { climb: { kind: 'climb' } })).toBe('climb');
  });
  it('points are kept safe; suggestions from what was missing and the sentence, not twice', () => {
    expect(cleanPoint({ id: 'x', text: '  Licht  ', when: 'moon' })).toEqual({ id: 'x', text: 'Licht', when: 'any' });
    expect(cleanPoint({ text: ' ' })).toBeNull();
    expect(pointsOf(debriefs[0])).toHaveLength(4);
    const d = { missing: [{ id: 'm1', name: 'Sonnencreme' }], note: 'Vor 9 Uhr los', nextTime: [] };
    expect(pointSuggestions(d)).toEqual([{ key: 'miss:m1', name: 'Sonnencreme', pack: true, when: 'heat' }, { key: 'note', text: 'Vor 9 Uhr los', pack: false, when: 'any' }]);
    expect(pointSuggestions({ ...d, nextTime: [{ id: 'a', text: 'Sonnencreme einpacken', when: 'heat' }, { id: 'b', text: 'Vor 9 Uhr los', when: 'any' }] })).toEqual([]);
  });
});

describe('the bars of the last trips', () => {
  it('this trip last, at most 8, only trips up to it', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`r${i}`, { start: `2026-0${(i % 9) + 1}-1${i % 10}` }));
    const me = rows[5];
    const s = lastSeries(rows, me, (r) => r.km);
    expect(s.length).toBeLessThanOrEqual(8);
    expect(s.at(-1).id).toBe(me.id);
    expect(s.every((x) => rows.find((r) => r.id === x.id).start <= me.start)).toBe(true);
  });
});
