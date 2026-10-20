/**
 * Wetter der Fahrt (Noah 20.10.2026 «4a»): the weather of a finished tour, written down afterwards. From
 * Open-Meteo, free and without a key (as weather.js): the last weeks from the forecast service (it keeps
 * about three months back), older days from its archive. The place is where the ride started (the first
 * point of its line) or the trip's place. Stored with the tour:
 *   activity.weather or trip.wxReal = { fetchedAt, place: { lat, lon }, days: [{ date, min, max, rainMm,
 *     wind, gust, hourly: { t: [24 °C], r: [24 mm] } }] }
 * The same day shape as trip.forecast, so the Rückblick reads it too (rueckblick.js weatherOf).
 */
import { decodePolyline } from '../spur/polyline.js';

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
/** Days back the forecast service still has; older days come from the archive. */
export const RECENT_DAYS = 60;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
const r4 = (n) => Math.round(n * 1e4) / 1e4;
const between = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** Where the tour started: { lat, lon } from the first line, else the trip's place, else null. */
export function startPlace(acts = [], trip = null) {
  for (const a of acts) {
    const pts = a?.line ? decodePolyline(a.line) : [];
    if (pts.length) return { lat: r4(pts[0][0]), lon: r4(pts[0][1]) };
  }
  const p = trip?.place ?? trip?.forecast?.place;
  if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) return { lat: p.lat, lon: p.lon };
  const line = trip?.route?.line;
  if (Array.isArray(line) && line.length && Array.isArray(line[0])) return { lat: r4(line[0][0]), lon: r4(line[0][1]) };
  return null;
}

/** The address to ask, for the days from … to (YYYY-MM-DD). */
export function wxUrl(place, from, to, today) {
  const base = between(from, today) <= RECENT_DAYS ? FORECAST : ARCHIVE;
  return `${base}?latitude=${place.lat}&longitude=${place.lon}&start_date=${from}&end_date=${to}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&hourly=temperature_2m,precipitation&timezone=auto`;
}

/** Open-Meteo's answer → the days to store. */
export function wxDays(data = {}) {
  const daily = data.daily ?? {};
  const hours = new Map();
  for (const [n, stamp] of (data.hourly?.time ?? []).entries()) {
    const [date, time] = String(stamp).split('T');
    const h = Number(String(time ?? '').slice(0, 2));
    if (!date || !Number.isInteger(h) || h < 0 || h > 23) continue;
    if (!hours.has(date)) hours.set(date, { t: Array(24).fill(null), r: Array(24).fill(null) });
    hours.get(date).t[h] = num(data.hourly.temperature_2m?.[n]);
    hours.get(date).r[h] = num(data.hourly.precipitation?.[n]);
  }
  return (daily.time ?? []).map((date, n) => ({
    date,
    min: num(daily.temperature_2m_min?.[n]),
    max: num(daily.temperature_2m_max?.[n]),
    rainMm: num(daily.precipitation_sum?.[n]),
    wind: num(daily.wind_speed_10m_max?.[n]),
    gust: num(daily.wind_gusts_10m_max?.[n]),
    ...(hours.has(date) ? { hourly: hours.get(date) } : {}),
  }));
}

/** Fetch the weather of the days from … to at the place. Throws when the service does not answer. */
export async function fetchTourWeather(place, from, to, today, fetcher = fetch, now = new Date()) {
  const res = await fetcher(wxUrl(place, from, to, today));
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const days = wxDays(await res.json());
  return { fetchedAt: now.toISOString(), place: { lat: place.lat, lon: place.lon }, days };
}

/**
 * The weather in a few numbers: coldest and warmest, rain and the strongest wind of the days; with one
 * activity also while riding (from its start time over its elapsed time, the hours of the day).
 * → { tmin, tmax, mm, wind, gust, ride: { tmin, tmax, mm } | null } or null without days.
 */
export function wxSummary(wx, act = null) {
  const days = wx?.days ?? [];
  if (!days.length) return null;
  const vals = (k) => days.map((x) => x[k]).filter((v) => typeof v === 'number');
  const mins = vals('min');
  const maxs = vals('max');
  const rain = vals('rainMm');
  const wind = vals('wind');
  const gust = vals('gust');
  const out = {
    tmin: mins.length ? Math.round(Math.min(...mins)) : null,
    tmax: maxs.length ? Math.round(Math.max(...maxs)) : null,
    mm: rain.length ? Math.round(rain.reduce((s, v) => s + v, 0) * 10) / 10 : null,
    wind: wind.length ? Math.round(Math.max(...wind)) : null,
    gust: gust.length ? Math.round(Math.max(...gust)) : null,
    ride: null,
  };
  const day = act ? days.find((x) => x.date === act.day) : null;
  const m = /^(\d{1,2}):/.exec(act?.time ?? '');
  if (day?.hourly && m) {
    const from = Number(m[1]);
    const secs = act.elapsedS || act.movingS || 3600;
    const to = Math.min(23, from + Math.max(0, Math.ceil(secs / 3600) - 1));
    const ts = day.hourly.t.slice(from, to + 1).filter((v) => typeof v === 'number');
    const rs = day.hourly.r.slice(from, to + 1).filter((v) => typeof v === 'number');
    if (ts.length) out.ride = { tmin: Math.round(Math.min(...ts)), tmax: Math.round(Math.max(...ts)), mm: Math.round(rs.reduce((s, v) => s + v, 0) * 10) / 10 };
  }
  return out;
}
