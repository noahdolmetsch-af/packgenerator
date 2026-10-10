// v0.78.0 «Fünf Orte» 2 (Noah 10.10.2026, O2.2a, O2.3a, O2.6a): the last tab per place, swiping to the
// next tab and the old addresses. Pure functions; localStorage is a small stand-in.
import { describe, it, expect, beforeEach } from 'vitest';
import { PLACES, PLACE_TABS, placeHref, keepTab, lastTab, tabStep, redirectOf, pageOf } from '../src/lib/nav.js';

const store = new Map();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
});
const place = (key) => PLACES.find((p) => p.key === key);

describe('the last tab of each place (O2.2a)', () => {
  it('a place opens at the tab opened last there', () => {
    expect(placeHref(place('bikes'), 'trips')).toBe(PLACE_TABS.bikes[0].href);
    keepTab('bikes', 'care');
    expect(lastTab('bikes')?.key).toBe('care');
    expect(placeHref(place('bikes'), 'trips')).toBe('#/bikes?tab=care');
  });

  it('a tap on the place you are on goes to its first tab', () => {
    keepTab('bikes', 'care');
    expect(placeHref(place('bikes'), 'bikes')).toBe(PLACE_TABS.bikes[0].href);
  });

  it('a place without tabs keeps its address; an unknown tab is forgotten', () => {
    expect(placeHref(place('today'), 'bikes')).toBe('#/');
    store.set('nav.tab.gear', 'gone');
    expect(placeHref(place('gear'), 'today')).toBe(PLACE_TABS.gear[0].href);
  });
});

describe('swiping to the next tab (O2.3a)', () => {
  it('goes one tab on, or back, and stops at the ends', () => {
    const tabs = PLACE_TABS.bikes;
    expect(tabStep('bikes', tabs[0].href, 1)?.key).toBe(tabs[1].key);
    expect(tabStep('bikes', tabs[1].href, -1)?.key).toBe(tabs[0].key);
    expect(tabStep('bikes', tabs[0].href, -1)).toBe(null);
    expect(tabStep('bikes', tabs.at(-1).href, 1)).toBe(null);
    expect(tabStep('trips', '#/pack', 1)).toBe(null); // a trip is no tab
  });
});

describe('old addresses (O2.6a)', () => {
  it('#/care leads to Velos › Pflege and keeps the chosen bike', () => {
    expect(redirectOf('#/care')).toEqual({ hash: '#/bikes?tab=care', spot: '', old: '#/care' });
    expect(redirectOf('#/care?bike=b1&tab=x')).toEqual({ hash: '#/bikes?tab=care&bike=b1', spot: '', old: '#/care' });
    expect(pageOf('#/bikes?tab=care', true)).toBe('care');
  });

  it('every other address stays', () => {
    for (const h of ['#/', '#/bikes', '#/bikes?tab=care', '#/gear', '#/trips', '#/careful']) expect(redirectOf(h)).toBe(null);
  });
});

describe('hobby pages 1: the tab «Aktivität» in Aktiv', () => {
  it('lights «Aktivität» on the tiles, milestones and an editor opened from a tile; «Ziele» elsewhere', async () => {
    const { tabOf } = await import('../src/lib/nav.js');
    for (const h of ['#/flow/activity', '#/flow/milestones?act=meditation', '#/flow/act/meditation', '#/flow/edit/yoga?from=activity']) expect(tabOf('active', h), h).toBe('activity');
    for (const h of ['#/flow/goals', '#/flow/edit/yoga', '#/flow/new']) expect(tabOf('active', h), h).toBe('goals');
    expect(tabOf('active', '#/flow')).toBe('today');
  });
});
