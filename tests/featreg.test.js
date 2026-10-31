import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { mergeParts, FEATREG } from '../src/lib/featreg/index.js';
import { PARTS } from '../src/lib/featreg/index.gen.js';

describe('featreg: one file per new function', () => {
  it('merges features, moments, howto, handbook, home and gaps of every part', () => {
    const a = { features: [{ id: 'f.a', group: 'data', title: 'A', text: 'a', href: '#/a', moment: 'planen' }, { id: 'f.b', group: 'data', title: 'B', text: 'b', href: '#/b' }], howto: { 'f.a': ['1', '2', '3'] }, home: { 'f.a': '#/a' } };
    const b = { features: [{ id: 'f.c', group: 'bike', title: 'C', text: 'c', href: '#/c', moment: 'planen' }], handbook: { 'f.c': { on: null, steps: ['x'], example: 'y' } }, gaps: { 'f.c': 'spot' } };
    const m = mergeParts([a, b]);
    expect(m.features.map((f) => f.id)).toEqual(['f.a', 'f.b', 'f.c']);
    expect(m.features[0]).not.toHaveProperty('moment'); // the moment goes to FEATURE_MOMENTS, not into the entry
    expect(m.moments).toEqual({ planen: ['f.a', 'f.c'], app: ['f.b'] });
    expect(m.howto['f.a']).toHaveLength(3);
    expect(m.handbook['f.c'].steps).toEqual(['x']);
    expect(m.home).toEqual({ 'f.a': '#/a' });
    expect(m.gaps).toEqual({ 'f.c': 'spot' });
    expect(mergeParts([])).toEqual({ features: [], moments: {}, howto: {}, handbook: {}, home: {}, gaps: {} });
  });

  it('collects every file of the folder (index.gen.js is written by scripts/news.mjs)', () => {
    const files = readdirSync(new URL('../src/lib/featreg/', import.meta.url)).filter((f) => /^[a-z0-9][a-z0-9-]*\.js$/.test(f) && f !== 'index.js');
    expect(PARTS).toHaveLength(files.length);
    expect(FEATREG.features.length).toBeGreaterThanOrEqual(0);
  });
});
