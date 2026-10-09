/**
 * v0.46.0 «Startseite neu» (Noah 1a 2b 3a … 34b): the rules of the new Today page. Pure functions (no
 * database, no screen), tested in tests/home0460.test.js; Home.svelte and lib/home/*.svelte read the
 * records and write the result.
 *
 * - test trips (Noah 10a): a trip with "test" in its name never becomes the next trip on Today; a quiet
 *   line offers to archive them (with Undo). The marker of the fictional test fixtures
 *   ("test_data_gtp_") does not count: it is not part of a name Noah types.
 * - the greeting by time of day and the weather in one sentence (home forecast, hourly when known);
 * - the countdown of the next trip ("Tomorrow · 22 h to go", "In 5 days");
 * - the series: weeks in a row with at least one trip or ride;
 * - milestones (Noah 21a): the 10th trip, every 1000 km on a bike, the first night out; a quiet card
 *   on the day and the day after.
 */
import { t, tn, num } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { tripEnd } from '../debrief.js';

/* ---------- test trips ---------- */

/** The prefix of the fictional e2e fixtures; it is not a "test" Noah typed. */
export const FIXTURE_MARK = /test_data_gtp_/gi;
/** A trip with "test" in its name (any case), e.g. "TEST-Runde" or "Testtour". */
export const isTestTrip = (trip) => /test/i.test(String(trip?.title ?? '').replace(FIXTURE_MARK, ''));
/** Archived from Today ("Clean up test trips"): it stays in the data, Today leaves it out. */
export const isArchived = (trip) => !!trip?.archivedAt;
/** The trips Today works with: no archived and no test trips. */
export const homeTrips = (trips = []) => trips.filter((x) => !isArchived(x) && !isTestTrip(x));
/** The test trips still to clean up. */
export const testTrips = (trips = []) => trips.filter((x) => !isArchived(x) && isTestTrip(x));
/**
 * What archiving changes on a trip: the day it was archived, and "not riding" (skipped), so no
 * other page counts it as a trip to come or a debrief to write. Undo puts the trip back as it was.
 */
export const archiveChanges = (now = new Date().toISOString()) => ({ archivedAt: now, skipped: true, updatedAt: now });

/* ---------- greeting and weather ---------- */

/** 'morning' before 12, 'day' until 18, 'evening' from 18 (Noah 32a: the evening puts other rows first). */
export const dayPart = (hour) => (hour < 12 && hour >= 4 ? 'morning' : hour >= 12 && hour < 18 ? 'day' : 'evening');

/** "Good morning, Noah." (the name only when there is one). */
export function greeting(hour, name = '') {
  const part = dayPart(hour);
  const who = String(name ?? '').trim();
  const key = { morning: who ? 'Good morning, {name}.' : 'Good morning.', day: who ? 'Hello, {name}.' : 'Hello.', evening: who ? 'Good evening, {name}.' : 'Good evening.' }[part];
  return t(key, { name: who });
}

/** Rain from this probability (%) on in an hour counts as wet. */
export const WET_PCT = 50;

/**
 * The weather in one sentence from the home forecast (home-weather.js; days with min, max, rain and,
 * when known, hourly { t, p }). Before 18:00 today from this hour on, from 18:00 tomorrow.
 * → { text, temp, dry, when: 'today' | 'tomorrow' } or null without a forecast for that day.
 */
export function weatherLine(forecast, now = new Date()) {
  const hour = now.getHours();
  const tomorrow = hour >= 18;
  const d = new Date(now);
  if (tomorrow) d.setDate(d.getDate() + 1);
  const date = localDay(d);
  const day = (forecast?.days ?? []).find((x) => x.date === date);
  if (!day) return null;
  const from = tomorrow ? 8 : hour;
  const temps = day.hourly?.t ?? null;
  const pcts = day.hourly?.p ?? null;
  const temp = Math.round(tomorrow ? (day.max ?? temps?.[14] ?? 0) : (temps?.[from] ?? day.max ?? 0));
  let text;
  let dry;
  if (pcts?.length === 24) {
    const wetAt = pcts.findIndex((p, h) => h >= from && h <= 22 && p >= WET_PCT);
    if (wetAt === from) (text = t('{t}° and rain likely.', { t: temp })), (dry = false);
    else if (wetAt > 0) (text = t('{t}° and dry until {h}:00.', { t: temp, h: wetAt })), (dry = wetAt - from >= 3);
    else (text = t('{t}° and dry.', { t: temp })), (dry = true);
  } else {
    const rain = day.rain ?? 'none';
    dry = rain === 'none';
    text = rain === 'rain' ? t('{t}° and rain.', { t: temp }) : rain === 'showers' ? t('{t}°, showers possible.', { t: temp }) : t('{t}° and dry.', { t: temp });
  }
  if (tomorrow) text = t('Tomorrow {weather}', { weather: text });
  return { text, temp, dry, when: tomorrow ? 'tomorrow' : 'today' };
}

