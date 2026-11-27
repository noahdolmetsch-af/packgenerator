// «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): the pure rules of the answers «Works» / «Does not work» per release
import { describe, it, expect } from 'vitest';
import { makeEntry } from '../src/lib/logbuch/logbuch.js';
import { releaseOfNews, stepsOf, resultOf, resultsOf, worksEntry, filterReleases, matchRelease } from '../src/lib/logbuch/testrunde.js';
import { buildOrder } from '../src/lib/logbuch/auftrag.js';
import { DEFAULT_KINDS, removeArt } from '../src/lib/logbuch/kinds.js';

const NEWS = { version: '0.1312.2', title: 'A star instead of a pin', pr: 1830, test: ['Open Trips.', 'Tap the star.'] };
const now = new Date('2026-11-27T12:00:00');

describe('release of an entry', () => {
  it('takes version, PR and title; an entry without a version has no release', () => {
    expect(releaseOfNews(NEWS)).toEqual({ version: '0.1312.2', pr: 1830, title: 'A star instead of a pin' });
    expect(releaseOfNews(NEWS, 7).pr).toBe(7);
    expect(releaseOfNews({ title: 'x' })).toBeNull();
    expect(releaseOfNews({ version: '0.5.0', title: 'x' }).pr).toBeNull();
  });
  it('makeEntry keeps the release and old entries have none', () => {
    const e = makeEntry({ art: 'fehler', text: 'no star', page: '#/', device: 'phone', width: 390, now, release: releaseOfNews(NEWS) });
    expect(e.release).toEqual({ version: '0.1312.2', pr: 1830, title: 'A star instead of a pin' });
    expect(makeEntry({ art: 'fehler', text: 'x', page: '#/', device: 'phone', width: 390, now }).release).toBeNull();
  });
});

describe('steps and answers', () => {
  it('lists the steps that are text', () => {
    expect(stepsOf(NEWS)).toHaveLength(2);
    expect(stepsOf({ test: ['', '  '] })).toEqual([]);
    expect(stepsOf({})).toEqual([]);
  });
  it('works = source test, does not work = an entry of the user, an auto error has no answer', () => {
    const rel = releaseOfNews(NEWS);
    const ok = worksEntry({ release: rel, text: 'ok', now });
    const bad = makeEntry({ art: 'fehler', text: 'bad', page: '#/', device: 'phone', width: 390, now, release: rel });
    expect(resultOf(ok)).toBe('ok');
    expect(resultOf(bad)).toBe('fail');
    expect(resultOf(makeEntry({ art: 'fehler', text: 'x', page: '#/', device: 'phone', width: 390, now }))).toBeNull();
    expect(resultOf({ ...bad, source: 'auto' })).toBeNull();
  });
  it('the newest answer of a version wins', () => {
    const rel = releaseOfNews(NEWS);
    const bad = makeEntry({ art: 'fehler', text: 'bad', page: '#/', device: 'phone', width: 390, now: new Date('2026-11-27T10:00:00'), release: rel });
    const ok = worksEntry({ release: rel, text: 'ok', now: new Date('2026-11-27T11:00:00') });
    expect(resultsOf([ok, bad]).get('0.1312.2').result).toBe('ok');
    expect(resultsOf([bad]).get('0.1312.2').result).toBe('fail');
    expect(resultsOf([]).size).toBe(0);
  });
  it('«Works» also works when the user deleted the kind «Good as it is»', () => {
    const cfg = removeArt(DEFAULT_KINDS, 'gutso');
    const e = worksEntry({ release: releaseOfNews(NEWS), text: 'ok', now, cfg });
    expect(e).not.toBeNull();
    expect(e.art).toBe('');
  });
});

describe('the list of all releases', () => {
  const rows = [
    { version: '0.3.0', test: ['a'] },
    { version: '0.2.0', test: ['a'] },
    { version: '0.1.0' },
  ];
  const results = new Map([['0.3.0', { result: 'ok' }]]);
  it('filters by answer', () => {
    expect(filterReleases(rows, { filter: 'open', results }).map((e) => e.version)).toEqual(['0.2.0']);
    expect(filterReleases(rows, { filter: 'ok', results }).map((e) => e.version)).toEqual(['0.3.0']);
    expect(filterReleases(rows, { filter: 'fail', results })).toEqual([]);
    expect(filterReleases(rows, { filter: 'all', results })).toHaveLength(3);
    expect(filterReleases(rows, { filter: 'you', forYou: [rows[1]] })).toEqual([rows[1]]);
  });
  it('finds a release by its PR number with or without # and pr', () => {
    expect(matchRelease(1830, ['1830'], 'a star')).toBe(true);
    expect(matchRelease(1830, ['#1830'], 'a star')).toBe(true);
    expect(matchRelease(1830, ['pr1830'], 'a star')).toBe(true);
    expect(matchRelease(1830, ['star', '1830'], 'a star')).toBe(true);
    expect(matchRelease(1830, ['1831'], 'a star')).toBe(false);
    expect(matchRelease(null, ['1830'], 'a star')).toBe(false);
  });
});

describe('the improvement order names the release', () => {
  it('a «Does not work» entry says release and PR', () => {
    const e = makeEntry({ art: 'fehler', text: 'no star', page: '#/', device: 'phone', width: 390, now, release: releaseOfNews(NEWS) });
    expect(buildOrder([e], '27.11.2026')).toMatch(/0\.1312\.2/);
    expect(buildOrder([e], '27.11.2026')).toMatch(/1830/);
  });
});
