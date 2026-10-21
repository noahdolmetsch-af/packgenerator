/** Glätte-Push (Paket Wetter): the morning ice warning at home and ice on the tour day. */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/i18n.svelte.js', () => ({ t: (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : s), locale: () => 'de-CH' }));

const { cleanList, weatherReasons, weatherMessage, forecastUrl, REASONS } = await import('../api/_lib/push.js');
const { buildList, KINDS, ICE_DAYS } = await import('../src/lib/push/schedule.js');

const day = (o) => ({ time: ['2026-11-20'], weather_code: [o.code ?? 3], wind_gusts_10m_max: [o.gust ?? 20], temperature_2m_max: [o.tmax ?? 4], temperature_2m_min: [o.tmin ?? -1], precipitation_sum: [o.mm ?? 0] });
const HOME = { name: 'Testdorf', lat: 47.1, lon: 8.2 };
const ON = (kinds) => ({ on: true, kinds: Object.fromEntries(kinds.map((k) => [k, true])) });

describe('ice on the server', () => {
  it('warns of ice only around 0 °C with rain or snow', () => {
    expect(weatherReasons(day({ tmin: -1, mm: 0 }), '2026-11-20').reasons).toEqual([]);
    expect(weatherReasons(day({ tmin: -1, mm: 1.5 }), '2026-11-20').reasons).toEqual(['ice']);
    expect(weatherReasons(day({ tmin: 0.5, code: 71 }), '2026-11-20').reasons).toEqual(['ice']);
    expect(weatherReasons(day({ tmin: 3, mm: 5 }), '2026-11-20').reasons).toEqual([]);
    expect(weatherReasons(day({ tmin: -2, mm: 2, code: 95, gust: 70 }), '2026-11-20').reasons).toEqual(['thunder', 'ice', 'storm']);
    expect(REASONS).toEqual(['thunder', 'ice', 'storm', 'heat']);
  });
  it('asks Open-Meteo for the coldest hour and the rain', () => {
    expect(forecastUrl({ lat: 47, lon: 8, date: '2026-11-20' })).toContain('temperature_2m_min,precipitation_sum');
  });
  it('an ice check tells only of ice, with the coldest temperature', () => {
    const texts = { ice: 'Glatt bis {temp} °C.', storm: 'Sturm.', ititle: 'Glätte-Warnung', title: 'Wetter' };
    const w = cleanList({ weather: [{ key: 'ice:2026-11-20', at: 1, date: '2026-11-20', lat: 47, lon: 8, only: ['ice', 'nonsense'], url: '#/wetter' }] }).weather[0];
    expect(w.only).toEqual(['ice']);
    expect(weatherMessage(w, { reasons: ['storm'], tmax: 4, tmin: -2 }, texts)).toBeNull();
    expect(weatherMessage(w, { reasons: ['storm', 'ice'], tmax: 4, tmin: -2.4 }, texts)).toEqual({ title: 'Glätte-Warnung', body: 'Glatt bis -2 °C.', url: '#/wetter', tag: 'ice:2026-11-20' });
    // a tour-day check without «only» keeps the order thunder, ice, storm, heat
    expect(weatherMessage({ key: 'wx', title: 'Testtour', url: '#/pack' }, { reasons: ['ice', 'storm'], tmax: 4, tmin: -1 }, texts).body).toBe('Glatt bis -1 °C.');
  });
});

describe('ice in the app', () => {
  it('has its own switch', () => {
    expect(KINDS.some((k) => k.key === 'ice')).toBe(true);
  });
  it('checks the home place each morning in the cold months, not on a tour day with its own check', () => {
    const now = new Date(2026, 10, 20, 5, 0); // 20.11.2026 05:00
    const trips = [{ id: 't1', title: 'Testtour', status: 'planned', startDate: '2026-11-22', days: 1 }];
    const l = buildList({ trips, settings: { push: ON(['ice', 'weather']), homePlace: HOME }, now });
    const ice = l.weather.filter((w) => w.only);
    expect(ice).toHaveLength(ICE_DAYS - 1);
    expect(ice.map((w) => w.date)).not.toContain('2026-11-22');
    expect(ice[0]).toMatchObject({ key: 'ice:2026-11-20', date: '2026-11-20', lat: 47.1, lon: 8.2, url: '#/wetter', only: ['ice'] });
    expect(l.texts.ice).toContain('{temp}');
    expect(l.weather.find((w) => w.key.startsWith('wx:'))?.date).toBe('2026-11-22');
  });
  it('sends nothing in summer, without a home place or with the switch off', () => {
    const summer = new Date(2026, 6, 10, 5, 0);
    expect(buildList({ settings: { push: ON(['ice']), homePlace: HOME }, now: summer }).weather).toEqual([]);
    const now = new Date(2026, 10, 20, 5, 0);
    expect(buildList({ settings: { push: ON(['ice']) }, now }).weather).toEqual([]);
    const off = buildList({ settings: { push: ON(['backup']), homePlace: HOME }, now });
    expect(off.weather).toEqual([]);
    expect(off.texts.ice).toBe('');
  });
});
