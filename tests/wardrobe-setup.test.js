// «Kleiderschrank einrichten» (Noah 21.11.2026 «1-5a 4b»): the pure rules of the setup queue.
import { describe, it, expect } from 'vitest';
import { LEVELS, levelsOfRange, rangeOfLevels, suggestLevels, placeOf, needsSetup, setupQueue, setupCount, setupPatch } from '../src/lib/wardrobe-setup.js';

const piece = (id, name, f = {}) => ({ id, name, category: 'onbike', ownership: 'owned', domains: ['bikepacking'], ...f });

describe('levels and ranges', () => {
  it('has five steps from warm to frost', () => {
    expect(LEVELS.map((l) => l.key)).toEqual(['warm', 'mild', 'cool', 'cold', 'frost']);
  });
  it('turns steps into a range, warm stays open at the top', () => {
    expect(rangeOfLevels(['cool', 'mild'])).toEqual({ tempMin: 5, tempMax: 20 });
    expect(rangeOfLevels(['warm'])).toEqual({ tempMin: 20, tempMax: null });
    expect(rangeOfLevels(['cold', 'frost'])).toEqual({ tempMin: -15, tempMax: 5 });
    expect(rangeOfLevels([])).toEqual({ tempMin: null, tempMax: null });
  });
  it('keeps the steps as one run', () => {
    expect(rangeOfLevels(['warm', 'cool'])).toEqual({ tempMin: 5, tempMax: null });
  });
  it('reads a range back into steps', () => {
    expect(levelsOfRange({ lo: 5, hi: 18 })).toEqual(['mild', 'cool']);
    expect(levelsOfRange({ lo: -5, hi: 10 })).toEqual(['cool', 'cold', 'frost']);
    expect(levelsOfRange(null)).toEqual([]);
  });
});

describe('suggestions', () => {
  it('uses an existing range first, then the class, then the name', () => {
    expect(suggestLevels(piece('a', 'X', { tempMin: 5, tempMax: 18 }))).toEqual(['mild', 'cool']);
    expect(suggestLevels(piece('b', 'X', { tempClass: 'kalt' }))).toEqual(['cold', 'frost']);
    expect(suggestLevels(piece('c', 'Winterjacke'))).toEqual(['cold', 'frost']);
    expect(suggestLevels(piece('d', 'Kurze Hose'))).toEqual(['warm', 'mild']);
    expect(suggestLevels(piece('e', 'Beinlinge'))).toEqual(['mild', 'cool']);
    expect(suggestLevels(piece('f', 'Handschuhe dünn'))).toEqual(['mild', 'cool']);
    expect(suggestLevels(piece('g', 'Gummiente'))).toEqual([]);
  });
  it('reads the layer and zone from the piece or the name', () => {
    expect(placeOf(piece('a', 'Windweste', { layer: 'mid', zone: 'torso' }))).toMatchObject({ layer: 'mid', zone: 'torso', guessed: false });
    expect(placeOf(piece('b', 'Buff dünn'))).toMatchObject({ layer: 'accessory', zone: 'head', guessed: true });
    expect(placeOf(piece('c', 'Gummiente'))).toMatchObject({ layer: null, zone: null });
  });
});

describe('the queue', () => {
  const items = [
    piece('1', 'Alpha', { layer: 'base', zone: 'torso', tempMin: 5, tempMax: 15 }),
    piece('2', 'Beta'),
    piece('3', 'Charlie', { layer: 'mid', zone: 'torso' }),
    piece('4', 'Delta', { ownership: 'wishlist' }),
    piece('5', 'Echo', { domains: ['everyday'] }),
    piece('6', 'Foxtrot', { category: 'cooking' }),
    piece('7', 'Golf', { ownership: 'gone' }),
  ];
  it('needs setup: owned bike clothes without place or number', () => {
    expect(items.map((i) => [i.id, needsSetup(i)])).toEqual([['1', false], ['2', true], ['3', true], ['4', false], ['5', false], ['6', false], ['7', false]]);
  });
  it('puts the most used first, then by name, and leaves skipped ones out', () => {
    const trips = [{ entries: [{ itemId: '3' }] }, { entries: [{ itemId: '3' }, { itemId: '2' }] }];
    expect(setupQueue(items, trips).map((q) => q.item.id)).toEqual(['3', '2']);
    expect(setupQueue(items, trips, ['3']).map((q) => q.item.id)).toEqual(['2']);
  });
  it('counts what is open', () => {
    expect(setupCount(items)).toEqual({ all: 3, open: 2, noTemp: 2, noPlace: 1 });
  });
  it('saves only what changes', () => {
    expect(setupPatch(items[2], { levels: ['cool', 'mild'], layer: 'mid', zone: 'torso' })).toEqual({ tempMin: 5, tempMax: 20 });
    expect(setupPatch(items[1], { levels: ['warm'], layer: 'base', zone: 'legs' })).toEqual({ layer: 'base', zone: 'legs', tempMin: 20, tempMax: null });
    expect(setupPatch(items[1], { levels: [], layer: null, zone: null })).toEqual({});
  });
});
