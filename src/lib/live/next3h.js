/**
 * «Kälte und Regen der nächsten 3 Stunden» (Noah 02.11.2026, Vorschlag 3): from the weather along the route, what the
 * next hours bring where you will be then, and one plain sentence («Jacke jetzt»). Pure: the ride gives the km, the
 * pace and the saved forecast (wx: { points: [{ km }], series: [] }); nothing is stored.
 *   → null without a forecast, else { rows: [{ h, km, temp, feels, rain, wind, dark }], verdict, h, value }
 *   verdict: 'rain' (≥ 50 %), 'cold' (feels < 8 °), 'cool' (< 15 °), 'wind' (≥ 30 km/h), 'ok'
 */
import { wxNear } from '../race/route-lib.js';
import { lightLeft } from './live-lib.js';

export const RAIN_AT = 50;
export const COLD_AT = 8;
export const COOL_AT = 15;
export const WIND_AT = 30;

export function nextHours({ wx, km, now = Date.now(), pace = {}, totalKm = null, hours = 3, pos = null }) {
  if (!wx?.points?.length || !wx?.series?.length || !Number.isFinite(km)) return null;
  const kmh = pace?.kmh > 0 ? pace.kmh : 18;
  const rows = [];
  for (let h = 0; h <= hours; h++) {
    const at = km + kmh * h;
    const k = Number.isFinite(totalKm) ? Math.min(at, totalKm) : at;
    const w = wxNear(wx, k, now + h * 36e5);
    if (w) rows.push({ h, km: Math.round(k * 10) / 10, temp: w.temp, feels: w.feels ?? w.temp, rain: w.rain, wind: w.wind, dark: pos ? (lightLeft(pos.lat, pos.lon, now + h * 36e5)?.dark ?? null) : null });
  }
  if (!rows.length) return null;
  const first = (f) => rows.find(f);
  const rainy = first((r) => r.rain != null && r.rain >= RAIN_AT);
  if (rainy) return { rows, verdict: 'rain', h: rainy.h, value: rainy.rain };
  const cold = first((r) => r.feels != null && r.feels < COLD_AT);
  if (cold) return { rows, verdict: 'cold', h: cold.h, value: Math.round(Math.min(...rows.map((r) => r.feels ?? 99))) };
  const cool = first((r) => r.feels != null && r.feels < COOL_AT);
  if (cool) return { rows, verdict: 'cool', h: cool.h, value: Math.round(Math.min(...rows.map((r) => r.feels ?? 99))) };
  const windy = first((r) => r.wind != null && r.wind >= WIND_AT);
  if (windy) return { rows, verdict: 'wind', h: windy.h, value: Math.round(windy.wind) };
  return { rows, verdict: 'ok', h: null, value: null };
}

export const RAIN_SOME = 30;

/** What one hour cell shows: rain 'high' (≥ 50 %) or 'some' (≥ 30 %), cold 'cold' (< 8 °) or 'cool' (< 15 °), wind (≥ 30 km/h). */
export function cellFlags(r) {
  return {
    rain: r.rain != null && r.rain >= RAIN_AT ? 'high' : r.rain != null && r.rain >= RAIN_SOME ? 'some' : null,
    cold: r.feels != null && r.feels < COLD_AT ? 'cold' : r.feels != null && r.feels < COOL_AT ? 'cool' : null,
    wind: r.wind != null && r.wind >= WIND_AT,
  };
}

/** One short thing to put on for an hour, from its flags (Noah 05.11.2026): 'rain', 'warm', 'arm', 'wind' or null. Rain wins, then cold, cool, wind. */
export function wearTip(f) {
  if (f.rain === 'high') return 'rain';
  if (f.cold === 'cold') return 'warm';
  if (f.cold === 'cool') return 'arm';
  if (f.wind) return 'wind';
  return null;
}
