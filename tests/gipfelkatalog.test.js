// Gipfelbuch ausbauen (Noah 24.11.2026 «alle 1-5 zusammen»): the catalogue, the collections, own lists, and finding
// the places of the catalogue on a ride. Fictional names and rides.
import { describe, it, expect } from 'vitest';
import * as K from '../src/lib/gipfelkatalog.js';
import { emptyBook, addPlace } from '../src/lib/gipfelbuch.js';

const peaks = [
  ['Testhorn', 46.0, 8.0, 4200, 'VS'],
  ['Testspitze', 46.1, 8.1, 4010, 'VS'],
  ['Niederhorn', 46.2, 8.2, 3050, 'BE'],
];
const passes = [
  ['Testpass', 46.5, 8.4, 2300, 'VS'],
  ['Kleinpass', 46.6, 8.5, 1500, 'BE'],
];
const haus = [['Testhügel', 47.0, 8.0, 800]];
const cat = () => K.buildCatalog({ peaks, passes, summits: [['Testhorn', 46.0004, 8.0004, 4199]], haus });

describe('the catalogue', () => {
  it('puts the lists together, once per place, and sorts them into collections', () => {
    const c = cat();
    expect(c.filter((x) => x.name === 'Testhorn')).toHaveLength(1);
    expect(c.filter((x) => x.coll.includes('vier')).map((x) => x.name).sort()).toEqual(['Testhorn', 'Testspitze']);
    expect(c.filter((x) => x.coll.includes('paesse2000')).map((x) => x.name)).toEqual(['Testpass']);
    expect(c.find((x) => x.name === 'Testhügel').coll).toEqual(['haus']);
    expect(c.find((x) => x.name === 'Kleinpass').kind).toBe('pass');
  });
  it('knows the real lists it is built from', async () => {
    const real = await K.loadCatalog();
    expect(real.filter((x) => x.coll.includes('vier')).length).toBeGreaterThanOrEqual(45);
    expect(real.filter((x) => x.coll.includes('paesse2000')).length).toBeGreaterThan(20);
    expect(real.find((x) => x.name === 'Üetliberg').coll).toContain('haus');
    expect(new Set(real.map((x) => x.key)).size).toBe(real.length);
  });
});

describe('collections', () => {
  it('counts the places you have by name or by a visit nearby, the ones you have first', () => {
    let b = addPlace(emptyBook(), { name: 'Testhorn', sport: 'hike', ele: 4200 }, { day: '2026-07-01' });
    b = addPlace(b, { name: 'Pass irgendwo', sport: 'bike', ele: 4000, lat: 46.1002, lon: 8.1003 }, { day: '2026-07-02' });
    const col = K.collectionOf(K.COLLECTIONS[0], cat(), b);
    expect(col).toMatchObject({ have: 2, total: 2 });
    expect(col.rows.map((r) => r.it.name)).toEqual(['Testhorn', 'Testspitze']);
    const none = K.collectionOf(K.COLLECTIONS[1], cat(), emptyBook());
    expect(none).toMatchObject({ have: 0, total: 1 });
  });
  it('lets a place called «Pass Name» or «Name» count for the same pass', () => {
    const b = addPlace(emptyBook(), { name: 'Test', sport: 'bike', ele: 2300 }, { day: '2026-07-01' });
    expect(K.placeFor(b, { name: 'Testpass', m: 2300, lat: 0, lon: 0 })?.name).toBe('Test');
  });
});

describe('own lists', () => {
  it('reads, saves, changes, hides and removes', () => {
    expect(K.listsOf(null)).toEqual({ hidden: [], own: [] });
    expect(K.itemsOfText('A\n b ;A\n\n')).toEqual(['A', 'b']);
    let l = K.saveList(K.listsOf(null), { name: ' Meine ', items: 'Testhorn\nNiemals' }, 'gbl_1');
    expect(l.own).toEqual([{ id: 'gbl_1', name: 'Meine', items: ['Testhorn', 'Niemals'] }]);
    expect(K.saveList(l, { name: '' })).toBe(l);
    l = K.saveList(l, { id: 'gbl_1', name: 'Neu', items: 'X' });
    expect(l.own).toEqual([{ id: 'gbl_1', name: 'Neu', items: ['X'] }]);
    l = K.setHidden(l, 'vier', true);
    expect(l.hidden).toEqual(['vier']);
    expect(K.setHidden(l, 'vier', false).hidden).toEqual([]);
    expect(K.removeList(l, 'gbl_1').own).toEqual([]);
  });
  it('counts an own list against the book', () => {
    const b = addPlace(emptyBook(), { name: 'Testhorn', sport: 'hike' }, { day: '2026-07-01' });
    const c = K.ownCollection({ id: 'x', name: 'L', items: ['Testhorn', 'Fern'] }, b);
    expect(c).toMatchObject({ have: 1, total: 2, own: true });
    expect(c.rows[0].it.name).toBe('Testhorn');
  });
});

