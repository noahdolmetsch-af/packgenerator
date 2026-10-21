import { describe, it, expect } from 'vitest';
import { photoDay, setupTimeline, headPhoto, problemPhotos, PROBLEM_PHOTOS } from '../src/lib/photo.js';
import { buildProblems } from '../src/lib/problems.js';
import { coverPhoto } from '../src/lib/lernen/fotos.js';

// «Bilder in der App» (Noah 20.10.2026 «1b 2a 3a 4a 5a»), fictional data only.
const bike = { id: 'gravel', name: 'Gravel Blau' };
const ph = (id, over = {}) => ({ id, bikeId: 'gravel', name: id, data: `data:${id}`, main: false, tripId: null, addedAt: '2026-05-02T10:00:00Z', ...over });

describe('setup photos as a timeline (2a)', () => {
  it('takes the day set by hand, else the day it was added', () => {
    expect(photoDay({ day: '2025-07-01', addedAt: '2026-05-02T10:00:00Z' })).toBe('2025-07-01');
    expect(photoDay({ addedAt: '2026-05-02T10:00:00Z' })).toBe('2026-05-02');
    expect(photoDay({})).toBe(null);
  });
  it('groups by month, newest first, photos without a day at the end', () => {
    const photos = [ph('a', { day: '2025-07-01' }), ph('b', { day: '2026-03-10' }), ph('c', { day: '2026-03-02' }), ph('d', { addedAt: '' }), ph('x', { bikeId: 'other' })];
    const g = setupTimeline(bike, photos);
    expect(g.map((x) => x.month)).toEqual(['2026-03', '2025-07', '']);
    expect(g[0].items.map((p) => p.id)).toEqual(['b', 'c']);
    expect(g.flatMap((x) => x.items).some((p) => p.id === 'x')).toBe(false);
  });
});

describe('the pale photo behind the head (1b)', () => {
  it('is the photo marked main, else the newest one', () => {
    expect(headPhoto(bike, [ph('a', { day: '2025-01-01' }), ph('b', { day: '2026-01-01' })]).id).toBe('b');
    expect(headPhoto(bike, [ph('a', { day: '2025-01-01', main: true }), ph('b', { day: '2026-01-01' })]).id).toBe('a');
    expect(headPhoto(bike, [])).toBe(null);
  });
});

describe('several photos per problem (3a)', () => {
  it('older rows with one photo still count', () => {
    expect(problemPhotos({ photo: 'data:1' })).toEqual(['data:1']);
    expect(problemPhotos({ photo: 'data:1', photos: ['data:1', 'data:2'] })).toEqual(['data:1', 'data:2']);
    expect(problemPhotos({})).toEqual([]);
    expect(PROBLEM_PHOTOS).toBeGreaterThan(1);
  });
  it('the first problem keeps all photos and the PDF, the first photo stays in `photo`', () => {
    const { notes, repairs } = buildProblems(['Kette', 'Bremse'], { bike, photos: ['data:1', 'data:2'], docId: 'doc-1', rows: [], stamp: 's' });
    expect(repairs[0]).toMatchObject({ photo: 'data:1', photos: ['data:1', 'data:2'], docId: 'doc-1' });
    expect(repairs[1].photo).toBe(null);
    expect(repairs[1].photos).toBeUndefined();
    expect(notes[0].photos).toEqual(['data:1', 'data:2']);
  });
});

describe('the tour photo on top of the tour page (5a)', () => {
  const list = [{ id: 'p1' }, { id: 'p2' }];
  it('is the chosen one, else the first', () => {
    expect(coverPhoto(list, 'p2').id).toBe('p2');
    expect(coverPhoto(list, 'gone').id).toBe('p1');
    expect(coverPhoto([], 'p1')).toBe(null);
  });
});
