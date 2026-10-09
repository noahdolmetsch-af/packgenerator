import { describe, it, expect } from 'vitest';
import { comesLine, blockNames, ruleNames, placeName, weightState, lifeLine, nextFold } from '../src/lib/gear/detail.js';
import { lighterAlts, lighterAlt, onTheWay, materialStats, AUTO_ALTS } from '../src/lib/gear/material.js';

// v0.63.0 «Material-Detail ruhig» (Noah 1a-3a). Fictional data only.
const blocks = [
  { key: 'light', name: 'Light', builtIn: true },
  { key: 'warm', name: 'Night: Warm', builtIn: true },
  { key: 'u-own', name: 'My block', builtIn: false },
];

describe('the summary line at the top of the item', () => {
  it('says how it comes along: blocks, rules, place', () => {
    const item = { id: 'a', sets: ['standard', 'light'], role: 'standard', coldBelow: 10, defaultBag: 'seat' };
    expect(blockNames(item, blocks)).toEqual(['Standard', 'Light']);
    expect(ruleNames(item)).toEqual(['below 10 °C']);
    expect(comesLine(item, blocks)).toMatch(/^Comes along: Standard · Light · below 10 °C · /);
  });
  it('says «by hand» without a block or a rule, and On me for a worn item', () => {
    expect(comesLine({ id: 'b', sets: [], defaultBag: 'seat' }, blocks)).toMatch(/^Comes along: by hand · /);
    expect(placeName({ id: 'c', role: 'worn' })).toBe('On me');
    expect(blockNames({ id: 'c', role: 'worn' }, blocks)).toEqual(['Standard']);
  });
  it('a night block without its prefix, an own block by its name', () => {
    expect(blockNames({ id: 'd', sets: ['warm', 'u-own'] }, blocks)).toEqual(['Warm', 'My block']);
  });
  it('an item marked «stays at home» says so first', () => {
    expect(comesLine({ id: 'e', leaveHome: true, role: 'optional', sets: [] }, blocks)).toMatch(/^Comes along: Stays at home · by hand/);
  });
  it('the weight status', () => {
    expect(weightState({ weightG: null })).toBe('not weighed');
    expect(weightState({ weightG: 120, weightStatus: 'measured' })).toBe('weighed');
    expect(weightState({ weightG: 120, weightStatus: 'logbook' })).toBe('from a list');
  });
  it('the history row', () => {
    expect(lifeLine({ taken: 4, used: 3 }, 1)).toBe('4× along · 3× used · 1 lighter option');
    expect(lifeLine({ taken: 0, used: 0 })).toBe('on no reviewed trip yet');
  });
});

describe('one row open at a time', () => {
  it('opening a row replaces the open one; a late close of another row changes nothing', () => {
    expect(nextFold(null, 'where', true)).toBe('where');
    expect(nextFold('where', 'blocks', true)).toBe('blocks');
    expect(nextFold('blocks', 'where', false)).toBe('blocks');
    expect(nextFold('blocks', 'blocks', false)).toBe(null);
  });
});

const it2 = (id, extra = {}) => ({ id, name: id, category: 'tools', weightG: 100, qty: 1, ownership: 'owned', ...extra });

describe('lighter alternatives: linked first, then at most two suggestions', () => {
  const items = [
    it2('pump', { weightG: 200 }),
    it2('pump2', { weightG: 150 }),
    it2('pump3', { weightG: 120 }),
    it2('lever', { weightG: 20 }),
    it2('linked', { weightG: 180, altFor: 'pump' }),
    it2('heavy', { weightG: 300 }),
    it2('wish', { weightG: 50, ownership: 'wishlist' }),
    it2('unweighed', { weightG: null }),
    it2('other', { weightG: 10, category: 'elec' }),
  ];
  it('the linked one first and marked, then the closest lighter ones of the same category', () => {
    const alts = lighterAlts(items[0], items);
    expect(alts.map((a) => [a.item.id, a.manual ? 'manual' : 'auto'])).toEqual([['linked', 'manual'], ['pump2', 'auto'], ['pump3', 'auto']]);
    expect(alts.filter((a) => a.auto)).toHaveLength(AUTO_ALTS);
    expect(alts[1].diffG).toBe(-50);
  });
  it('a dismissed suggestion is left out, the next one moves up', () => {
    expect(lighterAlts(items[0], items, ['pump2']).map((a) => a.item.id)).toEqual(['linked', 'pump3']);
  });
  it('a much lighter thing of the same category is no suggestion (under 40 % of the weight)', () => {
    expect(lighterAlts(items[0], items).some((a) => a.item.id === 'lever')).toBe(false);
  });
  it('the manual lighterAlt stays as it was (only linked items)', () => {
    expect(lighterAlt(items[0], items)).toMatchObject({ item: { id: 'linked' } });
    expect(lighterAlt(items[1], items)).toBe(null);
  });
  it('clothing: only the same zone and layer', () => {
    const c = (id, extra) => ({ id, name: id, category: 'onbike', weightG: 200, qty: 1, ownership: 'owned', ...extra });
    const list = [c('jersey', { zone: 'torso', layer: 'base' }), c('thin', { weightG: 120, zone: 'torso', layer: 'base' }), c('vest', { weightG: 150, zone: 'torso', layer: 'shell' }), c('socks', { weightG: 140, zone: 'feet' }), c('nozone', { weightG: 100 })];
    expect(lighterAlts(list[0], list).map((a) => a.item.id)).toEqual(['thin']);
    expect(lighterAlts(list[4], list)).toEqual([]); // no zone: no guess
  });
  it('an unweighed item gets no suggestion', () => {
    expect(lighterAlts(items[7], items)).toEqual([]);
  });
});

describe('«On the way there» under an empty «Never used»', () => {
  it('taken once or twice, never used; most often first', () => {
    const items = [it2('a'), it2('b'), it2('c'), it2('d'), it2('w', { ownership: 'wishlist' })];
    const trips = [
      { id: 't1', startDate: '2026-09-01', entries: ['a', 'b', 'c', 'w'].map((itemId) => ({ itemId })) },
      { id: 't2', startDate: '2026-09-10', entries: ['a', 'd'].map((itemId) => ({ itemId })) },
    ];
    const debriefs = [
      { tripId: 't1', status: 'done', items: { a: 'unused', b: 'unused', w: 'unused' } },
      { tripId: 't2', status: 'done', items: { a: 'unused' } },
    ];
    const stats = materialStats(items, trips, debriefs, '2026-10-09');
    expect(onTheWay(items, stats)).toEqual([{ item: items[0], taken: 2 }, { item: items[1], taken: 1 }]);
  });
});
