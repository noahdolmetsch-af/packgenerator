/**
 * «Velo-Inspektion» 3a: which days it rained at the home place (settings 'homePlace' = { name, lat, lon }),
 * so a ride on a rainy day weighs more. Free and without a key: Open-Meteo, the daily rain of the last
 * 92 days in one request. Kept in the meta table (never in a backup, never synced), fetched at most every
 * 12 hours and only online; older days stay (up to a year), so the weights also work offline.
 * An estimate: the rain at home, not on the route (the card says so).
 */
import { INSPECT_RAIN, WET_MM, addDays } from './inspect.js';

const API = 'https://api.open-meteo.com/v1/forecast';
export const RAIN_EVERY_MS = 12 * 3600e3;
const KEEP_DAYS = 400;

/** The request for the last 92 days of rain at a place. */
export const rainUrl = (place) => `${API}?latitude=${Number(place.lat).toFixed(3)}&longitude=${Number(place.lon).toFixed(3)}&daily=precipitation_sum&past_days=92&forecast_days=1&timezone=Europe%2FZurich`;

/** Open-Meteo's answer → { 'YYYY-MM-DD': mm }. */
export function parseRain(json) {
  const d = json?.daily;
  if (!Array.isArray(d?.time) || !Array.isArray(d?.precipitation_sum)) return {};
  return Object.fromEntries(d.time.map((t, i) => [t, Number(d.precipitation_sum[i])]).filter(([t, v]) => typeof t === 'string' && Number.isFinite(v)));
}

/** The saved days plus the new ones (the new ones win), only the last KEEP_DAYS days before today. */
export function mergeRain(old = {}, fresh = {}, today) {
  const from = addDays(today, -KEEP_DAYS);
  return Object.fromEntries(Object.entries({ ...old, ...fresh }).filter(([d]) => d >= from && d <= today).sort(([a], [b]) => a.localeCompare(b)));
}

/** The rainy days as a Set. */
export const wetSet = (days = {}, mm = WET_MM) => new Set(Object.entries(days ?? {}).filter(([, v]) => v >= mm).map(([d]) => d));

/** Does the saved rain need a fresh fetch (another place or older than 12 h)? */
export const rainStale = (saved, place, now = Date.now()) => !saved || saved.lat !== place.lat || saved.lon !== place.lon || !(now - Date.parse(saved.at ?? 0) < RAIN_EVERY_MS);

/**
 * Fetch when needed and keep it. → the saved record { key, at, lat, lon, place, days } or null
 * (no home place). Fails quietly offline: the saved days stay.
 */
export async function refreshRain(db, { fetcher = fetch, now = Date.now(), today, online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  const place = (await db.settings.get('homePlace'))?.value ?? null;
  const saved = (await db.meta.get(INSPECT_RAIN)) ?? null;
  if (!place || typeof place.lat !== 'number' || typeof place.lon !== 'number') return saved;
  if (!online || !rainStale(saved, place, now)) return saved;
  try {
    const res = await fetcher(rainUrl(place));
    if (!res.ok) return saved;
    const days = mergeRain(saved?.lat === place.lat && saved?.lon === place.lon ? saved.days : {}, parseRain(await res.json()), today);
    const rec = { key: INSPECT_RAIN, at: new Date(now).toISOString(), lat: place.lat, lon: place.lon, place: place.name ?? '', days };
    await db.meta.put(rec);
    return rec;
  } catch {
    return saved;
  }
}
