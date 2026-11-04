// «Nussgipfel-Rechner» (Idee 26): kcal in nut croissants.
import { describe, it, expect } from 'vitest';
import { nussgipfelOf, NUSSGIPFEL_KCAL } from '../src/lib/nussgipfel/nussgipfel.js';

describe('nussgipfelOf', () => {
  it('rounds kcal to whole nut croissants', () => {
    expect(NUSSGIPFEL_KCAL).toBe(400);
    expect(nussgipfelOf(1600)).toBe(4);
    expect(nussgipfelOf(1790)).toBe(4);
    expect(nussgipfelOf(1810)).toBe(5);
    expect(nussgipfelOf(400)).toBe(1);
    expect(nussgipfelOf(150)).toBe(0);
  });
  it('says nothing for no energy or a wrong value', () => {
    for (const v of [0, -5, null, undefined, NaN, 'x']) expect(nussgipfelOf(v)).toBe(null);
  });
});
