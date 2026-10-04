import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { splitBrand, tidyBrands } from '../src/lib/brand.js';
import { createDb } from '../src/lib/db.js';

describe('brand', () => {
  it('splits brand from model and colour', () => {
    expect(splitBrand('Garmin Edge 1040 Solar')).toEqual({ brand: 'Garmin', model: 'Edge 1040 Solar' });
    expect(splitBrand('Sea to Summit Aeros Ultralight')).toEqual({ brand: 'Sea to Summit', model: 'Aeros Ultralight' });
    expect(splitBrand('Scott white')).toEqual({ brand: 'Scott', model: 'white' });
    expect(splitBrand('Albion')).toEqual({ brand: 'Albion', model: '' });
    expect(splitBrand('black')).toEqual({ brand: '', model: 'black' });
    expect(splitBrand('AirPods')).toEqual({ brand: 'Apple', model: 'AirPods' });
    expect(splitBrand('Unknown Maker X1')).toEqual({ brand: 'Unknown Maker X1', model: '' });
    expect(splitBrand(null)).toEqual({ brand: '', model: '' });
  });

  it('tidies only items that were never split', async () => {
    const db = createDb('brand-test');
    await db.items.bulkPut([
      { id: 'A', name: 'a', brand: 'Garmin Edge 840' },
      { id: 'B', name: 'b', brand: 'Garmin Edge 840', model: '' },
    ]);
    expect(await tidyBrands(db)).toBe(1);
    expect(await db.items.get('A')).toMatchObject({ brand: 'Garmin', model: 'Edge 840' });
    expect(await db.items.get('B')).toMatchObject({ brand: 'Garmin Edge 840', model: '' });
    expect(await tidyBrands(db)).toBe(0);
  });
});
