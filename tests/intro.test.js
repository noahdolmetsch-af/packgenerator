// «Einstieg» on top of a place (Noah 15.10.2026 «1a 2a 3a 4a»): open on the phone for the first 3 visits,
// open on the computer until folded, × and back, the tour offered once; the tip that fits the month and the
// «Did you know» with its source (pageinfo.js).
import { describe, it, expect } from 'vitest';
import { INTROS, OPEN_VISITS, introOf, visit, isOpen, setFold, hide, showAll, hiddenCount, isHidden, offerTour, setOffered } from '../src/lib/intro.js';
import { PAGES, tipOfDay, factOfDay, contextOf } from '../src/lib/pageinfo.js';
import { TOURS } from '../src/lib/tour.js';
import DE from '../src/lib/i18n/de/index.js';

const de = (k) => DE[k] ?? DE[k.replace(/\|[a-z]+$/, '')];
const visits = (n, place = 'aktiv') => Array.from({ length: n }).reduce((v) => visit(v, place), undefined);

describe('the words', () => {
  it('Active, Trips and Gear: three things, what to expect, a tour and tips, all in German', () => {
    expect(Object.keys(INTROS)).toEqual(['aktiv', 'touren', 'material']);
    for (const [place, x] of Object.entries(INTROS)) {
      expect(x.things, place).toHaveLength(3);
      expect(TOURS[x.tour], place).toBeTruthy();
      expect(PAGES[place]?.tips.length, place).toBeGreaterThan(2);
      for (const k of [x.name, x.title, x.expect, ...x.things.flatMap((y) => [y.title, y.text])]) expect(de(k), k).toBeTruthy();
      for (const tip of PAGES[place].tips) {
        expect(de(tip.text), tip.text).toBeTruthy();
        if (tip.source) expect(de(tip.source), tip.source).toBeTruthy();
        if (tip.button) expect(de(tip.button), tip.button).toBeTruthy();
      }
    }
  });
});

describe('open or one line (1a)', () => {
  it('phone: open on the first 3 visits, then one line', () => {
    expect(isOpen(visits(1), 'aktiv', true)).toBe(true);
    expect(isOpen(visits(OPEN_VISITS), 'aktiv', true)).toBe(true);
    expect(isOpen(visits(OPEN_VISITS + 1), 'aktiv', true)).toBe(false);
  });
  it('computer: open until folded; a fold or unfold you chose wins everywhere', () => {
    expect(isOpen(visits(9), 'aktiv', false)).toBe(true);
    expect(isOpen(setFold(visits(1), 'aktiv', true), 'aktiv', false)).toBe(false);
    expect(isOpen(setFold(visits(9), 'aktiv', false), 'aktiv', true)).toBe(true);
  });
  it('Material keeps «list first»: one line from the start, until you open it', () => {
    expect(INTROS.material.folded).toBe(true);
    expect(isOpen(visits(1, 'material'), 'material', false, true)).toBe(false);
    expect(isOpen(setFold(visits(1, 'material'), 'material', false), 'material', true, true)).toBe(true);
  });
  it('× takes it away, the Handbook brings all back', () => {
    const v = hide(hide(undefined, 'aktiv'), 'material');
    expect(isHidden(v, 'aktiv')).toBe(true);
    expect(hiddenCount(v)).toBe(2);
    expect(hiddenCount(showAll(v))).toBe(0);
  });
  it('the small tour is offered on the first visit, once', () => {
    expect(offerTour(visits(1, 'touren'), 'touren')).toBe(true);
    expect(offerTour(setOffered(visits(1, 'touren'), 'touren'), 'touren')).toBe(false);
    expect(offerTour(visits(2, 'touren'), 'touren')).toBe(false);
  });
  it('a broken stored value is made whole', () => {
    expect(introOf({ visits: { aktiv: -1, touren: 2 }, hidden: { aktiv: 'yes' }, fold: [] })).toEqual({ visits: { touren: 2 }, hidden: {}, fold: {}, offered: {} });
  });
});

describe('the tip and the «Did you know» (2a, 3a)', () => {
  it('the ski tip fits only in October and November and comes first then', () => {
    const oct = contextOf({}, '2026-10-15');
    expect(oct.month).toBe(10);
    expect(tipOfDay(undefined, 'aktiv', '2026-10-15', oct).id).toBe('aktiv-ski');
    const jun = contextOf({}, '2026-06-15');
    expect(tipOfDay(undefined, 'aktiv', '2026-06-15', jun).id).not.toBe('aktiv-ski');
  });
  it('a «Did you know» always has its source, never the tip of the day twice, off with the switch', () => {
    for (const place of ['aktiv', 'touren', 'material']) {
      const f = factOfDay(undefined, place, '2026-10-15');
      expect(f?.source, place).toBeTruthy();
    }
    const only = PAGES.touren.tips.filter((x) => x.source);
    expect(factOfDay(undefined, 'touren', '2026-10-15', only[0].id)).toBe(null);
    expect(factOfDay({ knowOn: false }, 'aktiv', '2026-10-15')).toBe(null);
  });
});
