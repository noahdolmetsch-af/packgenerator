// «Ideen»: several tips per area, the next one after «I like it» and «Another idea» (Noah 27.11.2026 «ich kann nicht mehr ideen laden»)
import { describe, it, expect } from 'vitest';
import { TIPS, pickTip, nextIx } from '../src/lib/ideentipps.js';
import { CATS } from '../src/lib/balance.js';
import de from '../src/lib/i18n/de/ideentipps.js';

describe('TIPS: every area has several tips, the one of balance.js first', () => {
  it('each of the 9 areas starts with its own tip and has at least 5 tips, none twice', () => {
    for (const c of CATS) {
      expect(TIPS[c.key][0]).toBe(c.tip);
      expect(TIPS[c.key].length).toBeGreaterThanOrEqual(5);
      expect(new Set(TIPS[c.key]).size).toBe(TIPS[c.key].length);
    }
  });
  it('every new tip has its German text', () => {
    for (const c of CATS) for (const tip of TIPS[c.key].slice(1)) expect(de[tip], tip).toBeTruthy();
    expect(de['Another idea']).toBe('Andere Idee');
  });
});

describe('pickTip: from the stored place on, the first tip that is not yet among your ideas', () => {
  const tips = ['a', 'b', 'c'];
  it('takes the tip at the place', () => {
    expect(pickTip(tips, 1, new Set())).toEqual({ key: 'b', ix: 1, n: 3 });
    expect(pickTip(tips, 0, new Set())).toEqual({ key: 'a', ix: 0, n: 3 });
  });
  it('skips what is already in your ideas and goes round the end', () => {
    expect(pickTip(tips, 0, new Set(['a']))?.key).toBe('b');
    expect(pickTip(tips, 2, new Set(['c']))?.key).toBe('a');
    expect(pickTip(tips, 7, new Set())?.key).toBe('b'); // a place beyond the end goes round
  });
  it('compares the translated text', () => {
    expect(pickTip(['a', 'b'], 0, new Set(['A']), (x) => x.toUpperCase())?.key).toBe('b');
  });
  it('null when all tips are among your ideas, and for an area without tips', () => {
    expect(pickTip(tips, 0, new Set(tips))).toBeNull();
    expect(pickTip([], 0)).toBeNull();
  });
});

describe('nextIx: the place after the shown tip', () => {
  it('moves on and goes round', () => {
    expect(nextIx(['a', 'b', 'c'], 0)).toBe(1);
    expect(nextIx(['a', 'b', 'c'], 2)).toBe(0);
    expect(nextIx([], 3)).toBe(0);
  });
});
