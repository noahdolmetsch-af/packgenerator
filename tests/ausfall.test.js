import { describe, it, expect } from 'vitest';
import { isOutage, outageText, calm } from '../src/lib/ausfall.js';
import { fetchForecast, searchPlace } from '../src/lib/weather.js';
import { errorText } from '../src/lib/stravasync.js';

describe('a service that cannot be reached', () => {
  it('knows what an outage is', () => {
    for (const s of [500, 502, 503, 429, 408]) expect(isOutage(s), String(s)).toBe(true);
    for (const s of [200, 400, 401, 404]) expect(isOutage(s), String(s)).toBe(false);
    expect(isOutage(new TypeError('Failed to fetch'))).toBe(true);
    expect(isOutage(new Error('boom'))).toBe(false);
  });
  it('weather says the same calm sentence for a server error and for no network', async () => {
    const sentence = outageText('Weather');
    expect(sentence).toMatch(/keep working/);
    const bern = { lat: 46.9, lon: 7.4 };
    await expect(fetchForecast(bern, async () => ({ ok: false, status: 503 }))).rejects.toThrow(sentence);
    await expect(fetchForecast(bern, async () => { throw new TypeError('Failed to fetch'); })).rejects.toThrow(sentence);
    await expect(searchPlace('Bern', async () => ({ ok: false, status: 500 }))).rejects.toThrow(sentence);
  });
  it('other errors keep their own message', async () => {
    await expect(fetchForecast({ lat: 1, lon: 1 }, async () => ({ ok: false, status: 400 }))).rejects.toThrow('Forecast failed (400)');
  });
  it('strava and calm() use the same sentence', async () => {
    expect(errorText('network')).toMatch(/keep working/);
    expect(errorText('server_error')).toMatch(/keep working/);
    await expect(calm('Strava', async () => { throw new TypeError('x'); })).rejects.toThrow(/keep working/);
    await expect(calm('Strava', async () => { throw new RangeError('x'); })).rejects.toThrow('x');
  });
});
