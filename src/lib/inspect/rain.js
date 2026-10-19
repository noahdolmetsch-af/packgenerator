/**
 * «Velo-Inspektion» 3a: which days it rained at the home place (settings 'homePlace' = { name, lat, lon }),
 * so a ride on a rainy day weighs more. Free and without a key: Open-Meteo, the daily rain of the last
 * 92 days in one request. Kept in the meta table (never in a backup, never synced), fetched at most every
 * 12 hours and only online; older days stay (up to a year), so the weights also work offline.
 * Noah 19.10.2026 «3a»: a Strava ride brings the cell where it started (kmBook spot '47.4,8.5', about 10 km);
 * the rain of the most ridden cells of the last 92 days is fetched too (spots), so such a ride counts the rain
 * where it was. Rides without a cell (hand, CSV, Garmin) count the rain at home.
 * An estimate: the rain at the start, not along the route (the card says so).
 */
import { INSPECT_RAIN, WET_MM, addDays } from './inspect.js';

const API = 'https://api.open-meteo.com/v1/forecast';
export const RAIN_EVERY_MS = 12 * 3600e3;
const KEEP_DAYS = 400;
/** At most this many ride cells are fetched (the most ridden first): a few requests, not one per ride. */
export const MAX_SPOTS = 6;

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

/** '47.4,8.5' → { lat, lon }, or null. */
export function spotPlace(spot) {
  const m = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(String(spot ?? ''));
  return m ? { lat: Number(m[1]), lon: Number(m[2]) } : null;
}

/** The cells of the counted rides of the last 92 days, the most ridden first, at most MAX_SPOTS. */
export function spotsToFetch(entries, today, max = MAX_SPOTS) {
  const from = addDays(today, -92);
  const n = {};
  for (const e of entries ?? []) if (e?.spot && spotPlace(e.spot) && e.state === 'counted' && e.date >= from && e.date <= today) n[e.spot] = (n[e.spot] ?? 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([k]) => k);
}

/**
 * Was a ride wet? → a function (ride) → boolean for the due rules (inspect.js isWet): the rain of its
 * start cell when that is known, else the rain at home.
 */
export function wetOf(rec, mm = WET_MM) {
  const home = wetSet(rec?.days, mm);
  const spots = Object.fromEntries(Object.entries(rec?.spots ?? {}).map(([k, v]) => [k, wetSet(v?.days, mm)]));
  return (e) => (e?.spot && spots[e.spot] ? spots[e.spot] : home).has(e?.date);
}

/** Does the saved rain need a fresh fetch (another place or older than 12 h)? */
export const rainStale = (saved, place, now = Date.now()) => !saved || saved.lat !== place.lat || saved.lon !== place.lon || !(now - Date.parse(saved.at ?? 0) < RAIN_EVERY_MS);

/**
 * Fetch when needed and keep it. → the saved record { key, at, lat, lon, place, days } or null
 * (no home place). Fails quietly offline: the saved days stay.
 */
export async function refreshRain(db, { fetcher = fetch, now = Date.now(), today, online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  const place = (await db.settings.get('homePlace'))?.value ?? null;
  const saved = (await db.meta.get(INSPECT_RAIN)) ?? null;
  if (!online) return saved;
  const get = async (p) => {
    try {
      const res = await fetcher(rainUrl(p));
      return res.ok ? parseRain(await res.json()) : null;
    } catch {
      return null;
    }
  };
  let rec = saved ? { ...saved, spots: { ...(saved.spots ?? {}) } } : { key: INSPECT_RAIN, at: null, lat: null, lon: null, place: '', days: {}, spots: {} };
  let changed = false;
  if (place && typeof place.lat === 'number' && typeof place.lon === 'number' && rainStale(saved, place, now)) {
    const fresh = await get(place);
    if (fresh) {
      const days = mergeRain(saved?.lat === place.lat && saved?.lon === place.lon ? saved.days : {}, fresh, today);
      rec = { ...rec, at: new Date(now).toISOString(), lat: place.lat, lon: place.lon, place: place.name ?? '', days };
      changed = true;
    }
  }
  // «3a»: the cells where the rides started (each at most every 12 hours)
  const cells = spotsToFetch(await db.kmBook.where('date').aboveOrEqual(addDays(today, -92)).toArray(), today);
  for (const k of cells) {
    const old = rec.spots[k];
    if (old && now - Date.parse(old.at ?? 0) < RAIN_EVERY_MS) continue;
    const fresh = await get(spotPlace(k));
    if (!fresh) continue;
    rec.spots[k] = { at: new Date(now).toISOString(), days: mergeRain(old?.days ?? {}, fresh, today) };
    changed = true;
  }
  if (!changed) return saved;
  await db.meta.put(rec);
  return rec;
}
