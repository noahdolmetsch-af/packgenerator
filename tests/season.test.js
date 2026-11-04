// «Velos-Pflege einbauen» (Noah 03.11.2026 «2a»): the season rule, by calendar day. Fictional bikes.
import { describe, it, expect } from 'vitest';
import { SEASON_RULES, seasonNow, seasonDone, seasonYear, monthOf } from '../src/lib/season.js';
import { WINTER_STD } from '../src/lib/griff.js';
import DE from '../src/lib/i18n/de/index.js';

const bikes = [{ id: 'test_data_gtp_b1' }, { id: 'test_data_gtp_b2' }];
const ids = (d, o = {}) => seasonNow(d, { bikes, ...o }).map((r) => r.id);

describe('the season rule', () => {
  it('November puts the bike away, December looks back, February is spring, other months say nothing', () => {
    expect(ids('2026-11-18')).toEqual(['bike-winter']);
    expect(ids('2026-12-02')).toEqual(['bike-year']);
    expect(ids('2027-02-09')).toEqual(['bike-spring']);
    for (const d of ['2026-10-31', '2027-01-15', '2027-03-01', '2026-07-14']) expect(ids(d), d).toEqual([]);
    expect(monthOf('2026-11-01')).toBe(11);
  });
  it('without a bike nothing shows; an area can be asked for', () => {
    expect(seasonNow('2026-11-18', { bikes: [] })).toEqual([]);
    expect(seasonNow('2026-11-18', { bikes, area: 'ski' })).toEqual([]);
    expect(seasonNow('2026-11-18', { bikes, area: 'velo' })).toHaveLength(1);
  });
  it('the winter rule goes away once every point is ticked on every bike, but not before', () => {
    const items = WINTER_STD.map((x, i) => ({ id: `w${i}`, text: x, std: true }));
    const tick = (n) => ({ winter: { items, ticks: Object.fromEntries(bikes.map((b) => [b.id, { day: '2026', ids: items.slice(0, n).map((x) => x.id) }])) } });
    expect(seasonDone('winter', bikes, tick(items.length), '2026-11-18')).toBe(true);
    expect(seasonDone('winter', bikes, tick(items.length - 1), '2026-11-18')).toBe(false);
    expect(ids('2026-11-18', { season: tick(items.length) })).toEqual([]);
    expect(ids('2026-11-18', { season: tick(2) })).toEqual(['bike-winter']);
  });
  it('a winter tick of November still counts in January; every rule has a German label and a place', () => {
    expect(seasonYear('winter', '2027-01-20')).toBe('2026');
    expect(seasonYear('winter', '2026-11-18')).toBe('2026');
    expect(seasonYear('spring', '2027-02-09')).toBe('2027');
    for (const r of SEASON_RULES) {
      expect(r.href).toMatch(/^#\//);
      expect(DE[r.label], r.label).toBeTruthy();
      expect(r.months.every((m) => m >= 1 && m <= 12)).toBe(true);
    }
  });
});
