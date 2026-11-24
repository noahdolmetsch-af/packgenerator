import { describe, it, expect } from 'vitest';
import { arrange, countsOf, gearContext, saysGear, ORDER, FILTERS, TOPICS } from '../src/lib/suche/ordnung.js';
import { isUnknown } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

const g = (kind, n = 2, more = 0) => ({ kind, name: kind, rows: Array.from({ length: n }, (_, i) => ({ id: `${kind}${i}`, title: `${kind} ${i}` })), more });

const w = (kind, n = 1) => ({ kind, name: kind, rows: Array.from({ length: n }, (_, i) => ({ id: `${kind}w${i}`, title: `${kind} weak ${i}`, weak: true })), more: 0 });
const names = (r) => r.groups.map((x) => x.kind);

describe('Klügere Suche: Reihenfolge, starke und schwache Treffer, Material', () => {
  it('puts pages first and gear last, with gear folded into one line with its first names', () => {
    const r = arrange([g('gear', 3), g('trip'), g('page'), g('bike')], { q: 'jacke' });
    expect(names(r)).toEqual(['page', 'trip', 'bike']);
    expect(r.gear).toEqual({ n: 3, names: ['gear 0', 'gear 1', 'gear 2'] });
  });
  it('counts the rows that did not fit as well', () => {
    expect(arrange([g('gear', 6, 4), g('page')], { q: 'x' }).gear.n).toBe(10);
  });
  it('a weak hit (only in running text) does not fold the gear away, and stands last, quieter', () => {
    const r = arrange([g('gear', 3), w('log')], { q: 'trikot' });
    expect(names(r)).toEqual(['gear']);
    expect(r.gear).toBeNull();
    expect(r.weak).toEqual([expect.objectContaining({ id: 'logw0', from: 'log', fromKind: 'log' })]);
    // a strong hit does fold it
    expect(arrange([g('gear', 3), g('page'), w('log')], { q: 'trikot' }).gear).not.toBeNull();
  });
  it('weak gear hits (only in a note) are weak, not gear', () => {
    const r = arrange([{ kind: 'gear', name: 'Gear', rows: [{ id: 'a', title: 'Zelt', weak: true }], more: 0 }, g('page')], { q: 'x' });
    expect(r.gear).toBeNull();
    expect(names(r)).toEqual(['page']);
    expect(r.weak).toHaveLength(1);
  });
  it('keeps gear in front on the gear pages, when learned, with the button and with a word like «Teil»', () => {
    const all = [g('page'), g('gear'), g('trip')];
    expect(names(arrange(all, { context: true, q: 'x' }))).toEqual(['gear', 'page', 'trip']);
    expect(names(arrange(all, { learned: true, q: 'x' }))[0]).toBe('gear');
    expect(arrange(all, { q: 'teile unter 100' }).groups[0].kind).toBe('gear');
    expect(names(arrange(all, { filter: 'gear', q: 'x' }))).toEqual(['gear']);
    expect(arrange(all, { context: true, q: 'x' }).gear).toBeNull();
  });
  it('shows gear when nothing else strong fits; other hits (a function, a command) keep it folded', () => {
    expect(arrange([g('gear')], { q: 'trikot' })).toMatchObject({ groups: [{ kind: 'gear' }], gear: null });
    expect(arrange([g('gear')], { q: 'trikot', other: 1 }).gear).not.toBeNull();
  });
  it('filters by kind and hides gear unless it is chosen', () => {
    const all = [g('gear'), g('trip'), g('template'), g('note'), g('log'), g('page'), g('bike')];
    expect(names(arrange(all, { filter: 'trips' }))).toEqual(['trip', 'template']);
    expect(names(arrange(all, { filter: 'notes' }))).toEqual(['note', 'log']);
    expect(arrange(all, { filter: 'bikes' }).gear).toBeNull();
    expect(FILTERS.map((x) => x.key)).toEqual(['all', 'pages', 'trips', 'bikes', 'notes', 'gear']);
    expect(ORDER.at(-1)).toBe('gear');
  });
  it('counts the hits per button', () => {
    expect(countsOf([g('gear', 15), g('page', 2), g('action', 1), g('log', 1)])).toEqual({ pages: 3, trips: 0, bikes: 0, notes: 1, gear: 15 });
  });
  it('knows the gear pages from the address', () => {
    for (const h of ['#/gear', '#/gear?q=zelt', '#/gear/supplies', '#/blocks', '#/equipment', '#/pack']) expect(gearContext(h), h).toBe(true);
    for (const h of ['#/', '#/week', '#/trips', '#/pack/past', '#/pack/templates', '#/me/data', '#/bikes?tab=care', '']) expect(gearContext(h), h).toBe(false);
  });
  it('hears «my things» words', () => {
    expect(saysGear('Teile unter 200 g')).toBe(true);
    expect(saysGear('Gewicht Zelt')).toBe(true);
    expect(saysGear('trikot')).toBe(false);
  });
  it('has six topics whose pages exist and have German names', () => {
    expect(TOPICS.map((x) => x.key)).toEqual(['packing', 'trips', 'bike', 'body', 'weather', 'app']);
    for (const x of TOPICS) {
      expect(DE[x.label], x.label).toBeTruthy();
      expect(DE[x.sub], x.sub).toBeTruthy();
      const rows = x.rows();
      expect(rows.length, x.key).toBeGreaterThan(0);
      for (const r of rows) {
        expect(isUnknown(r.href), r.href).toBe(false);
        expect(DE[r.title], r.title).toBeTruthy();
      }
    }
  });
  it('has German names for the buttons', () => {
    for (const f of FILTERS) expect(DE[f.label], f.label).toBeTruthy();
  });
});
