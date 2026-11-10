// «Meine Tour»: the facts form, care, fuel and ride reach the rule (Noah 10.11.2026 «2a»). Fictional data.
import { describe, it, expect } from 'vitest';
import { formOf, careDueOf, tourExtra } from '../src/lib/tourpfad/kontext.js';
import { tourStand } from '../src/lib/tourpfad/stand.js';
import { addDays } from '../src/lib/phase.js';

const D0 = '2026-10-14';
const es = (n, packed = 0) => Array.from({ length: n }, (_, k) => ({ itemId: `i${k}`, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (extra = {}) => ({ id: 'test_data_k1', title: 'test_data_ Jura', domain: 'bikepacking', bikeId: 'b1', bike: 'test_data_ Gravel', startDate: addDays(D0, 6), days: 3, entries: es(32, 24), ready: [], status: 'planned', route: { km: 312 }, wx: { min: 4, max: 12 }, arrival: 'train', stages: { days: [{ km: 100 }, { km: 100 }, { km: 112 }] }, ...extra });

describe('the facts of the tour', () => {
  it('form: from the readiness level, unknown without data', () => {
    expect(formOf(null)).toBeNull();
    expect(formOf({ score: 80, level: 'hard' })).toBe('good');
    expect(formOf({ score: 60, level: 'normal' })).toBe('good');
    expect(formOf({ score: 45, level: 'easy' })).toBe('ok');
    expect(formOf({ score: 20, level: 'rest' })).toBe('low');
  });
  it('care: no bike is unknown, nothing recorded is unknown', () => {
    expect(careDueOf(null, { today: D0 })).toBeNull();
  });
  it('ride and fuel plan: only known when there is one, else unknown (never «fine»)', () => {
    const x = tourExtra({ trip: trip(), today: D0, rides: [{ id: 'r1', tripId: 'other', km: 80 }] });
    expect(x.ridden).toBeNull();
    expect(x.fuelPlan).toBeNull();
    expect(x.longestKm).toBe(80);
    const y = tourExtra({ trip: trip({ fuelOwn: {} }), today: D0, rides: [{ id: 'r2', tripId: 'test_data_k1', km: 120 }] });
    expect(y.ridden).toBe(true);
    expect(y.fuelPlan).toBe(true);
    expect(y.longestKm).toBe(120);
  });
});

describe('«Packing» becomes the next step once the form is known', () => {
  const base = { today: D0 };
  it('without the facts: Body first (as before)', () => {
    expect(tourStand(trip(), base).next.key).toBe('koerper');
  });
  it('with a good form and no care due: Packing', () => {
    const x = { ...base, form: 'good', careDue: 0, fuelPlan: true };
    expect(tourStand(trip(), x).next.key).toBe('packen');
  });
  it('a low form is a note, never the next step', () => {
    const s = tourStand(trip(), { ...base, form: 'low', careDue: 0, fuelPlan: true });
    expect(s.next.key).toBe('packen');
    expect(s.phases[1].rows.find((r) => r.key === 'koerper').state).toBe('warn');
  });
});
