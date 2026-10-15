import { describe, it, expect } from 'vitest';
import { PAGES, contextOf, farOf, setKnowOn, infoOf, allTips, tipOfDay, tipPlace, canRows, setTipsOn, setTip, hideToday, addTip, removeTip, setCan, canShown, tipLink } from '../src/lib/pageinfo.js';
import DE from '../src/lib/i18n/de/index.js';

// «Inhalte Flow» IF1–IF3 (Noah 14.10.2026, mockups approved 04:32): tip of the day and fold; the tiles «Next» are SK (sk tests).
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
  it('goes through all tips that are on (not the «Passt zu heute» ones)', () => {
    const n = PAGES.aktiv.tips.filter((x) => x.kind !== 'today').length;
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
    i = setTip(i, 'today-heat', true);
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
    expect(infoOf('x')).toEqual({ tipsOn: true, knowOn: true, off: [], own: {}, gone: {}, canOff: {} });
    expect(tipOfDay({ off: 'no', own: [] }, 'aktiv', '2026-10-14')).toBeTruthy();
  });
});

describe('the fold «What the app can do here»', () => {
  it('fills in the page address and can be hidden', () => {
    expect(canRows('meditation', '#/flow/act/med').every((r) => !r.href.includes('{base}'))).toBe(true);
    expect(canShown(undefined, 'aktiv')).toBe(true);
    expect(canShown(setCan(undefined, 'aktiv', false), 'aktiv')).toBe(false);
  });
  it('own links from the first build drop out of the state (the tiles are SK now)', () => {
    expect('links' in infoOf({ links: { aktiv: [{ id: 'l1', url: 'https://example.org' }] } })).toBe(false);
  });
});

describe('German', () => {
  it('every built-in text has a German entry', () => {
    for (const p of Object.values(PAGES)) for (const s of [...p.tips.map((x) => x.text), ...p.can.flatMap((x) => [x.title, x.sub])]) expect(DE[s], s).toBeTruthy();
  });
});

describe('«Wusstest du» WD1–WD3', () => {
  const rest = (page) => PAGES[page].tips.filter((x) => x.kind !== 'today');
  it('knowledge is on at first (1a); «Only useful tips» leaves out the «Wusstest du» ones', () => {
    const seen = (i) => new Set(Array.from({ length: 30 }, (_, k) => tipOfDay(i, 'aktiv', day('2026-10-14', k)).kind));
    expect(seen(undefined).has('know')).toBe(true);
    expect(seen(setKnowOn(undefined, false))).toEqual(new Set(['tip']));
    expect(tipPlace(setKnowOn(undefined, false), 'aktiv', '2026-10-14').of).toBe(rest('aktiv').filter((x) => x.kind !== 'know').length);
  });
  it('a fitting «Passt zu heute» comes first, only on its day, and can be switched off', () => {
    const ctx = { heat: true, max: 31 };
    expect(tipOfDay(undefined, 'aktiv', '2026-07-18', ctx).id).toBe('today-heat');
    expect(tipPlace(undefined, 'aktiv', '2026-07-18', ctx)).toEqual({ n: 1, of: 1 });
    expect(tipOfDay(setTip(undefined, 'today-heat', false), 'aktiv', '2026-07-18', ctx).kind).not.toBe('today');
    for (let k = 0; k < 20; k++) expect(tipOfDay(undefined, 'aktiv', day('2026-10-14', k)).kind).not.toBe('today');
  });
  it('the kind of day: heat, cold, föhn, sauna, a long tour', () => {
    const T = '2026-07-18';
    expect(contextOf({ day: { min: 18, max: 31, rainMm: 0 } }, T)).toMatchObject({ heat: true, cold: false, foehn: false, max: 31 });
    expect(contextOf({ day: { min: 2, max: 9 } }, T).cold).toBe(true);
    expect(contextOf({ day: { min: 12, max: 22, rainMm: 0, windDir: 180, gust: 60 } }, T).foehn).toBe(true);
    expect(contextOf({ day: { min: 12, max: 22, rainMm: 4, windDir: 180, gust: 60 } }, T).foehn).toBe(false);
    expect(contextOf({ day: { min: 12, max: 22, rainMm: 0, windDir: 270, gust: 60 } }, T).foehn).toBe(false);
    expect(contextOf({ log: [{ day: T, actId: 'sauna' }] }, T).sauna).toBe(true);
    expect(contextOf({ log: [{ day: '2026-07-17', actId: 'sauna' }] }, T).sauna).toBe(false);
    expect(contextOf({ trips: [{ startDate: '2026-07-19', route: { km: 140 } }] }, T).long).toBe(true);
    expect(contextOf({ trips: [{ startDate: '2026-07-19', route: { km: 60 } }] }, T).long).toBe(false);
    expect(contextOf({}, T)).toMatchObject({ heat: false, cold: false, foehn: false, sauna: false, long: false, max: null });
  });
  it('around the Earth and up the Everest', () => {
    expect(farOf(8412, 96310)).toEqual({
      earth: { x: 0.2, pct: 20, fill: 8412 / 40075, next: 1, left: 31663 },
      everest: { x: 10.8, pct: 1088, fill: 96310 / 8849 - 10, next: 11, left: 1029 },
    });
    expect(farOf(50000, 0).earth).toMatchObject({ x: 1.2, next: 2, left: 30150 });
    expect(farOf(null, null)).toEqual({ earth: null, everest: null });
  });
});

describe('links at a tip (5a)', () => {
  const tip = (id) => Object.values(PAGES).flatMap((p) => p.tips).find((x) => x.id === id);
  it('a tip with a link opens a free site; the address follows the language', () => {
    expect(tipLink(tip('today-heat'), 'de')).toEqual({ href: 'https://www.meteoschweiz.admin.ch/', domain: 'meteoschweiz.admin.ch' });
    expect(tipLink(tip('today-heat'), 'en').domain).toBe('meteoswiss.admin.ch');
    expect(tipLink(tip('know-baspo')).domain).toBe('hepa.ch');
  });
  it('no link for a tip without one, an own tip or an unsafe address', () => {
    expect(tipLink(tip('aktiv-rolling'))).toBeNull();
    expect(tipLink({ own: true, link: 'meteo' })).toBeNull();
    expect(tipLink({ link: 'javascript:alert(1)' })).toBeNull();
    expect(tipLink({ link: 'http://example.org' })).toBeNull();
  });
  it('every built-in link is https', () => {
    for (const p of Object.values(PAGES)) for (const x of p.tips) if (x.link) expect(tipLink(x)?.href, x.id).toMatch(/^https:\/\//);
  });
});
