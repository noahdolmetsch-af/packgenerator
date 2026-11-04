// «Tacho-Ziffern» (Paket C idea 12): the number is split into digits that roll and separators that stay.
import { describe, it, expect } from 'vitest';
import { odoParts, odoMs } from '../src/lib/ui/odometer.js';

describe('odoParts', () => {
  it('splits a formatted number into digits and still separators', () => {
    expect(odoParts('6’428')).toEqual([{ c: '6', d: 6 }, { c: '’', d: null }, { c: '4', d: 4 }, { c: '2', d: 2 }, { c: '8', d: 8 }]);
  });
  it('handles an empty or missing value', () => {
    expect(odoParts('')).toEqual([]);
    expect(odoParts(null)).toEqual([]);
  });
  it('keeps every character, so the text stays the same as before', () => {
    expect(odoParts('1,460.5').map((p) => p.c).join('')).toBe('1,460.5');
  });
});

describe('odoMs', () => {
  it('lets the digits on the left roll longer, in steps', () => {
    expect(odoMs(0)).toBe(700);
    expect(odoMs(3)).toBeGreaterThan(odoMs(2));
    expect(odoMs(3)).toBeLessThan(1200);
  });
});
