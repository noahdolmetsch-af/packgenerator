import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { chargeList, isChargeable, chargeCount, toggleCharge, chargeAll, isCharged } from '../src/lib/charge.js';
import { hasEvening, eveningPlan, blockPlan } from '../src/lib/blockplan.js';
import { blocks } from '../src/lib/ride.js';
import { compareStates, buildBackup, restoreBackup, markImported, lastChangeOf, trackChanges, shareFiles, LAST_CHANGE } from '../src/lib/backup.js';
import { createDb } from '../src/lib/db.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const item = (id, category, name, extra = {}) => ({ id, category, name, ownership: 'owned', qty: 1, ...extra });
const ITEMS = [
  item('test_data_gtp_EL1', 'elec', 'test_data_gtp_ Bike computer', { nameDe: 'test_data_gtp_ Velocomputer' }),
  item('test_data_gtp_EL2', 'elec', 'test_data_gtp_ Power bank'),
  item('test_data_gtp_EL3', 'elec', 'test_data_gtp_ USB-C cable'),
  item('test_data_gtp_EL4', 'elec', 'test_data_gtp_ Charger 2-port'),
  item('test_data_gtp_EL5', 'elec', 'test_data_gtp_ Phone'),
  item('test_data_gtp_LI1', 'light', 'test_data_gtp_ Front light'),
  item('test_data_gtp_LI2', 'light', 'test_data_gtp_ Rear light'),
  item('test_data_gtp_BK1', 'bike', 'test_data_gtp_ Di2 battery'),
  item('test_data_gtp_BK2', 'bike', 'test_data_gtp_ Bottle cage'),
  item('test_data_gtp_ON1', 'onbike', 'test_data_gtp_ Rain jacket'),
];
const entry = (itemId, qty = 1) => ({ itemId, slot: 'seat', qty, packed: false });

