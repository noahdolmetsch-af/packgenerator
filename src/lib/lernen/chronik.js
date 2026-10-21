/**
 * Paket M «Aus Touren lernen», #1027 «Chronik-Karte» (instead of «Vor einem Jahr»): what you did on this
 * day, else in this month, in earlier years: trips (title, year, km, one line from the debrief) and rides
 * or activities, with their route lines for one small drawn map (no map tiles, no network).
 * Pure functions; ChronikKarte.svelte writes the words. Tested in tests/chronik.test.js.
 */
import { tripDone } from '../yearreview.js';
import { tripEnd } from '../tripstate.js';
import { stravaName } from '../stravanames.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** The first line of a debrief note, at most 90 characters (empty without one). */
export function noteLine(note, max = 90) {
  const s = String(note ?? '').trim().split('\n')[0].trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Every day of a trip (YYYY-MM-DD), at most 60. */
function daysOf(trip) {
  const end = tripEnd(trip) ?? trip.startDate;
  const out = [];
  for (let d = trip.startDate, n = 0; d <= end && n < 60; d = addDays(d, 1), n++) out.push(d);
  return out;
}

/** Does a day (YYYY-MM-DD) of an earlier year match today's day or month? */
const sameDay = (iso, today) => {
  const md = iso.slice(5, 10);
  const want = today.slice(5, 10);
  return md === want || (want === '02-28' && md === '02-29') || (want === '02-29' && md === '02-28');
};
const sameMonth = (iso, today) => iso.slice(5, 7) === today.slice(5, 7);
const earlier = (iso, today) => !!iso && iso.slice(0, 4) < today.slice(0, 4);

/**
 * The entries of earlier years: { day: [entry], month: [entry] }, newest year first. An entry:
 * { kind: 'trip' | 'ride' | 'activity', id, title, year, date, km, note, lines: [[[lat, lon], …]], href }.
 * A ride that belongs to a trip shows with its trip (its line on the trip); an activity on a day that
 * already has a trip or ride is left out (the same ride, once from Strava).
 */
export function chronik({ trips = [], debriefs = [], rides = [], activities = [], today } = {}) {
  if (!today) return { day: [], month: [] };
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const tripIds = new Set(trips.map((x) => x.id));
  const all = [];
  for (const trip of trips) {
    if (!trip?.startDate || trip.skipped || !earlier(trip.startDate, today) || !tripDone(trip, debriefs, today)) continue;
    const days = daysOf(trip);
    const own = rides.filter((r) => r.tripId === trip.id);
    const d = dBy[trip.id];
    const lines = own.map((r) => r.line).filter((l) => Array.isArray(l) && l.length > 1);
    if (!lines.length && trip.route?.line?.length > 1) lines.push(trip.route.line);
    const km = pos(d?.status === 'done' ? d.km : null) ?? pos(own.reduce((s, r) => s + (pos(r.km) ?? 0), 0)) ?? pos(trip.route?.km);
    all.push({
      kind: 'trip',
      id: trip.id,
      title: trip.title ?? '',
      year: trip.startDate.slice(0, 4),
      date: trip.startDate,
      days,
      km: r1(km),
      note: noteLine(d?.note),
      lines,
      href: `#/debrief/${encodeURIComponent(trip.id)}`,
    });
  }
  for (const r of rides) {
    if (!r?.date || !earlier(r.date, today) || (r.tripId && tripIds.has(r.tripId))) continue;
    all.push({ kind: 'ride', id: r.id, title: r.name ?? '', year: r.date.slice(0, 4), date: r.date, days: [r.date], km: r1(pos(r.km)), note: '', lines: Array.isArray(r.line) && r.line.length > 1 ? [r.line] : [], href: `#/debrief/ride/${encodeURIComponent(r.id)}` });
  }
  const taken = new Set(all.flatMap((e) => e.days));
  for (const a of activities) {
    if (!a?.day || !earlier(a.day, today) || taken.has(a.day)) continue;
    all.push({ kind: 'activity', id: a.id, title: stravaName(a.name ?? ''), year: a.day.slice(0, 4), date: a.day, days: [a.day], km: r1(pos(a.km)), note: '', lines: [], href: null });
  }
  const rank = { trip: 0, ride: 1, activity: 2 };
  const order = (a, b) => b.year.localeCompare(a.year) || a.date.localeCompare(b.date) || rank[a.kind] - rank[b.kind] || a.title.localeCompare(b.title);
  const strip = ({ days, ...e }) => e;
  const day = all.filter((e) => e.days.some((x) => sameDay(x, today))).sort(order).map(strip);
  const month = all.filter((e) => e.days.some((x) => sameMonth(x, today))).sort(order).map(strip);
  return { day, month };
}

/**
 * Which view to show: the chosen one ('day' | 'month'), else 'day' when this day has something,
 * else 'month'. → { mode, list }.
 */
export function chronikView(c, mode = null) {
  const m = mode === 'day' || mode === 'month' ? mode : c.day.length ? 'day' : 'month';
  return { mode: m, list: m === 'day' ? c.day : c.month };
}

/** At most `max` points of a line, evenly picked (first and last stay). */
export function thinLine(line, max = 120) {
  if (!Array.isArray(line) || line.length <= max) return line ?? [];
  const out = [];
  const step = (line.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(line[Math.round(i * step)]);
  return out;
}

/**
 * Lines on a small drawing: a simple projection (longitude shrunk by cos(latitude)), fitted into
 * w × h with a margin. groups: [{ id, lines: [[[lat, lon], …]] }] → { w, h, paths: [{ id, d }] } or
 * null when there is no line. d: an SVG path («M x y L x y …»).
 */
export function projectLines(groups = [], w = 300, h = 160, pad = 10) {
  const valid = (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
  const gs = groups.map((g) => ({ id: g.id, lines: (g.lines ?? []).map((l) => thinLine(l).filter(valid)).filter((l) => l.length > 1) })).filter((g) => g.lines.length);
  if (!gs.length) return null;
  let s = 90, n = -90, west = 180, e = -180;
  for (const g of gs) for (const l of g.lines) for (const [lat, lon] of l) (s = Math.min(s, lat)), (n = Math.max(n, lat)), (west = Math.min(west, lon)), (e = Math.max(e, lon));
  const k = Math.cos((((s + n) / 2) * Math.PI) / 180) || 1;
  const spanX = Math.max(1e-6, (e - west) * k);
  const spanY = Math.max(1e-6, n - s);
  const sc = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
  const ox = (w - spanX * sc) / 2;
  const oy = (h - spanY * sc) / 2;
  const xy = ([lat, lon]) => `${Math.round((ox + (lon - west) * k * sc) * 10) / 10} ${Math.round((oy + (n - lat) * sc) * 10) / 10}`;
  return { w, h, paths: gs.map((g) => ({ id: g.id, d: g.lines.map((l) => `M${l.map(xy).join(' L')}`).join(' ') })) };
}
