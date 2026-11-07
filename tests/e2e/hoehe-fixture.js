// Made-up place and air layers for the specs of «Temperaturen nach Höhe» (hoehe.spec.js, hoehe-heute.spec.js).
import { day } from './home0460-fixture.js';

export const OFF = 7200;
const Z = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500, 800: 1950, 700: 3000, 600: 4200 };
const T = { 1000: 10, 975: 8, 950: 6.5, 925: 5, 900: 3.5, 850: 0.5, 800: -2.5, 700: -9, 600: -19 };

// 4 days of hours from day(-1): every day 4 degrees warmer than the one before
export function layers(from, elevation) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 96 }, (_, i) => (t0 + i * 36e5) / 1000);
  const col = (f) => time.map((_, i) => f(i));
  const hourly = { time, temperature_2m: col((i) => 9 + Math.floor(i / 24) * 4), relative_humidity_2m: col(() => 60), cloud_cover_low: col(() => 5), cloud_cover_mid: col(() => 0), cloud_cover_high: col(() => 0), visibility: col(() => 24000) };
  for (const l of Object.keys(Z)) {
    hourly[`geopotential_height_${l}hPa`] = col(() => Z[l]);
    hourly[`temperature_${l}hPa`] = col((i) => T[l] + Math.floor(i / 24) * 4);
    hourly[`relative_humidity_${l}hPa`] = col(() => 50);
  }
  return { latitude: 47.39, longitude: 8.04, elevation, utc_offset_seconds: OFF, hourly };
}
export function core(from) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 24 * 16 }, (_, i) => (t0 + i * 36e5) / 1000);
  const all = (v) => time.map(() => v);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 410, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: all(6), apparent_temperature: all(4), precipitation_probability: all(5), precipitation: all(0), weather_code: all(3), wind_speed_10m: all(10), wind_gusts_10m: all(15), wind_direction_10m: all(270), cape: all(0), freezing_level_height: all(2200), visibility: all(20000), snowfall: all(0), snow_depth: all(0), snowfall_height: all(1900) },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 17 * 36e5) / 1000), uv_index_max: [2, 2, 2] },
  };
}
export const mock = async (context) => {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1)) }));
  // a place above 1000 m (Davos: latitude 46.8) lies higher than the first layers; the others at 410 m
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cloud_cover_low/, (r) => r.fulfill({ json: layers(day(-1), /latitude=46\.80/.test(r.request().url()) ? 1560 : 410) }));
  await context.route(/geocoding-api\.open-meteo\.com\//, (r) => r.fulfill({ json: { results: [{ name: 'Splügen', latitude: 46.55, longitude: 9.33, admin1: 'Graubünden', country: 'Schweiz' }] } }));
};

