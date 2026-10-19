// Impeccable runde 2 (18.10.2026), Gruppe 2 Material: the pure helpers. Fictional data only.
import { describe, it, expect } from 'vitest';
import { reviewBlocks, reviewOpen } from '../src/lib/blocksplit.js';
import DE from '../src/lib/i18n/de/index.js';
import MINE from '../src/lib/i18n/de/impeccable2-material.js';

describe('Bausteine 2: how many building blocks wait in «Bausteine prüfen»', () => {
  it('counts each block once: suggestions per block, the cold rules, the old Lodging', () => {
    expect(reviewBlocks(null)).toBe(0);
    expect(reviewBlocks({ suggested: {}, cold: [], unassigned: [] })).toBe(0);
    expect(reviewBlocks({ suggested: { repair: ['a'], charge: [], lights: ['b', 'c'] } })).toBe(2);
    expect(reviewBlocks({ suggested: { cold: ['a'] }, cold: ['b'] })).toBe(1);
    const r = { suggested: { repair: ['a'] }, cold: ['b'], unassigned: ['c', 'd'] };
    expect(reviewBlocks(r)).toBe(3);
    // the chip shows exactly when there is something to check
    expect(reviewOpen(r)).toBe(reviewBlocks(r) > 0);
  });
});

describe('the German texts of this round', () => {
  it('every key of impeccable2-material.js is in the German dictionary with its own text', () => {
    for (const [k, v] of Object.entries(MINE)) expect(DE[k], k).toBe(v);
  });
});
