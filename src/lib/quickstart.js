/**
 * v0.119.0 «Schnellstart» (mockups Q1–Q3, Noah 13.10.2026 00:05 «Q1–Q3 freigegeben», answers «1-5a»):
 * one click on Today makes a trip, without a dialog, and Noah stays on Today.
 *
 *   - always today and right away (no «after 14:00 it is tomorrow» rule as the day ride had);
 *   - 2.5 riding hours;
 *   - the bike a new trip brings (tourbike.svelte.js: the standard bike or the one ridden last), or the one Today suggests;
 *   - only the standard items (no copy of the last day ride, no template);
 *   - the weather from the home forecast for today; offline (or without a forecast) no weather;
 *   - the name is the local time stamp YYYYMMDDHHmm («202610130000»), a second one in the same
 *     minute gets « (2)» (dayride.js freeTitle).
 * Everything stays a suggestion: the green card on Today has «Open» and «Undo» (deletes the trip).
 * The rules are pure functions (tests/quickstart.test.js); quickStart() writes the trip.
 */
import { buildBikeTrip, freeTitle, forecastPreset, homeOf } from './dayride.js';
import { tourBikeId } from './tourbike.svelte.js';
import { ridesIntoDark } from './blockplan.js';
import { rememberDomain, BIKEPACKING } from './domains.js';
import { localDay } from './localday.js';

/** Riding hours of a quick start (Noah 1a). */
export const QUICK_HOURS = 2.5;

/** The trip name: the local time stamp YYYYMMDDHHmm, e.g. 202610130000 for 13.10.2026 00:00. */
export function stampName(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}${p(now.getHours())}${p(now.getMinutes())}`;
}

/** «No weather»: no range, dry (the same as the «No weather» chip, dayride.js pickWxChip). */
export const NO_WX = Object.freeze({ min: null, max: null, rain: 'none' });

/**
 * Everything a quick start needs, without a dialog.
 * forecast: the home forecast ({ days: [{ date, min, max, rainMm, rainPct }] }) or null (offline).
 * bikeId: the bike Today suggests (else the bike a new trip brings: the standard bike, or with
 * mode 'last' the bike ridden last; mode defaults to the setting, tourbike.svelte.js).
 * → { bike, hours, wx, wxFrom, startDate, title } or null without a bike.
 */
export function quickPlan(trips = [], bikes = [], { now = new Date(), forecast = null, bikeId = null, mode = undefined } = {}) {
  const startDate = localDay(now);
  const bike = (bikeId && bikes.find((b) => b.id === bikeId)) || bikes.find((b) => b.id === tourBikeId(trips, bikes, mode, startDate)) || null;
  if (!bike) return null;
  const fwx = forecast ? forecastPreset(forecast, startDate) : null;
  return {
    bike,
    hours: QUICK_HOURS,
    wx: fwx ?? { ...NO_WX },
    wxFrom: fwx ? 'forecast' : null,
    startDate,
    title: freeTitle(stampName(now), trips),
  };
}

/**
 * Makes the trip and saves it. db: the Dexie database; trips: ALL trips (for a free name); items:
 * the gear; forecast: as for quickPlan (null offline). → the new trip, or null without a bike.
 */
export async function quickStart(db, { trips = [], bikes = [], items = [], forecast = null, bikeId = null, now = new Date() } = {}) {
  const plan = quickPlan(trips, bikes, { now, forecast, bikeId });
  if (!plan) return null;
  const home = homeOf((await db.settings.get('homePlace'))?.value);
  const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
  // as the day ride: Light comes by itself when the ride goes into the dark (v0.66.0, Noah 7a)
  const dark = ridesIntoDark({ startDate: plan.startDate, days: 1, hours: plan.hours }, home);
  const fields = { hours: plan.hours, overnight: 'none', cook: false, wx: plan.wx, event: false, dark, ...(plan.wxFrom ? { wxFrom: plan.wxFrom } : {}) };
  const trip = buildBikeTrip({ draft: { title: plan.title, startDate: plan.startDate, days: 1 }, bike: plan.bike, start: 'standard', trips, items, readyStandard, fields }, now.getTime());
  await db.trips.put(trip);
  rememberDomain(BIKEPACKING);
  return trip;
}
