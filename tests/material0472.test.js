import { describe, it, expect } from 'vitest';
import { materialStats, usageOf, inView, viewCounts, sortItems, neverText, tripLog, learnedRule, ruleText, alternatives, lighterAlt, ageOf, ageText, costPerUse, viewSummary, weightOf, VIEWS } from '../src/lib/gear/material.js';

// Fictional data: eight debriefed trips, the coldest temperature of each in wx.min.
const item = (id, extra = {}) => ({ id, name: id, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', ...extra });
const items = [
  item('computer', { favorite: true }),
  item('powerbank', { weightG: 180 }),
  item('multitool', { weightG: 150 }),
  item('jacket', { weightG: 210, category: 'rain', priceChf: 349, boughtAt: '2024-03-15T10:00:00.000Z' }),
  item('vest', { weightG: 98, category: 'rain', altFor: 'jacket' }),
  item('stove', { weightG: 85 }),
  item('pot', { weightG: 102 }),
  item('book', { weightG: 240, favorite: true }),
  item('headphones', { weightG: null }),
  item('tarp', { ownership: 'wishlist' }),
  item('old', { ownership: 'gone' }),
];
const T = [
  ['t1', '2025-11-15', 2, 'none'],
  ['t2', '2026-01-10', 4, 'rain'],
  ['t3', '2026-03-07', 6, 'none'],
  ['t4', '2026-05-02', 12, 'none'],
  ['t5', '2026-06-13', 15, 'none'],
  ['t6', '2026-07-18', 17, 'none'],
  ['t7', '2026-08-22', 14, 'none'],
  ['t8', '2026-09-26', 8, 'none'],
];
const on = {
  computer: 'all', powerbank: 'all', multitool: 'all', jacket: 'all',
  vest: ['t4', 't5', 't6'], stove: ['t4', 't5', 't6', 't7'], pot: ['t4', 't5', 't6', 't7'], book: ['t5', 't6', 't7'],
};
const unused = { t5: ['powerbank', 'stove', 'pot', 'book'], t4: ['jacket', 'stove', 'pot'], t6: ['jacket', 'stove', 'pot', 'book'], t7: ['jacket', 'stove', 'pot', 'book'], t1: ['multitool'], t2: ['multitool'], t8: ['multitool'] };
unused.t5.push('jacket', 'multitool');
unused.t4.push('multitool');
unused.t6.push('multitool');
unused.t7.push('multitool');
const trips = T.map(([id, date, min, rain]) => ({
  id, title: `Trip ${id}`, startDate: date, days: 1, wx: { min, max: min + 8, rain },
  entries: Object.entries(on).filter(([, w]) => w === 'all' || w.includes(id)).map(([itemId]) => ({ itemId, qty: 1 })),
}));
const debriefs = T.map(([id]) => ({ tripId: id, status: 'done', items: Object.fromEntries((unused[id] ?? []).map((x) => [x, 'unused'])), missing: [] }));
const TODAY = '2026-10-09';
const stats = materialStats(items, trips, debriefs, TODAY);

describe('material views (v0.47.2)', () => {
  it('counts taken, used and the share per item', () => {
    expect(stats.n).toBe(8);
    expect(usageOf(stats, 'computer')).toMatchObject({ taken: 8, used: 8, share: 1 });
    expect(usageOf(stats, 'powerbank')).toMatchObject({ taken: 8, used: 7 });
    expect(usageOf(stats, 'multitool')).toMatchObject({ taken: 8, used: 1 });
    expect(usageOf(stats, 'jacket')).toMatchObject({ taken: 8, used: 4, unused: 4, share: 0.5 });
    expect(usageOf(stats, 'stove')).toMatchObject({ taken: 4, used: 0 });
    expect(usageOf(stats, 'nothing')).toMatchObject({ taken: 0, used: 0, dots: [] });
  });
  it('gives one dot per trip of the last 12 months: used, along but unused, at home', () => {
    expect(usageOf(stats, 'jacket').dots).toEqual(['used', 'used', 'used', 'unused', 'unused', 'unused', 'unused', 'used']);
    expect(usageOf(stats, 'vest').dots).toEqual(['home', 'home', 'home', 'used', 'used', 'used', 'home', 'home']);
    // a trip older than 12 months is left out of the dots, not of the counts
    const old = materialStats(items, trips, debriefs, '2026-12-01');
    expect(old.byId.jacket.dots).toHaveLength(7);
    expect(old.byId.jacket.taken).toBe(8);
  });
  it('knows the last trip and how it went', () => {
    expect(usageOf(stats, 'jacket').last).toEqual({ title: 'Trip t8', date: '2026-09-26', state: 'used' });
    expect(usageOf(stats, 'stove').last).toMatchObject({ title: 'Trip t7', state: 'unused' });
    // a trip without a debrief counts as last trip, its state unknown; a future one does not
    const more = [...trips, { id: 'x', title: 'No debrief', startDate: '2026-10-01', entries: [{ itemId: 'stove' }] }, { id: 'y', title: 'Later', startDate: '2026-11-01', entries: [{ itemId: 'stove' }] }];
    expect(materialStats(items, more, debriefs, TODAY).byId.stove.last).toEqual({ title: 'No debrief', date: '2026-10-01', state: null });
  });
  it('puts the items into the seven views and counts them', () => {
    expect(VIEWS).toEqual(['all', 'most', 'proven', 'fav', 'never', 'unweighed', 'wish']);
    expect(viewCounts(items, stats)).toEqual({ all: 9, most: 3, proven: 2, fav: 2, never: 3, unweighed: 1, wish: 1 });
    const ids = (v) => items.filter((i) => inView(v, i, usageOf(stats, i.id), stats.n)).map((i) => i.id);
    expect(ids('most')).toEqual(['computer', 'powerbank', 'jacket']);
    expect(ids('proven')).toEqual(['computer', 'powerbank']);
    expect(ids('never')).toEqual(['stove', 'pot', 'book']);
    expect(ids('wish')).toEqual(['tarp']);
    // without debriefs nothing is "most used"
    expect(viewCounts(items, materialStats(items, [], [], TODAY)).most).toBe(0);
  });
  it('says never used in one plain sentence', () => {
    expect(neverText(usageOf(stats, 'stove'))).toBe('Taken 4 times, never used');
    expect(neverText({ taken: 1 })).toBe('Taken 1 time, never used');
  });
  it('sorts by times along, weight, last trip or name', () => {
    const list = items.filter((i) => i.ownership === 'owned');
    expect(sortItems(list, 'taken', stats).slice(0, 4).map((i) => i.id)).toEqual(['computer', 'powerbank', 'jacket', 'multitool']);
    expect(sortItems(list, 'weight', stats).map((i) => i.id).at(0)).toBe('book');
    expect(sortItems(list, 'weight', stats).map((i) => i.id).at(-1)).toBe('headphones');
    expect(sortItems(list, 'last', stats).at(-1).id).toBe('headphones');
    expect(sortItems(list, 'name', stats).map((i) => i.id).slice(0, 2)).toEqual(['book', 'computer']);
  });
  it('learns a temperature rule only when every trip agrees', () => {
    const log = tripLog(trips, debriefs);
    expect(learnedRule('jacket', log)).toEqual({ kind: 'cold', limit: 12, n: 8 });
    expect(ruleText(learnedRule('jacket', log))).toBe('Below 12 °C always used, above never. From 8 trips.');
    expect(learnedRule('computer', log)).toBe(null);
    expect(learnedRule('stove', log)).toBe(null);
    // one warm trip where it was used breaks the rule
    const broken = debriefs.map((d) => (d.tripId === 't6' ? { ...d, items: { ...d.items, jacket: 'used' } } : d));
    expect(learnedRule('jacket', tripLog(trips, broken))).toBe(null);
  });
  it('learns a rain rule', () => {
    const wet = trips.map((x, k) => ({ ...x, wx: { min: 10, rain: k % 2 ? 'rain' : 'none' } }));
    const d = debriefs.map((x, k) => ({ ...x, items: k % 2 ? {} : { jacket: 'unused' } }));
    expect(learnedRule('jacket', tripLog(wet, d))).toEqual({ kind: 'rain', n: 8 });
    expect(ruleText({ kind: 'rain', n: 8 })).toBe('Always used in the rain, never when dry. From 8 trips.');
  });
  it('finds the lighter alternative in your own gear', () => {
    expect(lighterAlt(items[3], items)).toMatchObject({ item: { id: 'vest' }, diffG: -112 });
    expect(lighterAlt(items[4], items)).toBe(null);
    expect(alternatives(items[4], items).map((a) => a.item.id)).toEqual(['jacket']);
    expect(lighterAlt(items[0], items)).toBe(null);
  });
  it('tells the age and the cost per use only with data', () => {
    expect(ageOf(items[3], TODAY)).toEqual({ years: 2, months: 6 });
    expect(ageText({ years: 2, months: 6 })).toBe('2 y 6 mo');
    expect(ageText({ years: 0, months: 5 })).toBe('5 mo');
    expect(ageOf(items[0], TODAY)).toBe(null);
    expect(costPerUse(items[3], usageOf(stats, 'jacket'))).toBeCloseTo(87.25);
    expect(costPerUse(items[0], usageOf(stats, 'computer'))).toBe(null);
    expect(costPerUse(items[3], { used: 0 })).toBe(null);
  });
  it('sums a view: weight, missing weights, times along and share used', () => {
    expect(weightOf(items.slice(7, 9))).toEqual({ g: 240, missing: 1 });
    const s = viewSummary(items.slice(0, 2), stats);
    expect(s).toEqual({ n: 2, g: 280, missing: 0, avgTaken: 8, usedShare: 94 });
    expect(viewSummary([items[8]], stats)).toMatchObject({ avgTaken: null, usedShare: null });
  });
});
