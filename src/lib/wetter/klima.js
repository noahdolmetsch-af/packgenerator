/**
 * Paket Y extra 2 «Klimawerte weit voraus» (Noah 20.10.2026 «1-8 alle»): for a day further away than the
 * 16 days of the forecast, how the weather was on these days in the last 10 years (Open-Meteo historical
 * weather, free, no key): the usual high and low, how many days had rain, the usual wind. A guide, not a
 * forecast. One request per place, kept on this device for 30 days.
 * Pure functions plus loadClimate (takes the db and a fetcher). Tested in tests/wetter-klima.test.js.
 */
export const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
export const CLIMATE_KEY = 'wx-climate:';
export const YEARS = 10;
export const SPAN_DAYS = 3;
export const KEEP_DAYS = 30;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const r1 = (v) => Math.round(v * 10) / 10;

export function archiveUrl(place, fromYear, toYear) {
  const q = new URLSearchParams({
    latitude: Number(place.lat).toFixed(2),
    longitude: Number(place.lon).toFixed(2),
    start_date: `${fromYear}-01-01`,
    end_date: `${toYear}-12-31`,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
  });
  return `${ARCHIVE}?${q}`;
}

/** Days of the year apart (wraps over new year). */
const doy = (iso) => {
  const d = Date.parse(`${iso}T00:00:00Z`);
  return Math.floor((d - Date.parse(`${iso.slice(0, 4)}-01-01T00:00:00Z`)) / 864e5);
};
const near = (a, b, span) => {
  const x = Math.abs(doy(a) - doy(b));
  return Math.min(x, 365 - x) <= span;
};

/**
 * The usual weather around date (±span days) in the answer: { tmax, tmin, rainShare (0…1, days with 1 mm
 * or more), windMax, days, years } or null.
 */
export function climateFor(json, date, span = SPAN_DAYS) {
  const d = json?.daily;
  if (!d?.time?.length) return null;
  const rows = d.time.map((t, i) => ({ t, max: d.temperature_2m_max?.[i], min: d.temperature_2m_min?.[i], rain: d.precipitation_sum?.[i], wind: d.wind_speed_10m_max?.[i] })).filter((r) => fin(r.max) && near(r.t, date, span));
  if (!rows.length) return null;
  const avg = (k) => r1(rows.map((r) => r[k]).filter(fin).reduce((s, x, _, a) => s + x / a.length, 0));
  return {
    tmax: Math.round(avg('max')),
    tmin: Math.round(avg('min')),
    rainShare: Math.round((rows.filter((r) => fin(r.rain) && r.rain >= 1).length / rows.length) * 100) / 100,
    windMax: Math.round(avg('wind')),
    days: rows.length,
    years: new Set(rows.map((r) => r.t.slice(0, 4))).size,
  };
}

/** The archive for a place (the last YEARS whole years), kept KEEP_DAYS on this device. */
export async function loadClimate(db, place, { fetcher = fetch, now = Date.now() } = {}) {
  if (!place) return null;
  const key = `${CLIMATE_KEY}${Number(place.lat).toFixed(1)},${Number(place.lon).toFixed(1)}`;
  const kept = await db.meta.get(key);
  if (kept && now - kept.at < KEEP_DAYS * 864e5) return kept.data;
  const y = new Date(now).getUTCFullYear() - 1;
  const res = await fetcher(archiveUrl(place, y - YEARS + 1, y));
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  const j = await res.json();
  const data = { daily: j.daily };
  await db.meta.put({ key, at: now, data });
  return data;
}
