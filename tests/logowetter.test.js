// «Logo-Wetter» (Geheimmenü H9): the picture and sentence from the home forecast of Today (fictional numbers).
import { describe, it, expect } from 'vitest';
import { logoWeather, SNOW_AT } from '../src/lib/logo/wetter.js';

const tr = (s) => s;
const NOON = new Date(2026, 9, 14, 12, 0, 0); // 14.10.2026, 12:00 local (before 18:00: today counts)
const day = (p, t = 14) => ({ date: '2026-10-14', min: 7, max: 16, rainMm: 0, rainPct: 10, rain: 'none', hourly: { t: Array(24).fill(t), p } });
const hours = (fromWet) => Array.from({ length: 24 }, (_, h) => (fromWet != null && h >= fromWet ? 80 : 5));

describe('logo weather', () => {
  it('no forecast: none, with the words', () => {
    expect(logoWeather(null, NOON, tr)).toEqual({ kind: 'none', text: 'No weather loaded.' });
    expect(logoWeather({ days: [] }, NOON, tr).kind).toBe('none');
  });
  it('dry for hours: a sun with the sentence of Today', () => {
    const w = logoWeather({ days: [day(hours(null))] }, NOON, tr);
    expect(w.kind).toBe('sun');
    expect(w.text).toContain('14°');
  });
  it('rain starts soon: rain; cold with rain: snow', () => {
    expect(logoWeather({ days: [day(hours(13))] }, NOON, tr).kind).toBe('rain');
    expect(logoWeather({ days: [day(hours(12), SNOW_AT)] }, NOON, tr).kind).toBe('snow');
  });
});
