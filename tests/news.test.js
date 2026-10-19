// Paket Q #148: alerts for you and your own news sources.
import { describe, it, expect } from 'vitest';
import { DEFAULT_FEEDS, PASSES, feedsOf, alertsOf, checkFeed, usuallyOpen, warningsFor, importantOf, seasonOf } from '../src/lib/clear/news.js';
import DE from '../src/lib/i18n/de/klarer.js';

const W = [
  { event: 'Starkregen', area: 'Testregion Nord', level: 3, expires: '2026-10-20T10:00:00Z' },
  { event: 'Wind', area: 'Testregion Süd', level: 2, expires: '2026-10-20T10:00:00Z' },
  { event: 'Alt', area: 'Testregion Nord', level: 4, expires: '2026-10-18T10:00:00Z' },
];
const now = new Date('2026-10-19T08:00:00Z');

describe('news sources', () => {
  it('start with the velo and mountain sources, then the stored list', () => {
    expect(feedsOf(undefined)).toBe(DEFAULT_FEEDS);
    expect(feedsOf([])).toEqual([]);
  });
  it('checks a new source', () => {
    expect(checkFeed({ name: '', url: 'https://example.org/feed' }).error).toBeTruthy();
    expect(checkFeed({ name: 'X', url: 'http://example.org/feed' }).error).toBeTruthy();
    expect(checkFeed({ name: 'X', url: 'example.org/feed' }).feed.url).toBe('https://example.org/feed');
    expect(checkFeed({ name: 'X', url: DEFAULT_FEEDS[0].url }, DEFAULT_FEEDS).error).toBeTruthy();
    expect(checkFeed({ name: 'Neu', url: DEFAULT_FEEDS[0].url }, DEFAULT_FEEDS, DEFAULT_FEEDS[0].id).feed.name).toBe('Neu');
  });
});

describe('alerts', () => {
  it('filters warnings by region and drops old ones', () => {
    expect(warningsFor(W, 'nord', now).map((w) => w.event)).toEqual(['Starkregen']);
    expect(warningsFor(W, '', now).length).toBe(2);
  });
  it('a pass season', () => {
    const furka = PASSES.find((p) => p.key === 'furka');
    expect(usuallyOpen(furka, 7)).toBe(true);
    expect(usuallyOpen(furka, 1)).toBe(false);
    expect(seasonOf(PASSES.find((p) => p.key === 'julier'))).toBeNull();
  });
  it('one line on Today only for important things', () => {
    const prefs = alertsOf({ region: 'Nord', passes: ['furka'] });
    const lines = importantOf({ warnings: W, avalanche: { level: 3 }, prefs, now });
    expect(lines.map((l) => l.key)).toEqual(['weather', 'pass-furka']); // October: no avalanche line yet, Furka closes
    expect(importantOf({ warnings: W, prefs: alertsOf({}), now })).toEqual([]); // no region: no weather line
    expect(importantOf({ avalanche: { level: 3 }, prefs: alertsOf({}), now: new Date('2026-01-10T08:00:00Z') }).map((l) => l.key)).toEqual(['avalanche']);
  });
  it('every line has German', () => {
    const lines = importantOf({ warnings: W, avalanche: { level: 4 }, prefs: alertsOf({ region: 'Nord', passes: ['furka', 'oberalp'] }), now: new Date('2026-05-10T08:00:00Z') });
    for (const l of lines) expect(DE[l.text], l.text).toBeTruthy();
  });
});
