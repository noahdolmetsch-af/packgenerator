// «Anpassen» (Noah 20.10.2026 «1a 2a 3a 4a 5a»): the rules of src/lib/anpassen.js and the nav parts that use them.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  empty,
  clean,
  byOrder,
  moved,
  partKey,
  setPartHidden,
  setPartName,
  setPartOrder,
  resetPage,
  withTitle,
  pageCfg,
  pageKeyOf,
  menuPlaces,
  setPlaceHidden,
  setPlaceOrder,
  setPlaceName,
  setTabHidden,
  setTabName,
  setStartTab,
  visibleTabs,
  changeCount,
  isAllEmpty,
  writeCfg,
  readCfg,
  resetCache,
  STORE_KEY,
  ALWAYS_SHOWN,
} from '../src/lib/anpassen.js';
import { PLACES, PLACE_TABS, placeHref, menuBar, shownTabs, BAR_PLACES } from '../src/lib/nav.js';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

beforeEach(() => {
  mem.clear();
  resetCache();
});

describe('Anpassen: order', () => {
  const items = ['a', 'b', 'c', 'd'].map((key) => ({ key }));
  it('keeps the app order without a choice', () => {
    expect(byOrder(items, []).map((x) => x.key)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('sorts by the chosen keys; a new item follows the one before it', () => {
    expect(byOrder(items, ['c', 'a', 'd']).map((x) => x.key)).toEqual(['c', 'a', 'b', 'd']);
  });
  it('moves one key', () => {
    expect(moved(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moved(['a', 'b', 'c'], 0, 5)).toEqual(['a', 'b', 'c']);
  });
});

describe('Anpassen: parts of a page', () => {
  it('a heading key leaves out numbers and signs', () => {
    expect(partKey('Offen (3)')).toBe('offen');
    expect(partKey('  Deine  Woche · 12 km ')).toBe('deine woche km');
  });
  it('hides, renames, sorts and goes back', () => {
    let c = empty();
    c = setPartHidden(c, 'trips:overview', 'offen', true);
    c = setPartName(c, 'trips:overview', 'touren', 'Meine Touren', 'Touren');
    c = setPartOrder(c, 'trips:overview', ['touren', 'offen']);
    c = withTitle(c, 'trips:overview', 'Touren');
    const p = pageCfg(c, 'trips:overview');
    expect(p.hide).toEqual(['offen']);
    expect(p.names.touren).toBe('Meine Touren');
    expect(p.order).toEqual(['touren', 'offen']);
    expect(p.title).toBe('Touren');
    expect(changeCount(c)).toBe(3);
    c = resetPage(c, 'trips:overview');
    expect(c.pages['trips:overview']).toBeUndefined();
    expect(isAllEmpty(c)).toBe(true);
  });
  it('an empty name or the app name goes back to the app name', () => {
    let c = setPartName(empty(), 'p', 'k', 'X', 'Orig');
    c = setPartName(c, 'p', 'k', '  ', 'Orig');
    expect(c.pages.p).toBeUndefined();
    c = setPartName(empty(), 'p', 'k', 'Orig', 'Orig');
    expect(c.pages.p).toBeUndefined();
  });
  it('the page key holds the tab', () => {
    expect(pageKeyOf('trips', 'overview')).toBe('trips:overview');
    expect(pageKeyOf('home', null)).toBe('home');
  });
});

describe('Anpassen: menu and tabs', () => {
  it('hides and sorts places; Heute always stays', () => {
    let c = setPlaceHidden(empty(), 'gear', true);
    c = setPlaceHidden(c, ALWAYS_SHOWN[0], true);
    c = setPlaceOrder(c, ['bikes', 'today']);
    const keys = menuPlaces(c, PLACES).map((p) => p.key);
    expect(keys).not.toContain('gear');
    expect(keys).toContain('today');
    expect(keys[0]).toBe('bikes');
    expect(menuPlaces(c, PLACES, { all: true })).toHaveLength(PLACES.length);
  });
  it('an own place name, empty goes back', () => {
    let c = setPlaceName(empty(), 'bikes', 'Velos und Teile', 'Velos');
    expect(c.menu.names.bikes).toBe('Velos und Teile');
    c = setPlaceName(c, 'bikes', '', 'Velos');
    expect(c.menu.names.bikes).toBeUndefined();
  });
  it('a hidden tab is gone unless you are on it; never all tabs hidden', () => {
    const tabs = PLACE_TABS.trips;
    let c = setTabHidden(empty(), 'trips', tabs[1].key, true);
    expect(visibleTabs(c, 'trips', tabs).map((x) => x.key)).not.toContain(tabs[1].key);
    expect(visibleTabs(c, 'trips', tabs, tabs[1].key).map((x) => x.key)).toContain(tabs[1].key);
    for (const x of tabs) c = setTabHidden(c, 'trips', x.key, true);
    expect(visibleTabs(c, 'trips', tabs)).toHaveLength(tabs.length);
  });
  it('hiding the start tab clears the start', () => {
    let c = setStartTab(empty(), 'trips', 'templates');
    c = setTabHidden(c, 'trips', 'templates', true);
    expect(c.tabs.trips.start).toBeNull();
    c = setTabName(c, 'trips', 'overview', 'Alle', 'Overview');
    expect(c.tabs.trips.names.overview).toBe('Alle');
  });
});

describe('Anpassen: kept on this device', () => {
  it('writes, reads and cleans broken data', () => {
    writeCfg(setPlaceHidden(empty(), 'gear', true));
    resetCache();
    expect(readCfg().menu.hide).toEqual(['gear']);
    mem.set(STORE_KEY, '{broken');
    resetCache();
    expect(isAllEmpty(readCfg())).toBe(true);
    expect(clean({ menu: { hide: ['today', 5, 'bikes'] }, pages: { x: { hide: 'no' } } })).toEqual({ ...empty(), menu: { hide: ['bikes'], order: [], names: {} } });
  });
  it('an empty choice leaves nothing in storage', () => {
    writeCfg(empty());
    expect(mem.has(STORE_KEY)).toBe(false);
  });
});

describe('Anpassen: the menu and the start tab in nav.js', () => {
  it('the bar leaves out a hidden place and follows the order', () => {
    writeCfg(setPlaceOrder(setPlaceHidden(empty(), 'week', true), ['bikes', 'today']));
    const keys = menuBar().map((p) => p.key);
    expect(keys).not.toContain('week');
    expect(keys[0]).toBe('bikes');
    expect(keys.length).toBe(BAR_PLACES.length - 1);
  });
  it('a place opens at its start tab', () => {
    const trips = PLACES.find((p) => p.key === 'trips');
    const tpl = PLACE_TABS.trips.find((x) => x.key === 'templates');
    writeCfg(setStartTab(empty(), 'trips', 'templates'));
    expect(placeHref(trips, null)).toBe(tpl.href);
    expect(placeHref(trips, 'trips')).toBe(tpl.href);
  });
  it('without a choice a place opens as before', () => {
    const trips = PLACES.find((p) => p.key === 'trips');
    expect(placeHref(trips, null)).toBe(trips.href);
    expect(shownTabs('trips').map((x) => x.key)).toEqual(PLACE_TABS.trips.map((x) => x.key));
  });
  it('a hidden first tab: the place opens at the next one', () => {
    const trips = PLACES.find((p) => p.key === 'trips');
    writeCfg(setTabHidden(empty(), 'trips', PLACE_TABS.trips[0].key, true));
    expect(placeHref(trips, null)).toBe(PLACE_TABS.trips[1].href);
  });
});
