// «Pässe sammeln» (Paket E, Idee 24): finding passes on a ride and the collection.
import { describe, it, expect } from 'vitest';
import { PASSES, RADIUS_KM, distToSegmentKm, passesOnLine } from '../src/lib/paesse/katalog.js';
import { stateOf, suggestions, collect, collectAll, addOwn, change, remove, skip, unskip, resetSkipped, newestFirst, highest, passOf } from '../src/lib/paesse/sammlung.js';

const FURKA = PASSES.find((p) => p.key === 'furka');
/** A ride that goes over the Furka: a stretch of road across its top. */
const overFurka = [[FURKA.lat - 0.02, FURKA.lon - 0.05], [FURKA.lat, FURKA.lon + 0.001], [FURKA.lat + 0.02, FURKA.lon + 0.05]];

describe('katalog', () => {
  it('every pass has a name, a height and a place in Switzerland or next to it', () => {
    expect(new Set(PASSES.map((p) => p.key)).size).toBe(PASSES.length);
    for (const p of PASSES) {
      expect(p.name.length).toBeGreaterThan(2);
      expect(p.m).toBeGreaterThan(900);
      expect(p.m).toBeLessThan(2600);
      expect(p.lat).toBeGreaterThan(45.5);
      expect(p.lat).toBeLessThan(47.2);
      expect(p.lon).toBeGreaterThan(6);
      expect(p.lon).toBeLessThan(10.6);
    }
  });

  it('measures the distance to a stretch', () => {
    // 0.01° of latitude is about 1.11 km
    expect(distToSegmentKm([46.5, 8], [46.49, 7.9], [46.49, 8.1])).toBeCloseTo(1.11, 1);
    expect(distToSegmentKm([46.5, 8], [46.5, 8], [46.5, 8])).toBeCloseTo(0, 5);
    expect(distToSegmentKm([46.5, 8], [46.6, 8.1], [46.6, 8.1])).toBeGreaterThan(10);
  });

  it('finds the pass a ride goes over, also between two far points of the line', () => {
    expect(passesOnLine(overFurka)).toEqual(['furka']);
    expect(passesOnLine([[FURKA.lat - 0.3, FURKA.lon], [FURKA.lat + 0.3, FURKA.lon]])).toContain('furka');
  });

  it('does not count a road further away than the radius', () => {
    const km = (RADIUS_KM + 2) / 111.2;
    expect(passesOnLine([[FURKA.lat - 0.05, FURKA.lon + km * 1.5], [FURKA.lat + 0.05, FURKA.lon + km * 1.5]])).toEqual([]);
  });

  it('copes with empty and broken lines', () => {
    expect(passesOnLine([])).toEqual([]);
    expect(passesOnLine(null)).toEqual([]);
    expect(passesOnLine([[46.5, 8.4]])).toEqual([]);
    expect(passesOnLine([[null, 8], [46.5, 8.4], [46.6, 8.5]])).toEqual([]);
  });
});

describe('sammlung', () => {
  const rides = [
    { id: 'a2', date: '2026-08-20', title: 'Zweite Fahrt', line: overFurka },
    { id: 'a1', date: '2026-07-04', title: 'Erste Fahrt', line: overFurka },
    { id: 'a3', date: '2026-09-01', title: 'Flach', line: [[47.3, 8.5], [47.4, 8.6]] },
  ];

  it('reads a stored value made whole', () => {
    expect(stateOf(undefined)).toEqual({ list: [], skipped: [] });
    expect(stateOf({ list: [{ id: 'x', name: ' Furka ', m: '2429.4', date: '2026-07-04' }, { name: 'ohne id' }, null], skipped: ['a', 3] }).list).toEqual([{ id: 'x', key: '', name: 'Furka', m: 2429, date: '2026-07-04', ref: '' }]);
    expect(stateOf({ skipped: ['a', 3] }).skipped).toEqual(['a']);
  });

  it('suggests a pass with the date of the first ride', () => {
    const s = suggestions(rides, stateOf(null));
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ key: 'furka', date: '2026-07-04', title: 'Erste Fahrt', ref: 'a1' });
  });

  it('collected and skipped passes are not suggested again', () => {
    const st = collect(stateOf(null), suggestions(rides)[0]);
    expect(suggestions(rides, st)).toEqual([]);
    expect(suggestions(rides, skip(stateOf(null), 'furka'))).toEqual([]);
    expect(suggestions(rides, unskip(skip(stateOf(null), 'furka'), 'furka'))).toHaveLength(1);
    expect(suggestions(rides, resetSkipped(skip(stateOf(null), 'furka')))).toHaveLength(1);
  });

  it('collects once per pass, with its height and date', () => {
    const sug = suggestions(rides)[0];
    const st = collectAll(collect(stateOf(null), sug), [sug]);
    expect(st.list).toEqual([{ id: 'p-furka', key: 'furka', name: 'Furka', m: 2429, date: '2026-07-04', ref: 'a1' }]);
    expect(passOf('furka').m).toBe(2429);
    expect(passOf('nix')).toBeNull();
  });

  it('adds, changes and removes own passes', () => {
    let st = addOwn(stateOf(null), { name: '  Col du Test ', m: '1800', date: '2026-06-01' }, 'own-1');
    expect(st.list).toEqual([{ id: 'own-1', key: '', name: 'Col du Test', m: 1800, date: '2026-06-01', ref: '' }]);
    expect(addOwn(st, { name: '   ' }, 'own-2')).toBe(st);
    st = change(st, 'own-1', { name: 'Col du Nouveau', m: '', date: '2026-06-02' });
    expect(st.list[0]).toMatchObject({ name: 'Col du Nouveau', m: null, date: '2026-06-02' });
    expect(change(st, 'own-1', { name: '  ' }).list[0].name).toBe('Col du Nouveau');
    expect(remove(st, 'own-1').list).toEqual([]);
  });

  it('sorts newest first and finds the highest', () => {
    let st = addOwn(stateOf(null), { name: 'Alt', m: 1000, date: '2025-01-01' }, 'a');
    st = addOwn(st, { name: 'Neu', m: 2400, date: '2026-05-01' }, 'b');
    st = addOwn(st, { name: 'Ohne Datum', m: 500 }, 'c');
    expect(newestFirst(st.list).map((p) => p.name)).toEqual(['Neu', 'Alt', 'Ohne Datum']);
    expect(highest(st.list).name).toBe('Neu');
    expect(highest([])).toBeNull();
  });
});
