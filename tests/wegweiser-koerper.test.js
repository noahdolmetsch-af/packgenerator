// «Wegweiser statt Katalog» PR 7 «Körper»: «Fits here» on Insights, Your questions and My sports.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PASST_HIER, passtHier } from '../src/lib/passthier.js';
import { NO_JUMP } from '../src/lib/know/absprung.js';

const IDS = ['f.tennistop', 'f.experiment', 'f.specialdays', 'f.counterdays', 'f.freerewards', 'f.tworoles', 'f.scalemeaning', 'f.bodytalk'];

describe('Wegweiser Körper', () => {
  it('Insights, Your questions and My sports show their quiet helpers, in this order', () => {
    expect(passtHier('insights').map((f) => f.id)).toEqual(['f.counterdays', 'f.specialdays', 'f.experiment']);
    expect(passtHier('abfragen').map((f) => f.id)).toEqual(['f.scalemeaning', 'f.bodytalk']);
    expect(passtHier('sports').map((f) => f.id)).toEqual(['f.tennistop', 'f.tworoles', 'f.freerewards']);
  });
  it('all eight have a jump now and left the list of functions without one', () => {
    const linked = new Set([...PASST_HIER.insights, ...PASST_HIER.abfragen, ...PASST_HIER.sports]);
    for (const id of IDS) {
      expect(linked.has(id), id).toBe(true);
      expect(NO_JUMP, id).not.toContain(id);
    }
  });
  it('a function marked «Not for me» stays out', () => {
    expect(passtHier('sports', { 'f.tennistop': true }).map((f) => f.id)).toEqual(['f.tworoles', 'f.freerewards']);
  });
  it('the rows sit on the pages', () => {
    expect(readFileSync('src/pages/Erkenntnisse.svelte', 'utf8')).toContain('<PasstHier place="insights"');
    expect(readFileSync('src/pages/Abfragen.svelte', 'utf8')).toContain('<PasstHier place="abfragen"');
    expect(readFileSync('src/pages/flow/MySports.svelte', 'utf8')).toContain('<PasstHier place="sports"');
  });
});
