// Tempo-Runde (Noah 05.11.2026): detect() keeps its answer per collection while the places and the tracks stay the same.
import { describe, it, expect } from 'vitest';
import { COLLECTIONS, itemsOf, tracksOf, detect } from '../src/lib/neuland/neuland.js';
import { loadBase } from '../src/lib/neuland/load.js';

const KLAUSEN = [
  [47.3769, 8.5417], [47.295, 8.564], [47.238, 8.577], [47.082, 8.634], [47.0207, 8.653], [46.996, 8.606], [46.904, 8.623],
  [46.8804, 8.6444], [46.876, 8.665], [46.862, 8.77], [46.8686, 8.8546], [46.887, 8.9], [46.921, 8.997],
];
const defsOf = async (ids) => Promise.all(ids.map(async (id) => ({ ...COLLECTIONS.find((c) => c.id === id), items: itemsOf({}, id, await loadBase(id)).items })));
const own = (id, lat, lon) => ({ id: 'u-t', kind: 'point', items: [{ id, name: id, lat, lon, r: 0 }] });

describe('detect, tempo', () => {
  it('asked twice with the same places and tracks, it gives the same finds', async () => {
    const tracks = tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', line: KLAUSEN }], today: '2026-10-19' });
    const defs = await defsOf(['cantons', 'passes']);
    const a = detect(defs, tracks);
    const b = detect(await defsOf(['cantons', 'passes']), tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', line: KLAUSEN }], today: '2026-10-19' }));
    expect(b).toEqual(a);
    expect(Object.keys(a.cantons)).toEqual(expect.arrayContaining(['UR', 'GL']));
  });

  it('another set of collections reuses the finds of the one it shares', async () => {
    const tracks = tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', line: KLAUSEN }], today: '2026-10-19' });
    const both = detect(await defsOf(['cantons', 'passes']), tracks);
    const only = detect(await defsOf(['passes']), tracks);
    expect(Object.keys(only)).toEqual(['passes']);
    expect(only.passes).toEqual(both.passes);
  });

  it('a new ride, a moved place or a changed day gives new finds', async () => {
    const ride = (date, line) => tracksOf({ rides: [{ id: 'r1', date, line }], today: '2026-10-19' });
    const defs = await defsOf(['cantons']);
    const first = detect(defs, ride('2026-07-04', KLAUSEN));
    expect(first.cantons.UR.day).toBe('2026-07-04');
    // the same ride on another day
    expect(detect(defs, ride('2026-06-01', KLAUSEN)).cantons.UR.day).toBe('2026-06-01');
    // a shorter ride does not reach Zürich any more
    expect(detect(defs, ride('2026-07-04', KLAUSEN.slice(6, 10))).cantons.ZH).toBeUndefined();
    // an own place: found, then moved away, then not found
    const t = ride('2026-05-05', KLAUSEN);
    expect(detect([own('x', 46.8805, 8.6446)], t)['u-t'].x.day).toBe('2026-05-05');
    expect(detect([own('x', 40, 2)], t)['u-t']).toBeUndefined();
  });
});
