// Impeccable Runde 2 (18.10.2026), Gruppe 3 Velos: one way to write CHF; one order for the bike shop.
import { describe, it, expect, afterEach } from 'vitest';
import { lang } from '../src/lib/i18n.svelte.js';
import { chfText } from '../src/lib/money.js';
import { shopOrders } from '../src/lib/care/orders.js';

afterEach(() => {
  lang.v = 'en';
});

describe('chfText', () => {
  it('writes francs with thousands, Rappen only when not 00', () => {
    lang.v = 'de';
    expect(chfText(1716)).toMatch(/^CHF 1.716$/);
    expect(chfText(80)).toBe('CHF 80');
    expect(chfText(80.5)).toBe('CHF 80.50');
    expect(chfText(104.0)).toBe('CHF 104');
    expect(chfText(null)).toBe('');
  });
});

describe('shopOrders', () => {
  it('takes an open problem for the bike shop, and leaves out one I fix myself', () => {
    const bikes = [{ id: 'b1', name: 'test_data_gtp_ Gravel', parts: [] }, { id: 'b2', name: 'test_data_gtp_ Road', parts: [] }];
    const tasks = [
      { id: 1, area: 'Bike', bikeId: 'b1', task: 'test_data_gtp_ Kette knackt', status: 'open', fix: 'shop' },
      { id: 2, area: 'Bike', bikeId: 'b2', task: 'test_data_gtp_ Sattel schief', status: 'open', fix: 'self' },
    ];
    const rows = shopOrders(bikes, [], tasks, [], '2026-10-18');
    const b1 = rows.find((r) => r.bike.id === 'b1');
    expect(b1.order.rows.some((r) => r.name === 'test_data_gtp_ Kette knackt')).toBe(true);
    expect(rows.find((r) => r.bike.id === 'b2')?.order.rows.some((r) => r.name === 'test_data_gtp_ Sattel schief') ?? false).toBe(false);
  });
});
