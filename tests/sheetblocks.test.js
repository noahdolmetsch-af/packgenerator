// «Bausteine» (Noah 15.10.2026, B «1 a+b, 2 a+b, 3 a+b, 4a, 5a», BS «1b 2a 3b 4a 5b»): the order and
// the switches of the blocks of the Bike pass and the Workshop order, for all bikes and per bike.
import { describe, it, expect } from 'vitest';
import {
  BLOCKS,
  standardLayout,
  globalOf,
  layoutFor,
  fullLayout,
  shownIds,
  libraryFor,
  moveBlock,
  moveTo,
  switchBlock,
  addBlock,
  takeOff,
  saveLayout,
  resetBike,
  scopeOf,
  newOwn,
  putOwn,
  othersWith,
  goneOnBike,
  goneEverywhere,
  ownContent,
  setOwnContent,
  ownHasContent,
  blockDef,
  hasOwnLayout,
} from '../src/lib/sheetblocks.js';

const glob = globalOf(null);
const bike = (id, extra = {}) => ({ id, name: `Demo ${id}`, ...extra });
const ids = (list) => list.map((x) => x.id);

describe('the standard', () => {
  it('puts the Bike pass blocks in the agreed order, geometry off, the library last', () => {
    const pass = standardLayout('pass');
    expect(ids(pass.filter((x) => !x.lib))).toEqual(['suspension', 'wheels', 'fit', 'drive', 'measured', 'ownFields', 'own:note', 'geometry']);
    expect(pass.find((x) => x.id === 'geometry').on).toBe(false);
    expect(ids(pass.filter((x) => x.lib))).toEqual(BLOCKS.filter((b) => 'pass' in b.std && b.std.pass == null).map((b) => b.id));
  });
  it('has «Please leave as it is» on by default and «Before dropping it off» on the order (BS1 b)', () => {
    const order = layoutFor(bike(1), 'order', glob);
    expect(ids(order)).toEqual(['jobs', 'again', 'budget', 'measured', 'own:beforeDrop', 'wishes', 'keep']);
    expect(order.every((x) => x.on)).toBe(true);
  });
  it('keeps «Before dropping it off» out of the text to the bike shop (BS2 a)', () => {
    expect(blockDef('own:beforeDrop', glob)).toMatchObject({ own: true, kind: 'check', toShop: false });
    expect(blockDef('own:note', glob)).toMatchObject({ own: true, kind: 'text', toShop: true });
  });
  it('translates the starting own blocks when nothing is stored', () => {
    const g = globalOf(undefined, (s) => `DE:${s}`);
    expect(g.own.find((o) => o.id === 'note').title).toBe('DE:Note');
  });
  it('adds a block that is new since the layout was stored, and forgets unknown ids', () => {
    const g = globalOf({ layout: { pass: [{ id: 'wheels', on: true }, { id: 'gone', on: true }] }, own: [] });
    expect(ids(g.layout.pass)).toContain('suspension');
    expect(ids(g.layout.pass)).not.toContain('gone');
    expect(ids(g.layout.pass).at(-1)).not.toBe('wheels');
  });
});

describe('changing a layout', () => {
  const list = layoutFor(bike(1), 'pass', glob);
  it('moves a block one place with the arrows, never past the edges', () => {
    expect(ids(moveBlock(list, 'wheels', -1)).slice(0, 2)).toEqual(['wheels', 'suspension']);
    expect(moveBlock(list, 'suspension', -1)).toBe(list);
  });
  it('moves a dragged block from one place to another (B2 a+b)', () => {
    expect(ids(moveTo(list, 0, 3)).slice(0, 4)).toEqual(['wheels', 'fit', 'drive', 'suspension']);
  });
  it('switches a block off and on again', () => {
    const off = switchBlock(list, 'fit', false);
    expect(off.find((x) => x.id === 'fit').on).toBe(false);
    expect(switchBlock(off, 'fit', true).find((x) => x.id === 'fit').on).toBe(true);
  });
  it('takes a block off the sheet into the library and back on at the end', () => {
    const full = fullLayout(bike(1), 'pass', glob);
    const off = takeOff(full, 'fit');
    expect(off.find((x) => x.id === 'fit').lib).toBe(true);
    const back = addBlock(off, 'fit');
    const shown = back.filter((x) => !x.lib);
    expect(shown.at(-1)).toEqual({ id: 'fit', on: true });
    // dragging never moves a block past the ones on the sheet
    expect(ids(moveTo(off, 0, 99).filter((x) => !x.lib)).at(-1)).toBe('suspension');
  });
});

