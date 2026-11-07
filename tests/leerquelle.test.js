// «Leere Kachel sagt, woher der Wert kommt» (UI-Prüfung 07.11.2026, A3/I1): the rule behind ONE line instead of many empty tiles. Fictional keys.
import { describe, it, expect } from 'vitest';
import { leerQuelle, leerSumme } from '../src/lib/analyse/leerquelle.js';
import { SOURCE_PAGES } from '../src/lib/analyse/zahlweg.js';

const it_ = (key, src, empty = true) => ({ key, name: key, src, empty });

describe('empty tiles name the missing source', () => {
  const items = [it_('rhr', 'fitbit'), it_('sleep', 'fitbit'), it_('hrv', 'fitbit'), it_('kmw', 'strava'), it_('mood', 'check'), it_('readiness', 'body')];

  it('makes one group per source with a page of its own, the biggest first', () => {
    const g = leerQuelle(items, { fitbit: false, strava: false, check: false });
    expect(g.map((x) => [x.src, x.n])).toEqual([['fitbit', 3], ['strava', 1], ['check', 1]]);
    expect(g[0]).toEqual({ src: 'fitbit', name: 'Fitbit', href: '#/me/fitbit', n: 3, keys: ['rhr', 'sleep', 'hrv'], connected: false });
    expect(leerSumme(g)).toBe(5);
  });
  it('a connected source or an own calculation makes no group', () => {
    const g = leerQuelle(items, { fitbit: true });
    expect(g.map((x) => x.src)).toEqual(['strava', 'check']);
    expect(g.some((x) => x.src === 'body')).toBe(false);
  });
  it('a tile with a value does not count, and nothing connected-or-empty gives no line', () => {
    expect(leerQuelle([it_('rhr', 'fitbit', false)], {})).toEqual([]);
    expect(leerQuelle([], {})).toEqual([]);
    expect(leerQuelle(undefined, undefined)).toEqual([]);
    expect(leerSumme()).toBe(0);
  });
  it('ignores items without a key and sources it does not know', () => {
    expect(leerQuelle([{ src: 'fitbit', empty: true }, it_('x', 'nowhere')], {})).toEqual([]);
  });
  it('every group leads to a page of the app (a hash address)', () => {
    for (const src of Object.keys(SOURCE_PAGES)) {
      const [g] = leerQuelle([it_('k', src)], {});
      expect(g.href.startsWith('#/'), src).toBe(true);
    }
  });
  it('a tie is sorted by the source name, so the order does not jump', () => {
    const g = leerQuelle([it_('a', 'strava'), it_('b', 'fitbit')], {});
    expect(g.map((x) => x.name)).toEqual(['Fitbit', 'Strava']);
  });
});
