// Paket P8 «Fotoalbum»: all photos of the app by month and place (src/lib/album/fotos.js), and the album photo that greets on Heute.
import { describe, it, expect } from 'vitest';
import { KINDS, allPhotos, countKinds, ofKind, byMonth, byPlace, placesOf, newAlbumPhoto, albumPatch, sizeOf } from '../src/lib/album/fotos.js';
import { greetPhoto, albumOf } from '../src/lib/wohl.js';
import de from '../src/lib/i18n/de/index.js';

const D = 'data:image/jpeg;base64,AAAA';
const photos = [
  { id: 'a1', album: true, data: D, name: 'test_data_gtp_ Pause', place: 'test_data_gtp_ See', day: '2026-08-08', addedAt: '2026-10-01T10:00:00Z' },
  { id: 'a2', album: true, data: D, name: '', place: '', addedAt: '2026-09-02T10:00:00Z', greet: false },
  { id: 'b1', bikeId: 'bk1', data: D, name: 'Setup', day: '2026-08-20' },
  { id: 'b2', bikeId: 'bk1', data: D, wear: true, date: '2026-07-01' },
  { id: 'b3', bikeId: 'bk1', data: D, pack: true, date: '2026-08-01' },
  { id: 'x', bikeId: 'bk1', data: null },
];
const notes = [
  { id: 'n1', tripId: 'tr1', at: '2026-08-15T07:00:00Z', text: 'test_data_gtp_ Aussicht', photo: D, photos: [D] },
  { id: 'n2', tripId: null, at: '2026-08-15T07:00:00Z', text: 'kein Tour', photo: D },
  { id: 'n3', tripId: 'gone', at: '2026-08-15T07:00:00Z', text: 'Tour weg', photo: D },
];
const trips = [{ id: 'tr1', title: 'test_data_gtp_ Jura' }];
const bikes = [{ id: 'bk1', name: 'test_data_gtp_ Scale' }];
const all = allPhotos({ photos, notes, trips, bikes });

describe('Fotoalbum', () => {
  it('collects album, bike and trip photos, newest first', () => {
    expect(all.map((x) => x.id)).toEqual(['a2', 'b1', 'note:n1:1', 'note:n1:0', 'a1', 'b3', 'b2']);
    expect(countKinds(all)).toEqual({ all: 7, album: 2, bike: 3, tour: 2 });
    expect(all.find((x) => x.id === 'b2')).toMatchObject({ kind: 'bike', sub: 'wear', day: '2026-07-01', place: 'test_data_gtp_ Scale', href: '#/bikes?bike=bk1' });
    expect(all.find((x) => x.id === 'note:n1:0')).toMatchObject({ kind: 'tour', place: 'test_data_gtp_ Jura', href: '#/debrief/tr1', caption: 'test_data_gtp_ Aussicht' });
    expect(all.find((x) => x.id === 'a2')).toMatchObject({ day: '2026-09-02', month: '2026-09', greet: false });
    expect(ofKind(all, 'album').map((x) => x.id)).toEqual(['a2', 'a1']);
    expect(ofKind(all, 'all')).toBe(all);
  });
  it('groups by month with the places, and by place', () => {
    const m = byMonth(all);
    expect(m.map((g) => g.key)).toEqual(['2026-09', '2026-08', '2026-07']);
    expect(m[1].places).toEqual(['test_data_gtp_ Scale', 'test_data_gtp_ Jura', 'test_data_gtp_ See']);
    expect(byMonth([{ month: '' }, { month: '2026-01' }]).map((g) => g.key)).toEqual(['2026-01', '']);
    const p = byPlace(all);
    expect(p.map((g) => g.key)).toEqual(['test_data_gtp_ Scale', 'test_data_gtp_ Jura', 'test_data_gtp_ See', '']);
    expect(placesOf(all)).toEqual(['test_data_gtp_ See']);
  });
  it('makes and changes an album photo', () => {
    const r = newAlbumPhoto(D, { day: '2026-10-09', now: '2026-10-09T07:00:00Z', place: ' Ufer ' });
    expect(r).toMatchObject({ album: true, bikeId: null, tripId: null, day: '2026-10-09', place: 'Ufer', data: D });
    expect(newAlbumPhoto(D).id).not.toBe(newAlbumPhoto(D).id);
    expect(albumPatch({ caption: ' Rast ', place: 'See', day: '2026-08-01', greet: false })).toEqual({ name: 'Rast', place: 'See', day: '2026-08-01', greet: false });
    expect(albumPatch({ day: 'kaputt' })).toEqual({});
    expect(sizeOf([{ src: 'x'.repeat(400) }])).toBe(300);
  });
  it('a photo switched off never greets on Heute', () => {
    const album = albumOf(photos);
    expect(album.map((p) => p.id)).toEqual(['a2', 'a1']);
    for (const r of [0, 0.5, 0.99]) expect(greetPhoto(album, r).id).toBe('a1');
    expect(greetPhoto([{ id: 'z', greet: false }], 0.3)).toBe(null);
  });
  it('has German for the chips', () => {
    for (const k of KINDS) expect(de[k.name], k.name).toBeTruthy();
    expect(de['Place|photo']).toBe('Ort');
  });
});
