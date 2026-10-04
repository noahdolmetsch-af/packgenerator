/**
 * Ride day (v0.18.0, answers 1a-8a): the view for the day on the bike.
 * - every bag with what is in it (answer 2b, no search);
 * - the day's stage from the GPX route: km, climbing, riding hours, arrival (answer 4a);
 * - the weather hour by hour at the start and the finish of the day (answer 3a), saved on the
 *   trip so it still shows without a connection (answer 5a): trip.rideWx[date] = { fetchedAt, places };
 * - one stage per day on longer trips (answer 6a);
 * - notes for the debrief (answer 7a): debrief.rideNotes = [{ at, day, text }].
 *
 * Pure functions, except fetchHourly (it gets fetch passed in, so tests can fake it).
 */
import { distKm, ridingHours, climb } from './route.js';
import { zoneName } from './trips.js';
import { newDebrief } from './debrief.js';

const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Start time when none is set. */
export const DEFAULT_START = '08:00';

/** The day of the trip (0-based) for a date; before the trip 0, after it the last day. */
export function dayIndex(trip, date) {
  const days = Math.max(1, Number(trip?.days) || 1);
  if (!trip?.startDate || date <= trip.startDate) return 0;
  for (let n = 0; n < days; n++) if (addDays(trip.startDate, n) === date) return n;
  return days - 1;
}

/** Is the date one of the trip's days? */
export const onTripDay = (trip, date) => {
  if (!trip?.startDate) return false;
  const days = Math.max(1, Number(trip.days) || 1);
  return date >= trip.startDate && date <= addDays(trip.startDate, days - 1);
};

/** The point at a share (0…1) of the way along a thinned route line [[lat, lon], …]. */
export function pointAt(line, frac) {
  if (!line?.length) return null;
  const pts = line.map(([lat, lon]) => ({ lat, lon }));
  if (frac <= 0 || pts.length === 1) return pts[0];
  const legs = pts.slice(1).map((p, n) => distKm(pts[n], p));
  const total = legs.reduce((t, l) => t + l, 0);
  let want = Math.min(1, frac) * total;
  for (let n = 0; n < legs.length; n++) {
    if (want <= legs[n]) {
      const f = legs[n] ? want / legs[n] : 0;
      const a = pts[n];
      const b = pts[n + 1];
      return { lat: round(a.lat + (b.lat - a.lat) * f), lon: round(a.lon + (b.lon - a.lon) * f) };
    }
    want -= legs[n];
  }
  return pts.at(-1);
}
const round = (v) => Math.round(v * 1e4) / 1e4;

/** Nonstop (answer to the 303 question, 4.10.2026): one stage from start to finish, through the night. */
export const isNonstop = (trip) => !!trip?.nonstop;
/** How many stages the trip has: one when nonstop, else one per day. */
export const stageCount = (trip) => (isNonstop(trip) ? 1 : Math.max(1, Number(trip?.days) || 1));

