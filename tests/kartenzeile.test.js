// Durchklick Etappe 2, Frage 1a (Noah 05.11.2026): which cards start as one line on a phone (src/lib/ui/kartenzeile.js).
import { describe, it, expect } from 'vitest';
import { START_FOLDED, openMapOf, cardFolded } from '../src/lib/ui/kartenzeile.js';

describe('cardFolded', () => {
  it('starts folded on a phone for the listed cards only', () => {
    for (const id of START_FOLDED) expect(cardFolded({}, id, true)).toBe(true);
    expect(cardFolded({}, 'ah:plan', true)).toBe(false);
    expect(cardFolded({}, 'gd:debrief', true)).toBe(false);
  });
  it('never folds by itself on a computer', () => {
    for (const id of START_FOLDED) expect(cardFolded({}, id, false)).toBe(false);
  });
  it('the stored choice wins on both', () => {
    expect(cardFolded({ 'gd:pack': true }, 'gd:pack', true)).toBe(false);
    expect(cardFolded({ 'gd:pack': false }, 'gd:pack', true)).toBe(true);
    expect(cardFolded({ 'gd:pack': false }, 'gd:pack', false)).toBe(true);
  });
  it('ignores a damaged setting', () => {
    expect(openMapOf(null)).toEqual({});
    expect(openMapOf([1, 2])).toEqual({});
    expect(openMapOf({ a: 'x', b: true, c: false })).toEqual({ b: true, c: false });
    expect(cardFolded('kaputt', 'gd:pack', true)).toBe(true);
  });
});
