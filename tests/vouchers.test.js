import { describe, it, expect } from 'vitest';
import { newCode, parseVoucher, applyVouchers, openVouchers, voucherText } from '../src/lib/booking/vouchers.js';

const mk = (kind, value) => parseVoucher(kind, value, 'v1', '2026-11-05', () => 0.5);

describe('vouchers', () => {
  it('makes short readable codes', () => {
    expect(newCode(() => 0)).toBe('GUT-AAAA');
    expect(newCode()).toMatch(/^GUT-[A-HJ-NP-Z2-9]{4}$/);
  });
  it('parses amount and lessons vouchers', () => {
    expect(mk('amount', '100')).toMatchObject({ kind: 'amount', total: 10000, left: 10000 });
    expect(mk('amount', '62,50').total).toBe(6250);
    expect(mk('lessons', '5')).toMatchObject({ kind: 'lessons', total: 5, left: 5 });
    expect(mk('amount', '')).toBeUndefined();
    expect(mk('amount', 'x')).toBeUndefined();
    expect(mk('lessons', '0')).toBeUndefined();
    expect(mk('lessons', '2.5')).toBeUndefined();
  });
  it('writes the rest in words', () => {
    expect(voucherText({ kind: 'lessons', total: 5, left: 3 })).toBe('5 lessons, 3 left');
    expect(voucherText({ kind: 'amount', total: 10000, left: 6000 })).toBe('100 CHF, 60 left');
  });
  const draft = { name: 'Mia Muster', amount: '60', purpose: 'Tennis, Mo' };
  it('takes a lesson off a lessons voucher', () => {
    const c = [{ name: 'mia muster', vouchers: [mk('lessons', '3')] }];
    const r = applyVouchers(draft, c, 1);
    expect(r.draft.amount).toBe('0');
    expect(r.draft.purpose).toContain('Voucher GUT-');
    expect(r.customers[0].vouchers[0].left).toBe(2);
    expect(c[0].vouchers[0].left).toBe(3); // the input is not changed
  });
  it('takes the rest of an amount voucher off, never below zero', () => {
    const r = applyVouchers(draft, [{ name: 'Mia Muster', vouchers: [mk('amount', '25')] }], 1);
    expect(r.draft.amount).toBe('35');
    expect(r.customers[0].vouchers[0].left).toBe(0);
    const all = applyVouchers(draft, [{ name: 'Mia Muster', vouchers: [mk('amount', '100')] }], 1);
    expect(all.draft.amount).toBe('0');
    expect(all.customers[0].vouchers[0].left).toBe(4000);
  });
  it('covers some of several lessons', () => {
    const r = applyVouchers({ ...draft, amount: '180' }, [{ name: 'Mia Muster', vouchers: [mk('lessons', '2')] }], 3);
    expect(r.draft.amount).toBe('60');
    expect(r.customers[0].vouchers[0].left).toBe(0);
  });
  it('leaves the draft alone without a voucher, a customer, or for several people', () => {
    expect(applyVouchers(draft, [], 1).used).toEqual([]);
    expect(applyVouchers(draft, [{ name: 'Mia Muster' }], 1).draft).toBe(draft);
    const used = { ...mk('amount', '10'), left: 0 };
    expect(openVouchers({ vouchers: [used] })).toEqual([]);
    expect(applyVouchers(draft, [{ name: 'Mia Muster', vouchers: [used] }], 1).draft).toBe(draft);
    const two = { ...draft, name: 'Mia Muster, Ben' };
    expect(applyVouchers(two, [{ name: 'Mia Muster, Ben', vouchers: [mk('amount', '10')] }], 1).draft).toBe(two);
  });
});
