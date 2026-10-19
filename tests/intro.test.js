// «Einstieg» on top of a place (Noah 15.10.2026 «1a 2a 3a 4a»): open on the phone for the first 3 visits,
// open on the computer until folded, × and back, the tour offered once; the tip that fits the month and the
// «Did you know» with its source (pageinfo.js).
import { describe, it, expect } from 'vitest';
import { INTROS, OPEN_VISITS, introOf, visit, isOpen, setFold, hide, showAll, hiddenCount, isHidden, offerTour, setOffered } from '../src/lib/intro.js';
import { PAGES, tipOfDay, factOfDay, contextOf } from '../src/lib/pageinfo.js';
import { TOURS } from '../src/lib/tour.js';
import DE from '../src/lib/i18n/de/index.js';

// exactly as t() looks it up: a key with |suffix needs its own German entry
const de = (k) => DE[k];
const visits = (n, place = 'aktiv') => Array.from({ length: n }).reduce((v) => visit(v, place), undefined);

const PLACES = ['aktiv', 'touren', 'material', 'velos'];
describe('the words', () => {
  it('the four places first, then the pages below them (4a)', () => {
    expect(Object.keys(INTROS).slice(0, 4)).toEqual(PLACES);
    expect(Object.keys(INTROS).length).toBeGreaterThan(12);
  });
  it('three things, what to expect and tips, all in German; a tour on each place, none on a page', () => {
    for (const [place, x] of Object.entries(INTROS)) {
      expect(x.things, place).toHaveLength(3);
      if (x.page) expect(x.tour, place).toBeUndefined();
      else expect(TOURS[x.tour], place).toBeTruthy();
      expect(PAGES[place]?.tips.length, place).toBeGreaterThan(2);
      for (const k of [x.name, x.title, x.expect, ...x.things.flatMap((y) => [y.title, y.text])]) expect(de(k), k).toBeTruthy();
      for (const y of x.things) if (y.href) expect(y.href, place).toMatch(/^#\//);
      for (const tip of PAGES[place].tips) {
        expect(de(tip.text), tip.text).toBeTruthy();
        if (tip.source) expect(de(tip.source), tip.source).toBeTruthy();
        if (tip.button) expect(de(tip.button), tip.button).toBeTruthy();
      }
    }
  });
  it('the tip of a page never sends you to the page you are on', () => {
    const own = { goals: '#/flow/goals', blocks: '#/blocks', templates: '#/pack/templates', debrief: '#/debrief', past: '#/past', velos: '#/bikes' };
    for (const [place, href] of Object.entries(own)) for (const tip of PAGES[place].tips) expect(tip.href ?? '', tip.id).not.toBe(href);
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
    for (const place of [...PLACES, 'meditation', 'training', 'goals', 'activity', 'rest', 'week', 'templates', 'debrief', 'wardrobe', 'past', 'pflege', 'workshop', 'ausstattung', 'einkauf', 'weekplan']) {
      const f = factOfDay(undefined, place, '2026-10-15');
      expect(f?.source, place).toBeTruthy();
    }
    const only = PAGES.touren.tips.filter((x) => x.source);
    expect(factOfDay(undefined, 'touren', '2026-10-15', only[0].id)).toBe(null);
    expect(factOfDay({ knowOn: false }, 'aktiv', '2026-10-15')).toBe(null);
  });
  it('in the Einstieg the tip of the day is never the «Did you know», so both boxes show every day', () => {
    for (const place of Object.keys(INTROS)) {
      for (let k = 0; k < 14; k++) {
        const day = `2026-06-${String(k + 1).padStart(2, '0')}`;
        const tip = tipOfDay(undefined, place, day, {}, { sourced: false });
        expect(tip?.source, `${place} ${day}`).toBeFalsy();
        if (PAGES[place].tips.some((x) => x.source)) expect(factOfDay(undefined, place, day, tip?.id)?.source, place).toBeTruthy();
      }
    }
  });
});