/**
 * Is a day dry enough for a ride (the suggestion of the day, Noah 19a)? With hours: no hour from
 * fromHour (at least 9) to 18 with rain from WET_PCT on; else the day's own rain word. No day: false.
 */
export function dayDry(forecast, date, fromHour = 9) {
  const day = (forecast?.days ?? []).find((x) => x.date === date);
  if (!day) return false;
  const p = day.hourly?.p;
  if (p?.length === 24) return p.slice(Math.max(9, fromHour), 19).every((x) => x == null || x < WET_PCT);
  return (day.rain ?? 'none') === 'none';
}

/* ---------- the next trip ---------- */

const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);
const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / 864e5);
/** The hour a trip day starts, for "22 h to go". */
export const START_HOUR = 8;

/**
 * The countdown of a trip (Noah 8a): { text, near } with near = today, tomorrow or under way.
 * "Today", "On the way · day 2", "Tomorrow · 22 h to go", "In 5 days", "No date set".
 */
export function countdown(trip, now = new Date()) {
  if (!trip?.startDate) return { text: t('No date set'), near: false };
  const today = localDay(now);
  const end = tripEnd(trip) ?? trip.startDate;
  const n = daysBetween(today, trip.startDate);
  if (n <= 0 && today <= end) return n === 0 ? { text: Number(trip.days) > 1 ? t('On the way · day {n} of {m}', { n: 1, m: Number(trip.days) }) : t('Today|countdown'), near: true, under: true } : { text: Number(trip.days) > 1 ? t('On the way · day {n} of {m}', { n: 1 - n, m: Number(trip.days) }) : t('On the way|countdown'), near: true, under: true };
  if (n < 0) return { text: t('Over|countdown'), near: false };
  if (n === 1) {
    const [y, m, d] = trip.startDate.split('-').map(Number);
    const h = Math.max(1, Math.round((new Date(y, m - 1, d, START_HOUR).getTime() - now.getTime()) / 36e5));
    return { text: t('Tomorrow · {h} h to go', { h }), near: true };
  }
  return { text: tn(n, 'In {n} day', 'In {n} days'), near: false };
}

/**
 * The trips Today can show in the trip card, soonest first: not archived, no test trip, not skipped
 * or finished, not over. The swipe goes through these (Noah 31a).
 */
