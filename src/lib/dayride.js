/**
 * v0.25.1 (Noah 1a, 2a, 3a): a day ride in one tap, a prefilled "New trip" dialog and the weather
 * from the forecast at the home place.
 *
 * Noah measured a day ride with v0.25.0 at 60 s: too many clicks and entries. Now
 *   - "Day ride" (Home, nav.js dayRide) makes the trip without a dialog, from the last day ride
 *     (bike, hours, weather) or sensible defaults, and Pack opens it with "Change" and "Undo";
 *   - the "New trip" dialog starts with a name, a start date and a bike, so "Create trip" works
 *     without typing;
 *   - with a home place (settings 'homePlace' = { name, lat, lon }) and the internet, the weather
 *     preset comes from the forecast for the start date (weather.js); offline it falls back silently.
 * The rules are pure functions (tests/dayride.test.js); only fetchHomeForecast talks to the network.
 */
import { newTrip, WX_PRESETS } from './trips.js';
import { tripFromTemplate } from './templates.js';
import { contextTrip } from './context.js';
import { hasBike } from './domains.js';
import { fetchForecast, toWx } from './weather.js';
import { t } from './i18n.svelte.js';
import { localDay } from './localday.js';

/** Hours of a day ride when no earlier day ride says otherwise. */
export const DAY_HOURS = 2;
/** The weather preset when neither the forecast nor an earlier day ride says otherwise. */
export const DAY_WX = 'Chilly';
/** From this hour on, a day ride is for tomorrow. */
export const LATE_HOUR = 14;

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The start date of a new ride (YYYY-MM-DD, local time): today before 14:00, else tomorrow. */
export function rideDate(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() >= LATE_HOUR) d.setDate(d.getDate() + 1);
  return iso(d);
}

/**
 * The short form of a bike name for a trip name: the first two words ("Scott Scale 940" →
 * "Scott Scale"); a name of one or two words stays as it is.
 */
export const bikeShort = (name) => `${name ?? ''}`.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(' ');

/** "11.10." for 2026-10-11 (the same in both languages, as Noah writes it). */
export const shortDate = (date) => {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date ?? '');
  return m ? `${Number(m[2])}.${Number(m[1])}.` : '';
};

/**
 * The automatic trip name: "Scott Scale day ride 11.10." («Scott Scale Tagestour 11.10.»).
 * More days: "Scott Scale 3 days 11.10.". Without a bike: "Ride day ride …" becomes the label
 * given (e.g. the area for a trip without a bike) or "Ride". Without a date the date is left out.
 */
export function rideName({ bike = '', label = '', date = '', days = 1 } = {}) {
  const who = bikeShort(bike) || label || t('Ride|dayride');
  const n = Math.max(1, Number(days) || 1);
  const text = n > 1 ? t('{bike} {n} days {date}', { bike: who, n, date: shortDate(date) }) : t('{bike} day ride {date}', { bike: who, date: shortDate(date) });
  return text.trim();
}

/**
 * v0.30.1 (Noah E6): a name no other trip has: a second day ride on the same day and bike is
 * "… day ride 11.10. (2)", so every one can be told apart in the lists.
 */
export function freeTitle(title, trips = []) {
  const taken = new Set(trips.map((x) => (x.title ?? '').trim().toLowerCase()));
  if (!taken.has(title.toLowerCase())) return title;
  let n = 2;
  while (taken.has(`${title} (${n})`.toLowerCase())) n++;
  return `${title} (${n})`;
}

/** Is this trip a day ride? One day, no night (or an older trip without that), not skipped, by bike. */
export const isDayRide = (trip) =>
  !!trip && !trip.skipped && hasBike(trip) && !(Number(trip.days) > 1) && (trip.overnight == null || trip.overnight === 'none');

const newest = (a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

/** The newest day ride (by start date), or null: a new day ride starts like it. */
export const daySource = (trips = []) => [...trips].filter(isDayRide).sort(newest)[0] ?? null;

/**
 * When a trip was last "used": the later of when it was made (createdAt) and its start day once
 * that day has come. A trip planned for later counts from when it was made, not from its start date.
 */
const usedAt = (trip, today) => {
  const made = trip.createdAt ?? '';
  const ridden = trip.startDate && trip.startDate <= today ? `${trip.startDate}T23:59:59` : '';
  return made > ridden ? made : ridden;
};

/**
 * The bike of the last trip by bike that still exists, else the first bike (bikes sorted as shown).
 * v0.30.1 (Noah E5): "last" is the trip used last (usedAt): the one ridden or made most recently.
 * It was the trip with the latest start date, so a trip planned weeks ahead on another bike won.
 */
export function lastBikeId(trips = [], bikes = [], today = localDay()) {
  const known = new Set(bikes.map((b) => b.id));
  const last = [...trips]
    .filter((x) => hasBike(x) && !x.skipped && known.has(x.bikeId))
    .sort((a, b) => usedAt(b, today).localeCompare(usedAt(a, today)) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
  return last?.bikeId ?? bikes[0]?.id ?? null;
}

/**
 * The weather preset closest to a forecast's min and max (by the middle of the range).
 * → the WX_PRESETS entry, or null without both values.
 */
export function presetFor(min, max) {
  if (min == null || max == null || !Number.isFinite(Number(min)) || !Number.isFinite(Number(max))) return null;
  const mid = (Number(min) + Number(max)) / 2;
  return WX_PRESETS.reduce((best, p) => (Math.abs((p.min + p.max) / 2 - mid) < Math.abs((best.min + best.max) / 2 - mid) ? p : best));
}

/**
 * The packing weather for a date from a forecast (weather.js fetchForecast): the matching preset,
 * and the rain rule of weather.js toWx ('rain' from 5 mm, 'showers' from 1 mm or 50 %).
 * → { min, max, rain } or null when the forecast does not reach that day.
 */
export function forecastPreset(forecast, date) {
  const day = (forecast?.days ?? []).find((d) => d.date === date);
  const wx = day ? toWx([day]) : null;
  const p = wx ? presetFor(wx.min, wx.max) : null;
  return p ? { min: p.min, max: p.max, rain: wx.rain } : null;
}

/** A usable home place (settings 'homePlace'), or null. */
export const homeOf = (value) => (value && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lon)) ? value : null);

