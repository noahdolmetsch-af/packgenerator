import { describe, it, expect } from 'vitest';
import { withCustomer, rateOf, parseRate, invoicesOf, lessonsOf, keyOf } from '../src/lib/booking/customers.js';
import { newOffer, invoiceDraft } from '../src/lib/booking/model.js';

describe('Kundenliste', () => {
  it('adds a person once and fills an empty contact', () => {
    const a = withCustomer([], { name: ' Mia  Muster ', contact: '' }, 'c1', '2026-11-03');
    expect(a).toEqual([{ id: 'c1', name: 'Mia  Muster', contact: '', note: '', rate: null, createdAt: '2026-11-03' }]);
    expect(withCustomer(a, { name: 'mia muster', contact: 'mia@example.test' })[0].contact).toBe('mia@example.test');
    const b = withCustomer(a, { name: 'MIA MUSTER', contact: '' });
    expect(b).toBe(a);
    expect(withCustomer(a, { name: '  ' })).toBe(a);
  });
  it('reads the own price and parses it', () => {
    expect(rateOf([{ name: 'Ben', rate: 5000 }], ' ben ')).toBe(5000);
    expect(rateOf([], 'Ben')).toBeNull();
    expect(parseRate('62,50')).toBe(6250);
    expect(parseRate('')).toBeNull();
    expect(parseRate('abc')).toBeUndefined();
    expect(parseRate('-1')).toBeUndefined();
  });
  it('finds lessons and invoices by name', () => {
    const c = { name: 'Mia Muster' };
    expect(lessonsOf(c, [{ name: 'mia muster' }, { name: 'Ben' }])).toHaveLength(1);
    expect(invoicesOf(c, [{ name: 'Mia Muster' }, { name: 'Ben, Mia Muster' }, { name: 'Ben' }])).toHaveLength(2);
    expect(keyOf(' A  B ')).toBe('a b');
  });
  it('uses the own price in the invoice draft', () => {
    const offer = newOffer('tennis');
    const d = invoiceDraft(offer, { type: 'one' }, { id: 'b1', name: 'Mia' }, 'Mo', 5000);
    expect(d.amount).toBe('50');
  });
});

describe('lesson card', () => {
  const c = { id: 'c1', name: 'Mia Muster', pack: { size: 2, price: 45000, from: '2026-11-02' } };
  const bs = [
    { id: 'a', name: 'mia muster', at: '2026-10-30T10:00' },
    { id: 'b', name: 'Mia Muster', at: '2026-11-03T10:00' },
    { id: 'c', name: 'Mia Muster', at: '2026-11-10T10:00' },
    { id: 'd', name: 'Mia Muster', at: '2026-11-17T10:00' },
  ];
  it('covers the first N lessons from the start day, in time order', async () => {
    const { packCover } = await import('../src/lib/booking/customers.js');
    expect(packCover([c], bs)).toEqual({ b: { n: 1, size: 2 }, c: { n: 2, size: 2 } });
  });
  it('counts the lessons that are over', async () => {
    const { packState } = await import('../src/lib/booking/customers.js');
    expect(packState(c, bs, '2026-11-05T00:00')).toEqual({ size: 2, used: 1, left: 1 });
    expect(packState({ name: 'x' }, bs, '')).toBeNull();
  });
  it('reads the card fields', async () => {
    const { parsePack } = await import('../src/lib/booking/customers.js');
    expect(parsePack('10', '450', '2026-11-04')).toEqual({ size: 10, price: 45000, from: '2026-11-04' });
    expect(parsePack('', '', '')).toBeNull();
    expect(parsePack('0', '', '')).toBeUndefined();
    expect(parsePack('10', 'abc', '')).toBeUndefined();
  });
});

describe('subscription', () => {
  it('reads the price, empty means none', async () => {
    const { parseAbo, aboOf } = await import('../src/lib/booking/customers.js');
    expect(parseAbo('200')).toEqual({ price: 20000 });
    expect(parseAbo('')).toBeNull();
    expect(parseAbo('abc')).toBeUndefined();
    expect(aboOf({ abo: { price: 20000 } })).toEqual({ price: 20000 });
    expect(aboOf({})).toBeNull();
  });
});
