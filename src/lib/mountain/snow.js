/**
 * Paket J «Berg, Schnee und Notfall» #160 (Noah 19.10.2026 «1a und b und als sichtbar auf der
 * skitouren seite»): the freezing level and the fresh snow for a tour in the mountains, from
 * Open-Meteo (free, no key). Shown in the planning of every ski tour and every mountain tour, and on
 * the Skitouren page. Numbers only: the app never rates avalanche or weather danger.
 *
 * Stored on the trip (offline the last one shows):
 *   trip.snow = { fetchedAt, place: { name, lat, lon }, elevation, days: [{ date, freezeM, freezeLowM, snowCm, depthCm }] }
 *   freezeM: the highest freezing level between 6 and 18 h; freezeLowM: the lowest (the morning);
 *   snowCm: fresh snow that day; depthCm: snow depth at noon at the model's height (elevation).
 * trip.snowOff = true hides the box on that trip (everything is a suggestion).
 * Pure apart from fetchSnow; tested in tests/bergnotfall.test.js.
 */
import { domainOf } from '../domains.js';

const API = 'https://api.open-meteo.com/v1/forecast';
/** The snow of the days before the tour counts this many days back. */
export const FRESH_DAYS = 3;
/** A bike trip whose route goes this high counts as a mountain tour. */
export const HIGH_M = 1500;
/** Sports that always go to the mountains. */
export const MOUNTAIN_DOMAINS = ['ski', 'hiking'];

/** The address that asks Open-Meteo (only the map point leaves the device, never a name). */
export const snowUrl = (place) =>
  `${API}?latitude=${place.lat}&longitude=${place.lon}&hourly=freezing_level_height,snowfall,snow_depth&daily=snowfall_sum&past_days=${FRESH_DAYS}&forecast_days=16&timezone=auto`;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const r10 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const r50 = (v) => (v == null ? null : Math.round(v / 50) * 50);

/** Open-Meteo's answer → the object stored as trip.snow. */
export function parseSnow(json, place, now = new Date()) {
  const daily = json?.daily ?? {};
  const h = json?.hourly ?? {};
  const byDay = new Map();
  for (const [n, stamp] of (h.time ?? []).entries()) {
    const [date, time] = String(stamp).split('T');
    const hour = Number(String(time ?? '').slice(0, 2));
    if (!date || !Number.isInteger(hour)) continue;
    if (!byDay.has(date)) byDay.set(date, { fl: [], depth: null });
    const d = byDay.get(date);
    const fl = num(h.freezing_level_height?.[n]);
    if (fl != null && hour >= 6 && hour <= 18) d.fl.push(fl);
    if (hour === 12) d.depth = num(h.snow_depth?.[n]);
  }
  const days = (daily.time ?? []).map((date, n) => {
    const d = byDay.get(date) ?? { fl: [], depth: null };
    return {
      date,
      freezeM: d.fl.length ? r50(Math.max(...d.fl)) : null,
      freezeLowM: d.fl.length ? r50(Math.min(...d.fl)) : null,
      snowCm: r10(num(daily.snowfall_sum?.[n])),
      depthCm: d.depth == null ? null : Math.round(d.depth * 100),
    };
  });
  return { fetchedAt: now.toISOString(), place: { name: place.name ?? '', lat: place.lat, lon: place.lon }, elevation: num(json?.elevation), days };
}

/** Fetch the snow for a place (online only). */
export async function fetchSnow(place, fetcher = fetch, now = new Date()) {
  const res = await fetcher(snowUrl(place));
  if (!res.ok) throw new Error(`snow ${res.status}`);
  return parseSnow(await res.json(), place, now);
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The trip's days (YYYY-MM-DD). */
const daysOf = (trip) => (trip?.startDate ? Array.from({ length: Math.max(1, Number(trip.days) || 1) }, (_, n) => addDays(trip.startDate, n)) : []);

/** Does this trip go to the mountains? Ski and hiking always; another trip when its route goes up to 1500 m. */
export function isMountain(trip) {
  if (!trip) return false;
  if (MOUNTAIN_DOMAINS.includes(domainOf(trip)) || MOUNTAIN_DOMAINS.includes(trip.domain)) return true;
  const top = Math.max(0, ...(trip.route?.profile ?? []).map((p) => Number(p?.[1]) || 0));
  return top >= HIGH_M;
}

/** Can the snow be fetched for this trip now? It has a place and a day within 16 days, not over. */
export function snowReach(trip, today) {
  const days = daysOf(trip);
  if (!trip?.place || !days.length) return false;
  return addDays(today, 15) >= days[0] && days.at(-1) >= today;
}

/**
 * What the box shows for a trip: its days (freezing level, fresh snow) and the fresh snow of the
 * three days before the start. Null when nothing is saved for the trip's days.
 */
export function snowForTrip(trip) {
  const want = daysOf(trip);
  const all = trip?.snow?.days ?? [];
  const days = all.filter((d) => want.includes(d.date));
  if (!days.length) return null;
  const before = new Set(Array.from({ length: FRESH_DAYS }, (_, n) => addDays(want[0], -(n + 1))));
  const prior = all.filter((d) => before.has(d.date) && d.snowCm != null);
  const fresh = prior.length ? r10(prior.reduce((s, d) => s + d.snowCm, 0)) : null;
  return { days, fresh, freshDays: prior.length, elevation: trip.snow.elevation ?? null, fetchedAt: trip.snow.fetchedAt };
}

/** Fetch again when online, in reach, and the saved one is older than 3 hours or for another place. */
export function snowStale(trip, now = Date.now()) {
  const s = trip?.snow;
  if (!s?.fetchedAt) return true;
  if (trip.place && (s.place?.lat !== trip.place.lat || s.place?.lon !== trip.place.lon)) return true;
  return now - new Date(s.fetchedAt).getTime() > 3 * 36e5;
}
