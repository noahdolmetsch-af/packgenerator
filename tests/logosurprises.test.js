// «Geheimmenü»: the five taps pick one surprise by chance, never the same one twice in a row.
import { describe, it, expect } from 'vitest';
import { SURPRISES, pickSurprise } from '../src/lib/logo/surprises.js';

describe('logo surprises', () => {
  it('knows the bike and the saying', () => {
    expect(SURPRISES).toEqual(expect.arrayContaining(['bike', 'saying', 'flat', 'marmot', 'weather']));
  });
  it('the first time every surprise can come', () => {
    expect(pickSurprise(['a', 'b', 'c'], null, () => 0)).toBe('a');
    expect(pickSurprise(['a', 'b', 'c'], null, () => 0.99)).toBe('c');
  });
  it('never the same one twice in a row, whatever the chance says', () => {
    const list = ['a', 'b', 'c'];
    for (const prev of list) {
      for (const r of [0, 0.2, 0.5, 0.8, 0.999]) expect(pickSurprise(list, prev, () => r)).not.toBe(prev);
    }
  });
  it('a single surprise repeats (nothing else to pick)', () => {
    expect(pickSurprise(['a'], 'a', () => 0.5)).toBe('a');
  });
});
