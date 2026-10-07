/**
 * Good to know on Today (v0.25.1, Noah 1a, 7.10.2026): only cards that have something to say,
 * the most urgent first, every card with ONE button that does the thing.
 *
 * Pure functions (no database, no screen): Home gathers the records, knowCards() decides which
 * cards show, in which order and with what numbers; GoodToKnow.svelte only writes the words.
 *
 * Priority (lower = higher up):
 *   1  backup due, wear part due now, Still open with a late row
 *   2  weather of the next trip within 3 days, wear part due soon
 *   3  Inbox notes, Still open, a running demo
 *   4  weekend ride weather (Thursday to Sunday)
 *   5  insights: wear forecast, season, weight trend, best upgrade, long not used, learnings, pace,
 *      the weekend weather from Monday to Wednesday
 *   9  "Set your home place" (the one card without data: the way to set it up)
 */
import { isInventory, isConsumable } from './gear.js';
import { CHECK_KM, CHECK_PARTS, kmSince, partInfo, PART } from './care.js';
import { costByYear } from './workshop.js';
import { isOver, tripEnd } from './debrief.js';
import { tripStats } from './trips.js';
import { toWx } from './weather.js';

const DAY = 864e5;
const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);
const addDays = (iso, n) => new Date(ms(iso) + n * DAY).toISOString().slice(0, 10);

/** The key of the setting with Noah's home place: { name, lat, lon }. */
export const HOME_PLACE = 'homePlace';
/** The key in the "meta" table (never exported) of the saved home forecast: { fetchedAt, place, days }. */
export const HOME_FORECAST = 'homeForecast';
/** Fetch the home forecast at most every 3 hours; a saved one shows for up to 12 hours. */
export const FETCH_EVERY_H = 3;
export const SHOW_FOR_H = 12;

/** A card's order within the same priority. */
export const ORDER = ['backup', 'wear', 'todo', 'weather', 'inbox', 'demo', 'weekend', 'season', 'trend', 'upgrade', 'unused', 'learnings', 'pace', 'home'];

/* ---------- trips that happened ---------- */

