// «Kursblick» (Noah 22.11.2026): calculations and the loader of the small app. Invented prices only.
import { describe, it, expect } from 'vitest';
import { addDays, addMonths, backBy, closeOnOrBefore, goldChfKg, usdOzToChfKg, verkaufswert, vergleich, verglichenMit, eigenerZeitraum, ab, duenn, PERIODS, OZ_G } from '../src/lib/kurse/rechnen.js';
import { ladeReihe, FRISCH_MS, KURSE_URL } from '../src/lib/kurse/laden.js';

const S = [['2026-10-28', 100], ['2026-10-29', 102], ['2026-10-30', 110], ['2026-11-02', 111], ['2026-11-03', 120]];

describe('calendar days', () => {
  it('moves by days, months and years on the date string', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26'); // the clock change changes nothing
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29');
    expect(backBy('2026-11-03', { n: 40, unit: 'y' })).toBe('1986-11-03');
    expect(backBy('2026-11-03', { n: 2, unit: 'w' })).toBe('2026-10-20');
    expect(backBy('2026-02-28', { n: 1, unit: 'y' })).toBe('2025-02-28');
  });
  it('has the periods from the day to 40 years', () => {
    expect(PERIODS[0].key).toBe('day');
    expect(PERIODS.at(-1)).toMatchObject({ n: 40, unit: 'y' });
  });
  it('checks a custom period', () => {
    expect(eigenerZeitraum('45', 'd')).toMatchObject({ n: 45, unit: 'd' });
    expect(eigenerZeitraum('0', 'd')).toBeNull();
    expect(eigenerZeitraum('3', 'x')).toBeNull();
    expect(eigenerZeitraum('', 'y')).toBeNull();
  });
});

describe('series', () => {
  it('finds the close on a day or the last one before (a Sunday takes Friday)', () => {
    expect(closeOnOrBefore(S, '2026-11-01')).toEqual(['2026-10-30', 110]);
    expect(closeOnOrBefore(S, '2026-11-02')).toEqual(['2026-11-02', 111]);
    expect(closeOnOrBefore(S, '2026-10-01')).toBeNull();
    expect(closeOnOrBefore([], '2026-10-01')).toBeNull();
  });
  it('compares with a day, flags a history that is too short', () => {
    const v = vergleich(S, '2026-11-01');
    expect(v.from).toEqual(['2026-10-30', 110]);
    expect(v.abs).toBe(10);
    expect(v.pct).toBeCloseTo(9.0909, 3);
    expect(v.kurz).toBe(false);
    const k = verglichenMit(S, { n: 40, unit: 'y' });
    expect(k.kurz).toBe(true);
    expect(k.from).toEqual(S[0]);
    expect(vergleich([], '2026-11-01')).toBeNull();
  });
  it('cuts a series from a day on', () => {
    expect(ab(S, '2026-11-01')[0]).toEqual(['2026-10-30', 110]);
    expect(ab(S, '2000-01-01')).toHaveLength(5);
  });
  it('thins a long series to a drawing and keeps the first, last and the peaks', () => {
    const long = Array.from({ length: 5000 }, (_, i) => [addDays('2000-01-01', i), i === 2500 ? 9999 : 100 + (i % 7)]);
    const d = duenn(long, 200);
    expect(d.length).toBeLessThanOrEqual(210);
    expect(d[0]).toEqual(long[0]);
    expect(d.at(-1)).toEqual(long.at(-1));
    expect(d.some((p) => p[1] === 9999)).toBe(true);
    for (let i = 1; i < d.length; i++) expect(d[i][0] > d[i - 1][0]).toBe(true);
    expect(duenn(S, 200)).toBe(S);
  });
});

describe('gold in francs per kilogram', () => {
  it('turns dollars per ounce into francs per kilogram', () => {
    expect(OZ_G).toBeCloseTo(31.1035, 4);
    expect(usdOzToChfKg(2000, 0.9)).toBeCloseTo((2000 / 31.1034768) * 1000 * 0.9, 6);
  });
  it('uses the dollar rate of the day or the last one before, skips days before the first rate', () => {
    const gold = [['2026-10-28', 2000], ['2026-10-29', 2010], ['2026-10-30', 2020]];
    const fx = [['2026-10-29', 0.9], ['2026-10-30', 0.8]];
    const out = goldChfKg(gold, fx);
    expect(out.map((p) => p[0])).toEqual(['2026-10-29', '2026-10-30']);
    expect(out[0][1]).toBeCloseTo(usdOzToChfKg(2010, 0.9), 1);
    expect(out[1][1]).toBeCloseTo(usdOzToChfKg(2020, 0.8), 1);
    expect(goldChfKg([], fx)).toEqual([]);
  });
  it('subtracts the dealer deduction (2 percent as a suggestion), a fee, and keeps the deduction in range', () => {
    expect(verkaufswert(100000)).toBe(98000);
    expect(verkaufswert(100000, 4, 50)).toBe(95950);
    expect(verkaufswert(100000, -5)).toBe(100000);
    expect(verkaufswert(100000, 90)).toBe(50000);
    expect(verkaufswert(100000, 'x')).toBe(100000);
  });
});

describe('loader', () => {
  const answer = (day = '2026-11-03', fetchedAt = '2026-11-04T07:00:00.000Z') => ({ id: 'smi', currency: 'CHF', unit: 'points', source: 'yahoo', since: '2026-10-28', fetchedAt, last: { day, close: 120 }, points: S });
  const memory = () => {
    const m = new Map();
    return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) };
  };
  const NOW = Date.parse('2026-11-04T08:00:00Z');
  it('asks the server and keeps the answer', async () => {
    const store = memory();
    let url = '';
    const fetcher = async (u) => ((url = u), { ok: true, json: async () => answer() });
    const r = await ladeReihe('smi', { fetcher, store, now: NOW + 7 * 3600 * 1000 });
    expect(r.via).toBe('server');
    expect(url).toBe(`${KURSE_URL}?action=kurse&id=smi`);
    expect(store.m.get('smi').last.day).toBe('2026-11-03');
  });
  it('does not ask again within six hours, unless forced', async () => {
    const store = memory();
    store.m.set('smi', answer());
    let n = 0;
    const fetcher = async () => (n++, { ok: true, json: async () => answer() });
    expect((await ladeReihe('smi', { fetcher, store, now: NOW })).via).toBe('cache');
    expect(n).toBe(0);
    await ladeReihe('smi', { fetcher, store, now: NOW, force: true });
    expect(n).toBe(1);
  });
  it('shows an old answer when the server is down, and says so', async () => {
    const store = memory();
    store.m.set('smi', answer());
    const r = await ladeReihe('smi', { fetcher: async () => { throw new Error('offline'); }, store, now: NOW + FRISCH_MS + 1 });
    expect(r).toMatchObject({ via: 'cache', alt: true });
  });
  it('throws with neither, and ignores a wrong answer', async () => {
    await expect(ladeReihe('smi', { fetcher: async () => ({ ok: true, json: async () => ({ id: 'gold' }) }), store: memory(), now: NOW })).rejects.toThrow();
  });
});
