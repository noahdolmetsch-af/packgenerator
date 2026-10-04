import { describe, it, expect } from 'vitest';
import { searchPlace, fetchForecast, forecastForTrip, toWx, forecastFrom, ageText } from '../src/lib/weather.js';

const fake = (body, ok = true) => async () => ({ ok, status: ok ? 200 : 500, json: async () => body });

describe('weather from Open-Meteo (answers 4a, 5a)', () => {
  it('searches places', async () => {
    const res = await searchPlace('Bern', fake({ results: [{ name: 'Bern', admin1: 'Bern', country: 'Switzerland', latitude: 46.94809, longitude: 7.44744 }] }));
    expect(res).toEqual([{ name: 'Bern', detail: 'Bern, Switzerland', lat: 46.9481, lon: 7.4474 }]);
    expect(await searchPlace('B', fake({}))).toEqual([]);
    await expect(searchPlace('Bern', fake({}, false))).rejects.toThrow(/failed/);
  });
  it('stores the forecast and picks the trip days', async () => {
    const f = await fetchForecast({ name: 'Bern', lat: 46.9, lon: 7.4 }, fake({
      daily: { time: ['2026-10-14', '2026-10-15', '2026-10-16'], temperature_2m_min: [3.2, 4.6, 2.1], temperature_2m_max: [12, 14.2, 11.5], precipitation_sum: [0, 0.4, 2], precipitation_probability_max: [10, 30, 60] },
    }), new Date('2026-10-04T10:00:00Z'));
    expect(f.days[1]).toEqual({ date: '2026-10-15', min: 4.6, max: 14.2, rainMm: 0.4, rainPct: 30 });
    const trip = { startDate: '2026-10-15', days: 3, forecast: f };
    const days = forecastForTrip(trip);
    expect(days.map((d) => d.date)).toEqual(['2026-10-15', '2026-10-16']);
    expect(toWx(days)).toEqual({ min: 2, max: 15, rain: 'showers' });
    expect(toWx([{ min: 10, max: 20, rainMm: 6 }])).toMatchObject({ rain: 'rain' });
    expect(toWx([{ min: 10, max: 20, rainMm: 0, rainPct: 20 }])).toMatchObject({ rain: 'none' });
    expect(toWx([])).toBeNull();
    expect(forecastFrom(trip)).toBe('2026-09-30');
    expect(ageText('2026-10-02T10:00:00Z', new Date('2026-10-04T11:00:00Z'))).toBe('2 days ago');
  });
});
