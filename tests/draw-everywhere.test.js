import { describe, it, expect } from 'vitest';
import { bikePhotos, bikePhotoDrawn } from '../src/lib/photo.js';
import { buildProblems } from '../src/lib/problems.js';
import { newEntry } from '../src/lib/tagebuch/journal.js';
import { hashSrc, inkFor, newInk, withInk } from '../src/lib/draw/ink.js';

// Paket NE 1146 (Noah 20.10.2026 «1b»): draw on every photo, not only in notes. Fictional data only.
const bike = { id: 'gravel', name: 'Gravel Blau' };
const ink = newInk({ base: 'data:old', w: 100, h: 80, id: 'ink-a' });

describe('setup photos (db.photos and the older bike.photo)', () => {
  it('bikePhotos carries the inks of a row and of the bike', () => {
    const inks = withInk({}, [], ['data:a'], ink);
    const list = bikePhotos({ ...bike, photo: 'data:b', inks: { x: 1 } }, [{ id: 'p1', bikeId: 'gravel', data: 'data:a', inks }]);
    expect(list.find((p) => p.id === 'p1').inks).toEqual(inks);
    expect(list.find((p) => !p.stored).inks).toEqual({ x: 1 });
  });
  it('a drawn photo of the photos table changes its row', () => {
    const d = bikePhotoDrawn('gravel', { id: 'p1', stored: true, inks: undefined }, { old: 'data:old', src: 'data:new', ink });
    expect(d.table).toBe('photos');
    expect(d.id).toBe('p1');
    expect(d.patch.data).toBe('data:new');
    expect(inkFor(d.patch.inks, 'data:new').ink.id).toBe('ink-a');
    expect(Object.keys(d.patch.inks)).toEqual([hashSrc('data:new')]);
  });
  it('the older bike photo changes the bike', () => {
    const d = bikePhotoDrawn('gravel', { id: 'bike-gravel', stored: false }, { old: 'data:old', src: 'data:new', ink });
    expect(d).toMatchObject({ table: 'bikes', id: 'gravel', patch: { photo: 'data:new' } });
    expect(inkFor(d.patch.inks, 'data:new')).toBeTruthy();
  });
});

describe('problem photos', () => {
  it('the drawings travel with the first problem, only for its photos', () => {
    const inks = withInk(withInk({}, [], ['data:p1'], ink), [], ['data:gone'], ink);
    const { repairs } = buildProblems(['Brake rubs', 'Bell loose'], { bike, photos: ['data:p1', 'data:p2'], inks, rows: [], now: '2026-05-02T10:00:00Z', stamp: 't' });
    expect(Object.keys(repairs[0].inks)).toEqual([hashSrc('data:p1')]);
    expect(repairs[1].inks).toBeUndefined();
  });
  it('no drawing: no inks field', () => {
    const { repairs } = buildProblems(['Brake rubs'], { bike, photos: ['data:p1'], rows: [], now: '2026-05-02T10:00:00Z', stamp: 't' });
    expect('inks' in repairs[0]).toBe(false);
  });
});

describe('diary entries', () => {
  it('keeps the inks of the photos that are still there', () => {
    const inks = withInk(withInk({}, [], ['data:d1'], ink), [], ['data:removed'], ink);
    const e = newEntry({ text: 'Ride along the lake', photos: [{ src: 'data:d1' }], inks }, { now: '2026-05-02T10:00:00Z' });
    expect(Object.keys(e.inks)).toEqual([hashSrc('data:d1')]);
  });
  it('an entry without drawings has no inks field', () => {
    const e = newEntry({ text: 'Ride', photos: [{ src: 'data:d1' }] }, { now: '2026-05-02T10:00:00Z' });
    expect('inks' in e).toBe(false);
  });
});
