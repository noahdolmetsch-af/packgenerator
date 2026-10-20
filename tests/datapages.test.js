// «Datenseiten wie am Garmin» (Noah 20.10.2026): the pure part of the data pages on the live map.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import {
  PAGES_KEY,
  MAX_UNITS,
  MAX_PAGES,
  EXTRA_FIELDS,
  CHARTS,
  LAYOUTS,
  LAYOUT_NS,
  defaultPages,
  cleanPages,
  pageName,
  addPage,
  renamePage,
  deletePage,
  insertPage,
  movePage,
  updatePage,
  unitsOf,
  roomFor,
  toggleField,
  toggleChart,
  removeItem,
  moveItem,
  setBig,
  setMap,
  layoutOf,
  layoutFits,
  applyLayout,
  gridOf,
  fieldCatalogue,
  cleanMaxHr,
  cleanFtp,
  hrZones,
  powerZones,
  HR_ZONE_PCT,
  zoneIndex,
  timeInZones,
  zoneBars,
  downsample,
  rangeOf,
  pathOf,
  curveStats,
  profileStats,
  mmss,
} from '../src/lib/live/datapages.js';
import { ZONE_PCT } from '../src/lib/review/werte.js';
import { POWER_ZONE_SHARES } from '../src/lib/training.js';
import { LIVE_TILES } from '../src/lib/live/livemap.js';
import DE from '../src/lib/i18n/de/index.js';

const page = (items, extra = {}) => ({ id: 'x', name: 'Test', std: '', map: false, items, ...extra });
const f = (key, big = false) => ({ f: key, big });

describe('the ready pages', () => {
  it('three like Garmin, with their own German names, within the places', () => {
    const d = defaultPages();
    expect(PAGES_KEY).toBe('live-pages');
    expect(d.pages.map((p) => p.std)).toEqual(['Ride|page', 'Power|page', 'Climb|page']);
    expect(d.pages.map((p) => DE[p.std])).toEqual(['Fahrt', 'Leistung', 'Steigung']);
    for (const p of d.pages) {
      expect(p.name).toBe('');
      expect(unitsOf(p.items)).toBeLessThanOrEqual(MAX_UNITS);
      expect(p.items.length).toBeGreaterThan(0);
    }
    expect(cleanPages(d)).toEqual(d);
  });
  it('every field of the ready pages is in the live catalogue or this module', () => {
    const keys = new Set([...fieldCatalogue(LIVE_TILES).map((x) => x.key), 'hr', 'power', 'cadence', 'gain', 'max', 'stops', 'total']);
    for (const p of defaultPages().pages) for (const it of p.items) if (it.f) expect(keys.has(it.f), it.f).toBe(true);
  });
  it('the extra fields and charts have German labels', () => {
    for (const x of [...EXTRA_FIELDS, ...CHARTS]) expect(DE[x.label], x.label).toBeTruthy();
  });
  it('the catalogue adds the extra fields once', () => {
    const cat = fieldCatalogue([{ key: 'done', label: 'km done' }, { key: 'battery', label: 'Battery' }]);
    expect(cat.filter((x) => x.key === 'battery')).toHaveLength(1);
    expect(cat[0].key).toBe('done');
    expect(cat.some((x) => x.key === 'upToTop' && x.route)).toBe(true);
  });
});

