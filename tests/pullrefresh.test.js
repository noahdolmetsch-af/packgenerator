// «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026, Paket D, Idee 10): the pull and what it loads.
import { describe, it, expect, vi } from 'vitest';
import { THRESHOLD, MAX_PULL, pullOf, arms, isHeute, isAktiv, isPullPage, refreshToday } from '../src/lib/home/refresh.js';

describe('pull', () => {
  it('resists: half the finger way, never more than the maximum', () => {
    expect(pullOf(0)).toBe(0);
    expect(pullOf(60)).toBe(30);
    expect(pullOf(1000)).toBe(MAX_PULL);
    expect(pullOf(-40)).toBe(0);
    expect(pullOf('x')).toBe(0);
  });
  it('refreshes only from the threshold on', () => {
    expect(arms(THRESHOLD - 1)).toBe(false);
    expect(arms(THRESHOLD)).toBe(true);
    expect(arms(pullOf(2 * THRESHOLD))).toBe(true);
    expect(arms(pullOf(THRESHOLD))).toBe(false); // the finger needs twice the way
  });
  it('starts only on Heute', () => {
    for (const h of ['', '#', '#/']) expect(isHeute(h), h).toBe(true);
    for (const h of ['#/trips', '#/me', '#/bikes?tab=care']) expect(isHeute(h), h).toBe(false);
  });
});

describe('refreshToday', () => {
  const db = (home) => ({ settings: { get: async () => (home ? { value: home } : undefined) } });
  it('loads the home weather fresh and fetches Strava', async () => {
    const loadCore = vi.fn(async () => ({}));
    const fetchNow = vi.fn(async () => ({}));
    const home = { lat: 47.4, lon: 8.0, name: 'test_data_gtp_ Daheim' };
    const r = await refreshToday({ db: db(home), loadCore, fetchNow, hasStrava: true });
    expect(r).toEqual({ weather: true, strava: true });
    expect(loadCore).toHaveBeenCalledWith(expect.anything(), home, { force: true });
    expect(fetchNow).toHaveBeenCalledTimes(1);
  });
  it('skips what is not set up: no home place, no Strava key', async () => {
    const loadCore = vi.fn();
    const fetchNow = vi.fn();
    expect(await refreshToday({ db: db(null), loadCore, fetchNow, hasStrava: false })).toEqual({ weather: false, strava: false });
    expect(loadCore).not.toHaveBeenCalled();
    expect(fetchNow).not.toHaveBeenCalled();
  });
  it('never throws when a service fails', async () => {
    const loadCore = vi.fn(async () => {
      throw new Error('offline');
    });
    const fetchNow = vi.fn(() => {
      throw new Error('boom');
    });
    const r = await refreshToday({ db: db({ lat: 1, lon: 2 }), loadCore, fetchNow, hasStrava: true });
    expect(r).toEqual({ weather: true, strava: true });
  });
  it('Noah 7.11.2026 «3a»: fetches the Fitbit values too, and does not wait for a slow Google longer than the limit', async () => {
    const fetchFitbit = vi.fn(async () => ({}));
    const r = await refreshToday({ db: db(null), loadCore: vi.fn(), fetchNow: vi.fn(), fetchFitbit, hasFitbit: true });
    expect(r).toEqual({ weather: false, strava: false, fitbit: true });
    expect(fetchFitbit).toHaveBeenCalledTimes(1);
    const slow = vi.fn(() => new Promise(() => {}));
    const t0 = Date.now();
    await refreshToday({ db: db(null), loadCore: vi.fn(), fetchNow: vi.fn(), fetchFitbit: slow, hasFitbit: true, fitbitMax: 30 });
    expect(Date.now() - t0).toBeLessThan(1000);
    const off = vi.fn();
    expect(await refreshToday({ db: db(null), loadCore: vi.fn(), fetchNow: vi.fn(), fetchFitbit: off, hasFitbit: false })).toEqual({ weather: false, strava: false });
    expect(off).not.toHaveBeenCalled();
  });
});

describe('Ziehen auf Aktiv (Noah 10.11.2026 «ja»)', () => {
  it('works on the start of Aktiv and on Heute, nowhere else', () => {
    for (const h of ['#/flow', '#/flow/', '#/flow?x=1']) expect(isAktiv(h), h).toBe(true);
    for (const h of ['#/flow/sports', '#/flow/act/meditation', '#/', '#/trips']) expect(isAktiv(h), h).toBe(false);
    for (const h of ['', '#/', '#/flow']) expect(isPullPage(h), h).toBe(true);
    for (const h of ['#/flow/rest', '#/me/data', '#/bikes']) expect(isPullPage(h), h).toBe(false);
  });
  it('onlySync brings only the sync: no weather, no Strava, no Fitbit', async () => {
    const db = { settings: { get: async () => ({ value: { lat: 47, lon: 8 } }) } };
    const loadCore = vi.fn();
    const fetchNow = vi.fn();
    const fetchFitbit = vi.fn();
    const syncNow = vi.fn(async () => ({}));
    const r = await refreshToday({ db, loadCore, fetchNow, hasStrava: true, fetchFitbit, hasFitbit: true, syncNow, hasSync: true, onlySync: true });
    expect(syncNow).toHaveBeenCalledTimes(1);
    expect(loadCore).not.toHaveBeenCalled();
    expect(fetchNow).not.toHaveBeenCalled();
    expect(fetchFitbit).not.toHaveBeenCalled();
    expect(r).toEqual({ weather: false, strava: false, sync: true });
  });
});
