// «Wertliste» (Warteliste 7; Noah 22.11.2026 «1-5 a»): rows, filters, totals and the typed price.
import { describe, it, expect } from 'vitest';
import { rowsOf, filterRows, totalsOf, lineOf, priceOf, savePlan, applyPlan, SMALL_CHF } from '../src/lib/wertliste/wertliste.js';

const bikes = [
  { id: 'b1', name: 'Gravel A', bought: '2025-03-10', sheets: { theft: { frameNo: 'FR-123' }, warranty: { price: 2400 } } },
  { id: 'b2', name: 'City', sheets: {} },
  { id: 'b3', name: 'Old', sold: true },
];
const items = [
  { id: 'i1', name: 'Tent', ownership: 'owned', category: 'sleep', priceChf: 420, boughtAt: '2025-05-01T00:00:00Z' },
  { id: 'i2', name: 'Bar', ownership: 'owned', category: 'food', priceChf: 2 },
  { id: 'i3', name: 'Bags', ownership: 'owned', category: 'bags', priceChf: 40, qty: 2 },
  { id: 'i4', name: 'Wish', ownership: 'wishlist', category: 'bags', priceChf: 99 },
  { id: 'i5', name: 'Lamp', ownership: 'unclear', category: 'light' },
];
const visits = [{ id: 'v1', bikeId: 'b1', date: '2025-03-10' }];

describe('rowsOf', () => {
  it('lists the bikes (not sold) first, then the gear that is yours and not food', () => {
    const r = rowsOf({ bikes, items, visits });
    expect(r.map((x) => x.key)).toEqual(['bike:b2', 'bike:b1', 'gear:i3', 'gear:i5', 'gear:i1'].sort((a, b) => 0) && ['bike:b2', 'bike:b1', 'gear:i3', 'gear:i5', 'gear:i1']);
  });
  it('reads the frame number, price, day and the receipt of a bike', () => {
    const b = rowsOf({ bikes, items, visits }).find((x) => x.key === 'bike:b1');
    expect(b).toMatchObject({ ref: 'FR-123', price: 2400, bought: '2025-03-10', receipt: true });
    expect(rowsOf({ bikes, items, visits }).find((x) => x.key === 'bike:b2')).toMatchObject({ ref: null, price: null, bought: null, receipt: false });
  });
  it('a gear row has its price, the day (date part) and pieces', () => {
    const r = rowsOf({ bikes, items }).find((x) => x.key === 'gear:i1');
    expect(r).toMatchObject({ price: 420, bought: '2025-05-01' });
    expect(lineOf(rowsOf({ bikes, items }).find((x) => x.key === 'gear:i3'))).toBe(80);
  });
});

describe('filterRows and totalsOf', () => {
  const rows = rowsOf({ bikes, items, visits });
  it('the kind buttons and «only above CHF 50» (a row without a price stays)', () => {
    expect(filterRows(rows, { bikes: false }).every((r) => r.kind === 'gear')).toBe(true);
    expect(filterRows(rows, { gear: false }).every((r) => r.kind === 'bike')).toBe(true);
    const big = filterRows(rows, { big: true }).map((r) => r.key);
    expect(big).toContain('gear:i1');
    expect(big).toContain('gear:i5');
    expect(SMALL_CHF).toBe(50);
    expect(filterRows(rows, { noPrice: true }).every((r) => r.price == null)).toBe(true);
  });
  it('the totals count only the chosen rows and say how many prices are missing', () => {
    const all = new Set(rows.map((r) => r.key));
    expect(totalsOf(rows, all)).toMatchObject({ n: 5, bikes: 2, gear: 3, sum: 2400 + 420 + 80, missing: 2, receipts: 1 });
    expect(totalsOf(rows, new Set(['bike:b1']))).toMatchObject({ n: 1, sum: 2400, missing: 0, noDay: 0 });
  });
});

describe('typed values', () => {
  it('reads a price with comma and thousands signs, refuses nonsense', () => {
    expect(priceOf('1’250,50')).toBe(1250.5);
    expect(priceOf("1'250")).toBe(1250);
    expect(priceOf('')).toBe(null);
    expect(priceOf('abc')).toBe(null);
    expect(priceOf('-5')).toBe(null);
  });
  it('plans the save: gear price → priceChf, bike price → the warranty sheet, days → boughtAt / bought', () => {
    const rows = rowsOf({ bikes, items });
    const bike = rows.find((r) => r.key === 'bike:b2');
    const gear = rows.find((r) => r.key === 'gear:i5');
    expect(savePlan(gear, 'price', '35')).toEqual({ table: 'items', id: 'i5', patch: { priceChf: 35 } });
    expect(savePlan(gear, 'bought', '2025-06-01')).toEqual({ table: 'items', id: 'i5', patch: { boughtAt: '2025-06-01' } });
    expect(savePlan(bike, 'bought', '2024-01-02')).toEqual({ table: 'bikes', id: 'b2', patch: { bought: '2024-01-02' } });
    expect(applyPlan({ id: 'b2', sheets: { theft: { frameNo: 'x' } } }, savePlan(bike, 'price', '999'))).toEqual({ id: 'b2', sheets: { theft: { frameNo: 'x' }, warranty: { price: 999 } } });
    expect(savePlan(gear, 'price', 'x')).toBe(null);
    expect(savePlan(gear, 'bought', '1.6.2025')).toBe(null);
  });
});
