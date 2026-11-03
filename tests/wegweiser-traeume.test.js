// «Wegweiser statt Katalog» PR 6 «Träume»: «Fits here» on Dreams and on New ground.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PASST_HIER, passtHier } from '../src/lib/passthier.js';
import { NO_JUMP } from '../src/lib/know/absprung.js';
import { HOME } from '../src/lib/know/heimat.js';

const IDS = ['f.freilust', 'f.freireise', 'f.freiwesentlich', 'f.ownbingo', 'f.freinacht'];

describe('Wegweiser Träume', () => {
  it('Dreams shows travel wishes, what I am up for and what matters, New ground the first night and the own bingo', () => {
    expect(passtHier('dreams').map((f) => f.id)).toEqual(['f.freireise', 'f.freilust', 'f.freiwesentlich']);
    expect(passtHier('neuland').map((f) => f.id)).toEqual(['f.freinacht', 'f.ownbingo']);
  });
  it('all five have a jump now and left the list of functions without one', () => {
    const linked = new Set([...PASST_HIER.dreams, ...PASST_HIER.neuland]);
    for (const id of IDS) {
      expect(linked.has(id), id).toBe(true);
      expect(NO_JUMP, id).not.toContain(id);
    }
  });
  it('the row shows pages from elsewhere, never the page itself', () => {
    for (const id of PASST_HIER.dreams) expect(HOME[id], id).not.toBe('#/trips/dreams');
    for (const id of PASST_HIER.neuland) expect(HOME[id], id).not.toBe('#/neuland');
  });
  it('a function marked «Not for me» stays out', () => {
    expect(passtHier('neuland', { 'f.ownbingo': true }).map((f) => f.id)).toEqual(['f.freinacht']);
  });
  it('the rows sit on the pages', () => {
    expect(readFileSync('src/pages/Dreams.svelte', 'utf8')).toContain('<PasstHier place="dreams"');
    expect(readFileSync('src/pages/Neuland.svelte', 'utf8')).toContain('<PasstHier place="neuland"');
  });
});
