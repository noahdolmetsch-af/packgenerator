// «Wegweiser statt Katalog» PR 9: the line «As next» after an action.
import { describe, it, expect } from 'vitest';
import { ALS_NAECHSTES, alsNaechstes } from '../src/lib/alsnaechstes.js';
import { FEATURE } from '../src/lib/features.js';
import DE from '../src/lib/i18n/de/index.js';

describe('As next', () => {
  it('a saved ride, «All packed» and a care job each show their functions, in this order', () => {
    expect(alsNaechstes('ride').map((f) => f.id)).toEqual(['f.partwear', 'f.logbook']);
    expect(alsNaechstes('packed').map((f) => f.id)).toEqual(['f.weather', 'f.departsheet']);
    expect(alsNaechstes('care').map((f) => f.id)).toEqual(['f.setuplog', 'f.sparestock']);
  });
  it('leaves out what is marked «Not for me» and unknown moments', () => {
    expect(alsNaechstes('ride', { 'f.logbook': true }).map((f) => f.id)).toEqual(['f.partwear']);
    expect(alsNaechstes('nowhere')).toEqual([]);
  });
  it('a moment shows 1 or 2 functions that exist, each with a page and a German title', () => {
    for (const list of Object.values(ALS_NAECHSTES)) {
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(2);
      expect(new Set(list).size).toBe(list.length);
      for (const id of list) {
        expect(FEATURE[id], id).toBeTruthy();
        expect(FEATURE[id].href.startsWith('#/'), id).toBe(true);
        expect(DE[FEATURE[id].title], id).toBeTruthy();
      }
    }
    expect(DE['As next']).toBe('Als Nächstes');
  });
});
