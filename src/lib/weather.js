/**
 * Weather forecast for a trip (Noah, 4.10.2026, answers 4a and 5a): from Open-Meteo, a free
 * service without a key. It needs the internet; offline the app shows the forecast it saved last.
 *
 * The place is typed in by hand (trip.place = { name, lat, lon }) or comes from a GPX route.
 * The forecast is stored on the trip:
 *   trip.forecast = { fetchedAt, place, days: [{ date, min, max, rainMm, rainPct }] }
 * "Use forecast" turns it into the packing weather trip.wx = { min, max, rain }.
 */
import { t, tn } from './i18n.svelte.js';

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const API = 'https://api.open-meteo.com/v1/forecast';
/** Open-Meteo forecasts 16 days ahead. */
export const FORECAST_DAYS = 16;

/** Search places by name. Returns [{ name, detail, lat, lon }]. */
export async function searchPlace(query, fetcher = fetch) {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetcher(`${GEO}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
  if (!res.ok) throw new Error(t('Place search failed ({status})', { status: res.status }));
  const data = await res.json();
  return (data.results ?? []).map((r) => ({
    name: r.name,
    detail: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: round(r.latitude),
    lon: round(r.longitude),
  }));
}

const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

/** Fetch the daily forecast for a place. Returns the object to store as trip.forecast. */
export async function fetchForecast(place, fetcher = fetch, now = new Date()) {
  const url = `${API}?latitude=${place.lat}&longitude=${place.lon}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=${FORECAST_DAYS}`;
  const res = await fetcher(url);
  if (!res.ok) throw new Error(t('Forecast failed ({status})', { status: res.status }));
  const { daily = {} } = await res.json();
  const days = (daily.time ?? []).map((date, n) => ({
    date,
    min: num(daily.temperature_2m_min?.[n]),
    max: num(daily.temperature_2m_max?.[n]),
    rainMm: num(daily.precipitation_sum?.[n]),
    rainPct: num(daily.precipitation_probability_max?.[n]),
  }));
  return { fetchedAt: now.toISOString(), place: { name: place.name, lat: place.lat, lon: place.lon }, days };
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The trip's days (YYYY-MM-DD). */
export const tripDays = (trip) => (trip?.startDate ? Array.from({ length: Math.max(1, Number(trip.days) || 1) }, (_, n) => addDays(trip.startDate, n)) : []);

/** The first day a forecast reaches the trip (16 days before it starts). */
export const forecastFrom = (trip) => (trip?.startDate ? addDays(trip.startDate, -(FORECAST_DAYS - 1)) : null);

/** The forecast days that fall on the trip. */
export function forecastForTrip(trip) {
  const want = new Set(tripDays(trip));
  return (trip?.forecast?.days ?? []).filter((d) => want.has(d.date));
}

/**
 * The packing weather from the forecast days: coldest min, warmest max (rounded), and rain:
 * "rain" when a day has 5 mm or more, "showers" when a day has 1 mm or a chance of 50 % or more.
 */
export function toWx(days) {
  const mins = days.map((d) => d.min).filter((v) => v != null);
  const maxs = days.map((d) => d.max).filter((v) => v != null);
  if (!mins.length || !maxs.length) return null;
  const rainy = (d, mm, pct) => (d.rainMm ?? 0) >= mm || (pct != null && (d.rainPct ?? 0) >= pct);
  const rain = days.some((d) => rainy(d, 5, null)) ? 'rain' : days.some((d) => rainy(d, 1, 50)) ? 'showers' : 'none';
  return { min: Math.floor(Math.min(...mins)), max: Math.ceil(Math.max(...maxs)), rain };
}

/** How old a saved forecast is, as words ("today", "1 day ago", "3 days ago"). */
export function ageText(iso, now = new Date()) {
  const days = Math.floor((now - new Date(iso)) / 864e5);
  if (days <= 0) {
    const h = Math.floor((now - new Date(iso)) / 36e5);
    return h < 1 ? t('just now') : t('{h} h ago', { h });
  }
  return tn(days, '{n} day ago', '{n} days ago');
}
