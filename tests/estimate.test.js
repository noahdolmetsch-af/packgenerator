import { describe, it, expect } from 'vitest';
import { lastPrice, estimateFor } from '../src/lib/care/estimate.js';
import { withVisits } from '../src/lib/workshop.js';

// «Kosten-Schätzung» (Noah 21.11.2026, Schritt E): fictional bike, km and prices.
const rep = (date, km, extra = {}) => ({ date, km, action: 'replace', result: 'done', ...extra });
const bike = { id: 'b1', name: 'Test-Velo', parts: [
  { key: 'chain', history: [rep('2025-10-07', 3100, { chf: 48 }), rep('2026-08-18', 5700, { chf: 54 }), { date: '2026-11-09', km: 6090, action: 'check', result: 'ok', value: 0.2, chf: 5 }] },
  { key: 'tyres', history: [rep('2026-06-24', 5200, { chf: 96 }), { date: '2026-09-01', action: 'replace', result: 'needed', chf: 120 }] },
  { key: 'cassette', history: [rep('2025-10-07', 3100)] },
  { key: 'padsF', history: [] },
] };

describe('the last price of a part', () => {
  it('is the newest replacement with a price; checks and «work needed» do not count', () => {
    expect(lastPrice(bike, 'chain')).toEqual({ chf: 54, day: '2026-08-18', km: 5700 });
    expect(lastPrice(bike, 'tyres')).toEqual({ chf: 96, day: '2026-06-24', km: 5200 });
  });
  it('is null without a price, without history or for an unknown part', () => {
    expect(lastPrice(bike, 'cassette')).toBe(null);
    expect(lastPrice(bike, 'padsF')).toBe(null);
    expect(lastPrice(bike, 'nothing')).toBe(null);
    expect(lastPrice(null, 'chain')).toBe(null);
  });
  it('also reads the price of a workshop visit', () => {
    const visits = [{ id: 'v1', bikeId: 'b1', date: '2026-10-01', km: 6000, shop: 'Test', parts: [{ part: 'padsF', action: 'replace', chf: 28 }] }];
    expect(lastPrice(withVisits(bike, visits), 'padsF')).toMatchObject({ chf: 28, day: '2026-10-01' });
  });
});

describe('the estimate of several parts', () => {
  it('adds the last prices, counts a part once and names the parts without a price', () => {
    const e = estimateFor(bike, ['chain', 'tyres', 'chain', 'cassette', null]);
    expect(e.total).toBe(150);
    expect(e.items.map((x) => x.key)).toEqual(['chain', 'tyres']);
    expect(e.missing).toEqual(['cassette']);
    expect(estimateFor(bike, [])).toEqual({ total: 0, items: [], missing: [] });
  });
});
