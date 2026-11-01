// «Wegweiser statt Katalog» PR 2: the row «Fits here».
import { describe, it, expect } from 'vitest';
import { PASST_HIER, passtHier } from '../src/lib/passthier.js';

describe('Fits here', () => {
  it('Unterwegs shows phrases, time zones, light and arrival, in this order', () => {
    expect(passtHier('ride').map((f) => f.id)).toEqual(['f.phrases', 'f.zones', 'f.light', 'f.arrival']);
  });
  it('leaves out what is marked «Not for me» and unknown places', () => {
    expect(passtHier('ride', { 'f.zones': true }).map((f) => f.id)).not.toContain('f.zones');
    expect(passtHier('nowhere')).toEqual([]);
  });
  it('a place shows 2 to 4 functions, each once', () => {
    for (const list of Object.values(PASST_HIER)) {
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.length).toBeLessThanOrEqual(4);
      expect(new Set(list).size).toBe(list.length);
    }
  });
});