describe('the stored value made safe', () => {
  it('nothing or garbage → the ready pages; an empty list stays empty', () => {
    expect(cleanPages(null)).toEqual(defaultPages());
    expect(cleanPages('x')).toEqual(defaultPages());
    expect(cleanPages({ pages: 'no' })).toEqual(defaultPages());
    expect(cleanPages({ pages: [] })).toEqual({ v: 1, maxHr: null, ftp: null, pages: [] });
  });
  it('drops doubles, unknown charts, empty pages and too many places', () => {
    const items = [f('speed'), f('speed'), { c: 'power' }, { c: 'power' }, { c: 'nope' }, 'x', { f: '1bad' }, ...Array.from({ length: 12 }, (_, i) => f(`k${i}`))];
    const out = cleanPages({ pages: [{ id: 'a', name: '  My page  ', items }, { id: 'b', items: [] }] });
    expect(out.pages).toHaveLength(1);
    expect(out.pages[0].name).toBe('My page');
    expect(out.pages[0].items.slice(0, 2)).toEqual([f('speed'), { c: 'power' }]);
    expect(unitsOf(out.pages[0].items)).toBe(MAX_UNITS);
  });
  it('doubled ids get a new one, a typed name shows instead of the ready one, at most MAX_PAGES', () => {
    const many = Array.from({ length: 14 }, () => ({ id: 'same', items: [f('done')] }));
    const out = cleanPages({ pages: many });
    expect(out.pages).toHaveLength(MAX_PAGES);
    expect(new Set(out.pages.map((p) => p.id)).size).toBe(MAX_PAGES);
    const named = cleanPages({ pages: [{ id: 'r', name: 'Bummeln', std: 'Ride|page', items: [f('done')] }, { id: 's', std: 'Evil<b>', items: [f('done')] }] });
    expect(named.pages[0]).toMatchObject({ name: 'Bummeln', std: 'Ride|page' });
    expect(pageName(named.pages[0])).toBe('Bummeln');
    expect(named.pages[1]).toMatchObject({ name: '', std: '' });
    expect(pageName(named.pages[1], undefined, 1)).toBe('Page 3');
  });
  it('max heart rate and FTP only in a sensible range', () => {
    expect(cleanPages({ pages: [], maxHr: '185', ftp: 240.4 })).toMatchObject({ maxHr: 185, ftp: 240 });
    expect(cleanPages({ pages: [], maxHr: 20, ftp: 9000 })).toMatchObject({ maxHr: null, ftp: null });
    expect(cleanMaxHr('')).toBeNull();
    expect(cleanFtp(null)).toBeNull();
  });
});

describe('pages: add, rename, delete, put back, move', () => {
  const tr = (s) => `de:${s}`;
  it('a ready page shows its name through t() until renamed; a typed name stays as typed', () => {
    const d = defaultPages();
    expect(pageName(d.pages[0])).toBe('Ride');
    expect(pageName(d.pages[0], tr)).toBe('de:Ride|page');
    const r = renamePage(d, 'ride', '  Fahrt mit Anna  ');
    expect(pageName(r.pages[0], tr)).toBe('Fahrt mit Anna');
    expect(pageName(renamePage(r, 'ride', '').pages[0], tr)).toBe('de:Ride|page');
  });
  it('an own page keeps its name when the new one is empty', () => {
    const s = addPage(defaultPages(), { name: 'Nacht', id: 'n1' });
    expect(renamePage(s, 'n1', ' ').pages.at(-1).name).toBe('Nacht');
    expect(renamePage(s, 'n1', 'x'.repeat(60)).pages.at(-1).name).toHaveLength(40);
  });
  it('add: four fields, «Page n» by its place until named, at most MAX_PAGES', () => {
    const s = addPage(defaultPages(), { id: 'n1' });
    expect(s.pages.at(-1)).toEqual({ id: 'n1', name: '', std: '', map: false, items: [f('speed'), f('done'), f('moving'), f('clock')] });
    expect(pageName(s.pages[3], (k, v) => `${k}/${v.n}`, 3)).toBe('Page {n}/5');
    let full = defaultPages();
    for (let i = 0; i < 12; i++) full = addPage(full, { name: `P${i}` });
    expect(full.pages).toHaveLength(MAX_PAGES);
    expect(new Set(full.pages.map((p) => p.id)).size).toBe(MAX_PAGES);
  });
  it('delete and put back at the same place', () => {
    const d = defaultPages();
    const { set, page, at } = deletePage(d, 'power');
    expect(set.pages.map((p) => p.id)).toEqual(['ride', 'climb']);
    expect(at).toBe(1);
    expect(insertPage(set, page, at)).toEqual(d);
    expect(deletePage(d, 'nope')).toEqual({ set: d, page: null, at: -1 });
    // the id was taken meanwhile: a new one
    const again = insertPage(d, d.pages[0], 0);
    expect(again.pages[0].id).not.toBe('ride');
  });
  it('move and change one page', () => {
    const d = defaultPages();
    expect(movePage(d, 0, 2).pages.map((p) => p.id)).toEqual(['power', 'climb', 'ride']);
    expect(movePage(d, 0, 5)).toBe(d);
    expect(updatePage(d, 'climb', (p) => setMap(p, false)).pages[2].map).toBe(false);
  });
});

