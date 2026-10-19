/**
 * Tageswerte für die «Erkenntnisse» (Noah 19.10.2026 «2a 3a»): the weather and daylight of every day at the
 * home place, and how many appointments the Google calendar had that day, kept quietly on this device.
 *
 * - Weather: Open-Meteo (free, no key) gives the last 92 days in one call (past_days), so one fetch a day
 *   is enough and a missed week fills itself in. Only finished days are kept (today is not over yet).
 * - Appointments: the calendar copy (db.gEvents) only reaches 7 days back, so every fetch also notes the
 *   count per day here. Timed events only: all-day ones are mostly birthdays, holidays or trips.
 * Both live in `meta` (this device only, not in the backup, not synced): the weather can be fetched again,
 * the counts are a by-product of Google's calendar, which keeps the truth.
 */
import { HOME_PLACE } from './know.js';
import { localDay } from './localday.js';

export const DAY_WEATHER = 'dayWeather';
export const DAY_EVENTS = 'dayEvents';
/** Days kept per record (a bit more than a year). */
export const KEEP_DAYS = 400;
/** Open-Meteo's longest look back in the forecast call. */
export const PAST_DAYS = 92;

const API = 'https://api.open-meteo.com/v1/forecast';
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const weatherUrl = (place) =>
  `${API}?latitude=${place.lat}&longitude=${place.lon}&daily=temperature_2m_max,precipitation_sum,sunshine_duration,daylight_duration&timezone=auto&past_days=${PAST_DAYS}&forecast_days=1`;

/** Open-Meteo's answer → { day: { tmax, rainMm, sunH, lightH } } for the days before `today`. */
export function weatherDays(json, today) {
  const d = json?.daily ?? {};
  const out = {};
  for (const [i, day] of (d.time ?? []).entries()) {
    if (!isDay(day) || day >= today) continue;
    const sec = (v) => (typeof v === 'number' && Number.isFinite(v) ? num(v / 3600) : null);
    const row = { tmax: num(d.temperature_2m_max?.[i]), rainMm: num(d.precipitation_sum?.[i]), sunH: sec(d.sunshine_duration?.[i]), lightH: sec(d.daylight_duration?.[i]) };
    if (Object.values(row).some((v) => v != null)) out[day] = row;
  }
  return out;
}

/** Old and new days together, the newest KEEP_DAYS days kept (new values win). */
export function mergeDays(old = {}, fresh = {}) {
  const all = { ...(old ?? {}), ...(fresh ?? {}) };
  const keep = Object.keys(all).filter(isDay).sort().slice(-KEEP_DAYS);
  return Object.fromEntries(keep.map((d) => [d, all[d]]));
}

/** The same place (within ~5 km), so the kept days still belong to it. */
const samePlace = (a, b) => !!a && !!b && Math.abs(a.lat - b.lat) < 0.05 && Math.abs(a.lon - b.lon) < 0.05;

/**
 * Fetch the weather of the last days once a day and keep it. Quiet: without a home place, offline or when the
 * service fails nothing happens. Returns true when something new was kept.
 */
export async function keepDayWeather(db, { fetcher = fetch, today = localDay(), online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  const place = (await db.settings.get(HOME_PLACE))?.value ?? null;
  if (!place || typeof place.lat !== 'number' || typeof place.lon !== 'number' || !online) return false;
  const saved = (await db.meta.get(DAY_WEATHER)) ?? null;
  const same = samePlace(saved?.place, place);
  if (same && saved?.fetchedDay === today) return false;
  try {
    const res = await fetcher(weatherUrl(place));
    if (!res.ok) return false;
    const fresh = weatherDays(await res.json(), today);
    await db.meta.put({ key: DAY_WEATHER, fetchedDay: today, place: { lat: place.lat, lon: place.lon }, days: mergeDays(same ? saved.days : {}, fresh) });
    return true;
  } catch {
    return false;
  }
}

/** The timed events per day from..to (every day of the span, 0 when none). Days after `today` are left out. */
export function eventCounts(events = [], from, to, today = to) {
  if (!isDay(from) || !isDay(to) || to < from) return {};
  const end = today < to ? today : to;
  const out = {};
  for (let d = from; d <= end; d = addDays(d, 1)) out[d] = 0;
  for (const e of events) {
    if (!e || e.allDay || !isDay(e.day) || !(e.day in out)) continue;
    out[e.day] += 1;
  }
  return out;
}

/** Note the appointments per day of a calendar fetch (from..to, the whole span came from Google). */
export async function keepDayEvents(db, events, from, to, today = localDay()) {
  const fresh = eventCounts(events, from, to, today);
  if (!Object.keys(fresh).length) return;
  await db.transaction('rw', db.meta, async () => {
    const saved = (await db.meta.get(DAY_EVENTS)) ?? null;
    await db.meta.put({ key: DAY_EVENTS, days: mergeDays(saved?.days, fresh) });
  });
}

/** The kept records as plain maps: { weather: { day: {…} }, events: { day: n } }. */
export async function loadDayData(db) {
  const [w, e] = await Promise.all([db.meta.get(DAY_WEATHER), db.meta.get(DAY_EVENTS)]);
  return { weather: w?.days ?? {}, events: e?.days ?? {} };
}
