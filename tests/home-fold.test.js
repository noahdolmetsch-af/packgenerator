// «Neuer Schwung» Aufklappen: which areas of Today are folded on this phone (homeFold.js)
import { describe, it, expect } from 'vitest';
import { readFolded, writeFolded, toggleFold, FOLD_KEY } from '../src/lib/home/homeFold.js';

const mem = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};

describe('homeFold', () => {
  it('starts with every area open', () => {
    expect(readFolded(mem())).toEqual([]);
  });
  it('folds and opens an area and remembers it', () => {
    const s = mem();
    let f = toggleFold([], 'week');
    writeFolded(f, s);
    expect(readFolded(s)).toEqual(['week']);
    f = toggleFold(f, 'week');
    writeFolded(f, s);
    expect(readFolded(s)).toEqual([]);
    expect(s.m.has(FOLD_KEY)).toBe(false);
  });
  it('survives broken or blocked storage', () => {
    const s = mem();
    s.setItem(FOLD_KEY, '{oops');
    expect(readFolded(s)).toEqual([]);
    const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readFolded(bad)).toEqual([]);
    expect(() => writeFolded(['now'], bad)).not.toThrow();
  });
});
