/**
 * «Für deine Tour» (UI-Prüfung 07.11.2026, T3, Noah «5b»: Wetter zur Tour jetzt bauen): the card at the top of the weather
 * page for the next planned trip. Pure: no page, no database, no clock (today and the saved forecast are passed in).
 *
 * upcomingTrip(trips, today): the first planned trip whose last day is not over (by start date); archived and test trips do not count.
 * tourWeather(core, trip, today): the weather of the trip's day (the first day still to come) between 07:00 and 20:00, from the
 *   saved forecast of wetter/kern.js: { date, tmin, tmax, rainFrom (ms | null), windMax } or null when the forecast does not
 *   cover that day (more than 16 days away, or none saved).
 * rainGear(trip, items): the rain things on the trip's packing list: { n, packed }.
 */
import { atLocal, hoursBetween, dayLine } from './kern.js';
import { lastDay } from '../touren/wege.js';
import { rainOf } from '../layers.js';
import { homeTrips } from '../home/heute.js';

export const RIDE_FROM = 7;
export const RIDE_TO = 20;

const planned = (x) => !!x && !x.skipped && !x.finished && x.status !== 'done' && !!x.startDate;

/** A trip still to come or on the way: planned, and its last day is not before today. */
export const comingUp = (x, today) => planned(x) && (lastDay(x) ?? '') >= today;

/** The first planned trip that is still to come or on the way, by its start date; null without one. */
export function upcomingTrip(trips = [], today) {
  return homeTrips(trips).filter((x) => comingUp(x, today)).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

/** The day the card talks about: the start day, or today for a trip that is on the way. */
export const tourDay = (trip, today) => (trip?.startDate && trip.startDate > today ? trip.startDate : today);

/** The weather of the tour day, or null when the saved forecast does not cover it. */
export function tourWeather(core, trip, today) {
  if (!core || !trip?.startDate || !today) return null;
  const date = tourDay(trip, today);
  const off = core.offset ?? 0;
  const line = dayLine(hoursBetween(core, atLocal(date, RIDE_FROM, off), atLocal(date, RIDE_TO, off)));
  return line ? { date, tmin: line.tmin, tmax: line.tmax, rainFrom: line.rainFrom, windMax: line.windMax } : null;
}

/** The rain things (own setting «Bei Regen», or in a Regen block) among the trip's entries: how many, how many packed. */
export function rainGear(trip, items = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const rain = (trip?.entries ?? []).filter((e) => {
    const it = byId.get(e.itemId);
    return !!it && (it.category === 'rain' || !!rainOf(it));
  });
  return { n: rain.length, packed: rain.filter((e) => e.packed).length };
}