export function soonTrips(trips = [], today = localDay()) {
  return homeTrips(trips)
    .filter((x) => !x.skipped && !x.finished && x.startDate && (tripEnd(x) ?? x.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
}

/* ---------- the series (Noah 22a) ---------- */

/** The Monday of the week of a day (YYYY-MM-DD). */
export function weekOf(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * Weeks in a row with at least one trip or ride, counted back from this week. A week without a ride
 * yet does not break the series until it is over: then it counts from last week.
 */
export function streakWeeks(dates = [], today = localDay()) {
  const weeks = new Set(dates.filter((x) => typeof x === 'string' && x <= today).map((x) => weekOf(x.slice(0, 10))));
  let w = weekOf(today);
  if (!weeks.has(w)) w = weekOf(new Date(ms(w) - 7 * 864e5).toISOString().slice(0, 10));
  let n = 0;
  while (weeks.has(w)) {
    n++;
    w = new Date(ms(w) - 7 * 864e5).toISOString().slice(0, 10);
  }
  return n;
}

/**
 * The 12 mini bars of the last 12 months (yearreview.js months, oldest first): the last 12 calendar
 * months, each { month, km, pct (0-100 of the highest), now (this month) }.
 */
export function monthBars(months = [], today = localDay()) {
  const last = months.slice(-12);
  const top = Math.max(0, ...last.map((m) => m.km));
  return last.map((m) => ({ month: m.month, km: m.km, pct: top ? Math.max(m.km ? 6 : 0, Math.round((m.km / top) * 100)) : 0, now: m.month === today.slice(0, 7) }));
}

/* ---------- milestones (Noah 21a) ---------- */

export const MILESTONE_KEY = 'homeMilestones';
/** Trips counted as milestones. */
export const TRIP_STEPS = [10, 25, 50, 75, 100, 150, 200, 300, 400, 500];
/** A milestone card shows on its day and the day after. */
export const MILESTONE_DAYS = 2;

/** The highest step reached by n (0 when none). */
export const stepOf = (n, steps = TRIP_STEPS) => steps.filter((s) => n >= s).at(-1) ?? 0;

/**
 * Where the data stands now: { trips, bikes: { id: thousands }, names: { id: name }, nights }.
 * tripsDone: how many trips happened; bikes: [{ id, name, km }]; nights: nights outside so far.
 */
export function milestoneLevels({ tripsDone = 0, bikes = [], nights = 0 } = {}) {
  const km = {};
  const names = {};
  for (const b of bikes) if (typeof b.km === 'number' && b.km >= 0) (km[b.id] = Math.floor(b.km / 1000)), (names[b.id] = b.name);
  return { trips: stepOf(tripsDone), bikes: km, names, nights: nights > 0 };
}

const addDays = (iso, n) => new Date(ms(iso) + n * 864e5).toISOString().slice(0, 10);

/**
 * Compare with what was stored: a new step makes an event { key, day, … }. The first time (no stored
 * state) nothing is celebrated, the state is only written. Events older than a week are dropped.
 * → { state, changed }.
 */
export function milestoneStep(state, cur, today = localDay()) {
  if (!state || typeof state !== 'object' || !state.levels) return { state: { levels: { trips: cur.trips, bikes: cur.bikes, nights: cur.nights }, events: [] }, changed: true };
  const prev = state.levels;
  const events = (state.events ?? []).filter((e) => e.day >= addDays(today, -7));
  let changed = events.length !== (state.events ?? []).length;
  if (cur.trips > (prev.trips ?? 0)) events.push({ key: 'trips', n: cur.trips, day: today });
  for (const [id, k] of Object.entries(cur.bikes)) {
    if (prev.bikes?.[id] != null && k > prev.bikes[id]) events.push({ key: 'bikeKm', bikeId: id, bike: cur.names?.[id] ?? '', km: k * 1000, day: today });
  }
  if (cur.nights && !prev.nights) events.push({ key: 'firstNight', day: today });
  const levels = { trips: Math.max(cur.trips, prev.trips ?? 0), bikes: { ...prev.bikes, ...cur.bikes }, nights: !!(cur.nights || prev.nights) };
  if (events.length !== (state.events ?? []).length || JSON.stringify(levels) !== JSON.stringify(prev)) changed = true;
  return { state: { levels, events }, changed };
}

/** The milestones to show today (newest first). */
export const milestonesNow = (state, today = localDay()) => (state?.events ?? []).filter((e) => e.day <= today && e.day > addDays(today, -MILESTONE_DAYS)).reverse();

/** The words of a milestone. */
export function milestoneText(e) {
  if (e.key === 'trips') return t('Your {n}th trip with the app. Well done!', { n: e.n });
  if (e.key === 'bikeKm') return t('{bike}: {km} km on the counter.', { bike: e.bike, km: num(e.km) });
  if (e.key === 'firstNight') return t('Your first night out. Well done!');
  return '';
}

/* ---------- the layout (Noah 33a) ---------- */

export const LAYOUT_KEY = 'homeLayout';
/** The sections of Today that can be switched off and moved, in their first order. */
export const SECTIONS = ['greeting', 'trip', 'flow', 'actions', 'today', 'bikes', 'year'];
export const SECTION_NAME = { greeting: 'Greeting and weather', trip: 'Next trip', flow: 'In the flow', actions: 'What do you want to do?', today: 'Important today and Tried it yet?', bikes: 'Bikes|place', year: 'Last 12 months' };

/** A stored layout made whole: { order: all sections, off: [] }; unknown keys go, new ones follow their neighbour. */
export function layoutOf(value) {
  const order = (Array.isArray(value?.order) ? value.order : []).filter((k, i, a) => SECTIONS.includes(k) && a.indexOf(k) === i);
  // v0.51.0: a new section comes right after the one before it in SECTIONS (Im Flow under the trip)
  SECTIONS.forEach((k, i) => {
    if (order.includes(k)) return;
    const at = i ? order.indexOf(SECTIONS[i - 1]) : -1;
    if (at >= 0) order.splice(at + 1, 0, k);
    else order.push(k);
  });
  const off = (Array.isArray(value?.off) ? value.off : []).filter((k, i, a) => SECTIONS.includes(k) && a.indexOf(k) === i);
  return { order, off };
}
/** Move a section one place up (dir -1) or down (+1). */
export function moveSection(layout, key, dir) {
  const l = layoutOf(layout);
  const i = l.order.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= l.order.length) return l;
  const order = [...l.order];
  [order[i], order[j]] = [order[j], order[i]];
  return { ...l, order };
}
/** Switch a section on or off. */
export function toggleSection(layout, key) {
  const l = layoutOf(layout);
  return { ...l, off: l.off.includes(key) ? l.off.filter((k) => k !== key) : [...l.off, key] };
}
