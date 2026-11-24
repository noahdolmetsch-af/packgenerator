import { describe, it, expect } from 'vitest';
import { emptyBook, bookOf, addPlace, addVisit, editPlace, removePlace, dismiss, suggestions, sportOfType, topOfRide, topOfAct, placeRows, yearGroups, coreOf, sportCounts, gbStars, nextPassStar, starsOfPlace } from '../src/lib/gipfelbuch.js';

const place = (b, name, sport, ele, day, extra = {}) => addPlace(b, { name, sport, ele, ...extra }, { day, ref: extra.ref ?? 'hand', hm: extra.hm ?? null });
const idOf = (b, name) => b.places.find((p) => p.name === name).id;

describe('Gipfelbuch für alle (v0.165.0)', () => {
  it('reads a missing or broken row as an empty book', () => {
    expect(bookOf(null)).toEqual(emptyBook());
    expect(bookOf({ places: 'x' }).places).toEqual([]);
  });
  it('maps Strava types to the sports of the book; indoor and others are not suggested', () => {
    expect(sportOfType('Ride')).toBe('bike');
    expect(sportOfType('GravelRide')).toBe('gravel');
    expect(sportOfType('MountainBikeRide')).toBe('xc');
    expect(sportOfType('BackcountrySki')).toBe('ski');
    expect(sportOfType('Hike')).toBe('hike');
    expect(sportOfType('Yoga')).toBeNull();
  });
  it('finds the top of a ride on its line and of an activity in its course', () => {
    const ride = { profile: [[0, 600], [10, 1400], [20, 2140], [30, 900]], line: [[46.0, 8.0], [46.1, 8.1], [46.2, 8.2], [46.3, 8.3]] };
    expect(topOfRide(ride)).toEqual({ ele: 2140, rise: 1540, lat: 46.2, lon: 8.2 });
    expect(topOfAct({ prof: { pts: [[0, 1000], [30, 1810], [60, 1200]] } })).toEqual({ ele: 1810, rise: 810, lat: null, lon: null });
    expect(topOfRide({ profile: [] })).toBeNull();
  });
  it('suggests tops high enough, not yet in the book and not dismissed, newest first; a near place is a visit', () => {
    let b = place(emptyBook(), 'Passo Esempio', 'bike', 2140, '2026-09-12', { lat: 46.2, lon: 8.2 });
    const rides = [
      { id: 'r1', date: '2026-10-01', name: 'test_data_gtp_ again', gainM: 1500, profile: [[0, 600], [20, 2138], [40, 700]], line: [[46.0, 8.0], [46.2001, 8.2001], [46.3, 8.3]] },
      { id: 'r2', date: '2026-08-01', name: 'test_data_gtp_ flat', gainM: 100, profile: [[0, 400], [20, 500]], line: [[47, 8], [47.1, 8]] },
    ];
    const acts = [
      { id: 'a1', day: '2026-09-20', type: 'Hike', name: 'test_data_gtp_ hike', hm: 900, prof: { pts: [[0, 1500], [90, 2455]] }, climbs: [{ name: 'Muster-Gipfel Aufstieg', hm: 900 }] },
      { id: 'a2', day: '2026-09-21', type: 'Ride', trainer: true, prof: { pts: [[0, 1000], [60, 2500]] } },
      { id: 'a3', day: '2026-09-22', type: 'Yoga', prof: { pts: [[0, 1000], [60, 2500]] } },
    ];
    const s = suggestions(b, { acts, rides });
    expect(s.map((x) => x.ref)).toEqual(['ride:r1', 'act:a1']);
    expect(s[0].match).toBe(idOf(b, 'Passo Esempio'));
    expect(s[1]).toMatchObject({ sport: 'hike', ele: 2455, name: 'Muster-Gipfel Aufstieg', match: null });
    b = dismiss(b, 'act:a1');
    b = addVisit(b, idOf(b, 'Passo Esempio'), { day: '2026-10-01', ref: 'ride:r1', hm: 1500 });
    expect(suggestions(b, { acts, rides })).toEqual([]);
  });
  it('matches an activity by a climb that carries the name of a place', () => {
    const b = place(emptyBook(), 'Col du Test', 'gravel', 1610, '2026-08-30');
    const acts = [{ id: 'a9', day: '2026-10-02', type: 'GravelRide', prof: { pts: [[0, 600], [80, 1612]] }, climbs: [{ name: 'Col du Test (Nord)', hm: 1000 }] }];
    expect(suggestions(b, { acts })[0].match).toBe(idOf(b, 'Col du Test'));
  });
  it('places by hand also for sports without height; edit and remove', () => {
    let b = place(emptyBook(), 'Halle Beispiel', 'other', '', '2026-10-03', { label: 'Tennis' });
    expect(b.places[0]).toMatchObject({ sport: 'other', ele: null, label: 'Tennis' });
    b = editPlace(b, b.places[0].id, { name: 'Halle Muster', ele: '480' });
    expect(b.places[0]).toMatchObject({ name: 'Halle Muster', ele: 480 });
    b = removePlace(b, b.places[0].id);
    expect(b).toEqual({ places: [], visits: [], dismissed: [] });
  });
  it('groups the visits by year, counts new places and builds the key line', () => {
    let b = place(emptyBook(), 'Col du Test', 'gravel', 1610, '2025-07-01', { hm: 900 });
    b = addVisit(b, idOf(b, 'Col du Test'), { day: '2026-08-30', hm: 950 });
    b = place(b, 'Piz Fictiv', 'ski', 2940, '2026-03-14', { hm: 1400 });
    const g = yearGroups(b);
    expect(g.map((x) => [x.year, x.rows.map((r) => [r.place.name, r.firstEver]), x.visits, x.fresh])).toEqual([
      ['2026', [['Col du Test', false], ['Piz Fictiv', true]], 2, 1],
      ['2025', [['Col du Test', true]], 1, 1],
    ]);
    expect(coreOf(b, '2026')).toEqual({ places: 2, fresh: 1, top: { name: 'Piz Fictiv', ele: 2940 }, hm: 2350 });
    expect(sportCounts(b).map((s) => [s.key, s.n])).toEqual([['gravel', 1], ['ski', 1]]);
    expect(placeRows(b, 'ski').map((r) => r.place.name)).toEqual(['Piz Fictiv']);
  });
  it('gives the four kinds of stars; trails and summits do not count as passes', () => {
    let b = emptyBook();
    const day = (i) => `2026-0${1 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, '0')}`;
    for (let i = 0; i < 10; i++) b = place(b, `Pass ${i}`, i % 2 ? 'gravel' : 'bike', 1500 + i * 60, day(i));
    b = place(b, 'Trail X', 'xc', 2500, '2026-05-01');
    const s = gbStars(b);
    expect(s.map((x) => x.id)).toEqual(['gb.new5-2026', 'gb.pass2000', 'gb.passes-10', 'gb.top-2026']);
    expect(s.find((x) => x.id === 'gb.pass2000')).toMatchObject({ name: 'Pass 9', ele: 2040, day: day(9) });
    expect(s.find((x) => x.id === 'gb.top-2026')).toMatchObject({ name: 'Trail X', ele: 2500 });
    expect(s.find((x) => x.id === 'gb.new5-2026')).toMatchObject({ name: 'Pass 4', day: day(4) });
    expect(nextPassStar(b)).toEqual({ have: 10, target: 25 });
    expect(starsOfPlace(b, idOf(b, 'Pass 9')).map((x) => x.id)).toEqual(['gb.pass2000', 'gb.passes-10']);
  });
});

