// «Analyse» (Noah 27.10.2026 «1a 2a 3a 4a 5b»): the rules of the page Auswerten › Analyse
import { describe, it, expect } from 'vitest';
import { PERIODS, SOURCES, sourceOf, periodDays, summaryOf, sparkOf, tilesOf, ticksByDay, tickPeriod, sparkPath } from '../src/lib/analyse.js';
import { BODY_KEYS } from '../src/lib/uebersicht.js';

describe('Analyse', () => {
  it('has four periods and five sources; every body value has a source chip', () => {
    expect(PERIODS).toEqual([7, 30, 90, 365]);
    expect(SOURCES).toEqual(['aktiv', 'fitbit', 'strava', 'body', 'check']);
    for (const b of BODY_KEYS) expect(SOURCES, b.key).toContain(sourceOf(b.src));
    expect(sourceOf('fitbit')).toBe('fitbit');
    expect(sourceOf('zones')).toBe('strava');
    expect(sourceOf('med')).toBe('aktiv');
    expect(sourceOf('own')).toBe('body');
  });
  it('counts calendar days back from today, the last one today', () => {
    const d = periodDays('2026-03-30', 3);
    expect(d).toEqual(['2026-03-28', '2026-03-29', '2026-03-30']); // over the summer-time change in Zurich
    expect(periodDays('2026-10-27', 30)).toHaveLength(30);
  });
  it('sums or averages only the days with a value', () => {
    expect(summaryOf([1, null, 3], false)).toEqual({ value: 2, n: 2 });
    expect(summaryOf([1, null, 3], true)).toEqual({ value: 4, n: 2 });
    expect(summaryOf([null, undefined])).toEqual({ value: null, n: 0 });
  });
  it('a small course has at most 30 points; a mean leaves a gap, a sum counts 0', () => {
    expect(sparkOf(Array(365).fill(1), true).length).toBeLessThanOrEqual(30);
    expect(sparkOf([null, null, 2, 4], false, 2)).toEqual([null, 3]);
    expect(sparkOf([null, null, 2, 4], true, 2)).toEqual([0, 6]);
  });
  it('leaves out values without a day, groups without a tile and switched-off sources', () => {
    const days = ['2026-10-26', '2026-10-27'];
    const groups = [
      { key: 'a', name: 'A', items: [{ key: 'x', src: 'fitbit', get: (d) => (d === '2026-10-27' ? 50 : null) }, { key: 'y', src: 'fitbit', get: () => null }] },
      { key: 'b', name: 'B', items: [{ key: 'z', src: 'aktiv', sum: true, get: () => 1 }] },
    ];
    const all = tilesOf(groups, days);
    expect(all.map((g) => g.key)).toEqual(['a', 'b']);
    expect(all[0].tiles.map((x) => x.key)).toEqual(['x']);
    expect(all[0].tiles[0].value).toBe(50);
    expect(all[1].tiles[0].value).toBe(2);
    expect(tilesOf(groups, days, ['aktiv']).map((g) => g.key)).toEqual(['b']);
    expect(tilesOf(groups, days, [])).toEqual([]);
  });
  it('counts the ticks of one activity per day and picks the period of «Haken ausgewertet»', () => {
    const log = [{ actId: 'sauna', day: '2026-10-26' }, { actId: 'sauna', day: '2026-10-26' }, { actId: 'gym', day: '2026-10-26' }, { actId: 'sauna', day: '2026-10-27' }];
    const by = ticksByDay(log, 'sauna');
    expect(by.get('2026-10-26')).toBe(2);
    expect(by.get('2026-10-27')).toBe(1);
    expect(tickPeriod(7)).toBe(30);
    expect(tickPeriod(30)).toBe(30);
    expect(tickPeriod(90)).toBe(90);
    expect(tickPeriod(365)).toBe(365);
  });
  it('draws a line with gaps, nothing without values', () => {
    expect(sparkPath([])).toBe('');
    expect(sparkPath([null, null])).toBe('');
    const p = sparkPath([1, null, 2, 3]);
    expect(p.match(/M/g)).toHaveLength(2);
  });
});
