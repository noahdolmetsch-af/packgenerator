// «Wetterfenster für Träume» (Träume und Neuland N15, Noah 27.10.2026 «1-5 a»): dry days in a row for a dream.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { isDry, placeOf, placeKey, dryWindow, needDays, windowsOf, placesToFetch, refreshDreamWx, DREAM_WX, MAX_PLACES } from '../src/lib/dreams/wetterfenster.js';

const P = 'test_data_gtp_';
const day = (date, rainMm = 0, rainPct = 10) => ({ date, rainMm, rainPct });
const HOME = { lat: 47.38, lon: 8.54 };

describe('dry days', () => {
  it('a day is dry under 1 mm and under 40 %', () => {
    expect(isDry(day('2026-10-28'))).toBe(true);
    expect(isDry(day('2026-10-28', 2))).toBe(false);
    expect(isDry(day('2026-10-28', 0, 60))).toBe(false);
  });

  it('finds the first run long enough, from today on, and takes it whole', () => {
    const days = [day('2026-10-26'), day('2026-10-27'), day('2026-10-28', 5), day('2026-10-29'), day('2026-10-30'), day('2026-10-31'), day('2026-11-01', 3)];
    expect(dryWindow(days, '2026-10-27', 2)).toEqual({ from: '2026-10-29', to: '2026-10-31', n: 3 });
    expect(dryWindow(days, '2026-10-26', 2)).toEqual({ from: '2026-10-26', to: '2026-10-27', n: 2 });
    expect(dryWindow(days, '2026-10-27', 4)).toBe(null);
  });

  it('a dream needs its days, at least 2 and at most 3', () => {
    expect(needDays({ days: 1 })).toBe(2);
    expect(needDays({ days: 3 })).toBe(3);
    expect(needDays({ days: 9 })).toBe(3);
  });
});

describe('places and windows', () => {
  const routed = { id: 'a', title: `${P}Pass`, days: 2, route: { line: [[46.57, 8.41], [46.56, 8.33]] } };
  const plain = { id: 'b', title: `${P}See`, days: 1 };

  it('takes the route start, else home', () => {
    expect(placeOf(routed, HOME)).toEqual({ lat: 46.57, lon: 8.41 });
    expect(placeOf(plain, HOME)).toEqual(HOME);
    expect(placeOf(plain, null)).toBe(null);
    expect(placeKey({ lat: 46.57, lon: 8.41 })).toBe('46.6,8.4');
  });

  it('gives each dream the window of its place', () => {
    const kept = {
      places: {
        '46.6,8.4': { fetchedAt: '2026-10-27T10:00:00Z', days: [day('2026-10-27', 4), day('2026-10-28'), day('2026-10-29')] },
        '47.4,8.5': { fetchedAt: '2026-10-27T10:00:00Z', days: [day('2026-10-27'), day('2026-10-28', 9), day('2026-10-29')] },
      },
    };
    const w = windowsOf([routed, plain], HOME, kept, '2026-10-27');
    expect(w.get('a')).toEqual({ from: '2026-10-28', to: '2026-10-29', n: 2 });
    expect(w.has('b')).toBe(false);
  });

  it('fetches only places not kept or older than 3 hours, and not too many', () => {
    const now = Date.parse('2026-10-27T12:00:00Z');
    const kept = { places: { '46.6,8.4': { fetchedAt: '2026-10-27T10:00:00Z', days: [] }, '47.4,8.5': { fetchedAt: '2026-10-27T07:00:00Z', days: [] } } };
    expect(placesToFetch([routed, plain], HOME, kept, now).map(([k]) => k)).toEqual(['47.4,8.5']);
    const many = Array.from({ length: 9 }, (_, i) => ({ id: `d${i}`, route: { line: [[46 + i, 8]] } }));
    expect(placesToFetch(many, HOME, null, now)).toHaveLength(MAX_PLACES);
  });

  it('keeps the forecast on the device and drops forecasts older than 2 days', async () => {
    const db = createDb(`wx-${Math.random()}`);
    await db.meta.put({ key: DREAM_WX, places: { '40.0,8.0': { fetchedAt: '2026-10-20T10:00:00Z', days: [] }, '41.0,8.0': { fetchedAt: '2026-10-27T09:00:00Z', days: [] } } });
    const asked = [];
    const fetcher = async (url) => (asked.push(url), { ok: true, json: async () => ({ daily: { time: ['2026-10-27', '2026-10-28'], precipitation_sum: [0, 0], precipitation_probability_max: [5, 5], temperature_2m_max: [15, 16], temperature_2m_min: [5, 6] } }) });
    const kept = await refreshDreamWx(db, [plain], HOME, { fetcher, now: Date.parse('2026-10-27T12:00:00Z'), online: true });
    expect(asked).toHaveLength(1);
    expect(Object.keys(kept.places).sort()).toEqual(['41.0,8.0', '47.4,8.5']);
    expect(kept.places['47.4,8.5'].days[1]).toEqual({ date: '2026-10-28', rainMm: 0, rainPct: 5, max: 16 });
    expect((await db.meta.get(DREAM_WX)).places['47.4,8.5']).toBeTruthy();
    // offline: nothing is asked, what was kept stays
    const off = await refreshDreamWx(db, [plain], HOME, { fetcher, online: false });
    expect(asked).toHaveLength(1);
    expect(Object.keys(off.places).sort()).toEqual(['41.0,8.0', '47.4,8.5']);
  });
});
