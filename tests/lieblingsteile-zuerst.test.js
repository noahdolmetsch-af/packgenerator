// «Lieblingsteile zuerst» (Noah 23.11.2026 «2a»): of the pieces that fit, the one with a star comes first
// (best() for gaps and «What do I wear today?», swapChoices() for «Swap»). Fictional data only.
import { describe, it, expect } from 'vitest';
import { best } from '../src/lib/wardrobe.js';
import { swapChoices } from '../src/lib/swap.js';

const P = 'test_data_gtp_';
const c = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', ownership: 'owned', weightG: 100, layer: 'mid', zone: 'torso', ...f });

describe('best(): favourite first among pieces that fit', () => {
  const light = c('L1', 'Weste leicht', { tempMin: 8, tempMax: 20, weightG: 90 });
  const fav = c('L2', 'Weste Liebling', { tempMin: 6, tempMax: 20, weightG: 180, favorite: true });
  it('without a star the lighter piece wins (as before)', () => {
    expect(best([fav, light].map((i) => ({ ...i, favorite: false })), 10).id).toBe('L1');
  });
  it('with a star the favourite wins, also when it is heavier', () => {
    expect(best([light, fav], 10).id).toBe('L2');
  });
  it('a piece that holds the temperature still beats a favourite that does not', () => {
    const cold = c('L3', 'Weste kalt', { tempMin: -5, tempMax: 5, favorite: true });
    expect(best([cold, light], 10).id).toBe('L1');
  });
});

describe('swapChoices(): favourite before the closer range, after your own picks', () => {
  const cur = c('S0', 'Jacke aktuell', { tempMin: 8, tempMax: 18 });
  const near = c('S1', 'Jacke nah', { tempMin: 8, tempMax: 18 });
  const fav = c('S2', 'Jacke Liebling', { tempMin: 4, tempMax: 30, favorite: true });
  const trip = { id: 't', wx: { min: 10, max: 16, rain: 'none' }, entries: [{ itemId: 'S0', slot: 'body', qty: 1 }] };
  it('puts the starred piece first among the fitting ones', () => {
    expect(swapChoices(cur, [cur, near, fav], trip).fits.map((r) => r.item.id)).toEqual(['S2', 'S1']);
  });
  it('a piece you picked before stays above the star', () => {
    const mem = { S1: { n: 1, at: '2026-11-01T10:00:00Z' } };
    expect(swapChoices(cur, [cur, near, fav], trip, mem).fits.map((r) => r.item.id)).toEqual(['S1', 'S2']);
  });
});