describe('charge list (L4)', () => {
  const trip = {
    id: 't1',
    entries: ['test_data_gtp_LI2', 'test_data_gtp_EL3', 'test_data_gtp_EL1', 'test_data_gtp_BK1', 'test_data_gtp_BK2', 'test_data_gtp_ON1', 'test_data_gtp_EL4', 'test_data_gtp_LI1', 'test_data_gtp_EL2'].map((id) => entry(id)).concat([entry('test_data_gtp_EL5', 2), entry('gone-item')]),
  };

  it('takes Electronics and Lights on the trip, without cables and chargers, plus clear devices elsewhere, sorted', () => {
    expect(chargeList(trip, ITEMS)).toEqual([
      { itemId: 'test_data_gtp_EL1', name: 'test_data_gtp_ Bike computer', qty: 1 },
      { itemId: 'test_data_gtp_EL5', name: 'test_data_gtp_ Phone', qty: 2 },
      { itemId: 'test_data_gtp_EL2', name: 'test_data_gtp_ Power bank', qty: 1 },
      { itemId: 'test_data_gtp_LI1', name: 'test_data_gtp_ Front light', qty: 1 },
      { itemId: 'test_data_gtp_LI2', name: 'test_data_gtp_ Rear light', qty: 1 },
      { itemId: 'test_data_gtp_BK1', name: 'test_data_gtp_ Di2 battery', qty: 1 },
    ]);
  });

  it('only what is on the trip; nothing for a trip without devices or no trip', () => {
    expect(chargeList({ entries: [entry('test_data_gtp_ON1')] }, ITEMS)).toEqual([]);
    expect(chargeList(null, ITEMS)).toEqual([]);
    expect(chargeList({ entries: [entry('test_data_gtp_LI1')] }, ITEMS).map((r) => r.itemId)).toEqual(['test_data_gtp_LI1']);
  });

  it('speaks German names in German', () => {
    lang.v = 'de';
    expect(chargeList({ entries: [entry('test_data_gtp_EL1')] }, ITEMS)[0].name).toBe('test_data_gtp_ Velocomputer');
  });

  it('the rule: categories, or a device name', () => {
    expect(isChargeable(item('x', 'elec', 'Garmin Edge'))).toBe(true);
    expect(isChargeable(item('x', 'elec', 'Ladekabel', { nameDe: 'Kabel USB' }))).toBe(false);
    expect(isChargeable(item('x', 'elec', 'SD card'))).toBe(false);
    expect(isChargeable(item('x', 'bike', 'SRAM AXS battery'))).toBe(true);
    expect(isChargeable(item('x', 'lux', 'Powerbank 5000'))).toBe(true);
    expect(isChargeable(item('x', 'tools', 'Tyre levers'))).toBe(false);
    expect(isChargeable(null)).toBe(false);
  });

  it('ticks live on the trip: the evening before and each evening on the way apart; items never change', () => {
    const list = chargeList(trip, ITEMS);
    const before = JSON.stringify(ITEMS);
    let t1 = { ...trip, ...toggleCharge(trip, 'test_data_gtp_EL1') };
    expect(t1.charge).toEqual({ test_data_gtp_EL1: true });
    expect(isCharged(t1, 'test_data_gtp_EL1')).toBe(true);
    expect(isCharged(t1, 'test_data_gtp_EL1', '2026-10-15')).toBe(false);
    t1 = { ...t1, ...toggleCharge(t1, 'test_data_gtp_LI1', '2026-10-15') };
    t1 = { ...t1, ...toggleCharge(t1, 'test_data_gtp_LI2', '2026-10-16') };
    expect(t1.chargeNight).toEqual({ '2026-10-15': { test_data_gtp_LI1: true }, '2026-10-16': { test_data_gtp_LI2: true } });
    expect(chargeCount(t1, list)).toEqual({ done: 1, total: 6 });
    t1 = { ...t1, ...toggleCharge(t1, 'test_data_gtp_EL1') };
    expect(t1.charge).toEqual({});
    t1 = { ...t1, ...chargeAll(t1, list, '2026-10-15') };
    expect(chargeCount(t1, list, '2026-10-15')).toEqual({ done: 6, total: 6 });
    expect(t1.chargeNight['2026-10-16']).toEqual({ test_data_gtp_LI2: true });
    expect(JSON.stringify(ITEMS)).toBe(before);
  });

  it('a tick of an item no longer on the list does not count', () => {
    const list = chargeList(trip, ITEMS);
    expect(chargeCount({ ...trip, charge: { 'gone-item': true, test_data_gtp_EL2: true } }, list)).toEqual({ done: 1, total: 6 });
  });
});

describe('the evening on a trip of several days (L8)', () => {
  it('every day except the last; not on a day ride or a nonstop ride (one stage)', () => {
    expect([0, 1, 2].map((d) => hasEvening(3, d))).toEqual([true, true, false]);
    expect(hasEvening(2, 0)).toBe(true);
    expect(hasEvening(2, 1)).toBe(false);
    expect(hasEvening(1, 0)).toBe(false);
    expect(eveningPlan({ days: 1, day: 0 })).toBeNull();
    expect(eveningPlan({ days: 2, day: 1 })).toBeNull();
  });

  const layers = [
    { item: { id: 'test_data_gtp_gilet', name: 'test_data_gtp_ Gilet', coldBelow: 12 }, qty: 1, place: 'Top tube bag' },
    { item: { id: 'test_data_gtp_rain', name: 'test_data_gtp_ Rain jacket', rain: 'yes' }, qty: 1, place: 'Seat pack' },
  ];
  const first = (wx) => {
    const rows = blocks({}, { startAt: '2026-10-16T08:00', hours: 6, km: null }).slice(0, 1);
    return blockPlan(rows, layers, { wxOf: () => wx, place: null }).rows[0];
  };
  const charge = [{ itemId: 'test_data_gtp_EL1', name: 'test_data_gtp_ Bike computer', qty: 1 }];

  it('holds the night, the charge list, the clothes for the first block of tomorrow and its weather', () => {
    const e = eveningPlan({ days: 2, day: 0, date: '2026-10-15', nextDate: '2026-10-16', overnight: 'lodging', first: first([{ t: '2026-10-16T08:00', temp: 7, rainMm: 1.2 }]), charge });
    expect(e.date).toBe('2026-10-15');
    expect(e.nextDate).toBe('2026-10-16');
    expect(e.overnight).toBe('lodging');
    expect(e.charge).toBe(charge);
    expect(e.layOut).toEqual([
      { id: 'test_data_gtp_gilet', name: 'test_data_gtp_ Gilet', place: 'Top tube bag' },
      { id: 'test_data_gtp_rain', name: 'test_data_gtp_ Rain jacket', place: 'Seat pack' },
    ]);
    expect(e.everyRide).toBe(false);
    expect(e.morning).toEqual({ from: '08:00', to: '11:00', temp: { lo: 7, hi: 7 }, wet: true, wxFrom: 'hours' });
  });

  it('warm and dry: the every-ride clothes; outdoor night; no tomorrow known: nothing to lay out', () => {
    const warm = eveningPlan({ days: 3, day: 1, overnight: 'outdoor', first: first([{ t: '2026-10-16T08:00', temp: 18, rainMm: 0 }]) });
    expect(warm.overnight).toBe('outdoor');
    expect(warm.layOut).toEqual([]);
    expect(warm.everyRide).toBe(true);
    const blind = eveningPlan({ days: 2, day: 0, overnight: 'none', first: null });
    expect(blind.overnight).toBeNull();
    expect(blind.everyRide).toBe(false);
    expect(blind.morning).toBeNull();
  });
});

