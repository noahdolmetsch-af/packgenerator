// «Ein Filter auf Touren» (Noah 26.11.2026 «Ja», «a»): rules in src/lib/touren/tourbar.js
import { describe, it, expect } from 'vitest';
import { DISTS, distKeyOf, withDist, yearsOf, yearPeriod, wordRows, hitOf, kindCounts } from '../src/lib/touren/tourbar.js';
import { emptyFilter, KINDS } from '../src/lib/touren/filter.js';

const rows = [
  { id: 'a', title: 'Jura-Runde', start: '2026-10-03', km: 82, days: 1, bike: 'Strassenvelo' },
  { id: 'b', title: 'Feierabend am See', start: '2026-09-02', km: 28, days: 1, bike: 'Strassenvelo' },
  { id: 'c', title: 'Alpenrunde Süd', start: '2025-08-14', km: 318, days: 4, bike: 'Gravel Blau' },
  { id: 'd', title: 'Alpenrunde Nord', start: '2026-08-14', km: null, days: 1, bike: 'Gravel Blau' },
];

describe('distance buttons', () => {
  it('set the km range of the list filter and switch off on a second tap', () => {
    expect(withDist(emptyFilter(), 'long').km).toEqual([80, null]);
    expect(distKeyOf(withDist(emptyFilter(), 'mid'))).toBe('mid');
    expect(withDist(withDist(emptyFilter(), 'short'), 'short').km).toEqual([null, null]);
    expect(distKeyOf(emptyFilter())).toBe(null);
  });
  it('are three and do not overlap', () => {
    expect(DISTS.map((d) => d.key)).toEqual(['short', 'mid', 'long']);
    expect(DISTS[0].km[1]).toBe(DISTS[1].km[0]);
    expect(DISTS[1].km[1]).toBe(DISTS[2].km[0]);
  });
});

describe('years', () => {
  it('lists the years that exist, newest first', () => {
    expect(yearsOf(rows)).toEqual(['2026', '2025']);
  });
  it('makes a period of one calendar year, the current one stops today', () => {
    expect(yearPeriod('2025', '2026-11-26')).toEqual({ mode: 'pick', from: '2025-01-01', to: '2025-12-31' });
    expect(yearPeriod('2026', '2026-11-26').to).toBe('2026-11-26');
  });
});

describe('the words of the field', () => {
  const bikeOf = (r) => r.bike;
  it('find in the title, the bike and the day, in any case, with umlauts', () => {
    expect(wordRows(rows, 'alpenrunde', bikeOf).length).toBe(2);
    expect(wordRows(rows, 'ALPENRUNDE süd', bikeOf).map((r) => r.id)).toEqual(['c']);
    expect(wordRows(rows, 'strassenvelo', bikeOf).length).toBe(2);
    expect(wordRows(rows, '2025', bikeOf).map((r) => r.id)).toEqual(['c']);
  });
  it('without words let everything through', () => {
    expect(wordRows(rows, '  ', bikeOf).length).toBe(4);
    expect(hitOf('')('x')).toBe(true);
  });
});

describe('kinds that exist', () => {
  it('counts only the kinds with trips', () => {
    const k = kindCounts(rows, KINDS);
    expect(k.length).toBeGreaterThan(0);
    expect(k.every((x) => x.n > 0)).toBe(true);
    expect(k.reduce((s, x) => s + x.n, 0)).toBe(rows.length);
  });
});