describe('finding places on a ride', () => {
  // a line that runs over Testpass (46.5, 8.4) and near Testhorn (46.0, 8.0, 1.0 km east of the line)
  const line = [[46.45, 8.35], [46.5, 8.4], [46.55, 8.45]];
  const act = { id: 'a1', type: 'Ride', day: '2026-07-10', name: 'Passfahrt', hm: 1400, line: undefined, _line: line };
  const withLine = (a) => ({ ...a, line: a._line });

  it('suggests the pass by name for a road ride, and no summit for a ride', () => {
    const c = cat().concat([{ key: 'peak:nahgipfel', name: 'Nahgipfel', m: 2400, lat: 46.5, lon: 8.401, kind: 'peak', coll: [] }]);
    const s = K.catalogSuggestions(emptyBook(), c, { acts: [withLine(act)] });
    expect(s.map((x) => x.name)).toEqual(['Testpass']);
    expect(s[0]).toMatchObject({ ref: 'act:a1', sport: 'bike', ele: 2300, match: null, level: 'sure', cat: 'pass:testpass' });
  });
  it('lets a hike find summits too, and says «again» for a place that is already in the book', () => {
    const c = cat().concat([{ key: 'peak:nahgipfel', name: 'Nahgipfel', m: 2400, lat: 46.5, lon: 8.401, kind: 'peak', coll: [] }]);
    let b = addPlace(emptyBook(), { name: 'Testpass', sport: 'bike', ele: 2300, lat: 46.5, lon: 8.4 }, { day: '2025-07-01', ref: 'act:old' });
    const s = K.catalogSuggestions(b, c, { acts: [withLine({ ...act, type: 'Hike' })] });
    expect(s.map((x) => x.name).sort()).toEqual(['Nahgipfel', 'Testpass']);
    expect(s.find((x) => x.name === 'Testpass').match).toBe(b.places[0].id);
  });
  it('leaves out what was confirmed or put away, but not the other places of the same ride', () => {
    const c = cat();
    const first = K.catalogSuggestions(emptyBook(), c, { acts: [withLine(act)] })[0];
    const b = addPlace(emptyBook(), { name: 'Testpass', sport: 'bike', lat: 46.5, lon: 8.4 }, { day: act.day, ref: first.ref });
    expect(K.catalogSuggestions(b, c, { acts: [withLine(act)] })).toEqual([]);
    const away = { ...emptyBook(), dismissed: [K.hitRef('act:a1', 'pass:testpass')] };
    expect(K.catalogSuggestions(away, c, { acts: [withLine(act)] })).toEqual([]);
  });
  it('skips indoor rides, flat rides and rides without a line', () => {
    const c = cat();
    expect(K.catalogSuggestions(emptyBook(), c, { acts: [withLine({ ...act, trainer: true }), withLine({ ...act, hm: 50 }), act] })).toEqual([]);
  });
  it('merges: a generic top that a catalogue hit explains is dropped, another top stays', () => {
    const found = [{ ref: 'act:a1', day: '2026-07-10', ele: 2300, name: 'Testpass', cat: 'pass:testpass' }];
    const generic = [
      { ref: 'act:a1', day: '2026-07-10', ele: 2310, name: '' },
      { ref: 'act:a2', day: '2026-07-09', ele: 1800, name: '' },
    ];
    expect(K.mergeSuggestions(generic, found).map((x) => x.ref)).toEqual(['act:a1', 'act:a2']);
    expect(K.mergeSuggestions(generic, found)[0].cat).toBe('pass:testpass');
  });
});