/**
 * The forecast at the home place, or null: offline, no place, an error or no answer within
 * timeoutMs (Noah should never wait long for a day ride). Never throws.
 */
export async function fetchHomeForecast(place, { fetcher = globalThis.fetch?.bind(globalThis), timeoutMs = 3000, online = globalThis.navigator?.onLine ?? true } = {}) {
  const home = homeOf(place);
  if (!home || !online || !fetcher) return null;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  let timer;
  try {
    const late = new Promise((_, no) => (timer = setTimeout(() => (ctrl?.abort(), no(new Error('timeout'))), timeoutMs)));
    return await Promise.race([fetchForecast(home, (url) => fetcher(url, ctrl ? { signal: ctrl.signal } : undefined)), late]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Everything a day ride needs, without a dialog (Noah 1a):
 * the bike of the last trip by bike (or the first bike); the newest day ride gives hours and
 * temperatures (never its rain), else 2 h and "Chilly". The list is the standard set plus the weather (v0.29.2, Noah 5a). forecastWx (from forecastPreset) wins over the old weather.
 * → { bike, hours, wx, wxFrom, startDate, title, source } or null without a bike.
 */
export function dayRidePlan(trips = [], bikes = [], { now = new Date(), forecastWx = null, bikeId = null } = {}) {
  const source = daySource(trips);
  // v0.29.2 (Noah 5a): the bike of the last trip by bike (was: of the last day ride)
  // v0.46.0 (Noah 14a, 19a): or the bike chosen on Today ("Other bike", "tagestour factor")
  const bike = (bikeId && bikes.find((b) => b.id === bikeId)) || bikes.find((b) => b.id === lastBikeId(trips, bikes, iso(now))) || null;
  if (!bike) return null;
  const hours = Number(source?.hours) > 0 ? Number(source.hours) : DAY_HOURS;
  const chilly = WX_PRESETS.find((p) => p.name === DAY_WX);
  // v0.46.1 (Noah: rain socks on a dry day ride): the temperatures of the last day ride carry over,
  // its rain does not; rain comes only from the forecast or when chosen on the trip.
  const old = source?.wx?.min != null && source?.wx?.max != null ? { min: source.wx.min, max: source.wx.max, rain: 'none' } : null;
  const wx = forecastWx ?? old ?? { min: chilly.min, max: chilly.max, rain: 'none' };
  const startDate = rideDate(now);
  return { bike, hours, wx, wxFrom: forecastWx ? 'forecast' : null, startDate, title: freeTitle(rideName({ bike: bike.name, date: startDate }), trips), source };
}

/**
 * A new bike trip, the way "Create trip" makes it (TripDialog and the day ride use this one path):
 * the start (template, a copy of the last trip on the bike, or the standard set) plus the trip's
 * context (context.js contextTrip). fields: hours, overnight, cook, wx, event (and wxFrom).
 */
export function buildBikeTrip({ draft, bike, start = 'last', templates = [], trips = [], items = [], readyStandard = null, fields = {}, sets = [] }, now = Date.now()) {
  const tpl = templates.find((x) => x.id === start);
  // v0.39.0 (AP28): sets = the settings 'sets' (the amounts in the blocks of a linked template).
  const base = tpl
    ? tripFromTemplate({ ...draft, bike }, tpl, items, now, sets)
    : newTrip({ ...draft, bike, readyStandard, overnight: fields.overnight ?? null }, start === 'standard' ? [] : trips, items, now);
  // v0.25.0 (M3, 6b/7b): the context goes straight into the list; a template keeps its hours when none are given.
  return contextTrip({ ...base, ...fields, hours: fields.hours ?? base.hours ?? null }, items, { fromCopy: !tpl && !!base.copiedFrom });
}

/** The words for a packing weather: "Chilly" (a preset), else "8–14 °C"; with rain "Chilly, rain". */
export function wxLabel(wx) {
  if (!wx || (wx.min == null && wx.max == null)) return t('no weather set');
  const p = WX_PRESETS.find((x) => x.min === wx.min && x.max === wx.max);
  const temp = p ? t(p.name) : `${wx.min ?? '?'}–${wx.max ?? '?'} °C`;
  return wx.rain === 'rain' ? t('{weather}, rain', { weather: temp }) : wx.rain === 'showers' ? t('{weather}, showers', { weather: temp }) : temp;
}
