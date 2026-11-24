import { describe, it, expect } from 'vitest';
import { noteOpen, prefersGear, forgetWord, cleanLearn, keyOf, readLearn, writeLearn, LEARN_AFTER } from '../src/lib/suche/lernen.js';

describe('Die Suche lernt von dir', () => {
  it('prefers gear after three opens of gear for the same word, more often than anything else', () => {
    let m = {};
    for (let i = 0; i < LEARN_AFTER - 1; i++) m = noteOpen(m, 'Trikot', 'gear');
    expect(prefersGear(m, 'trikot')).toBe(false);
    m = noteOpen(m, ' TRIKOT ', 'gear');
    expect(prefersGear(m, 'trikot')).toBe(true);
    expect(prefersGear(m, 'zelt')).toBe(false);
    // opening something else more often turns it off again
    for (let i = 0; i < 3; i++) m = noteOpen(m, 'trikot', 'page');
    expect(prefersGear(m, 'trikot')).toBe(false);
  });
  it('folds umlauts and spaces into one key, and forgets a word', () => {
    expect(keyOf('  Mütze   warm ')).toBe('muetze warm');
    let m = noteOpen({}, 'zelt', 'gear');
    expect(Object.keys(m)).toEqual(['zelt']);
    expect(forgetWord(m, 'Zelt')).toEqual({});
  });
  it('keeps at most 40 words and makes a stored value safe', () => {
    let m = {};
    for (let i = 0; i < 50; i++) m = noteOpen(m, `wort${i}`, 'gear');
    expect(Object.keys(m)).toHaveLength(40);
    expect(Object.keys(m)).not.toContain('wort0');
    expect(cleanLearn({ a: { gear: 'x', other: 1 }, b: { gear: 2, other: 0 }, c: 7 })).toEqual({ b: { gear: 2, other: 0 } });
    expect(cleanLearn('nope')).toEqual({});
  });
  it('reads and writes through a storage, and survives one that fails', () => {
    const store = {};
    const st = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) };
    writeLearn({ zelt: { gear: 3, other: 0 } }, st);
    expect(readLearn(st)).toEqual({ zelt: { gear: 3, other: 0 } });
    expect(readLearn({ getItem: () => { throw new Error('x'); } })).toEqual({});
  });
});