describe('fields and charts of a page', () => {
  it('on and off; at least one item stays; a chart needs two places', () => {
    let p = page([f('done')]);
    p = toggleField(p, 'speed');
    expect(p.items).toEqual([f('done'), f('speed')]);
    p = toggleChart(p, 'hr');
    p = toggleField(p, 'clock');
    expect(p.items).toEqual([f('done'), f('speed'), f('clock'), { c: 'hr' }]); // new fields before the charts
    expect(toggleField(page([f('done')]), 'done').items).toEqual([f('done')]);
    expect(toggleChart(p, 'nope')).toBe(p);
    const nine = page(Array.from({ length: 9 }, (_, i) => f(`k${i}`)));
    expect(roomFor(nine, 'field')).toBe(true);
    expect(roomFor(nine, 'chart')).toBe(false);
    expect(toggleChart(nine, 'hr')).toBe(nine);
    expect(toggleField(toggleField(nine, 'a'), 'b').items).toHaveLength(10);
  });
  it('remove, move, big or small', () => {
    const p = page([f('a'), f('b'), { c: 'hr' }]);
    expect(removeItem(p, 1).items).toEqual([f('a'), { c: 'hr' }]);
    expect(removeItem(page([f('a')]), 0).items).toEqual([f('a')]);
    expect(moveItem(p, 2, 0).items[0]).toEqual({ c: 'hr' });
    expect(setBig(p, 0, true).items[0]).toEqual(f('a', true));
    expect(setBig(p, 2, true)).toBe(p);
    const full = page(Array.from({ length: 10 }, (_, i) => f(`k${i}`)));
    expect(setBig(full, 0, true)).toBe(full);
  });
});

