// Paket Q #148: alerts for you and your own news sources.
import { describe, it, expect } from 'vitest';
import { DEFAULT_FEEDS, PASSES, feedsOf, alertsOf, checkFeed, usuallyOpen, warningsFor, importantOf, seasonOf, tripAlerts, tripSoon } from '../src/lib/clear/news.js';
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

describe('warning for a planned trip (Zusatz 1)', () => {
  const W = { event: 'Starkregen', area: 'Testregion Nord', level: 2, onset: '2026-10-21T06:00:00.000Z', expires: '2026-10-22T06:00:00.000Z', link: 'https://example.org/w' };
  const trip = { startDate: '2026-10-21', days: 2, domain: 'bikepacking', place: { name: 'Testregion' } };
  it('finds a warning for the trip place and days', () => {
    const r = tripAlerts({ trip, warnings: [W], today: '2026-10-19' });
    expect(r).toEqual([{ key: 'weather', text: 'Weather warning for your trip: {event} ({area})', vars: { event: 'Starkregen', area: 'Testregion Nord' }, href: 'https://example.org/w' }]);
  });
  it('nothing for another place, other days, a past trip or a weak warning', () => {
    expect(tripAlerts({ trip: { ...trip, place: { name: 'Anderswo' } }, warnings: [W], today: '2026-10-19' })).toEqual([]);
    expect(tripAlerts({ trip: { ...trip, startDate: '2026-10-25' }, warnings: [W], today: '2026-10-19' })).toEqual([]);
    expect(tripAlerts({ trip, warnings: [W], today: '2026-10-30' })).toEqual([]);
    expect(tripAlerts({ trip, warnings: [{ ...W, level: 1 }], today: '2026-10-19' })).toEqual([]);
  });
  it('uses your region when the trip has no place', () => {
    expect(tripAlerts({ trip: { ...trip, place: null }, warnings: [W], prefs: { region: 'nord', weather: true }, today: '2026-10-19' })).toHaveLength(1);
  });
  it('avalanche only on a ski tour today or tomorrow', () => {
    const av = { level: 3, link: 'https://example.org/slf' };
    expect(tripAlerts({ trip: { ...trip, domain: 'ski', startDate: '2026-10-20' }, avalanche: av, today: '2026-10-19' })[0].key).toBe('avalanche');
    expect(tripAlerts({ trip: { ...trip, domain: 'ski', startDate: '2026-10-23' }, avalanche: av, today: '2026-10-19' })).toEqual([]);
    expect(tripAlerts({ trip: { ...trip, startDate: '2026-10-20' }, avalanche: av, today: '2026-10-19' })).toEqual([]);
  });
  it('soon: from today up to 5 days ahead, or under way', () => {
    expect(tripSoon(trip, '2026-10-19')).toBe(true);
    expect(tripSoon(trip, '2026-10-22')).toBe(true);
    expect(tripSoon(trip, '2026-10-23')).toBe(false);
    expect(tripSoon({ ...trip, startDate: '2026-10-30' }, '2026-10-19')).toBe(false);
  });
});
