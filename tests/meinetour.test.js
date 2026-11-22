// «Meine Tour» (Plan «ganze App», Schritt 2a, Noah 08.11.2026 «2 a»): the card on Heute for a planned tour. It only reads
// tourStand, so Heute and the Tour-Pfad say the same. Fictional trips; calendar days (no Date.now arithmetic).
import { describe, it, expect } from 'vitest';
import { meineTour, pfadHref } from '../src/lib/tourpfad/karte.js';
import { tourStand } from '../src/lib/tourpfad/stand.js';
import { addDays } from '../src/lib/phase.js';
import { READY, TILE, TILES, wallOf, wallRecord, withMeineTour, HEAD_N2 } from '../src/lib/home/tiles.js';
import { SECTION_OF, sectionOf } from '../src/lib/home/sections.js';
import { KEEP_TOP, byTime } from '../src/lib/clear/tipweek.js';
import DE from '../src/lib/i18n/de/index.js';

const D0 = '2026-10-14';
const day = (n) => addDays(D0, n);
const es = (n, packed = 0) => Array.from({ length: n }, (_, k) => ({ itemId: `i${k}`, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (extra = {}) => ({ id: 'test_data_mt1', title: 'test_data_ Jura', domain: 'bikepacking', bikeId: 'b1', bike: 'test_data_ Gravel', startDate: day(6), days: 3, entries: es(32, 24), ready: [], status: 'planned', route: { km: 312 }, wx: { min: 4, max: 12 }, arrival: 'train', stages: { days: [{ km: 100 }, { km: 100 }, { km: 112 }] }, ...extra });
const ctx = { today: D0, fuelPlan: true };
const ids = (w) => w.map((x) => x.id);

describe('the card for a planned tour', () => {
  it('names the tour, the step n of 4 and the four phases with their state', () => {
    const c = meineTour(trip(), ctx);
    expect(c.title).toBe('test_data_ Jura');
    expect(c.phase).toBe('vorbereiten');
    expect([c.n, c.total]).toEqual([2, 4]);
    expect(c.phases.map((p) => [p.key, p.state])).toEqual([['planen', 'done'], ['vorbereiten', 'now'], ['unterwegs', 'next'], ['danach', 'next']]);
    expect(c.pfad).toBe(pfadHref(trip()));
    expect(c.pfad).toBe('#/trips/pfad?t=test_data_mt1');
  });
  it('the one main button leads to the first open row, the same as the Tour-Pfad says', () => {
    const t = trip();
    // like the Tour-Pfad today: without the form and the care Heute does not know, the first open row is «Body»
    expect(meineTour(t, ctx).next.key).toBe('koerper');
    const know = { ...ctx, form: 'good', careDue: 0 };
    const c = meineTour(t, know);
    const s = tourStand(t, know);
    expect(c.next.key).toBe(s.next.key);
    expect(c.next.href).toBe(s.next.href);
    expect(c.next.title).toBe('Packing');
    expect(c.next.line).toBe('24 of 32 packed');
    expect(c.next.button).toBe('Go on with Packing');
  });
  it('a phase with nothing open has no button, only a line', () => {
    const t = trip({ entries: es(32, 32) });
    const know = { ...ctx, form: 'good', careDue: 0 };
    expect(tourStand(t, know).next).toBe(null);
    const c = meineTour(t, know);
    expect(c.phase).toBe('vorbereiten');
    expect(c.next).toBe(null);
  });
  it('has no «Unterwegs» button (Noah «9 b»: the on-the-way mode comes with step 7a and he switches it on himself)', () => {
    const c = meineTour(trip({ startDate: D0 }), ctx);
    expect(c.phase).toBe('unterwegs');
    expect(c.next.key).toBe('losfahren');
    expect(JSON.stringify(c)).not.toMatch(/modus|mode|live/i);
  });
});

describe('the card is only there for a planned tour', () => {
  it('no trip, a tour that is not riding, or a finished one: no card', () => {
    expect(meineTour(null, ctx)).toBe(null);
    expect(meineTour(trip({ skipped: true }), ctx)).toBe(null);
    expect(meineTour(trip({ startDate: day(-5) }), { ...ctx, debriefDone: true })).toBe(null);
  });
});

describe('the hints are ONE line', () => {
  const prep = { scope: 'prep', tripId: 'test_data_mt1', open: 3, overdue: 1, needed: 0, done: 2, total: 5, status: 'open' };
  it('an open preparation (the old line «Event preparation») is the hint and opens the trip at «Before the trip»', () => {
    const c = meineTour(trip(), ctx, { prep });
    expect(c.hint).toEqual({ text: 'Event preparation: 3 open (1 overdue)', href: '#/pack', prep: 'test_data_mt1' });
  });
  it('a preparation that is done or missing is no hint', () => {
    expect(meineTour(trip(), ctx, { prep: { ...prep, status: 'done' } }).hint).toBe(null);
    expect(meineTour(trip(), ctx, { prep: { ...prep, status: 'none' } }).hint).toBe(null);
    expect(meineTour(trip(), ctx).hint).toBe(null);
  });
  it('without a preparation the first row with a note is the hint (a note, never a verdict)', () => {
    const c = meineTour(trip({ startDate: day(2) }), { ...ctx, careDue: 2 });
    expect(c.hint.text).toBe('Bike: 2 care points due');
    expect(c.hint.prep).toBe(null);
  });
});

describe('the tile on the wall', () => {
  it('is in the catalog, in the first area, on top of the ready wall and of the head', () => {
    expect(TILES.some((x) => x.id === 'meinetour')).toBe(true);
    expect(TILE.meinetour.sizes).toContain(TILE.meinetour.size);
    expect(SECTION_OF.meinetour).toBe('now');
    expect(sectionOf({ id: 'meinetour', size: 'long' })).toBe('now');
    expect(ids(READY)[0]).toBe('meinetour');
    expect(HEAD_N2).toContain('meinetour');
    expect(KEEP_TOP).toContain('meinetour');
    expect(DE[TILE.meinetour.label]).toBeTruthy();
    expect(DE[TILE.meinetour.pitch]).toBeTruthy();
  });
  it('the time of day does not move it away from the top', () => {
    const w = READY.filter((x) => ['meinetour', 'meditation', 'moment', 'trip', 'week', 'suggest'].includes(x.id));
    expect(ids(byTime(w, 8, true))[0]).toBe('meinetour');
    expect(ids(byTime(w, 20, true))[0]).toBe('meinetour');
  });
  it('a wall of before (v < 21) gets it once on top; taken away it stays away; a wall made one\'s own stays as it is', () => {
    expect(ids(withMeineTour([{ id: 'meditation', size: 'long' }, { id: 'week', size: 'l' }]))).toEqual(['meinetour', 'meditation', 'week']);
    expect(ids(withMeineTour([{ id: 'week', size: 'l' }]))).toEqual(['week']);
    expect(ids(withMeineTour([{ id: 'meinetour', size: 'long' }, { id: 'meditation', size: 'long' }]))).toEqual(['meinetour', 'meditation']);
    expect(ids(wallOf({ v: 20, tiles: [{ id: 'trip', size: 'l' }] }))).toEqual(['meinetour', 'trip']);
    expect(ids(wallOf({ v: 21, tiles: [{ id: 'trip', size: 'l' }] }))).toEqual(['trip']);
    expect(wallRecord([]).v).toBe(21);
  });
});

describe('the words', () => {
  it('every new text has its German', () => {
    for (const k of ['My tour', 'The four phases of the tour', 'Next: {title}', 'Nothing is open in this phase.', 'All steps', 'Go on with {title}']) expect(DE[k], k).toBeTruthy();
  });
});
