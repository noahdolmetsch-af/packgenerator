// «Tour-Stand» (Tour von A bis Z, Schritt 0): the phase and the rows of a tour, pure (src/lib/tourpfad/stand.js).
import { describe, it, expect } from 'vitest';
import { tourStand, PHASES } from '../src/lib/tourpfad/stand.js';
import { addDays } from '../src/lib/phase.js';

const D0 = '2026-10-14';
const day = (n) => addDays(D0, n);
const es = (n, packed = 0) => Array.from({ length: n }, (_, k) => ({ itemId: `i${k}`, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (extra = {}) => ({ id: 'test_data_t1', title: 'test_data_ Jura', domain: 'bikepacking', bikeId: 'b1', startDate: day(10), days: 3, entries: es(10), ready: [], status: 'planned', ...extra });
const full = { route: { km: 312 }, wx: { min: 4, max: 12 }, arrival: 'train', stages: { days: [{ km: 100 }, { km: 100 }, { km: 112 }] } };
const rowOf = (s, key) => s.phases.flatMap((p) => p.rows).find((r) => r.key === key);

describe('tourStand: the phase by date and by what is done', () => {
  it('no trip, not riding', () => {
    expect(tourStand(null, { today: D0 }).phase).toBe(null);
    const s = tourStand(trip({ skipped: true }), { today: D0 });
    expect(s.phase).toBe('ausgefallen');
    expect(s.phases).toEqual([]);
    expect(s.next).toBe(null);
  });
  it('far ahead with things open: Planen; the first open row is the main button', () => {
    const s = tourStand(trip(), { today: D0 });
    expect(s.phase).toBe('planen');
    expect(s.n).toBe(1);
    expect(s.total).toBe(PHASES.length);
    expect(s.next.key).toBe('route');
    expect(s.phases.map((p) => p.state)).toEqual(['now', 'next', 'next', 'next']);
  });
  it('Planen done: Vorbereiten, Planen is ✓ with its count', () => {
    const s = tourStand(trip({ ...full }), { today: D0, fuelPlan: true });
    expect(s.phase).toBe('vorbereiten');
    expect(s.phases[0]).toMatchObject({ state: 'done', done: s.phases[0].total });
    expect(s.n).toBe(2);
  });
  it('within the packing days it is Vorbereiten even with planning open; the date never waits for rows', () => {
    expect(tourStand(trip({ startDate: day(2) }), { today: D0 }).phase).toBe('vorbereiten');
    expect(tourStand(trip({ startDate: day(2) }), { today: D0, packDays: 1 }).phase).toBe('planen');
    expect(tourStand(trip({ entries: es(10, 1) }), { today: D0 }).phase).toBe('vorbereiten');
  });
  it('no start date: Planen, the date row is open', () => {
    const s = tourStand(trip({ startDate: null }), { today: D0 });
    expect(s.phase).toBe('planen');
    expect(rowOf(s, 'ziel').state).toBe('open');
  });
  it('during: Unterwegs; earlier phases with rows open are «past», not ✓', () => {
    const s = tourStand(trip(), { today: day(10) });
    expect(s.phase).toBe('unterwegs');
    expect(s.phases.map((p) => p.state)).toEqual(['past', 'past', 'now', 'next']);
    expect(s.next.key).toBe('losfahren');
  });
  it('arrived (finished) or over: Danach; debrief saved: fertig', () => {
    expect(tourStand(trip({ finished: day(11) }), { today: day(11) }).phase).toBe('danach');
    expect(tourStand(trip(), { today: day(14) }).phase).toBe('danach');
    const s = tourStand(trip(), { today: day(14), debriefDone: true });
    expect(s.phase).toBe('fertig');
    expect(s.n).toBe(4);
    expect(s.phases.every((p) => p.state === 'done')).toBe(true);
    expect(s.next).toBe(null);
  });
});

describe('tourStand: the rows', () => {
  it('Packen counts: none, begun, all', () => {
    expect(rowOf(tourStand(trip({ entries: [] }), { today: D0 }), 'packen')).toMatchObject({ state: 'open', facts: { packed: 0, total: 0 } });
    expect(rowOf(tourStand(trip({ entries: es(32, 24) }), { today: D0 }), 'packen')).toMatchObject({ state: 'part', facts: { packed: 24, total: 32 }, href: '#/pack?day' });
    expect(rowOf(tourStand(trip({ entries: es(4, 4) }), { today: D0 }), 'packen').state).toBe('done');
  });
  it('the main button skips notes (warn, hint) and goes to the packing that is begun', () => {
    const t = trip({ ...full, startDate: day(6), entries: es(32, 24) });
    const s = tourStand(t, { today: D0, fuelPlan: true, form: 'good', longestKm: 140, careDue: 1 });
    expect(s.phase).toBe('vorbereiten');
    expect(rowOf(s, 'velo').state).toBe('warn');
    expect(rowOf(s, 'koerper-tour').hint).toBe(true);
    expect(s.next.key).toBe('packen');
  });
  it('Körper und Tour: 3 days of 105 km against a longest ride of 90 km is a note, against 140 km it is fine', () => {
    expect(rowOf(tourStand(trip({ route: { km: 315 } }), { today: D0, longestKm: 90 }), 'koerper-tour').state).toBe('warn');
    expect(rowOf(tourStand(trip({ route: { km: 315 } }), { today: D0, longestKm: 140 }), 'koerper-tour').state).toBe('done');
    const s = tourStand(trip({ route: { km: 315 } }), { today: D0, longestKm: 140 });
    const v = s.phases[1];
    expect(v.rows.some((r) => r.key === 'koerper-tour')).toBe(true);
    expect(v.total).toBe(v.rows.length - 1);
  });
  it('without a route or without a longest ride there is no Körper-und-Tour row (nothing to say)', () => {
    expect(rowOf(tourStand(trip(), { today: D0, longestKm: 140 }), 'koerper-tour')).toBeUndefined();
    expect(rowOf(tourStand(trip({ route: { km: 300 } }), { today: D0 }), 'koerper-tour')).toBeUndefined();
  });
  it('unknown is never «fine»: no form and no care data stay open', () => {
    const s = tourStand(trip(), { today: D0 });
    expect(rowOf(s, 'koerper').state).toBe('open');
    expect(rowOf(s, 'velo').state).toBe('open');
    expect(rowOf(s, 'velo').facts.careDue).toBe(null);
    expect(rowOf(tourStand(trip(), { today: D0, form: 'low' }), 'koerper').state).toBe('warn');
    expect(rowOf(tourStand(trip(), { today: D0, careDue: 0 }), 'velo').state).toBe('done');
  });
  it('a tour without a bike and a day ride have fewer rows', () => {
    const hike = trip({ domain: 'ski', bikeId: null, packs: [{ key: 'p1', name: 'Backpack' }], days: 1 });
    const keys = tourStand(hike, { today: D0 }).phases.flatMap((p) => p.rows.map((r) => r.key));
    expect(keys).not.toContain('route');
    expect(keys).not.toContain('velo');
    expect(keys).not.toContain('losfahren');
    expect(keys).not.toContain('etappen');
  });
  it('Etappen: own stages ✓, a route alone begun, nothing open', () => {
    expect(rowOf(tourStand(trip(), { today: D0 }), 'etappen').state).toBe('open');
    expect(rowOf(tourStand(trip({ route: { km: 300 } }), { today: D0 }), 'etappen').state).toBe('part');
    expect(rowOf(tourStand(trip({ stages: { days: [{ km: 100 }, { km: 100 }, { km: 100 }] } }), { today: D0 }), 'etappen').state).toBe('done');
  });
  it('Anreise: the field or a chosen option; Verpflegung: the plan', () => {
    expect(rowOf(tourStand(trip(), { today: D0 }), 'anreise').state).toBe('open');
    expect(rowOf(tourStand(trip({ arrival: 'bike' }), { today: D0 }), 'anreise').state).toBe('done');
    expect(rowOf(tourStand(trip(), { today: D0, travelChosen: 1 }), 'anreise').state).toBe('done');
    expect(rowOf(tourStand(trip(), { today: D0, fuelPlan: true }), 'verpflegung').state).toBe('done');
  });
  it('Letzte 24 Stunden: later until the day before, then by the ready check', () => {
    const ready = [{ id: 'a', label: 'Lights', done: true }, { id: 'b', label: 'Pump', done: false }];
    expect(rowOf(tourStand(trip({ ready, startDate: day(5) }), { today: D0 }), 'letzte24').state).toBe('later');
    expect(rowOf(tourStand(trip({ ready, startDate: day(1) }), { today: D0 }), 'letzte24')).toMatchObject({ state: 'part', facts: { done: 1, total: 2 } });
    expect(rowOf(tourStand(trip({ ready: [], startDate: day(1) }), { today: D0 }), 'letzte24')).toBeUndefined();
  });
  it('Danach: debrief and ride; the ride row only with data', () => {
    const s = tourStand(trip(), { today: day(14), ridden: false });
    expect(s.phase).toBe('danach');
    expect(s.next.key).toBe('rueckblick');
    expect(rowOf(s, 'fahrt').state).toBe('open');
    expect(rowOf(tourStand(trip(), { today: day(14) }), 'fahrt')).toBeUndefined();
  });
  it('rows the user took away neither show nor count', () => {
    const s = tourStand(trip(), { today: D0, hidden: ['route', 'wetter'] });
    expect(rowOf(s, 'route')).toBeUndefined();
    expect(rowOf(s, 'wetter')).toBeUndefined();
    expect(s.next.key).toBe('anreise');
  });
  it('needs today', () => {
    expect(() => tourStand(trip(), {})).toThrow();
  });
});
