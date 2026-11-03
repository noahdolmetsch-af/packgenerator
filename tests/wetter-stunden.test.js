// «Die nächsten Stunden» (Ziel 6, Noah 27.10.2026 «4a»): several weather models side by side, made-up weather.
import { describe, it, expect } from 'vitest';
import { hoursUrl, parseHours, loadHours, modelWindow, steps, hoursKey, MODELS } from '../src/lib/wetter/stunden.js';

const T0 = Date.parse('2026-07-10T08:00:00Z');
// rain(model, i) gives the rain of hour i for a model; null = the model does not cover the place
function answer(rain = () => 0, temp = () => 18) {
  const time = Array.from({ length: 10 }, (_, i) => (T0 + i * 36e5) / 1000);
  const hourly = { time };
  for (const m of MODELS) {
    const cover = rain(m.id, 0) !== null;
    hourly[`temperature_2m_${m.id}`] = time.map((_, i) => (cover ? temp(m.id, i) : null));
    hourly[`precipitation_${m.id}`] = time.map((_, i) => (cover ? rain(m.id, i) : null));
    hourly[`wind_speed_10m_${m.id}`] = time.map(() => (cover ? 10 : null));
    hourly[`wind_gusts_10m_${m.id}`] = time.map((_, i) => (cover ? 20 + i : null));
    hourly[`weather_code_${m.id}`] = time.map(() => (cover ? 3 : null));
  }
  return { utc_offset_seconds: 7200, hourly };
}

describe('asking the models', () => {
  it('asks all models in one request for the next 10 hours', () => {
    const u = hoursUrl({ lat: 46.9481, lon: 7.4474 });
    expect(u).toContain('models=meteoswiss_icon_ch1%2Cmeteoswiss_icon_ch2');
    expect(u).toContain('forecast_hours=10');
    expect(hoursKey({ lat: 46.9481, lon: 7.4474 })).toBe('wx-hours:46.95,7.45');
  });
  it('reads each model and leaves out a model without values', () => {
    const d = parseHours(answer((m) => (m === 'icon_d2' ? null : 0)));
    expect(d.models.map((m) => m.id)).toEqual(['meteoswiss_icon_ch1', 'meteoswiss_icon_ch2', 'meteofrance_arome_france_hd', 'ecmwf_ifs025']);
    expect(d.models[0].hours[0]).toMatchObject({ ms: T0, temp: 18, rainMm: 0, gust: 20 });
    expect(d.offset).toBe(7200);
  });
});

describe('the next 2, 4, 6 and 8 hours', () => {
  it('one model: rain sum, first wet hour, temperatures, strongest gust', () => {
    const d = parseHours(answer((m, i) => (i === 3 ? 1.2 : 0), (m, i) => 14 + i));
    const w = modelWindow(d.models[0].hours, T0, 4);
    expect(w).toMatchObject({ rainMm: 1.2, rainFrom: T0 + 3 * 36e5, tmin: 14, tmax: 17, gust: 23, thunder: false });
    expect(modelWindow(d.models[0].hours, T0, 2).rainMm).toBe(0);
  });
  it('says where the models agree and where not', () => {
    // MeteoSwiss 1 km and AROME see rain from hour 5, the others stay dry
    const d = parseHours(answer((m, i) => ((m === 'meteoswiss_icon_ch1' || m === 'meteofrance_arome_france_hd') && i >= 5 ? 0.8 : 0)));
    const s = steps(d, T0);
    expect(s.map((x) => x.h)).toEqual([2, 4, 6, 8]);
    expect(s[0]).toMatchObject({ agree: 'dry', wet: 0, of: 5 });
    expect(s[2]).toMatchObject({ agree: 'split', wet: 2, of: 5, rainFrom: T0 + 5 * 36e5 });
    expect(s[2].rainMm).toEqual([0, 0.8]);
  });
  it('all wet, and nothing at all without data', () => {
    const d = parseHours(answer(() => 2));
    expect(steps(d, T0)[0]).toMatchObject({ agree: 'wet', wet: 5, of: 5 });
    expect(steps(null, T0)[0]).toMatchObject({ agree: null, of: 0 });
  });
});

describe('keeping the answer', () => {
  const store = () => {
    const m = new Map();
    return { meta: { get: async (k) => m.get(k), put: async (row) => m.set(row.key, row) } };
  };
  it('asks once, keeps it for an hour, shows it offline with «old»', async () => {
    const db = store();
    let calls = 0;
    const fetcher = async () => (calls++, { ok: true, json: async () => answer() });
    const place = { lat: 46.95, lon: 7.45 };
    const a = await loadHours(db, place, { fetcher, now: T0 });
    expect(a.models).toHaveLength(5);
    await loadHours(db, place, { fetcher, now: T0 + 30 * 6e4 });
    expect(calls).toBe(1);
    const off = await loadHours(db, place, { fetcher, now: T0 + 2 * 36e5, online: false });
    expect(off.old).toBe(true);
    expect(await loadHours(db, place, { fetcher, now: T0 + 7 * 36e5, online: false })).toBeNull();
  });
});
