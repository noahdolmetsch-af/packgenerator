import { describe, it, expect } from 'vitest';
import { wearCosts, lastPrice, shopText } from '../src/lib/wearcost.js';

// «Was kostet das nächste Jahr?» (C1): fictional bike, plain calendar days.
const TODAY = '2026-11-02';
const row = (key, state, due, extra = {}) => ({ key, name: key, model: '', state, due, ...extra });
const rep = (date, chf) => ({ action: 'replace', result: 'done', date, km: 100, ...(chf != null ? { chf } : {}) });
const bike = { parts: [{ key: 'chain', history: [rep('2025-01-01', 30), rep('2026-01-01', 40)] }, { key: 'tyres', history: [rep('2026-01-01')] }, { key: 'padsF', history: [rep('2026-02-01', 25)] }] };

describe('wearCosts', () => {
  it('takes the last priced change, never a made-up price', () => {
    expect(lastPrice(bike.parts[0])).toBe(40);
    expect(lastPrice(bike.parts[1])).toBe(null);
    expect(lastPrice(null)).toBe(null);
  });
  it('lists the parts due in the time, oldest first, with sum and open prices', () => {
    const rows = [row('padsF', 'ok', '2027-03-01'), row('chain', 'soon', '2026-12-10'), row('tyres', 'due', null), row('cassette', 'ok', '2028-01-01'), row('bb', 'ok', null)];
    const r = wearCosts(rows, bike, { months: 12, today: TODAY });
    expect(r.items.map((x) => x.key)).toEqual(['tyres', 'chain', 'padsF']);
    expect(r.total).toBe(65);
    expect(r.unpriced).toBe(1);
  });
  it('a shorter time leaves out later parts; a part without a pace but "soon" stays', () => {
    const rows = [row('padsF', 'ok', '2027-03-01'), row('chain', 'soon', null)];
    expect(wearCosts(rows, bike, { months: 3, today: TODAY }).items.map((x) => x.key)).toEqual(['chain']);
  });
  it('shop text names the mounted model', () => {
    expect(shopText(row('chain', 'ok', null, { name: 'Chain', model: 'X-1' }))).toBe('Chain · X-1');
    expect(shopText(row('chain', 'ok', null, { name: 'Chain' }))).toBe('Chain');
  });
});
