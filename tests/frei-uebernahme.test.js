// «Fürs nächste Mal» › «In Packliste übernehmen» (Noah 05.11.2026 «8b»): the notes go onto the list of a trip.
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { takeOver, applyTakeOver, leaveText } from '../src/lib/frei/uebernahme.js';

const NOW = '2026-11-05T21:00:00.000Z';
const item = (id, name, extra = {}) => ({ id, name, category: 'lux', ownership: 'owned', defaultBag: null, ...extra });
const trip = (extra = {}) => ({ id: 'tr1', title: 'test_data_gtp_ Herbstrunde', startDate: '2026-11-10', days: 1, bikeId: 'b1', setup: {}, entries: [{ itemId: 'i1', slot: 'body', qty: 1, packed: false }], ...extra });
const mark = (key, name, pile, extra = {}) => ({ id: `m-${key}`, kind: 'mark', key, name, pile, reason: '', ...extra });
const tr = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '');
const items = [item('i1', 'Rain jacket'), item('i2', 'Head torch'), item('i3', 'Spare tube')];

describe('takeOver', () => {
  it('puts a missing known item on the list and leaves one that is there alone', () => {
    const r = takeOver({ marks: [mark('item:i2', 'Head torch', 'missing'), mark('item:i1', 'Rain jacket', 'proven')], trip: trip(), items, now: NOW, tr });
    expect(r.added).toEqual(['Head torch']);
    expect(r.already).toEqual(['Rain jacket']);
    expect(r.entries.map((e) => e.itemId)).toEqual(['i1', 'i2']);
    expect(r.entries[1]).toMatchObject({ qty: 1, packed: false });
  });
  it('makes a new item for a missing name, once, and reuses an item of that name', () => {
    const r = takeOver({ marks: [mark('name:sun cream', 'Sun cream', 'missing'), mark('name:head torch', 'Head torch', 'missing')], trip: trip(), items, now: NOW, tr });
    expect(r.newItems).toHaveLength(1);
    expect(r.newItems[0].name).toBe('Sun cream');
    expect(r.entries.map((e) => e.itemId)).toContain('i2');
    expect(r.entries.map((e) => e.itemId)).toContain(r.newItems[0].id);
  });
  it('makes two new items with two different ids', () => {
    const r = takeOver({ marks: [mark('name:a', 'Alpha', 'missing'), mark('name:b', 'Beta', 'missing')], trip: trip(), items, now: NOW, tr });
    expect(new Set(r.newItems.map((i) => i.id)).size).toBe(2);
  });
  it('takes nothing off for «just came along»: it leaves a planning note, once', () => {
    const m = mark('item:i1', 'Rain jacket', 'unused', { reason: 'dry all week' });
    const r = takeOver({ marks: [m], trip: trip(), items, now: NOW, tr });
    expect(r.entries.map((e) => e.itemId)).toEqual(['i1']);
    expect(r.noted).toEqual(['Rain jacket']);
    expect(r.planNotes[0].text).toBe('Leave Rain jacket at home next time – dry all week');
    expect(r.planNotes[0].text).toBe(leaveText(m, tr));
    const again = takeOver({ marks: [m], trip: trip({ planNotes: r.planNotes }), items, now: NOW, tr });
    expect(again.noted).toEqual([]);
    expect(again.already).toEqual(['Rain jacket']);
  });
  it('says «already fine» for a «just came along» item that is not on the list', () => {
    const r = takeOver({ marks: [mark('item:i3', 'Spare tube', 'unused')], trip: trip(), items, now: NOW, tr });
    expect(r.noted).toEqual([]);
    expect(r.already).toEqual(['Spare tube']);
  });
  it('uses the first pack on a trip without a bike', () => {
    const r = takeOver({ marks: [mark('item:i2', 'Head torch', 'missing')], trip: trip({ packs: [{ key: 'day-pack' }] }), items, now: NOW, tr });
    expect(r.entries.at(-1).slot).toBe('day-pack');
  });
});

describe('applyTakeOver', () => {
  const setup = async () => {
    const db = createDb(`test-uebernahme-${Math.random().toString(36).slice(2)}`);
    await db.items.bulkPut(items);
    await db.trips.put(trip());
    const marks = [mark('item:i2', 'Head torch', 'missing'), mark('name:sun cream', 'Sun cream', 'missing')];
    await db.frei.bulkPut(marks);
    return { db, marks };
  };
  it('writes the trip, the new item and the marks, and Undo puts everything back', async () => {
    const { db, marks } = await setup();
    const { result, undo } = await applyTakeOver(db, { tripId: 'tr1', marks, tr, now: NOW });
    expect(result.added).toEqual(['Head torch', 'Sun cream']);
    expect((await db.trips.get('tr1')).entries).toHaveLength(3);
    expect(await db.items.count()).toBe(4);
    expect((await db.frei.get('m-item:i2')).takenTo).toBe('tr1');
    await undo();
    expect((await db.trips.get('tr1')).entries).toHaveLength(1);
    expect(await db.items.count()).toBe(3);
    expect((await db.frei.get('m-item:i2')).takenTo).toBeUndefined();
  });
  it('does nothing for a trip that is gone', async () => {
    const { db, marks } = await setup();
    expect(await applyTakeOver(db, { tripId: 'nope', marks, tr, now: NOW })).toBeNull();
  });
});
