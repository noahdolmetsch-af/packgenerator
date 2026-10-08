// v0.27.0 (Noah 1a, AP23 PF02/PF04/PF05/PF10): the reason line of a Pack row.
import { describe, it, expect } from 'vitest';
import { rowReasons, amountReason, amountChecks, listDiff } from '../src/lib/reasons.js';

const P = 'test_data_gtp_';
const items = [
  { id: `${P}gel`, name: 'Gel', ownership: 'owned', role: 'standard', perHours: 3, maxQty: 4 },
  { id: `${P}bar`, name: 'Bar', ownership: 'owned', role: 'standard', perHours: 1, maxQty: 3, note: 'never more than 2' },
  { id: `${P}gloves`, name: 'Winter gloves', ownership: 'owned', coldBelow: 6 },
  { id: `${P}vest`, name: 'Wind vest', ownership: 'owned', coldBelow: 12 },
  { id: `${P}gilet`, name: 'Light gilet', ownership: 'owned', altFor: `${P}vest` },
  { id: `${P}buff`, name: 'Buff', ownership: 'owned', coldBelow: 8, sets: ['warm', 'u-rain'] },
  { id: `${P}lamp`, name: 'Lamp', ownership: 'owned', sets: ['sleep', 'light'] },
  { id: `${P}mine`, name: 'Camera', ownership: 'owned' },
];
const e = (id, qty = 1, src) => ({ itemId: `${P}${id}`, slot: 'seat', qty, packed: false, ...(src ? { src } : {}) });

describe('amountReason', () => {
  it('nothing to say for 1 piece on a one-day trip', () => {
    expect(amountReason(items[0], { hours: 2, days: 1 }, 1)).toBeNull();
  });
  it('one day: rule and hours', () => {
    expect(amountReason(items[0], { hours: 6, days: 1 }, 2).text).toBe('1 per 3 h · 6 h = 2');
  });
  it('more days: per day and in total', () => {
    expect(amountReason(items[0], { hours: 6, days: 2 }, 4).text).toBe('1 per 3 h · 2 per day × 2 days = 4');
  });
  it('capped by the maximum: the full need is said', () => {
    const r = amountReason(items[1], { hours: 6, days: 1 }, 3);
    expect(r).toMatchObject({ need: 6, qty: 3, capped: true });
    expect(r.text).toBe('1 per 1 h · 6 h · Need 6, you carry 3 (maximum)');
    expect(amountReason(items[0], { hours: 5, days: 3 }, 4).text).toBe('1 per 3 h · 5 h per day × 3 days · Need 5, you carry 4 (maximum)');
  });
});

describe('rowReasons', () => {
  const trip = { hours: 6, days: 1, overnight: 'outdoor', wx: { min: 4, max: 12, rain: 'none' }, entries: [e('gloves', 1, 'context'), e('vest', 1, 'context'), e('bar', 3), e('buff', 1, 'context'), e('lamp', 1, 'set'), e('mine')] };
  const r = rowReasons(trip, items, [{ key: 'u-rain', name: 'Rain' }]);
  it('weather layer says its limit', () => expect(r[`${P}gloves`].line).toBe('Below 6 °C'));
  it('the alternative can be reached', () => expect(r[`${P}vest`]).toMatchObject({ slot: `${P}vest`, alts: [`${P}gilet`] }));
  it('capped amount with its note', () => expect(r[`${P}bar`]).toMatchObject({ line: '1 per 1 h · 6 h · Need 6, you carry 3 (maximum)', note: 'never more than 2' }));
  it('the night set it came with', () => expect(r[`${P}buff`].line).toBe('Below 8 °C · from Warm'));
  it('the blocks of a block entry', () => expect(r[`${P}lamp`].line).toBe('from Sleep, Light'));
  it('nothing on an item added by hand', () => expect(r[`${P}mine`]).toMatchObject({ line: '', note: '', alts: [] }));
  it('a picked alternative keeps the reason and offers the way back', () => {
    const swapped = rowReasons({ ...trip, layerPick: { [`${P}vest`]: `${P}gilet` }, entries: [e('gilet', 1, 'context')] }, items);
    expect(swapped[`${P}gilet`]).toMatchObject({ line: 'Below 12 °C', slot: `${P}vest`, alts: [`${P}vest`] });
  });
});

describe('amountChecks and listDiff', () => {
  it('a capped row or a rule with a note stays visible', () => {
    const trip = { hours: 6, days: 1, entries: [e('bar', 3), e('gel', 2)] };
    expect(amountChecks(trip, items).map((c) => c.id)).toEqual([`${P}bar`]);
    expect(amountChecks(trip, items, new Set([`${P}bar`]))).toEqual([]);
  });
  it('says amounts, added and removed', () => {
    expect(listDiff([e('gel', 1), e('vest')], [e('gel', 2), e('gloves')])).toEqual({ amounts: [{ id: `${P}gel`, from: 1, to: 2 }], added: [`${P}gloves`], removed: [`${P}vest`] });
  });
});