describe('the ready grids and free arrangement', () => {
  it('1, 2, 3, 4, 6, 8, 10 fields like Garmin, each within the places', () => {
    expect(LAYOUT_NS).toEqual([1, 2, 3, 4, 6, 8, 10]);
    for (const n of LAYOUT_NS) {
      expect(LAYOUTS[n]).toHaveLength(n);
      expect(LAYOUTS[n].reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(MAX_UNITS);
    }
  });
  it('which grid the fields match, else free', () => {
    expect(layoutOf([f('a', true)])).toBe(1);
    expect(layoutOf([f('a', true), f('b'), f('c'), { c: 'hr' }])).toBe(3);
    expect(layoutOf([f('a'), f('b'), f('c'), f('d')])).toBe(4);
    expect(layoutOf([f('a'), f('b', true)])).toBe('free');
    expect(layoutOf(defaultPages().pages[0].items)).toBe(6);
  });
  it('applying a grid keeps the first fields, fills up with unused ones and keeps the charts', () => {
    const p = page([f('hr'), { c: 'power' }, f('done')]);
    const four = applyLayout(p, 4, ['done', 'speed', 'clock']);
    expect(four.items).toEqual([f('hr'), f('done'), f('speed'), f('clock'), { c: 'power' }]);
    expect(layoutOf(four.items)).toBe(4);
    expect(applyLayout(p, 1).items).toEqual([f('hr', true), { c: 'power' }]);
    // 10 fields and a chart do not fit: nothing changes
    expect(layoutFits(p, 10)).toBe(false);
    expect(applyLayout(p, 10)).toBe(p);
    expect(applyLayout(page([f('a')]), 10).items).toHaveLength(10);
  });
  it('the cells: a small field alone in its row takes the whole row', () => {
    const { cells, rows } = gridOf([f('a'), f('b'), f('c'), { c: 'hr' }, f('d', true), f('e')]);
    expect(cells.map((c) => [c.item.f ?? c.item.c, c.span])).toEqual([['a', 1], ['b', 1], ['c', 2], ['hr', 2], ['d', 2], ['e', 2]]);
    expect(rows).toBe(5);
    expect(gridOf([f('a'), f('route'), f('b')], (it) => it.f !== 'route').cells.map((c) => c.span)).toEqual([1, 1]);
    expect(gridOf([])).toEqual({ cells: [], rows: 0 });
  });
});

describe('zones (observation only)', () => {
  it('heart rate: 5 zones of 10 % from 50 % of the max, the same upper ends as the app', () => {
    expect(HR_ZONE_PCT.slice(1, 5)).toEqual(ZONE_PCT);
    expect(hrZones(200)).toEqual([
      { z: 1, from: 100, to: 120 },
      { z: 2, from: 121, to: 140 },
      { z: 3, from: 141, to: 160 },
      { z: 4, from: 161, to: 180 },
      { z: 5, from: 181, to: 200 },
    ]);
    expect(hrZones(null)).toBeNull();
  });
  it('power: the 7 Coggan zones of Training from the FTP', () => {
    const z = powerZones(200);
    expect(z).toHaveLength(7);
    expect(z.slice(0, 6).map((x) => x.to)).toEqual(POWER_ZONE_SHARES.map((p) => Math.round(200 * p)));
    expect(z[0]).toEqual({ z: 1, from: 0, to: 110 });
    expect(z[6]).toEqual({ z: 7, from: 301, to: null });
    expect(powerZones(0)).toBeNull();
  });
  it('the zone of a value; below 50 % counts to Z1, above the max to Z5', () => {
    const z = hrZones(200);
    expect([60, 120, 121, 179, 181, 230].map((v) => zoneIndex(v, z))).toEqual([0, 0, 1, 3, 4, 4]);
    expect(zoneIndex(500, powerZones(200))).toBe(6);
  });
  it('time in zone: each sample until the next, pauses capped', () => {
    const z = hrZones(200);
    const s = [[0, 110], [5, 110], [10, 150], [15, 150], [600, 190], [605, 190]];
    expect(timeInZones(s, z)).toEqual([10, 0, 35, 0, 5]);
    expect(timeInZones([], z)).toEqual([0, 0, 0, 0, 0]);
    expect(timeInZones(s, null)).toBeNull();
    expect(zoneBars([10, 0, 30])).toEqual([{ s: 10, h: 1 / 3, pct: 25 }, { s: 0, h: 0, pct: 0 }, { s: 30, h: 1, pct: 75 }]);
    expect(zoneBars([0, 0])).toEqual([{ s: 0, h: 0, pct: 0 }, { s: 0, h: 0, pct: 0 }]);
  });
});

describe('chart data', () => {
  const long = Array.from({ length: 1000 }, (_, i) => [i * 5, i % 2 ? 200 : 100]);
  it('downsampling keeps at most n averaged points in time order', () => {
    const d = downsample(long, 100);
    expect(d).toHaveLength(100);
    expect(d[0]).toEqual([22.5, 150]);
    expect(d.every((p, i) => !i || p[0] > d[i - 1][0])).toBe(true);
    expect(downsample([[0, 1], [5, NaN], [10, 2]], 100)).toEqual([[0, 1], [10, 2]]);
  });
  it('the range has room; power starts at 0', () => {
    expect(rangeOf([[0, 100], [1, 200]])).toEqual({ lo: 92, hi: 208 });
    expect(rangeOf([[0, 100], [1, 200]], 0)).toEqual({ lo: 0, hi: 216 });
    expect(rangeOf([])).toBeNull();
  });
  it('a path, broken at gaps, and an area for the profile', () => {
    expect(pathOf([[0, 0], [10, 10]], { w: 100, h: 50, floor: 0 })).toMatch(/^M0 50L100 /);
    expect(pathOf([[0, 0], [10, 10], [200, 5]], { gap: 60 }).match(/M/g)).toHaveLength(2);
    expect(pathOf([[0, 400], [2, 500]], { area: true, w: 100, h: 50 })).toMatch(/^M0 50L0 .*L100 50Z$/);
    expect(pathOf([[0, 1]])).toBe('');
  });
  it('numbers under the curves and the profile', () => {
    expect(curveStats([[0, 100], [5, 200], [10, 150]])).toEqual({ now: 150, avg: 150, max: 200 });
    expect(curveStats([])).toBeNull();
    expect(profileStats([[10, 500], [11, 560], [12, 540], [13.5, 600]])).toEqual({ up: 120, down: 20, km: 3.5 });
    expect(profileStats([[0, 1]])).toBeNull();
    expect([45, 725, 3725].map(mmss)).toEqual(['0:45', '12:05', '1:02:05']);
  });
});
