// «Suche am Ort» (Warteliste 1, V2; Noah «2a», «3b»): rules in src/lib/suche/ort.js
import { describe, it, expect } from 'vitest';
import { hereKind, placeRows, featuresOf } from '../src/lib/suche/ort.js';

describe('hereKind', () => {
  it('knows the two pages and nothing else (Touren has its own bar since 26.11.2026)', () => {
    expect(hereKind('#/me')).toBe('me');
    expect(hereKind('#/trips?tab=x')).toBe(null);
    expect(hereKind('#/auswerten/')).toBe('auswerten');
    expect(hereKind('#/me/data')).toBe(null);
    expect(hereKind('#/')).toBe(null);
  });
});

describe('placeRows', () => {
  it('has functions under Ich and under Auswerten', () => {
    expect(featuresOf('me').length).toBeGreaterThan(10);
    expect(featuresOf('auswerten').length).toBeGreaterThan(0);
  });
  it('finds only functions of the place', () => {
    const mine = new Set(featuresOf('me').map((f) => f.id));
    for (const r of placeRows('backup', 'me')) expect(mine.has(r.featureId)).toBe(true);
    expect(placeRows('x', 'me')).toEqual([]);
  });
});
