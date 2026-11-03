import { describe, it, expect } from 'vitest';
import { needsToKnow } from '../src/lib/needs.js';

// «Was die App noch wissen sollte» (D3): fictional records.
const place = { name: 'Testdorf', lat: 47, lon: 8 };
const bike = (id, extra = {}) => ({ id, name: id, weightG: 9000, parts: [], ...extra });
const gear = (n, weightG = null) => Array.from({ length: n }, (_, i) => ({ id: `i${i}${weightG}`, name: `Teil ${i}`, weightG, qty: 1, ownership: 'owned', category: 'tools' }));

describe('needsToKnow', () => {
  it('a complete setup needs nothing', () => {
    expect(needsToKnow({ homePlace: place, bikes: [bike('a')], items: gear(6, 100) })).toEqual([]);
  });
  it('names the missing home place, bike weight, part start and gear weights', () => {
    const parts = [{ key: 'chain', history: [] }, { key: 'chainring', history: [{ action: 'replace', date: '2026-01-01', km: 0 }] }];
    const r = needsToKnow({ homePlace: null, bikes: [bike('a', { weightG: null, parts })], items: gear(6) });
    expect(r.map((x) => x.key)).toEqual(['home', 'bikeweight', 'partstart', 'gearweight']);
    expect(r.find((x) => x.key === 'partstart').n).toBe(1);
    expect(r.find((x) => x.key === 'gearweight').n).toBe(6);
  });
  it('a few unweighed items are normal; a retired bike does not count', () => {
    expect(needsToKnow({ homePlace: place, bikes: [bike('a', { weightG: null, retired: true })], items: gear(4) }).map((x) => x.key)).not.toContain('gearweight');
  });
});