describe('the page of one place', async () => {
  const g = await import('../src/lib/gipfelbuch.js');
  const mk = () => {
    let b = g.emptyBook();
    b = g.addPlace(b, { name: 'Testpass Nord', sport: 'bike', ele: 2100, lat: 46.5, lon: 8.4 }, { day: '2026-06-01', ref: 'act:a1' });
    b = g.addVisit(b, b.places[0].id, { day: '2026-07-01', ref: 'act:a2' });
    return b;
  };
  const acts = [
    { id: 'a1', name: 'Pass-Tag', tempMin: 3.4, tempMax: 18.2, photos: [{ url: 'https://x.test/1.jpg' }, { url: 'http://bad.test/2.jpg' }], climbs: [{ name: 'Testpass Nord (Südseite)', s: 4000 }, { name: 'Andere', s: 100 }] },
    { id: 'a2', name: 'Nochmal', climbs: [{ name: 'Aufstieg Testpass Nord', s: 3800 }] },
  ];

  it('finds the time up by the name of the place and keeps the fastest', () => {
    const b = mk();
    const best = g.fastestUp(b, b.places[0].id, { acts });
    expect(best).toMatchObject({ s: 3800, day: '2026-07-01' });
    expect(g.fastestUp(b, 'nope', { acts })).toBeNull();
  });

  it('reads the facts of a visit: temperature, secure photos only, source', () => {
    const b = mk();
    const f = g.visitFacts(b.visits[0], b.places[0], { acts });
    expect(f).toMatchObject({ source: 'strava', title: 'Pass-Tag', tmin: 3, tmax: 18 });
    expect(f.photos).toEqual(['https://x.test/1.jpg']);
    expect(g.visitFacts({ ref: 'hand' }, b.places[0], {}).source).toBe('hand');
    expect(g.visitFacts({ ref: 'ride:r1' }, b.places[0], { rides: [{ id: 'r1', name: 'GPX' }] })).toMatchObject({ source: 'gpx', title: 'GPX' });
  });

  it('changes a visit and removes one, but never the last of a place', () => {
    let b = mk();
    const [v1, v2] = b.visits;
    b = g.editVisit(b, v1.id, { note: '  Nebel  ', wx: { tmin: 1, tmax: 9 } });
    expect(b.visits[0]).toMatchObject({ note: 'Nebel', wx: { tmin: 1, tmax: 9 } });
    b = g.removeVisit(b, v2.id);
    expect(b.visits).toHaveLength(1);
    expect(g.removeVisit(b, v1.id)).toBe(b);
  });

  it('writes times as clock', () => {
    expect(g.clock(3800)).toBe('1:03:20');
    expect(g.clock(125)).toBe('2:05');
  });
});

describe('the own photos of the visits', async () => {
  const f = await import('../src/lib/gipfelfotos.js');
  it('keeps data images only, three per visit, newest last', () => {
    expect(f.fotosOf({ a: ['data:image/jpeg;base64,x', 'https://x.test/1.jpg', 5], b: [] })).toEqual({ a: ['data:image/jpeg;base64,x'] });
    expect(f.fotosOf(null)).toEqual({});
    let m = {};
    for (const n of [1, 2, 3, 4]) m = f.addFoto(m, 'v', `data:image/jpeg;base64,${n}`);
    expect(m.v).toEqual(['data:image/jpeg;base64,2', 'data:image/jpeg;base64,3', 'data:image/jpeg;base64,4']);
  });
  it('removes one photo and the photos of removed visits', () => {
    const m = { v: ['data:image/jpeg;base64,1'], w: ['data:image/jpeg;base64,2'] };
    expect(f.removeFoto(m, 'v', 0)).toEqual({ w: ['data:image/jpeg;base64,2'] });
    expect(f.pruneFotos(m, { visits: [{ id: 'w' }] })).toEqual({ w: ['data:image/jpeg;base64,2'] });
  });
});