describe('for all bikes or only for one (B1 a+b, BS4 a)', () => {
  it('asks once: a bike without an answer has no scope yet', () => {
    expect(scopeOf(bike(1), 'pass')).toBe(null);
  });
  it('«For all bikes» changes the standard and remembers the answer on the bike', () => {
    const b = bike(1);
    const list = switchBlock(fullLayout(b, 'pass', glob), 'geometry', true);
    const res = saveLayout(glob, b, 'pass', list, 'all');
    expect(res.settings.layout.pass.find((x) => x.id === 'geometry').on).toBe(true);
    expect(res.bike.sheetBlocks.scope).toBe('all');
    const g2 = globalOf(res.settings);
    // another bike follows the new standard
    expect(shownIds(bike(2), 'pass', g2)).toContain('geometry');
    expect(scopeOf({ ...b, ...res.bike }, 'pass')).toBe('all');
  });
  it('«Only for this bike» gives it its own order; the others keep the standard', () => {
    const b = bike(1);
    const list = moveBlock(fullLayout(b, 'pass', glob), 'measured', -4);
    const res = saveLayout(glob, b, 'pass', list, 'bike');
    expect(res.settings).toBeUndefined();
    const mine = { ...b, ...res.bike };
    expect(ids(layoutFor(mine, 'pass', glob))[0]).toBe('measured');
    expect(ids(layoutFor(bike(2), 'pass', glob))[0]).toBe('suspension');
    expect(hasOwnLayout(mine, 'pass')).toBe(true);
    expect(scopeOf(mine, 'pass')).toBe('bike');
    // back to the standard
    const back = { ...mine, ...resetBike(mine, 'pass') };
    expect(hasOwnLayout(back, 'pass')).toBe(false);
    expect(ids(layoutFor(back, 'pass', glob))[0]).toBe('suspension');
  });
});

describe('own blocks (B5 a, BS5 b)', () => {
  it('needs a title, and a new one', () => {
    expect(newOwn(glob, { id: 'x', title: '  ' }).error).toBe('Please give it a title.');
    expect(newOwn(glob, { id: 'x', title: 'note' }).error).toBe('There is already a block with this title.');
    expect(newOwn(glob, { id: 'note', title: 'Note' }).def.title).toBe('Note');
  });
  it('a new own block goes on its sheets for every bike, also one with its own order', () => {
    const { def } = newOwn(glob, { id: 'home', title: 'After the pick-up at home', kind: 'check', sheets: ['order'], toShop: false, points: [{ id: 'p1', text: 'Lights back on' }] });
    const g = putOwn(glob, def);
    expect(ids(layoutFor(bike(1), 'order', g))).toContain('own:home');
    expect(ids(layoutFor(bike(1), 'pass', g))).not.toContain('own:home');
    const own = { ...bike(2), ...saveLayout(glob, bike(2), 'order', fullLayout(bike(2), 'order', glob), 'bike').bike };
    expect(ids(layoutFor(own, 'order', g))).toContain('own:home');
  });
  it('keeps the text per bike (B5 a)', () => {
    const def = blockDef('own:note', glob);
    const a = { ...bike(1), ...setOwnContent(bike(1), 'note', { text: 'Saddle 2 mm forward' }) };
    expect(ownContent(a, def).text).toBe('Saddle 2 mm forward');
    expect(ownContent(bike(2), def).text).toBe('');
    expect(ownHasContent(a, def)).toBe(true);
    expect(ownHasContent(bike(2), def)).toBe(false);
  });
  it('deletes on this bike only and asks about the others only when they still have it (BS5 b)', () => {
    const bikes = [bike(1), bike(2), bike(3)];
    const one = { ...bikes[0], ...goneOnBike(bikes[0], 'note') };
    expect(ids(layoutFor(one, 'pass', glob))).not.toContain('own:note');
    expect(ids(layoutFor(bikes[1], 'pass', glob))).toContain('own:note');
    expect(othersWith([one, bikes[1], bikes[2]], 1, 'note').map((b) => b.id)).toEqual([2, 3]);
    const two = { ...bikes[1], ...goneOnBike(bikes[1], 'note') };
    const three = { ...bikes[2], ...goneOnBike(bikes[2], 'note') };
    expect(othersWith([one, two, three], 1, 'note')).toEqual([]);
  });
  it('«on all bikes too» takes it out of the standard', () => {
    const g = goneEverywhere(glob, 'note');
    expect(g.own.some((o) => o.id === 'note')).toBe(false);
    expect(ids(layoutFor(bike(2), 'pass', globalOf(g)))).not.toContain('own:note');
  });
  it('lists the own blocks taken off a sheet in its library', () => {
    const full = takeOff(fullLayout(bike(1), 'pass', glob), 'own:note');
    const b = { ...bike(1), ...saveLayout(glob, bike(1), 'pass', full, 'bike').bike };
    expect(libraryFor(b, 'pass', glob)).toContain('own:note');
  });
});