/** Finished trips (not skipped, packed in the app, debriefed or over), oldest first. */
export function finishedTrips(trips = [], debriefs = [], today) {
  const done = new Set(debriefs.filter((d) => d.status === 'done').map((d) => d.tripId));
  return trips
    .filter((t) => !t.skipped && t.startDate && t.entries?.length && (done.has(t.id) || t.status === 'done' || isOver(t, today)))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** km of a debriefed trip: the debrief's km, else the route's; null when unknown. */
const tripKm = (d, t) => (typeof d?.km === 'number' && d.km > 0 ? d.km : typeof t.route?.km === 'number' && t.route.km > 0 ? t.route.km : null);

/** Debriefed trips of one bike with known km, oldest first: [{ date, end, km }]. */
export function bikeRides(bikeId, trips = [], debriefs = []) {
  const byId = Object.fromEntries(trips.map((t) => [t.id, t]));
  return debriefs
    .filter((d) => d.status === 'done' && byId[d.tripId]?.bikeId === bikeId && byId[d.tripId].startDate)
    .map((d) => ({ date: byId[d.tripId].startDate, end: tripEnd(byId[d.tripId]), km: tripKm(d, byId[d.tripId]) }))
    .filter((r) => r.km != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Average km of the last (up to 5) debriefed trips on a bike, or null. */
export function avgTripKm(rides, n = 5) {
  const last = rides.slice(-n);
  return last.length ? Math.round(last.reduce((s, r) => s + r.km, 0) / last.length) : null;
}

/** km per week on a bike from the debriefed trips of the last 12 weeks, or null (none). */
export function kmPerWeek(rides, today, weeks = 12) {
  const from = addDays(today, -7 * weeks);
  const km = rides.filter((r) => r.end >= from && r.date <= today).reduce((s, r) => s + r.km, 0);
  return km > 0 ? km / weeks : null;
}

/* ---------- 1. wear forecast ---------- */

const lastService = (p) => [...(p.history ?? [])].reverse().find((h) => h.action === 'service' || h.action === 'replace') ?? null;
const lastLook = (p) => [...(p.history ?? [])].reverse().find((h) => h.result !== 'needed') ?? null;

/**
 * What comes due next by km on each bike (bike: from withVisits): a service with its own interval
 * (wax the chain every 150 km) or the 1000 km check. left = interval minus km since the last time.
 * Returns one row per bike, soonest first:
 * [{ bikeId, bike, kind: 'service' | 'check', part, every, left, trips, weeks, prio }]
 * trips: about how many trips that is (from the average km of the last debriefed trips on that bike),
 * weeks: from the km per week of the last 12 weeks; both null when unknown.
 * prio: 1 due now (left ≤ 0), 2 soon (about one more trip, or the last fifth of the interval), else 5.
 */
export function wearForecast(bikes = [], trips = [], debriefs = [], today) {
  const out = [];
  for (const bike of bikes) {
    if (typeof bike.km !== 'number') continue;
    const cands = [];
    for (const p of (bike.parts ?? []).map(partInfo).filter((x) => x.everyKm)) {
      const since = kmSince(bike, lastService(p));
      if (since != null) cands.push({ kind: 'service', part: p.key, every: p.everyKm, left: p.everyKm - since });
    }
    const looked = (bike.parts ?? []).filter((p) => CHECK_PARTS.includes(p.key)).map((p) => kmSince(bike, lastLook(p))).filter((s) => s != null);
    if (looked.length) cands.push({ kind: 'check', part: 'check', every: CHECK_KM, left: CHECK_KM - Math.max(...looked) });
    if (!cands.length) continue;
    const next = cands.sort((a, b) => a.left - b.left)[0];
    const rides = bikeRides(bike.id, trips, debriefs);
    const avg = avgTripKm(rides);
    const perWeek = kmPerWeek(rides, today);
    const left = Math.max(0, next.left);
    const est = avg && next.left > 0 ? Math.max(1, Math.round(left / avg)) : null;
    // more than 20 trips away is no forecast worth saying (e.g. one short ride on record)
    const nTrips = est && est <= 20 ? est : null;
    // soon: about one more trip, or the last fifth of the interval
    const soon = nTrips === 1 || next.left <= next.every * 0.2;
    out.push({
      bikeId: bike.id,
      bike: bike.name,
      ...next,
      trips: nTrips,
      weeks: perWeek && next.left > 0 ? Math.max(1, Math.round(left / perWeek)) : null,
      prio: next.left <= 0 ? 1 : soon ? 2 : 5,
    });
  }
  return out.sort((a, b) => a.left - b.left || a.bike.localeCompare(b.bike));
}

/** The name of what is due, as an English key for t(): "Wax the chain" or the 1000 km check. */
export const wearWhat = (row) => (row.kind === 'check' ? '{km} km check' : PART[row.part]?.service ? `${PART[row.part].service} ${PART[row.part].name.toLowerCase()}` : PART[row.part]?.name ?? row.part);

/* ---------- 2. weekend ride weather ---------- */

/** The coming Saturday and Sunday that are not past yet (on a Sunday: only today). */
export function weekendDays(today) {
  const wd = new Date(ms(today)).getUTCDay(); // 0 Sunday … 6 Saturday
  if (wd === 0) return [today];
  const sat = addDays(today, 6 - wd);
  return [sat, addDays(sat, 1)];
}

/** Thursday to Sunday the weekend is close: the card moves up. */
export const weekendNear = (today) => [4, 5, 6, 0].includes(new Date(ms(today)).getUTCDay());

/** [{ date, max, rain: 'none' | 'showers' | 'rain' }] for the weekend days of a saved forecast, or null. */
export function weekendWeather(forecast, today) {
  const days = weekendDays(today)
    .map((date) => forecast?.days?.find((d) => d.date === date))
    .filter(Boolean)
    .map((d) => {
      const wx = toWx([d]);
      return wx ? { date: d.date, max: Math.round(d.max), rain: wx.rain } : null;
    })
    .filter(Boolean);
  return days.length ? days : null;
}

/** Hours since a saved forecast was fetched (Infinity without one). */
export const ageH = (forecast, now = Date.now()) => (forecast?.fetchedAt ? (now - Date.parse(forecast.fetchedAt)) / 36e5 : Infinity);
const samePlace = (a, b) => !!a && !!b && a.lat === b.lat && a.lon === b.lon;
/** Fetch again? Older than 3 hours, or for another place. */
export const needsFetch = (place, forecast, now = Date.now()) => !!place && (!samePlace(place, forecast?.place) || ageH(forecast, now) >= FETCH_EVERY_H);
/** Show the saved forecast? Same place and younger than 12 hours (offline or failed: else hidden). */
export const usable = (place, forecast, now = Date.now()) => !!place && samePlace(place, forecast?.place) && ageH(forecast, now) < SHOW_FOR_H;

/* ---------- 3. season in numbers ---------- */

/**
 * This calendar year: km per bike (from the debriefs of this year's trips; the app keeps no km
 * history, only the current km), finished trips and the workshop costs.
 * Returns { year, trips, km: [{ bikeId, bike, km }], kmFrom: 'debriefs', cost: { chf, visits, unknown } | null } or null when the year has nothing.
 */
export function season(bikes = [], trips = [], debriefs = [], visits = [], today) {
  const year = today.slice(0, 4);
  const done = finishedTrips(trips, debriefs, today).filter((t) => t.startDate.startsWith(year));
  const km = bikes
    .map((b) => ({ bikeId: b.id, bike: b.name, km: bikeRides(b.id, trips, debriefs).filter((r) => r.date.startsWith(year)).reduce((s, r) => s + r.km, 0) }))
    .filter((r) => r.km > 0)
    .sort((a, b) => b.km - a.km);
  const cost = costByYear(visits).find((y) => y.year === year) ?? null;
  if (!done.length && !km.length && !cost) return null;
  return { year, trips: done.length, km, kmFrom: 'debriefs', cost };
}

/* ---------- 4. best upgrade ---------- */

/**
 * The wish that saves the most grams per franc: a wishlist item with a price and a known weight that
 * replaces a heavier owned item (item.replaces). Returns { item, old, savedG, chf, gPer100 } or null.
 */
export function bestUpgrade(items = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  return (
    items
      .filter((i) => (i.ownership === 'wishlist' || i.ownership === 'to-buy') && typeof i.priceChf === 'number' && i.priceChf > 0 && i.weightG != null && i.replaces)
      .map((item) => {
        const old = byId[item.replaces];
        const savedG = old?.weightG != null ? old.weightG - item.weightG : 0;
        return { item, old, savedG, chf: item.priceChf, gPer100: Math.round((savedG / item.priceChf) * 100) };
      })
      .filter((r) => r.savedG > 0)
      .sort((a, b) => b.savedG / b.chf - a.savedG / a.chf || a.chf - b.chf)[0] ?? null
  );
}

/* ---------- 5. weight trend ---------- */

/**
 * Base weight (bags and bike, without food, water and what you wear) of the last up to 6 finished
 * trips, oldest first. Only trips with a base weight count; null with fewer than 2.
 * Returns { points: [{ id, title, date, g, missing }], first, last, diffG }.
 */
export function weightTrend(trips = [], debriefs = [], items = [], containers = [], bikes = [], today) {
  const points = finishedTrips(trips, debriefs, today)
    .map((t) => {
      const s = tripStats(t, items, containers, bikes.find((b) => b.id === t.bikeId) ?? null, null);
      return { id: t.id, title: t.title, date: t.startDate, g: s.baseG, missing: s.baseMissing };
    })
    .filter((p) => p.g > 0)
    .slice(-6);
  if (points.length < 2) return null;
  return { points, first: points[0], last: points.at(-1), diffG: points.at(-1).g - points[0].g };
}

/** The sparkline as an SVG path in a w × h box (the lightest at the bottom). */
export function sparkPath(values, w = 120, h = 32, pad = 3) {
  if (values.length < 2) return '';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (n) => pad + (n * (w - 2 * pad)) / (values.length - 1);
  const y = (v) => (hi === lo ? h / 2 : pad + ((hi - v) * (h - 2 * pad)) / (hi - lo));
  return values.map((v, n) => `${n ? 'L' : 'M'}${x(n).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
}

/* ---------- 6. long not used ---------- */

/**
 * Owned items that were on no trip in the last 12 months (planned trips count as use): packing
 * items only, so not worn, not standard, not "on every trip", not a bike fixture, not a bag that
 * sits on the bike, no bike parts, no food. since: the start of the 12 months, or the first trip
 * when the app knows fewer than 12 months (full: false). Returns { items, g, missing, since, full } or null when the
 * trips that already happened reach back less than 3 months (then the list would say nothing).
 */
export const MIN_HISTORY_DAYS = 90;
export function longUnused(items = [], trips = [], bikes = [], containers = [], today) {
  const from = addDays(today, -365);
  const real = trips.filter((t) => !t.skipped && t.startDate && t.entries?.length);
  // the first trip that already started; with less than 3 months of trips "not used" says nothing yet
  const first = real.map((t) => t.startDate).filter((d) => d <= today).sort()[0];
  if (!first || first > addDays(today, -MIN_HISTORY_DAYS)) return null;
  const used = new Set(real.filter((t) => (tripEnd(t) ?? t.startDate) >= from).flatMap((t) => t.entries.map((e) => e.itemId)));
  const fixtures = new Set(bikes.flatMap((b) => b.fixtures ?? []));
  const bags = new Set(containers.map((c) => c.itemId).filter(Boolean));
  const list = items
    .filter((i) => isInventory(i) && !isConsumable(i) && i.category !== 'bike' && i.role !== 'worn' && i.role !== 'standard' && !i.always && !fixtures.has(i.id) && !bags.has(i.id) && !used.has(i.id))
    .sort((a, b) => (b.weightG ?? 0) * (b.qty || 1) - (a.weightG ?? 0) * (a.qty || 1) || a.name.localeCompare(b.name));
  return {
    items: list,
    g: list.reduce((s, i) => s + (i.weightG == null ? 0 : i.weightG * (i.qty || 1)), 0),
    missing: list.filter((i) => i.weightG == null).length,
    since: first > from ? first : from,
    full: first <= from, // the trips reach back 12 months or more
  };
}

/* ---------- all cards ---------- */

/**
 * The cards to show, most urgent first: [{ key, prio, data }]. Every input is optional.
 * todos: openTodos() rows; backup: { due, days, afterTrip }; demo: the running demo or null;
 * next: the next trip; fc: its forecast weather (toWx) or null; sun: { rise, set } or null;
 * tips: learningsFor(); pace: paceOf(); notes: open Inbox notes;
 * homePlace / homeForecast: the setting and the saved forecast; placeLoading: the setting is not
 * read yet (neither the weekend card nor the set-up card then); now: ms (for the 12-hour rule).
 */
export function knowCards({
  today,
  now = Date.now(),
  todos = [],
  backup = { due: false },
  demo = null,
  next = null,
  fc = null,
  sun = null,
  tips = [],
  pace = null,
  notes = [],
  bikes = [],
  trips = [],
  debriefs = [],
  visits = [],
  items = [],
  containers = [],
  homePlace = null,
  homeForecast = null,
  placeLoading = false,
} = {}) {
  const cards = [];
  const add = (key, prio, data = {}) => cards.push({ key, prio, data });

  if (backup?.due) add('backup', 1, backup);
  else if (demo) add('demo', 3, demo);
  if (todos.length) add('todo', todos.some((r) => r.late) ? 1 : 3, { rows: todos });

  const wear = wearForecast(bikes, trips, debriefs, today);
  if (wear.length) add('wear', wear[0].prio, { rows: wear });

  if (next && (fc || sun)) {
    const days = next.startDate ? Math.round((ms(next.startDate) - ms(today)) / DAY) : null;
    add('weather', days != null && days <= 3 ? 2 : 5, { trip: next, fc, sun, days });
  }
  if (notes.length) add('inbox', 3, { notes });

  if (placeLoading) {
    /* nothing yet */
  } else if (!homePlace) add('home', 9);
  else {
    const days = usable(homePlace, homeForecast, now) ? weekendWeather(homeForecast, today) : null;
    if (days) add('weekend', weekendNear(today) ? 4 : 5, { place: homePlace, days });
  }

  const s = season(bikes, trips, debriefs, visits, today);
  if (s) add('season', 5, s);
  const tr = weightTrend(trips, debriefs, items, containers, bikes, today);
  if (tr) add('trend', 5, tr);
  const up = bestUpgrade(items);
  if (up) add('upgrade', 5, up);
  const un = longUnused(items, trips, bikes, containers, today);
  if (un?.items.length) add('unused', 5, un);
  if (tips[0]) add('learnings', 5, { tip: tips[0] });
  if (pace?.mine) add('pace', 5, { pace });

  return cards.sort((a, b) => a.prio - b.prio || ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
}

