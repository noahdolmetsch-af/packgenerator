// «332 Use Cases sichtbar machen» (Noah 24.10.2026 «1a 2b 3a 4 nein 5b»): every function of the catalogue
// has a home page, and the list of functions not yet visible there may only get shorter.
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../src/lib/features.js';
import { HOME, GAPS, WHY } from '../src/lib/know/heimat.js';

// Measured 24.10.2026 on 0.181.4. Lower this number whenever a package makes functions visible;
// never raise it: a new function comes with a visible place on its home page.
// 263 after merging 0.182–0.186 (tennis page, yoga classes and good day came before this guard); 249 after «Alltag sichtbar»;
// 252 after merging 0.187–0.189, built before this guard: dress rehearsal, good night and arrive well show only in their situation.
const MAX_GAPS = 252;

describe('home pages of the functions', () => {
  it('every function of the catalogue has a home page, and no home is left over', () => {
    const ids = FEATURES.map((f) => f.id);
    expect(ids.filter((id) => !HOME[id]), 'functions without a home in src/lib/know/heimat.js').toEqual([]);
    expect(Object.keys(HOME).filter((id) => !ids.includes(id)), 'homes of functions that no longer exist').toEqual([]);
    for (const [id, href] of Object.entries(HOME)) expect(href, id).toMatch(/^#\//);
  });

  it('the gaps name existing functions with a known why', () => {
    for (const [id, why] of Object.entries(GAPS)) {
      expect(HOME[id], id).toBeTruthy();
      expect(Object.keys(WHY), id).toContain(why);
    }
  });

  it('the list of gaps only gets shorter', () => {
    expect(Object.keys(GAPS).length).toBeLessThanOrEqual(MAX_GAPS);
  });
});
