// «Nächster Laden» on Unterwegs (Alles fertig): the next shop ahead among the loaded stops. Fictional data only.
import { describe, it, expect } from 'vitest';
import { nextShopOf } from '../src/lib/unterwegs/nextshop.js';

const pois = [
  { kind: 'shop', name: 'test_data_gtp_ Dorfladen', km: 12 },
  { kind: 'water', name: 'test_data_gtp_ Brunnen', km: 20 },
  { kind: 'shop', name: '', km: 41.26 },
  { kind: 'shop', name: 'test_data_gtp_ Weit weg', km: 200 },
];

describe('nextShopOf', () => {
  it('takes the first shop ahead, not one behind, not water', () => {
    expect(nextShopOf(pois, 5)).toEqual({ name: 'test_data_gtp_ Dorfladen', dist: 7 });
    expect(nextShopOf(pois, 15)).toEqual({ name: '', dist: 26.3 });
  });
  it('nothing without a position, without stops or too far away', () => {
    expect(nextShopOf(pois, null)).toBe(null);
    expect(nextShopOf([], 5)).toBe(null);
    expect(nextShopOf(pois, 50)).toBe(null);
  });
});
