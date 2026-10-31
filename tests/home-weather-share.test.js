// UI-Test T8 (G1-06): two tiles that ask for the home weather at the same time get the same answer
import { describe, it, expect, vi } from 'vitest';
import { homeForecast } from '../src/lib/home-weather.js';
import { HOME_PLACE, HOME_FORECAST } from '../src/lib/know.js';

const fakeDb = (place, saved) => {
  const meta = new Map(saved ? [[HOME_FORECAST, saved]] : []);
  return {
    settings: { get: vi.fn(async (k) => (k === HOME_PLACE && place ? { key: k, value: place } : undefined)) },
    meta: { get: vi.fn(async (k) => meta.get(k)), put: vi.fn(async (x) => meta.set(x.key, x)) },
  };
};

describe('homeForecast shared', () => {
  it('asks once for tiles that ask at the same time, and again later', async () => {
    const db = fakeDb(null);
    const [a, b] = await Promise.all([homeForecast(db), homeForecast(db)]);
    expect(a).toBe(null);
    expect(b).toBe(null);
    expect(db.settings.get).toHaveBeenCalledTimes(1);
    await homeForecast(db);
    expect(db.settings.get).toHaveBeenCalledTimes(2);
  });
  it('«fresh» (after a new home place) never takes the answer of an older question', async () => {
    const db = fakeDb(null);
    await Promise.all([homeForecast(db), homeForecast(db, { fresh: true })]);
    expect(db.settings.get).toHaveBeenCalledTimes(2);
  });
});
