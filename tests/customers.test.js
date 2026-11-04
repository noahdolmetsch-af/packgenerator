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
