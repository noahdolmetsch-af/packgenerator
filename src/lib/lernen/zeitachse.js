/**
 * Paket M «Aus Touren lernen», #1027 «Chronik» (Noah «1b»): everything on one time line (trips, rides,
 * activities, bike care, meditation, notes), one page per month, with a filter «Velo». For #/chronik.
 * Pure functions; Chronik.svelte writes the words. Tested in tests/chronik.test.js.
 */
import { tripDone } from '../yearreview.js';
import { noteLine } from './chronik.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const localDayOf = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
};

/** The filter chips of #/chronik, in their order (English keys for t()). */
export const CHRONIK_FILTERS = [
  { key: 'all', name: 'All|chronik' },
  { key: 'velo', name: 'Bike|chronik' },
  { key: 'trips', name: 'Trips|chronik' },
  { key: 'care', name: 'Care|chronik' },
  { key: 'meditation', name: 'Meditation|chronik' },
  { key: 'notes', name: 'Notes|chronik' },
];
export const FILTER_KEYS = CHRONIK_FILTERS.map((f) => f.key);
const KIND_FILTER = { trip: 'trips', ride: 'trips', activity: 'trips', care: 'care', meditation: 'meditation', note: 'notes' };

/** Does an entry pass a filter? 'velo': trips with a bike, rides, bike activities, bike care. */
export const passes = (e, f) => !f || f === 'all' || (f === 'velo' ? !!e.velo : KIND_FILTER[e.kind] === f);

/** Is a trip one on the bike? (a bike chosen, or the bikepacking area) */
const onBike = (trip) => !!(trip.bikeId || trip.bike) || trip.domain === 'bikepacking' || (trip.domains ?? []).includes('bikepacking');

/**
 * Every entry of the time line, newest first: { kind, id, date, title, sub, km, min, parts, href, velo }.
 * kind: 'trip' | 'ride' | 'activity' | 'care' (a workshop visit or a done repair) | 'meditation' | 'note'.
 * title and sub are raw data (the trip's title, the debrief line, the shop, the bike); the page writes the words.
 * A ride of a trip shows with its trip; a Strava bike activity on a day with a trip or ride is the same ride.
 */
export function timeline({ trips = [], debriefs = [], rides = [], activities = [], visits = [], maintenance = [], flowLog = [], notes = [], bikes = [], today } = {}) {
  const out = [];
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const bikeBy = Object.fromEntries(bikes.map((b) => [b.id, b]));
  const tripIds = new Set(trips.map((x) => x.id));
  for (const trip of trips) {
    if (!trip?.startDate || trip.skipped || trip.archivedAt || trip.startDate > today || !tripDone(trip, debriefs, today)) continue;
    const d = dBy[trip.id];
    const own = rides.filter((r) => r.tripId === trip.id);
    const km = pos(d?.status === 'done' ? d.km : null) ?? pos(own.reduce((s, r) => s + (pos(r.km) ?? 0), 0)) ?? pos(trip.route?.km);
    out.push({ kind: 'trip', id: trip.id, date: trip.startDate, days: Math.max(1, Number(trip.days) || 1), title: trip.title ?? '', sub: noteLine(d?.note), km: r1(km), href: `#/debrief/${encodeURIComponent(trip.id)}`, velo: onBike(trip) });
  }
  for (const r of rides) {
    if (!r?.date || r.date > today || (r.tripId && tripIds.has(r.tripId))) continue;
    out.push({ kind: 'ride', id: r.id, date: r.date, title: r.name ?? '', sub: '', km: r1(pos(r.km)), href: `#/debrief/ride/${encodeURIComponent(r.id)}`, velo: true });
  }
  const taken = new Set(out.map((e) => e.date));
  for (const a of activities) {
    if (!a?.day || a.day > today || (a.kind === 'bike' && taken.has(a.day))) continue;
    out.push({ kind: 'activity', id: a.id, date: a.day, title: a.name ?? '', sub: a.type ?? '', km: r1(pos(a.km)), href: null, velo: a.kind === 'bike' });
  }
  for (const v of visits) {
    if (!v?.date || v.date > today) continue;
    out.push({ kind: 'care', id: v.id, date: v.date, title: v.shop ?? '', sub: bikeBy[v.bikeId]?.name ?? '', parts: (v.parts ?? []).length, km: null, href: '#/bikes?tab=care', velo: true });
  }
  for (const m of maintenance) {
    if (m?.status !== 'done' || !m.statusDate || m.statusDate > today) continue;
    out.push({ kind: 'care', id: `m-${m.id}`, date: m.statusDate, title: m.task ?? '', sub: m.subject ?? '', km: null, href: '#/bikes?tab=care', velo: true });
  }
  for (const f of flowLog) {
    if (f?.actId !== 'meditation' || !f.day || f.day > today) continue;
    out.push({ kind: 'meditation', id: f.id, date: f.day, title: '', sub: '', min: pos(Number(f.min)), km: null, href: '#/flow/act/meditation', velo: false });
  }
  for (const n of notes) {
    const day = n?.at ? localDayOf(n.at) : null;
    if (!day || day > today || n.deletedAt) continue;
    out.push({ kind: 'note', id: n.id, date: day, title: noteLine(n.text, 120), sub: '', km: null, href: '#/notes', velo: false });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind) || String(a.title).localeCompare(String(b.title)));
}

/**
 * One month of the time line under a filter: { month, months: [{ month, n }] (every month with entries,
 * newest first), days: [{ date, entries }] (newest first), n }. Without a month: the newest one.
 */
export function monthPage(entries = [], month = null, filter = 'all') {
  const shown = entries.filter((e) => passes(e, filter));
  const count = {};
  for (const e of shown) count[e.date.slice(0, 7)] = (count[e.date.slice(0, 7)] ?? 0) + 1;
  const months = Object.keys(count).sort().reverse().map((m) => ({ month: m, n: count[m] }));
  const m = month ?? months[0]?.month ?? null;
  const days = [];
  for (const e of shown) {
    if (e.date.slice(0, 7) !== m) continue;
    const last = days.at(-1);
    if (last?.date === e.date) last.entries.push(e);
    else days.push({ date: e.date, entries: [e] });
  }
  return { month: m, months, days, n: days.reduce((s, d) => s + d.entries.length, 0) };
}
