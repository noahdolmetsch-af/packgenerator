// «Neuland» (wish #1007 + #1006): detection, bingo, the person's ticks and own collections (fictional data).
import { describe, it, expect, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { lang } from '../src/lib/i18n.svelte.js';
import {
  COLLECTIONS, CANTON_IDS, LOOSE_ID, stateOf, collectionsOf, setOn, moveCollection, moveCollectionTo, addCustom, renameCollection, deleteCustom,
  itemsOf, addItem, editItem, hideItem, removeItem, restoreItem, tick, untick, clearNope, tracksOf, detect, visitedOf, visitedFromLines, parsePlace, newIn,
  bingoCard, bingoLines, BINGO_LINES, cantonsInYear, newOnTrip, neulandSummary, itemLabel, slug,
} from '../src/lib/neuland/neuland.js';
import { loadBase } from '../src/lib/neuland/load.js';
import { computeNeuland, saveState, readState, cantonAt } from '../src/lib/neuland/store.js';
import { decodeRing, inRings, lineKm, densify } from '../src/lib/neuland/geo.js';
import DE from '../src/lib/i18n/de/neuland.js';

afterEach(() => (lang.v = 'en'));

const P = 'test_data_gtp_';
// a fictional day ride Zürich → Schwyz → Flüelen → Altdorf → Klausenpass → Linthal
const KLAUSEN = [
  [47.3769, 8.5417], [47.295, 8.564], [47.238, 8.577], [47.082, 8.634], [47.0207, 8.653], [46.996, 8.606], [46.904, 8.623],
  [46.8804, 8.6444], [46.876, 8.665], [46.862, 8.77], [46.8686, 8.8546], [46.887, 8.9], [46.921, 8.997],
];
const defsOf = async (ids, state = {}) => Promise.all(ids.map(async (id) => ({ ...COLLECTIONS.find((c) => c.id === id), items: itemsOf(state, id, await loadBase(id)).items })));

describe('geometry', () => {
  it('decodes delta rings, tests a point inside, measures the way to a line', () => {
    const ring = decodeRing([8000, 47000, 1000, 0, 0, 1000, -1000, 0], 1000); // a square 8–9 E, 47–48 N
    expect([...ring]).toEqual([8, 47, 9, 47, 9, 48, 8, 48]);
    expect(inRings(8.5, 47.5, [ring])).toBe(true);
    expect(inRings(9.5, 47.5, [ring])).toBe(false);
    expect(lineKm([47, 8.005], [[46.9, 8], [47.1, 8]])).toBeCloseTo(0.38, 1);
    expect(densify([[47, 8], [47, 8.1]], 0.4).length).toBeGreaterThan(19);
  });
});

describe('the data', () => {
  it('26 cantons with their ids, every municipality has a canton, the lists have names and places', async () => {
    const cantons = await loadBase('cantons');
    expect(cantons.map((c) => c.id).sort()).toEqual([...CANTON_IDS].sort());
    const muni = await loadBase('municipalities');
    expect(muni.length).toBeGreaterThan(2000);
    expect(muni.every((m) => CANTON_IDS.includes(m.kt))).toBe(true);
    for (const id of ['passes', 'huts', 'peaks', 'lakes']) {
      const l = await loadBase(id);
      expect(new Set(l.map((x) => x.id)).size, id).toBe(l.length); // ids are unique
      expect(l.every((x) => x.name && (x.rings || (Number.isFinite(x.lat) && Number.isFinite(x.lon))))).toBe(true);
    }
    expect((await loadBase('passes')).length).toBeGreaterThanOrEqual(80);
    expect((await loadBase('huts')).length).toBeGreaterThanOrEqual(120);
    const peaks = await loadBase('peaks');
    expect(peaks.length).toBeGreaterThanOrEqual(150);
    expect(peaks.filter((p) => p.alt >= 4000).length).toBeGreaterThanOrEqual(48);
    expect(peaks.every((p) => p.alt >= 3000)).toBe(true);
    expect((await loadBase('countries')).find((c) => c.id === 'c756').name).toBe('Schweiz');
  });
  it('a town lies in its canton', async () => {
    expect(await cantonAt({ lat: 46.8804, lon: 8.6444 })).toBe('UR');
    expect(await cantonAt({ lat: 46.0037, lon: 8.9511 })).toBe('TI');
    expect(await cantonAt({ lat: 48.5, lon: 2 })).toBe(null);
  });
});

describe('finding what was new', () => {
  it('a ride over the Klausenpass: cantons, municipalities, the pass, a lake, the country', async () => {
    const tracks = tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', tripId: 't1', line: KLAUSEN }], today: '2026-10-19' });
    const defs = await defsOf(['cantons', 'municipalities', 'passes', 'lakes', 'countries', 'peaks']);
    const found = detect(defs, tracks);
    expect(Object.keys(found.cantons).sort()).toEqual(expect.arrayContaining(['ZH', 'SZ', 'UR', 'GL']));
    expect(found.cantons.UR).toMatchObject({ day: '2026-07-04', tripId: 't1', rideId: 'r1', years: { 2026: '2026-07-04' } });
    expect(found.passes['p-klausenpass'].day).toBe('2026-07-04');
    expect(found.passes['p-gotthardpass']).toBeUndefined();
    expect(found.lakes['l9179']).toBeTruthy(); // Vierwaldstättersee along the Urnersee
    expect(found.countries.c756).toBeTruthy();
    const muni = await loadBase('municipalities');
    const names = Object.keys(found.municipalities).map((id) => muni.find((m) => m.id === id).name);
    expect(names).toEqual(expect.arrayContaining(['Altdorf (UR)', 'Unterschächen', 'Glarus Süd']));
    expect(found.peaks).toBeUndefined(); // no peak within 250 m
  });
  it('the first day wins, later years are kept for the bingo', async () => {
    const tracks = tracksOf({
      trips: [
        { id: 't2', name: `${P}Late`, startDate: '2027-05-01', route: { line: KLAUSEN } },
        { id: 't1', name: `${P}Early`, startDate: '2026-06-01', route: { line: KLAUSEN.slice(6, 10) } },
        { id: 't3', name: `${P}Plan`, startDate: '2030-01-01', route: { line: KLAUSEN } }, // not yet reached
        { id: 't4', name: `${P}Test`, startDate: '2026-01-01', testTrip: true, route: { line: KLAUSEN } },
      ],
      today: '2027-06-01',
    });
    expect(tracks.map((x) => x.tripId)).toEqual(['t1', 't2']);
    const found = detect(await defsOf(['cantons']), tracks);
    expect(found.cantons.UR).toMatchObject({ day: '2026-06-01', tripId: 't1', years: { 2026: '2026-06-01', 2027: '2027-05-01' } });
    expect(found.cantons.ZH).toMatchObject({ day: '2027-05-01', tripId: 't2' });
  });
  it('lines from elsewhere (package S allLines) plug in', async () => {
    const lines = [{ day: '2026-03-03', source: 'spur', pts: KLAUSEN }, { day: '2099-01-01', source: 'spur', pts: KLAUSEN }, { day: '2026-03-04', source: 'spur', pts: [] }];
    const found = visitedFromLines(lines, await defsOf(['passes']), '2026-10-19');
    expect(found.passes['p-klausenpass']).toMatchObject({ day: '2026-03-03', tripId: null, years: { 2026: '2026-03-03' } });
    expect(tracksOf({ lines, today: '2026-10-19' }).map((x) => x.src)).toEqual(['spur']);
  });
  it('a trip without a line counts with its start place; activities without a place count for nothing', () => {
    const tracks = tracksOf({ trips: [{ id: 't1', startDate: '2026-02-01', place: { name: 'x', lat: 46.0, lon: 8.95 } }], activities: [{ id: 'a1', day: '2026-02-02', km: 20 }], today: '2026-10-19' });
    expect(tracks).toEqual([{ day: '2026-02-01', tripId: 't1', rideId: null, src: 'trip', pts: [[46.0, 8.95]] }]);
  });
});

describe('the person always wins', () => {
  const items = [{ id: 'UR' }, { id: 'GL' }, { id: 'TI' }];
  const found = { cantons: { UR: { day: '2026-07-04', tripId: 't1', rideId: 'r1', years: { 2026: '2026-07-04' } }, GL: { day: '2026-07-04', tripId: 't1', rideId: 'r1', years: { 2026: '2026-07-04' } } } };
  it('a tick by hand adds, an untick of a found one keeps it off, clearing lets the app decide again', () => {
    let s = tick({}, 'cantons', 'TI', '2025-08-01');
    s = untick(s, 'cantons', 'GL', { found: true, day: '2026-10-19' });
    let v = visitedOf(s, 'cantons', items, found);
    expect([...v.keys()].sort()).toEqual(['TI', 'UR']);
    expect(v.get('TI')).toMatchObject({ day: '2025-08-01', by: 'hand' });
    expect(v.get('UR').by).toBe('auto');
    expect(newIn(v, 2026)).toEqual(['UR']);
    expect(newIn(v, null).sort()).toEqual(['TI', 'UR']);
    s = clearNope(s, 'cantons', 'GL');
    v = visitedOf(s, 'cantons', items, found);
    expect(v.has('GL')).toBe(true);
    // ticking a found one by hand: the hand day counts as first, the years of the app stay
    s = tick(s, 'cantons', 'UR', '2024-05-05');
    expect(visitedOf(s, 'cantons', items, found).get('UR')).toMatchObject({ day: '2024-05-05', by: 'hand', years: { 2024: '2024-05-05', 2026: '2026-07-04' } });
    // a «not there» then a tick by hand: the tick wins
    s = untick(s, 'cantons', 'UR', { found: true, day: '2026-10-19' });
    expect(visitedOf(s, 'cantons', items, found).has('UR')).toBe(false);
    s = tick(s, 'cantons', 'UR', '2026-10-19');
    expect(visitedOf(s, 'cantons', items, found).get('UR').by).toBe('hand');
  });
  it('a broken stored value never breaks', () => {
    expect(stateOf('x')).toMatchObject({ off: [], ticks: {}, custom: [], home: null });
    expect(stateOf({ home: 'XX', custom: [{ id: 'u1', items: [{ id: 'a', name: 'A', lat: 'bad' }] }] })).toMatchObject({ home: null, custom: [{ id: 'u1', name: '', items: [{ id: 'a', name: 'A' }] }] });
  });
});

describe('collections: on and off, order, own ones', () => {
  it('switches, orders with arrows and by dragging', () => {
    let s = setOn({}, 'municipalities', false);
    expect(collectionsOf(s).find((c) => c.id === 'municipalities').on).toBe(false);
    s = setOn(s, 'municipalities', true);
    expect(collectionsOf(s).every((c) => c.on)).toBe(true);
    s = moveCollection(s, 'lakes', -1);
    expect(collectionsOf(s).map((c) => c.id).slice(4, 6)).toEqual(['lakes', 'peaks']);
    s = moveCollectionTo(s, 0, 6);
    expect(collectionsOf(s).at(-1).id).toBe('cantons');
  });
  it('own collection: add, rename, items, delete moves the items to «Ohne Sammlung» or another one', () => {
    let { state: s, id } = addCustom({}, `  ${P}Cafés `, 'u-a');
    expect(collectionsOf(s).at(-1)).toMatchObject({ id: 'u-a', builtIn: false, name: `${P}Cafés` });
    s = renameCollection(s, 'u-a', `${P}Lieblingscafés`);
    s = addItem(s, 'u-a', { name: `${P}Café am See`, lat: 47.2, lon: 8.8 }, 'x-1').state;
    s = addItem(s, 'u-a', { name: `${P}Café ohne Ort` }, 'x-2').state;
    s = tick(s, 'u-a', 'x-2', '2026-09-01');
    expect(itemsOf(s, 'u-a').items.map((i) => i.id)).toEqual(['x-1', 'x-2']);
    s = editItem(s, 'u-a', 'x-1', { name: `${P}Café Seeblick` });
    expect(itemsOf(s, 'u-a').items[0]).toMatchObject({ name: `${P}Café Seeblick`, lat: 47.2 });
    const b = addCustom(s, `${P}Glace`, 'u-b');
    s = deleteCustom(b.state, id, 'u-b');
    expect(s.custom.map((c) => c.id)).toEqual(['u-b']);
    expect(itemsOf(s, 'u-b').items).toHaveLength(2);
    expect(s.ticks['u-b']['x-2'].day).toBe('2026-09-01'); // the tick goes along
    s = deleteCustom(s, 'u-b', null, 'Ohne Sammlung');
    expect(s.custom).toMatchObject([{ id: LOOSE_ID, name: 'Ohne Sammlung' }]);
    expect(itemsOf(s, LOOSE_ID).items).toHaveLength(2);
    expect(deleteCustom(s, LOOSE_ID, null).custom).toEqual([]); // «Ohne Sammlung» itself goes with its items (the page asks, Undo)
  });
  it('built-in collection: own name, a missing item, rename, move and hide an item', async () => {
    let s = renameCollection({}, 'huts', `${P}Hütten`);
    expect(collectionsOf(s).find((c) => c.id === 'huts').name).toBe(`${P}Hütten`);
    expect(collectionsOf(renameCollection(s, 'huts', '')).find((c) => c.id === 'huts').name).toBe('');
    const base = await loadBase('huts');
    s = addItem(s, 'huts', { name: `${P}Neue Hütte`, lat: 46.5, lon: 8.5 }, 'x-h').state;
    s = editItem(s, 'huts', 'h-huefihuette', { name: `${P}Hüfi`, lat: 46.81, lon: 8.836 });
    s = hideItem(s, 'h-domhuette');
    const { items, hidden } = itemsOf(s, 'huts', base);
    expect(items.find((i) => i.id === 'h-huefihuette')).toMatchObject({ name: `${P}Hüfi`, lat: 46.81, fixed: true });
    expect(items.at(-1)).toMatchObject({ id: 'x-h', own: true });
    expect(hidden.map((i) => i.id)).toEqual(['h-domhuette']);
    expect(itemsOf(hideItem(s, 'h-domhuette', false), 'huts', base).hidden).toEqual([]);
    const gone = removeItem(s, 'huts', 'x-h');
    expect(itemsOf(gone, 'huts', base).items.some((i) => i.id === 'x-h')).toBe(false);
    expect(itemsOf(restoreItem(gone, 'huts', { id: 'x-h', name: 'back' }), 'huts', base).items.at(-1).name).toBe('back');
    // an own place in an own collection is found by the line
    const c = addCustom({}, `${P}Brunnen`, 'u-w');
    const s2 = addItem(c.state, 'u-w', { name: `${P}Dorfbrunnen`, lat: 46.8805, lon: 8.6446 }, 'x-w').state;
    const found = detect([{ id: 'u-w', kind: 'point', items: itemsOf(s2, 'u-w').items }], tracksOf({ rides: [{ id: 'r', date: '2026-05-05', line: KLAUSEN }] }));
    expect(found['u-w']['x-w'].day).toBe('2026-05-05');
  });
});

describe('bingo', () => {
  it('the same card for a year, the joker in the middle, 24 other cantons, one left out', () => {
    const a = bingoCard(2026, 'UR');
    expect(a).toEqual(bingoCard(2026, 'UR'));
    expect(a.cells).toHaveLength(25);
    expect(a.cells[12]).toBe('UR');
    expect(new Set(a.cells).size).toBe(25);
    expect([...a.cells, a.out].sort()).toEqual([...CANTON_IDS].sort());
    expect(bingoCard(2027, 'UR').cells).not.toEqual(a.cells);
    expect(bingoCard(2026, 'XX').joker).toBe('ZH');
  });
  it('rows, columns and diagonals; the joker helps', () => {
    const card = bingoCard(2026, 'ZH');
    expect(BINGO_LINES).toHaveLength(12);
    expect(bingoLines(card, new Set())).toEqual([]);
    const row2 = new Set([0, 1, 3, 4].map((i) => card.cells[10 + i])); // the middle row without the joker
    expect(bingoLines(card, row2).map((l) => `${l.kind}${l.n}`)).toEqual(['row2']);
    const all = new Set(card.cells);
    expect(bingoLines(card, all)).toHaveLength(12);
  });
  it('a year counts its own visits', () => {
    const v = new Map([['UR', { day: '2025-03-01', years: { 2025: '2025-03-01', 2026: '2026-07-01' } }], ['GL', { day: '2025-03-01', years: { 2025: '2025-03-01' } }]]);
    expect([...cantonsInYear(v, 2026)]).toEqual(['UR']);
    expect([...cantonsInYear(v, 2025)].sort()).toEqual(['GL', 'UR']);
  });
});

describe('«Was war neu?» and the Rückblick line, from the database', () => {
  it('lists what a trip reached first', async () => {
    const db = createDb(`test-neuland-${Math.random()}`);
    await db.trips.bulkPut([
      { id: 't1', name: `${P}Klausen`, startDate: '2026-07-04', days: 1, route: { line: KLAUSEN } },
      { id: 't2', name: `${P}Again`, startDate: '2026-08-01', days: 1, route: { line: KLAUSEN } },
    ]);
    await saveState(db, setOn(setOn({}, 'municipalities', false), 'countries', false));
    const r = await computeNeuland(db, { today: '2026-10-19' });
    expect(r.collections.map((c) => c.id)).not.toContain('municipalities');
    const neu = newOnTrip('t1', r);
    expect(neu.map((x) => x.label)).toEqual(expect.arrayContaining(['Canton Uri', 'Klausenpass · 1948 m']));
    expect(neu.find((x) => x.cid === 'cantons').what).toBe('Canton');
    expect(newOnTrip('t2', r)).toEqual([]);
    const sum = neulandSummary(r, 2026);
    expect(sum.text).toMatch(/^New in 2026: \d+ cantons, 1 pass, \d+ lakes?$/);
    expect(neulandSummary(r, 2025).text).toBe('');
    expect(r.home).toBe('ZH');
    expect((await readState(db)).off).toEqual(['municipalities', 'countries']);
    expect(itemLabel('municipalities', { name: 'Altdorf (UR)', kt: 'UR' })).toBe('Altdorf (UR)');
    expect(itemLabel('municipalities', { name: 'Linthal', kt: 'GL' })).toBe('Linthal (GL)');
    db.close();
  });
  it('every English text of Neuland has a German one', () => {
    for (const [en, de] of Object.entries(DE)) expect(de, en).toBeTruthy();
    expect(slug('Col de l’Iseran Hütte')).toBe('col-de-l-iseran-huette');
  });
});

describe('a place typed by the person', () => {
  it('reads «lat, lon», a space, commas as decimals, a map link; refuses nonsense', () => {
    expect(parsePlace('46.8686, 8.8546')).toEqual({ lat: 46.8686, lon: 8.8546 });
    expect(parsePlace('46,8686 8,8546')).toEqual({ lat: 46.8686, lon: 8.8546 });
    expect(parsePlace('https://maps.example/@46.86,8.85,15z')).toEqual({ lat: 46.86, lon: 8.85 });
    expect(parsePlace('')).toEqual({ lat: null, lon: null });
    expect(parsePlace('Altdorf')).toBeNull();
  });
});
