import { describe, it, expect } from 'vitest';
import { PAGES, MAX_TILES, MAX_OWN, infoOf, allTips, tipOfDay, tipPlace, canRows, tilesOf, domainOf, setTipsOn, setTip, hideToday, addTip, removeTip, setCan, canShown, addLink, removeLink } from '../src/lib/pageinfo.js';
import DE from '../src/lib/i18n/de/index.js';

// «Inhalte Flow» IF1–IF3 (Noah 14.10.2026, mockups approved 04:32): tip of the day, fold, tiles.
const day = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

describe('the tip of the day', () => {
  it('stays the same all day and moves on the next day', () => {
    const a = tipOfDay(undefined, 'aktiv', '2026-10-14');
    expect(a).toBeTruthy();
    expect(tipOfDay(undefined, 'aktiv', '2026-10-14').id).toBe(a.id);
    expect(tipOfDay(undefined, 'aktiv', day('2026-10-14', 1)).id).not.toBe(a.id);
  });
  it('goes through all tips that are on', () => {
    const n = PAGES.aktiv.tips.length;
    const seen = new Set(Array.from({ length: n }, (_, i) => tipOfDay(undefined, 'aktiv', day('2026-10-14', i)).id));
    expect(seen.size).toBe(n);
  });
  it('× hides it for today only', () => {
    const i = hideToday(undefined, 'aktiv', '2026-10-14');
    expect(tipOfDay(i, 'aktiv', '2026-10-14')).toBeNull();
    expect(tipOfDay(i, 'aktiv', '2026-10-15')).toBeTruthy();
    expect(tipOfDay(i, 'meditation', '2026-10-14')).toBeTruthy();
  });
  it('a switched-off tip never comes; all off: no tip line', () => {
    let i;
    for (const x of PAGES.aktiv.tips.slice(1)) i = setTip(i, x.id, false);
    for (let k = 0; k < 6; k++) expect(tipOfDay(i, 'aktiv', day('2026-10-14', k)).id).toBe(PAGES.aktiv.tips[0].id);
    expect(tipPlace(i, 'aktiv', '2026-10-14')).toEqual({ n: 1, of: 1 });
    expect(tipOfDay(setTipsOn(i, false), 'aktiv', '2026-10-14')).toBeNull();
  });
  it('own tips join the list and can be deleted', () => {
    const i = addTip(undefined, 'aktiv', '  Water before the ride  ', 1);
    const own = allTips(i, 'aktiv').at(-1);
    expect(own).toMatchObject({ text: 'Water before the ride', own: true, on: true });
    expect(addTip(i, 'aktiv', '   ')).toEqual(infoOf(i));
    expect(allTips(removeTip(i, 'aktiv', own.id), 'aktiv').some((x) => x.own)).toBe(false);
  });
  it('a broken stored value falls back to the defaults', () => {
    expect(infoOf('x')).toEqual({ tipsOn: true, off: [], own: {}, gone: {}, canOff: {}, links: {} });
    expect(tipOfDay({ off: 'no', own: [] }, 'aktiv', '2026-10-14')).toBeTruthy();
  });
});

describe('the fold «What the app can do here»', () => {
  it('fills in the page address and can be hidden', () => {
    expect(canRows('meditation', '#/flow/act/med').every((r) => !r.href.includes('{base}'))).toBe(true);
    expect(canShown(undefined, 'aktiv')).toBe(true);
    expect(canShown(setCan(undefined, 'aktiv', false), 'aktiv')).toBe(false);
  });
});

describe('the tiles «Next»', () => {
  it('outside links carry their site name, inside links an app address', () => {
    for (const x of tilesOf(undefined, 'aktiv')) {
      if (x.own) continue;
      if (x.out) {
        expect(x.out).toMatch(/^https:\/\//);
        expect(x.domain).toBe(domainOf(x.out));
      } else expect(x.href).toMatch(/^#\//);
    }
  });
  it('an own link replaces the empty slot; at most MAX_TILES built-in tiles and MAX_OWN own links', () => {
    expect(tilesOf(undefined, 'meditation').some((x) => x.own)).toBe(true);
    const i = addLink(undefined, 'meditation', 'Calm music', 'example.org/music', 5);
    const tiles = tilesOf(i, 'meditation', { act: 'med' });
    expect(tiles.some((x) => x.own)).toBe(false);
    expect(tiles.at(-1)).toMatchObject({ title: 'Calm music', out: 'https://example.org/music', domain: 'example.org', mine: true });
    expect(tiles.find((x) => x.id === 'milestones').href).toBe('#/flow/milestones?act=med');
    let many = i;
    for (let k = 0; k < MAX_OWN; k++) many = addLink(many, 'aktiv', `L${k}`, `https://example.org/${k}`, 10 + k);
    expect(tilesOf(many, 'aktiv').length).toBe(MAX_TILES + MAX_OWN);
    expect(addLink(many, 'aktiv', 'one more', 'https://example.org/x', 99)).toBeNull();
    expect(ownCount(removeLink(i, 'meditation', tiles.at(-1).id))).toBe(0);
  });
  it('refuses addresses that are not web pages', () => {
    expect(addLink(undefined, 'aktiv', 'x', 'javascript:alert(1)')).toBeNull();
    expect(addLink(undefined, 'aktiv', 'x', '')).toBeNull();
  });
});

const ownCount = (i) => tilesOf(i, 'meditation').filter((x) => x.mine).length;

describe('German', () => {
  it('every built-in text has a German entry', () => {
    for (const p of Object.values(PAGES)) for (const s of [...p.tips.map((x) => x.text), ...p.can.flatMap((x) => [x.title, x.sub]), ...p.tiles.flatMap((x) => [x.title, x.sub])]) expect(DE[s], s).toBeTruthy();
  });
});