/** "YYYY-MM-DDTHH:MM" plus hours. */
export function addHours(at, hours) {
  const d = new Date(`${at}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + Math.round(hours * 60));
  return d.toISOString().slice(0, 16);
}

/**
 * One stage. The route is shared out evenly over the days (one GPX for the whole trip);
 * a nonstop trip has one stage with the whole route.
 * Returns { day, date, km, gainM, hours, from, to, start, arrive, startAt, endAt }.
 * start: the start time ("HH:MM", trip.rideStart[day] or 08:00); arrive: start + riding hours.
 * startAt / endAt: "YYYY-MM-DDTHH:MM" (local time at the place), for the weather hours.
 */
export function stage(trip, day = 0) {
  const days = stageCount(trip);
  if (day >= days) day = days - 1;
  const date = trip?.startDate ? addDays(trip.startDate, day) : null;
  const planStart = isNonstop(trip) ? (trip.plan?.schedule ?? []).find((b) => b.from)?.from : null;
  const start = trip?.rideStart?.[day] || planStart || DEFAULT_START;
  const startAt = date ? `${date}T${start.padStart(5, '0')}` : null;
  const r = trip?.route;
  if (!r?.km) return { day, date, km: null, gainM: null, hours: null, from: trip?.place ?? null, to: null, start, arrive: null, startAt, endAt: null };
  const share = { km: Math.round((r.km / days) * 10) / 10, gainM: dayGain(r, day, days) };
  const hours = ridingHours({ km: share.km, gainM: share.gainM ?? 0 }, 1);
  const from = day === 0 ? (r.start ?? pointAt(r.line, 0)) : pointAt(r.line, day / days);
  const to = day === days - 1 ? (r.end ?? pointAt(r.line, 1)) : pointAt(r.line, (day + 1) / days);
  return { day, date, ...share, hours, from, to, start, arrive: addTime(start, hours), startAt, endAt: startAt && hours != null ? addHours(startAt, hours) : null };
}

/**
 * The blocks of a nonstop ride: the time plan of the trip (trip.plan.schedule, from the logbook),
 * else blocks of 3 hours until the finish. Breaks and naps add no km.
 * Returns [{ name, from, to, startAt, endAt, kmFrom, kmTo, rest }] (km: where you should be).
 */
export const REST = /break|nap|pause|sleep|schlaf/i;
export function blocks(trip, st) {
  if (!st?.startAt || !st.km || !st.hours) return [];
  const speed = st.km / st.hours;
  const plan = (trip.plan?.schedule ?? []).filter((b) => b.from && b.to);
  const rows = [];
  let at = st.startAt;
  let km = 0;
  if (plan.length) {
    for (const b of plan) {
      const startAt = at.slice(11) <= b.from || rows.length === 0 ? `${at.slice(0, 10)}T${b.from}` : `${addDays(at.slice(0, 10), 1)}T${b.from}`;
      let endAt = `${startAt.slice(0, 10)}T${b.to}`;
      if (endAt <= startAt) endAt = `${addDays(startAt.slice(0, 10), 1)}T${b.to}`;
      const rest = REST.test(b.block);
      const len = (new Date(`${endAt}:00Z`) - new Date(`${startAt}:00Z`)) / 36e5;
      const kmTo = rest ? km : Math.min(st.km, km + len * speed);
      rows.push({ name: b.block, from: b.from, to: b.to, startAt, endAt, kmFrom: Math.round(km), kmTo: Math.round(kmTo), rest, note: b.note ?? '' });
      km = kmTo;
      at = endAt;
      if (km >= st.km) break;
    }
    return rows;
  }
  for (let n = 1; km < st.km - 0.05; n++) {
    const endAt = addHours(at, 3);
    const kmTo = Math.min(st.km, km + 3 * speed);
    rows.push({ name: `Block ${n}`, from: at.slice(11), to: endAt.slice(11), startAt: at, endAt, kmFrom: Math.round(km), kmTo: Math.round(kmTo), rest: false, note: '' });
    km = kmTo;
    at = endAt;
  }
  return rows;
}

/**
 * Climbing of one day: from the elevation profile, scaled to the route's total (the profile is
 * thinned, so it sees less climbing than the full file). Without a profile: an even share.
 */
export function dayGain(route, day, days) {
  if (route.gainM == null) return null;
  const prof = route.profile ?? [];
  if (days === 1) return route.gainM;
  if (prof.length < 2) return Math.round(route.gainM / days);
  const total = climb(prof.map(([, ele]) => ({ ele }))).gain;
  if (!total) return Math.round(route.gainM / days);
  const end = prof.at(-1)[0];
  const [a, b] = [(end * day) / days, (end * (day + 1)) / days];
  const part = climb(prof.filter(([km]) => km >= a && km <= b).map(([, ele]) => ({ ele }))).gain;
  return Math.round((route.gainM * part) / total);
}

/** The part of the profile for one day: { points, from, to } in km of the whole route. */
export function dayProfile(route, day, days) {
  const prof = route?.profile ?? [];
  if (prof.length < 2) return null;
  const end = prof.at(-1)[0];
  return { points: prof, from: (end * day) / days, to: (end * (day + 1)) / days };
}

/** "HH:MM" plus hours; past midnight it says "+1 day". */
export function addTime(hhmm, hours) {
  if (hours == null || !/^\d{1,2}:\d{2}$/.test(hhmm ?? '')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const mins = h * 60 + m + Math.round(hours * 60);
  const t = `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  return mins >= 24 * 60 ? `${t} (+1 day)` : t;
}

/* ---------- what is where ---------- */

/** Name of the place an entry is in: the bag's purpose, else the bag, else the zone. */
export function placeName(trip, zone) {
  if (zone.key === 'body') return 'On you';
  if (zone.key === 'mounted') return 'On the bike';
  return trip.purpose?.[zone.key] || zoneName(zone);
}

/* ---------- weather hour by hour ---------- */

const API = 'https://api.open-meteo.com/v1/forecast';
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

/**
 * Hourly forecast from one day to another (a nonstop ride goes through the night) at a few places.
 * Returns { fetchedAt, places: [{ name, lat, lon, hours: [{ t, h, temp, rainMm, rainPct, wind, gust }] }] }.
 * t: "YYYY-MM-DDTHH:MM" in the local time of the place.
 */
export async function fetchHourly(places, date, fetcher = fetch, now = new Date(), endDate = date) {
  const out = [];
  for (const p of places) {
    const url = `${API}?latitude=${p.lat}&longitude=${p.lon}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m&start_date=${date}&end_date=${endDate}&timezone=auto`;
    const res = await fetcher(url);
    if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
    const { hourly = {} } = await res.json();
    const hours = (hourly.time ?? []).map((t, n) => ({
      t,
      h: Number(t.slice(11, 13)),
      temp: num(hourly.temperature_2m?.[n]),
      rainMm: num(hourly.precipitation?.[n]),
      rainPct: num(hourly.precipitation_probability?.[n]),
      wind: num(hourly.wind_speed_10m?.[n]),
      gust: num(hourly.wind_gusts_10m?.[n]),
    }));
    out.push({ name: p.name, lat: p.lat, lon: p.lon, hours });
  }
  return { fetchedAt: now.toISOString(), places: out };
}

/**
 * The hours of the ride, one hour before the start until one hour after the arrival.
 * Without times: 6 to 21 h of the first day.
 */
export function rideHours(hours, startAt, endAt) {
  if (!startAt || !hours.length || !hours[0].t) {
    const first = hours[0]?.t?.slice(0, 10);
    return hours.filter((x) => (!first || x.t.slice(0, 10) === first) && x.h >= 6 && x.h <= 21);
  }
  const from = addHours(startAt, -1).slice(0, 13);
  const to = endAt ? addHours(endAt, 1).slice(0, 13) : `${startAt.slice(0, 10)}T21`;
  return hours.filter((x) => x.t.slice(0, 13) >= from && x.t.slice(0, 13) <= to);
}

/** The hours of one block (for the weather next to a block). */
export const blockHours = (hours, b) => hours.filter((x) => x.t && x.t.slice(0, 13) >= b.startAt.slice(0, 13) && x.t.slice(0, 13) < b.endAt.slice(0, 13));

/** A short line for the day: "9–17 °C · rain from 14 h · wind up to 35 km/h". */
export function wxSummary(hours) {
  const temps = hours.map((x) => x.temp).filter((v) => v != null);
  if (!temps.length) return '';
  const [lo, hi] = [Math.round(Math.min(...temps)), Math.round(Math.max(...temps))];
  const parts = [lo === hi ? `${lo} °C` : `${lo}–${hi} °C`];
  const wet = hours.find((x) => (x.rainMm ?? 0) >= 0.5 || (x.rainPct ?? 0) >= 50);
  parts.push(wet ? `rain likely from ${wet.h} h` : 'dry');
  const gusts = hours.map((x) => x.gust ?? x.wind).filter((v) => v != null);
  if (gusts.length && Math.max(...gusts) >= 30) parts.push(`gusts up to ${Math.round(Math.max(...gusts))} km/h`);
  return parts.join(' · ');
}

/* ---------- notes for the debrief ---------- */

/** The trip's debrief with one more note from the ride (a new draft when there is none). */
export function addRideNote(debrief, trip, text, day = 0, now = new Date().toISOString()) {
  const d = debrief ? structuredClone(debrief) : newDebrief(trip, now);
  d.rideNotes = [...(d.rideNotes ?? []), { at: now, day, text: text.trim() }];
  d.updatedAt = now;
  return d;
}
