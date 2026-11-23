// «Form im Vergleich zu früher» (Noah 21.11.2026, K2): fictional data only.
import { describe, it, expect } from 'vitest';
import { compareYears, wattPerBeat, inWindow, cleanSettings, DEFAULTS } from '../src/lib/flow/form/vergleich.js';

const TODAY = '2026-11-21';
const ride = (w, hr = 100, min = 60) => ({ kind: 'bike', wDevice: true, wAvg: w, hrAvg: hr, movingS: min * 60 });
/** n rides per year in June..September, watt per beat = wpb, one resting pulse per day. */
function build(spec, extra = () => {}) {
  const table = new Map();
  for (const [year, { wpb, n = 12, rhr = 50 }] of Object.entries(spec)) {
    for (let i = 0; i < 30; i++) {
      const day = `${year}-${i < 15 ? '06' : '07'}-${String((i % 15) + 1).padStart(2, '0')}`;
      table.set(day, { rhr, acts: i < n ? [ride(wpb * 100)] : [] });
    }
  }
  extra(table);
  return table;
}

describe('Watt je Herzschlag', () => {
  it('only a bike ride with a power meter, a pulse and enough time', () => {
    expect(wattPerBeat(ride(110, 100))).toBeCloseTo(1.1);
    expect(wattPerBeat({ ...ride(110), wDevice: false })).toBeNull();
    expect(wattPerBeat({ ...ride(110), kind: 'run' })).toBeNull();
    expect(wattPerBeat(ride(110, 100, 39))).toBeNull();
    expect(wattPerBeat(ride(110, 100, 39), 30)).toBeCloseTo(1.1);
    expect(wattPerBeat({ ...ride(110), hrAvg: null })).toBeNull();
  });
});

describe('the window', () => {
  it('May to October; this year only up to today', () => {
    expect(inWindow('2025-05-01', TODAY)).toBe(true);
    expect(inWindow('2025-10-31', TODAY)).toBe(true);
    expect(inWindow('2025-04-30', TODAY)).toBe(false);
    expect(inWindow('2025-11-01', TODAY)).toBe(false);
    expect(inWindow('2026-08-01', '2026-07-01')).toBe(false);
    expect(inWindow('2026-06-30', '2026-07-01')).toBe(true);
  });
  it('settings: numbers in range, else the defaults', () => {
    expect(cleanSettings(undefined)).toEqual(DEFAULTS);
    expect(cleanSettings({ minRides: 5, minMin: 30 })).toEqual({ minRides: 5, minMin: 30 });
    expect(cleanSettings({ minRides: 1, minMin: 'x' })).toEqual(DEFAULTS);
  });
});

describe('compareYears', () => {
  it('one year against the year before: «trend», with the direction', () => {
    const r = compareYears({ table: build({ 2025: { wpb: 1.0 }, 2026: { wpb: 1.1 } }), today: TODAY });
    expect(r.level).toBe('trend');
    expect(r.dir).toBe(1);
    expect(r.cur.wpb).toBeCloseTo(1.1);
    expect(r.prev.year).toBe(2025);
  });
  it('the same direction over three years: «sure»', () => {
    const r = compareYears({ table: build({ 2024: { wpb: 1.0 }, 2025: { wpb: 1.05 }, 2026: { wpb: 1.1 } }), today: TODAY });
    expect(r.level).toBe('sure');
    expect(r.dir).toBe(1);
  });
  it('a different direction in between: only «trend»', () => {
    const r = compareYears({ table: build({ 2024: { wpb: 1.1 }, 2025: { wpb: 1.0 }, 2026: { wpb: 1.1 } }), today: TODAY });
    expect(r.level).toBe('trend');
  });
  it('fewer rides than the minimum: «few»', () => {
    const r = compareYears({ table: build({ 2025: { wpb: 1.0 }, 2026: { wpb: 1.1, n: 9 } }), today: TODAY });
    expect(r.level).toBe('few');
    expect(r.cur.wpb).toBeNull();
    expect(compareYears({ table: build({ 2025: { wpb: 1.0 }, 2026: { wpb: 1.1, n: 9 } }), today: TODAY, settings: { minRides: 8 } }).level).toBe('trend');
  });
  it('no year before: «few»', () => {
    expect(compareYears({ table: build({ 2026: { wpb: 1.1 } }), today: TODAY }).level).toBe('few');
  });
  it('a year that sticks out far: «few» and marked as outlier', () => {
    const r = compareYears({ table: build({ 2023: { wpb: 1.0 }, 2024: { wpb: 0.7 }, 2025: { wpb: 1.05 }, 2026: { wpb: 1.1 } }), today: TODAY });
    expect(r.level).toBe('few');
    expect(r.years.find((y) => y.year === 2024).outlier).toBe(true);
  });
  it('a small change is no direction', () => {
    const r = compareYears({ table: build({ 2025: { wpb: 1.0 }, 2026: { wpb: 1.01 } }), today: TODAY });
    expect(r.dir).toBe(0);
    expect(r.level).toBe('trend');
  });
  it('marked days leave out the rides and the resting pulse, not the hours', () => {
    const table = build({ 2025: { wpb: 1.0 }, 2026: { wpb: 1.1, rhr: 50 } }, (t) => {
      for (let i = 1; i <= 31; i++) t.set(`2026-05-${String(i).padStart(2, '0')}`, { rhr: 60, acts: [ride(60)] });
    });
    const marked = new Set(Array.from({ length: 31 }, (_, i) => `2026-05-${String(i + 1).padStart(2, '0')}`));
    const all = compareYears({ table, today: TODAY });
    const out = compareYears({ table, today: TODAY, marked });
    expect(out.cur.rides).toBeLessThan(all.cur.rides);
    expect(out.cur.rhr).toBe(50);
    expect(all.cur.rhr).toBeGreaterThan(50);
    expect(out.cur.hours).toBe(all.cur.hours);
  });
  it('the resting pulse needs 20 days', () => {
    const table = new Map([['2026-06-01', { rhr: 50, acts: [] }]]);
    expect(compareYears({ table, today: TODAY }).cur.rhr).toBeNull();
  });
});
