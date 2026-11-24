// «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026): the card «N Neuheiten seit …» counts every line of the news since a version
// and the window groups them by place (src/lib/know/neuseit.js, neuseitOrte.js).
import { describe, it, expect } from 'vitest';
import { fromOf, sinceInfo, sinceFormat, dayWord, STRIP } from '../src/lib/know/neuseit.js';
import { groupByPlace, placeOfLine, placeLabel, ELSEWHERE } from '../src/lib/know/neuseitOrte.js';

const rows = [
  { version: '0.5.0', date: '2026-11-23', np: 2, ns: 1, id: 'e', bilder: [{ line: 1, vorher: true }] },
  { version: '0.4.0', date: '2026-11-22', np: 1, ns: 0, id: 'd', bilder: [{ line: 1, vorher: false }] },
  { version: '0.3.0', date: '2026-11-21', np: 1, ns: 2 },
  { version: '0.2.0', date: '2026-11-20', np: 4, ns: 0, id: 'b', bilder: [{ line: 1 }] },
];

describe('fromOf', () => {
  it('the version you looked at, else the one before the last update, else none', () => {
    expect(fromOf('0.3.0', { from: '0.1.0' })).toBe('0.3.0');
    expect(fromOf(null, { from: '0.1.0' })).toBe('0.1.0');
    expect(fromOf(null, null)).toBe(null);
  });
});

describe('sinceInfo', () => {
  it('counts every line (points and small things) of the versions after `from`', () => {
    const i = sinceInfo(rows, '0.2.0');
    expect(i.n).toBe(3 + 1 + 3);
    expect(i.versions).toBe(3);
    expect(i.since).toBe('2026-11-20');
  });
  it('the strip has the first picture of the newest versions, at most STRIP', () => {
    const i = sinceInfo(rows, '0.1.0');
    expect(i.pics.map((p) => p.id)).toEqual(['e', 'd', 'b']);
    expect(i.pics.length).toBeLessThanOrEqual(STRIP);
    expect(i.pics[0]).toEqual({ id: 'e', line: 1, vorher: true });
  });
  it('nothing new, or nothing to count from: n is 0', () => {
    expect(sinceInfo(rows, '0.5.0').n).toBe(0);
    expect(sinceInfo(rows, null).n).toBe(0);
  });
});

describe('sinceFormat', () => {
  it('weekday within six days, else day and month', () => {
    expect(sinceFormat('2026-11-20', '2026-11-23')).toEqual({ weekday: 'long' });
    expect(sinceFormat('2026-11-01', '2026-11-23')).toEqual({ day: 'numeric', month: 'short' });
    expect(sinceFormat(null, '2026-11-23')).toBe(null);
  });
});

describe('dayWord', () => {
  it('today and yesterday get a word, every other day none (a Tuesday card on a Tuesday must not say «since Tuesday»)', () => {
    expect(dayWord('2026-11-24', '2026-11-24')).toBe('today');
    expect(dayWord('2026-11-23', '2026-11-24')).toBe('yesterday');
    expect(dayWord('2026-11-22', '2026-11-24')).toBe(null);
    expect(dayWord(null, '2026-11-24')).toBe(null);
  });
});

describe('groupByPlace', () => {
  const e = (version, points, small = [], extra = {}) => ({ version, date: '2026-11-23', points, small, ...extra });
  it('groups the lines of the versions after `from` by the place of their target, largest first, no place last', () => {
    const list = [
      e('0.3.0', [{ text: 'a', go: { href: '#/wetter', where: 'w' } }, { text: 'b', go: null }], [{ box: 'new', text: 'c', go: { href: '#/wetter', where: 'w' } }], { id: 'x', bilder: [{ line: 1, vorher: false }] }),
      e('0.2.0', [{ text: 'd', go: { href: '#/bikes', where: 'w' } }]),
      e('0.1.0', [{ text: 'old', go: { href: '#/bikes', where: 'w' } }]),
    ];
    const g = groupByPlace(list, '0.1.0');
    expect(g.map((x) => [x.key, x.items.length])).toEqual([['weather', 2], ['bikes', 1], [ELSEWHERE, 1]]);
    expect(g[0].items[0]).toMatchObject({ id: 'x', line: 1, bild: { vorher: false } });
    expect(g[0].items[1].line).toBe(3); // the small thing counts after the main points, like the picture files
    expect(g[0].items[1].bild).toBe(null);
  });
  it('a line with an address finds its place; one without goes to «elsewhere»', () => {
    expect(placeOfLine({ text: 'x', go: { href: '#/trips', where: 'w' } })).toBe('trips');
    expect(placeOfLine({ text: 'x', go: null })).toBe(ELSEWHERE);
  });
  it('Me has its own name and no two groups share a name', () => {
    expect(placeLabel('me')).toBe('Me|place');
    const list = [{ version: '0.2.0', date: '2026-11-23', points: [{ text: 'a', go: { href: '#/me/news', where: 'w' } }, { text: 'b', go: null }], small: [] }];
    const labels = groupByPlace(list, '0.1.0').map((x) => x.label);
    expect(labels).toEqual(['Me|place', 'More places|news']);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
