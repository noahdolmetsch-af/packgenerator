// «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026, Paket D, Idee 10): the pull and what it loads.
import { describe, it, expect, vi } from 'vitest';
import { THRESHOLD, MAX_PULL, pullOf, arms, isHeute, refreshToday } from '../src/lib/home/refresh.js';

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
});
