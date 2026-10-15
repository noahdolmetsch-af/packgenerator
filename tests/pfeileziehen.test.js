// v0.163.x «Pfeile und Ziehen» (Noah 15.10.2026 «2a und b möglich - gilt überall für alles»): every
// sortable list has the arrows and a handle to drag. The pure parts: where a dragged row lands, how the
// others make room, and the new order for the categories and the activity tiles.
import { describe, it, expect } from 'vitest';
import { dropIndex, shiftOf } from '../src/lib/ui/sortable.js';
import { moveTo, move } from '../src/lib/lists.js';
import { moveFavTo, moveFav } from '../src/lib/flowtiles.js';

const mids = [10, 30, 50, 70]; // four rows of 20 px

describe('dropIndex', () => {
  it('stays in place for a small move', () => {
    expect(dropIndex(mids, 1, 32)).toBe(1);
  });
  it('goes down past the middles it crosses', () => {
    expect(dropIndex(mids, 0, 55)).toBe(2);
    expect(dropIndex(mids, 0, 99)).toBe(3);
  });
  it('goes up to the top', () => {
    expect(dropIndex(mids, 3, 0)).toBe(0);
    expect(dropIndex(mids, 3, 45)).toBe(2);
  });
});

describe('shiftOf', () => {
  it('rows between make room in the right direction', () => {
    expect([0, 1, 2, 3].map((i) => shiftOf(i, 0, 2))).toEqual([0, -1, -1, 0]);
    expect([0, 1, 2, 3].map((i) => shiftOf(i, 3, 1))).toEqual([0, 1, 1, 0]);
    expect([0, 1, 2, 3].map((i) => shiftOf(i, 2, 2))).toEqual([0, 0, 0, 0]);
  });
});

describe('lists moveTo', () => {
  const shown = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  it('puts the entry at the new place and keeps the rest in order', () => {
    expect(moveTo({}, shown, 'a', 2).order).toEqual(['b', 'c', 'a', 'd']);
    expect(moveTo({}, shown, 'd', 0).order).toEqual(['d', 'a', 'b', 'c']);
  });
  it('one place is the same as the arrow', () => {
    expect(moveTo({}, shown, 'b', 2).order).toEqual(move({}, shown, 'b', 1).order);
  });
  it('changes nothing outside the list', () => {
    const same = move({}, shown, 'a', -1); // the arrow at the top: the override unchanged
    expect(moveTo({}, shown, 'a', 9)).toEqual(same);
    expect(moveTo({}, shown, 'x', 1)).toEqual(same);
  });
});

describe('moveFavTo', () => {
  const favs = ['a', 'b', 'c'].map((id, favOrder) => ({ id, favOrder }));
  it('gives the new favOrder of every tile', () => {
    expect(moveFavTo(favs, 'c', 0).map((a) => [a.id, a.favOrder])).toEqual([['c', 0], ['a', 1], ['b', 2]]);
  });
  it('one place is the same as the arrow', () => {
    expect(moveFavTo(favs, 'a', 1)).toEqual(moveFav(favs, 'a', 1));
  });
  it('nothing to put when nothing moves', () => {
    expect(moveFavTo(favs, 'a', 0)).toEqual([]);
    expect(moveFavTo(favs, 'a', 5)).toEqual([]);
  });
});