describe('newer or older (L10)', () => {
  it('compares the file with this device; two seconds count as the same', () => {
    expect(compareStates('2026-10-08T12:00:00.000Z', '2026-10-07T20:00:00.000Z').kind).toBe('newer');
    expect(compareStates('2026-10-07T20:00:00.000Z', '2026-10-08T12:00:00.000Z').kind).toBe('older');
    expect(compareStates('2026-10-08T12:00:01.000Z', '2026-10-08T12:00:00.000Z').kind).toBe('same');
    expect(compareStates(null, '2026-10-08T12:00:00.000Z', '2026-10-01T09:00:00.000Z')).toEqual({ kind: 'unknown', file: null, local: '2026-10-08T12:00:00.000Z', exported: '2026-10-01T09:00:00.000Z' });
    expect(compareStates('2026-10-08T12:00:00.000Z', null).kind).toBe('unknown');
  });

  let n = 0;
  it('a save marks the change; the backup carries it; Replace takes the file state; an old file still imports', async () => {
    const db = createDb(`test_data_gtp_charge-${++n}`);
    trackChanges(db, 5);
    expect(await lastChangeOf(db)).toBeNull();
    await db.items.put(item('test_data_gtp_EL1', 'elec', 'x'));
    const mark = await lastChangeOf(db); // a waiting mark is written first
    expect(mark).toMatch(/^\d{4}-/);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.lastChange).toBe(mark);

    const other = createDb(`test_data_gtp_charge-${++n}`);
    trackChanges(other, 5);
    await other.items.put(item('test_data_gtp_LOCAL', 'elec', 'y'));
    await restoreBackup(other, file, 'replace');
    await markImported(other, file, 'replace');
    expect((await other.meta.get(LAST_CHANGE)).at).toBe(mark);
    expect(compareStates(file.lastChange, await lastChangeOf(other)).kind).toBe('same');

    // A backup from before v0.34.0: no lastChange. It imports; the device takes its export time.
    const old = { app: 'pack-generator', schemaVersion: 4, exportedAt: '2026-09-01T10:00:00.000Z', tables: { items: [item('test_data_gtp_OLD', 'elec', 'z')] } };
    await restoreBackup(other, old, 'replace');
    await markImported(other, old, 'replace');
    expect((await other.items.toArray()).map((i) => i.id)).toEqual(['test_data_gtp_OLD']);
    expect(await lastChangeOf(other)).toBe('2026-09-01T10:00:00.000Z');
    expect(compareStates(old.lastChange ?? null, mark).kind).toBe('unknown');
  });

  it('offers the backup as .json and as .txt to the share sheet', () => {
    const [a, b] = shareFiles('{}', 'pack-generator-2026-10-08.json');
    expect([a.name, a.type, b.name, b.type]).toEqual(['pack-generator-2026-10-08.json', 'application/json', 'pack-generator-2026-10-08.txt', 'text/plain']);
  });
});
