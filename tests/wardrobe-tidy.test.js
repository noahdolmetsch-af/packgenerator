import { describe, it, expect } from 'vitest';
import { noRange, everydayGuess, duplicateGroups, oddWeight } from '../src/lib/wardrobe-tidy.js';
import { wardrobe, onionRows } from '../src/lib/wardrobe.js';

const P = 'test_data_gtp_';
const item = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...f });

describe('Kleider heute: the suggestion in the cold', () => {
  const JERSEY = item('J1', 'Langarmtrikot ultradünn (warme Fahrten)', { layer: 'mid', zone: 'torso' }); // no range
  const FLEECE = item('J2', 'Fleecepulli', { layer: 'mid', zone: 'torso', tempMin: -5, tempMax: 10 });
  const RAIN = item('J3', 'Regenjacke', { layer: 'outer', zone: 'torso', tempMin: 0, tempMax: 20, category: 'rain' });
  const BIB = item('B1', 'Bib kurz', { layer: 'base', zone: 'legs', tempMin: 4, tempMax: 35 });
  const TIGHTS = item('B2', 'Winter-Tights lang', { layer: 'base', zone: 'legs', tempMin: -15, tempMax: 4 });
  const CASE = item('H1', 'Brillen-Etui', { layer: 'accessory', zone: 'head' }); // no range
  const CAP = item('H2', 'Chäppli dick', { layer: 'accessory', zone: 'head', tempClass: 'kalt' });
  const row = (rows, key) => rows.find((r) => r.key === key);

  it('a piece without a range is not chosen for 4 °C', () => {
    const rows = onionRows([JERSEY, FLEECE, RAIN, BIB, TIGHTS, CASE, CAP], 4, true);
    expect(row(rows, 'mid').item?.id).toBe('J2');
    expect(row(rows, 'head').item?.id).toBe('H2');
  });

  it('with nothing that says its range there is a gap, not a guess', () => {
    const rows = onionRows([JERSEY, CASE], 4, true);
    expect(row(rows, 'mid').item).toBeNull();
    expect(row(rows, 'head').item).toBeNull();
  });

  it('the legs: the piece at the edge of its range yields to the long one with room', () => {
    expect(row(onionRows([BIB, TIGHTS], 4, true), 'legs').item?.id).toBe('B2');
    expect(row(onionRows([BIB, TIGHTS], 12, false), 'legs').item?.id).toBe('B1'); // mild: the light one again
  });

  it('a rain shell without a range still keeps the rain out in the cold, one with a range goes first', () => {
    const plain = item('J5', 'Regenjacke UL', { layer: 'outer', zone: 'torso', category: 'rain' });
    expect(row(onionRows([plain], 4, true), 'outer').item?.id).toBe('J5');
    expect(row(onionRows([plain, RAIN], 4, true), 'outer').item?.id).toBe('J3');
  });

  it('a rain jacket without a range still counts when it is warm and wet', () => {
    const plain = item('J4', 'Regenjacke ohne Bereich', { layer: 'outer', zone: 'torso', category: 'rain' });
    expect(row(onionRows([plain], 20, true), 'outer').item?.id).toBe('J4');
  });
});

describe('Kleider heute: tidy suggestions', () => {
  it('pieces in their place without a range, with the steps the name suggests', () => {
    const list = noRange([item('A', 'Fleecepulli', { layer: 'mid', zone: 'torso' }), item('B', 'Trikot', { layer: 'base', zone: 'torso', tempMin: 5 }), item('C', 'Etui', { layer: 'accessory', zone: 'head' }), item('D', 'Unsortiert')]);
    expect(list.map((x) => x.item.id)).toEqual(['A', 'C']); // a suggestion first; B has a range, D has no place
    expect(list[0].levels.length).toBeGreaterThan(0);
    expect(list[1].levels).toEqual([]);
  });

  it('everyday names on the bike list are suggested, never done by themselves; «stays» skips', () => {
    const items = [item('S1', 'Badehose'), item('S2', 'Flip-Flops'), item('S3', 'Yoga-/Schlafhose'), item('S4', 'Regenjacke'), item('S5', 'Badeschlappen', { domains: ['everyday'] })];
    expect(everydayGuess(items).map((i) => i.id)).toEqual(['S1', 'S2', 'S3']);
    expect(everydayGuess(items, ['S2']).map((i) => i.id)).toEqual(['S1', 'S3']);
  });

  it('the same name twice: a group, oldest id first, nothing else', () => {
    const items = [item('Z2', 'Daunenjacke'), item('Z1', 'Daunenjacke'), item('Y1', 'Badehose'), item('G1', 'Daunenjacke', { ownership: 'gone' })];
    const g = duplicateGroups(items);
    expect(g).toHaveLength(1);
    expect(g[0].items.map((i) => i.id)).toEqual(['Z1', 'Z2']);
  });

  it('weights that look like a typo: 1 g and exactly 1 kg', () => {
    expect(oddWeight({ weightG: 1 })).toBe(true);
    expect(oddWeight({ weightG: 1000 })).toBe(true);
    expect(oddWeight({ weightG: 250 })).toBe(false);
    expect(oddWeight({ weightG: 1250 })).toBe(false);
    expect(oddWeight({})).toBe(false);
  });

  it('wishes stand apart from the pieces you own', () => {
    const w = wardrobe([item('O1', 'Jacke', { layer: 'outer', zone: 'torso' }), item('W1', 'Daunenjacke UL', { ownership: 'wishlist', layer: 'outer', zone: 'torso' })], 'velo');
    expect(w.all.map((i) => i.id)).toEqual(['O1']);
    expect(w.wishes.map((i) => i.id)).toEqual(['W1']);
    expect(w.n).toBe(1);
  });
});
