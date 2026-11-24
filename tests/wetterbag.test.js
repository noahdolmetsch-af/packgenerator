// Packvorschläge nach Wetter und Lieblingsteilen pro Tasche (Noah 24.11.2026 «1-5»): a favourite among alternatives takes the
// place of the usual piece, and the open weather pieces are sorted by their bag. Fictional items only.
import { describe, it, expect } from 'vitest';
import { layerSuggest } from '../src/lib/layers.js';
import { weatherByBag, MAX_PER_BAG } from '../src/lib/pack/wetterbag.js';

const own = (id, f = {}) => ({ id, name: id, category: 'clothing', ownership: 'owned', defaultBag: 'seat', weightG: 100, qty: 1, ...f });
const byId = (items) => Object.fromEntries(items.map((i) => [i.id, i]));
const rainy = { wx: { min: 8, max: 12, rain: 'rain' }, entries: [] };

describe('favourite among alternatives', () => {
  const list = [own('JACKET', { rain: 'yes' }), own('LIGHT', { altFor: 'JACKET' }), own('POOL', { altFor: 'JACKET' })];

  it('keeps the usual piece when no alternative is a favourite', () => {
    expect(layerSuggest(rainy, list)[0]).toMatchObject({ id: 'JACKET', slot: 'JACKET' });
  });
  it('a favourite alternative takes its place, the slot stays the usual piece', () => {
    const fav = list.map((i) => (i.id === 'LIGHT' ? { ...i, favorite: true } : i));
    expect(layerSuggest(rainy, fav)[0]).toMatchObject({ id: 'LIGHT', slot: 'JACKET' });
  });
  it('a usual piece that is a favourite itself stays', () => {
    const fav = list.map((i) => (i.id === 'JACKET' || i.id === 'LIGHT' ? { ...i, favorite: true } : i));
    expect(layerSuggest(rainy, fav)[0].id).toBe('JACKET');
  });
  it('a pick of yours wins, also the pick «back to the usual piece»', () => {
    const fav = list.map((i) => (i.id === 'LIGHT' ? { ...i, favorite: true } : i));
    expect(layerSuggest({ ...rainy, layerPick: { JACKET: 'POOL' } }, fav)[0].id).toBe('POOL');
    expect(layerSuggest({ ...rainy, layerPick: { JACKET: 'JACKET' } }, fav)[0].id).toBe('JACKET');
    expect(layerSuggest({ ...rainy, layerPick: { JACKET: 'none' } }, fav)[0].skipped).toBe(true);
  });
});

describe('weatherByBag', () => {
  const items = [
    own('JACKET', { rain: 'yes', defaultBag: 'seat' }),
    own('COVERS', { rain: 'yes', defaultBag: 'frame', favorite: true }),
    own('GLOVES', { coldBelow: 5, defaultBag: 'frame' }),
    own('VEST', { ride: 'daily', defaultBag: 'seat' }),
    own('BUFF', { coldBelow: 10, defaultBag: 'body' }),
    own('SPARE', { rain: 'optional', defaultBag: 'seat' }),
  ];
  const slotOf = (i) => i.defaultBag;
  const trip = { ride: 'daily', wx: { min: 3, max: 9, rain: 'rain' }, entries: [] };
  const rows = layerSuggest(trip, items);

  it('groups the open cold and rain pieces by bag, favourites first, nothing from the ride or the body', () => {
    const out = weatherByBag({ trip, rows, itemsById: byId(items), slotOf });
    expect(Object.keys(out).sort()).toEqual(['frame', 'seat']);
    expect(out.frame.map((x) => x.id)).toEqual(['COVERS', 'GLOVES']);
    expect(out.seat.map((x) => x.id)).toEqual(['JACKET']); // the vest is a ride piece, the spare one only optional, the buff is worn
  });
  it('a piece that is packed is not suggested any more', () => {
    const packed = { ...trip, entries: [{ itemId: 'JACKET', slot: 'seat', qty: 1 }] };
    expect(weatherByBag({ trip: packed, rows: layerSuggest(packed, items), itemsById: byId(items), slotOf }).seat).toBeUndefined();
  });
  it('a skipped piece is not suggested', () => {
    const skip = { ...trip, layerPick: { JACKET: 'none' } };
    expect(weatherByBag({ trip: skip, rows: layerSuggest(skip, items), itemsById: byId(items), slotOf }).seat).toBeUndefined();
  });
  it('at most a few pieces per bag', () => {
    const many = Array.from({ length: 6 }, (_, n) => own(`R${n}`, { rain: 'yes' }));
    const t = { wx: { min: 8, max: 12, rain: 'rain' }, entries: [] };
    expect(weatherByBag({ trip: t, rows: layerSuggest(t, many), itemsById: byId(many), slotOf }).seat).toHaveLength(MAX_PER_BAG);
  });
});
