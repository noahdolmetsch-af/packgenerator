// v0.73.0 «Ruhige Startseite + Fotoband»: the pure rules of the calmer Today page (fictional data).
import { describe, it, expect } from 'vitest';
import { tripToday, sameAsCard, bandPhotos, pickPhoto, photoCaption, actionsFirst } from '../src/lib/home/ruhig.js';
import { SECTIONS } from '../src/lib/home/heute.js';

const trip = (id, startDate, extra = {}) => ({ id, title: id, startDate, days: 1, bikeId: 'b1', ...extra });
const photo = (id, extra = {}) => ({ id, bikeId: 'b1', tripId: null, main: false, name: id, data: `data:image/jpeg;base64,${id}`, addedAt: '2025-07-14T10:00:00.000Z', ...extra });

describe('a trip today', () => {
  it('is a trip on one of its days, not skipped or finished', () => {
    expect(tripToday([trip('a', '2026-10-10')], '2026-10-10')).toBe(true);
    expect(tripToday([trip('a', '2026-10-08', { days: 3 })], '2026-10-10')).toBe(true);
    expect(tripToday([trip('a', '2026-10-11')], '2026-10-10')).toBe(false);
    expect(tripToday([trip('a', '2026-10-10', { skipped: true })], '2026-10-10')).toBe(false);
    expect(tripToday([trip('a', '2026-10-10', { finished: true })], '2026-10-10')).toBe(false);
    expect(tripToday([{ id: 'x' }], '2026-10-10')).toBe(false);
  });
});

describe('«Weitermachen» beside the trip card (Noah 2a)', () => {
  it('is hidden only for the same trip', () => {
    expect(sameAsCard('a', 'a')).toBe(true);
    expect(sameAsCard('a', 'b')).toBe(false);
    expect(sameAsCard('a', null)).toBe(false);
    expect(sameAsCard(null, null)).toBe(false);
  });
});

describe('the photo (Foto auf Heute 1a–4a)', () => {
  const bike = { id: 'b1', name: 'Gravel Blau' };
  it('takes the trip’s own photos first, else every photo of its bike, the main one first', () => {
    const ps = [photo('p1'), photo('p2', { main: true }), photo('p3', { tripId: 't1' }), photo('p4', { bikeId: 'b2' })];
    expect(bandPhotos(trip('t1', '2026-10-10'), bike, ps).map((p) => p.id)).toEqual(['p3']);
    expect(bandPhotos(trip('t2', '2026-10-10'), bike, ps).map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
    expect(bandPhotos(trip('t2', '2026-10-10'), bike, ps)[0]).toMatchObject({ src: 'data:image/jpeg;base64,p2', bikeId: 'b1', at: '2025-07-14T10:00:00.000Z' });
    expect(bandPhotos(null, bike, ps)).toEqual([]);
    expect(bandPhotos(trip('t2', '2026-10-10'), null, ps)).toEqual([]);
  });
  it('keeps the older bike photo without a name (the caption takes the bike)', () => {
    const list = bandPhotos(trip('t2', '2026-10-10'), { ...bike, photo: 'data:image/jpeg;base64,old' }, []);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('');
    expect(photoCaption(list[0], { fallback: 'Gravel Blau' })).toBe('Gravel Blau');
  });
  it('picks the same photo for the same number (one per app start)', () => {
    const list = ['a', 'b', 'c'];
    expect(pickPhoto(list, 0)).toBe('a');
    expect(pickPhoto(list, 0.5)).toBe('b');
    expect(pickPhoto(list, 0.99)).toBe('c');
    expect(pickPhoto(list, 1)).toBe('c');
    expect(pickPhoto([], 0.3)).toBeNull();
  });
  it('says place and month; a camera name gives way to the bike', () => {
    expect(photoCaption({ name: 'Klöntalersee', at: '2025-07-14T10:00:00.000Z' })).toBe('Klöntalersee · Juli 2025');
    expect(photoCaption({ name: 'IMG_1234', at: '2025-07-14T10:00:00.000Z' }, { fallback: 'Gravel Blau' })).toBe('Gravel Blau · Juli 2025');
    expect(photoCaption({ name: 'Setup', at: null }, { fallback: 'Gravel Blau' })).toBe('Gravel Blau');
    expect(photoCaption({ name: 'Jura', at: 'kaputt' })).toBe('Jura');
    expect(photoCaption(null)).toBe('');
  });
});

describe('a phone: the buttons right after the trip card', () => {
  it('moves «Im Flow» behind the buttons only when it stands directly before them', () => {
    expect(actionsFirst(SECTIONS)).toEqual(['greeting', 'trip', 'actions', 'flow', 'today', 'bikes', 'year']);
    expect(actionsFirst(['greeting', 'flow', 'trip', 'actions'])).toEqual(['greeting', 'flow', 'trip', 'actions']);
    expect(actionsFirst(['actions', 'flow'])).toEqual(['actions', 'flow']);
    expect(actionsFirst([])).toEqual([]);
  });
});
