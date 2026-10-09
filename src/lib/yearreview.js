/**
 * v0.44.0 "Rückblick 12 Monate" (Noah, 9.10.2026: "immer die letzten 12 Monate als Karte auf Heute
 * und als eigene Seite"): what the last 12 months were, from the data the app already has.
 *
 * - The window is rolling, never a calendar year: the 12 months up to today on the device's own
 *   date (localday.js). today = 9.10.2026 → 10.10.2025 to 9.10.2026, both included. A trip exactly
 *   12 months ago (9.10.2025) belongs to the 12 months before, so the two periods never overlap.
 * - A trip counts by its START date: a multi-day trip that began before the window counts in the
 *   period before, whole (its days, nights and km), also when its last days fall into the window.
 *   A ride linked to such a trip goes with the trip; a ride on its own counts by its own date.
 * - Riding: finished trips (not skipped; debriefed, marked done or over by date), their days, the
 *   nights outside (days − 1, not for trips in a hotel), km (the debrief's km, else the route's,
 *   else the linked rides'), climbing and moving time (uploaded rides, gpx.js).
 * - Packing: base weight per trip (trips.js tripStats, today's item weights), dead weight (taken on
 *   2 or more debriefed trips of the window and never used, insights.js), the most used items and
 *   wishlist items bought (item.boughtAt, stored from 0.44.0 on when a wish becomes owned).
 * - Learning: learnings added, the debrief's clothing answer, the pace of the window against the
 *   one before (pace.js, from the rides in "Your pace").
 * - Bikes: km per bike (from the trips), workshop visits and their cost, parts replaced (own work
 *   and the bike shop's).
 * - Compared with the 12 months before: a delta only where both periods have a number and it differs.
 * Pure functions, tested in tests/review044.test.js. Words are written by the components.
 */
import { isInventory, isConsumable } from './gear.js';
import { isWorn, inStandard } from './blocks2026.js';
import { isOver } from './debrief.js';
import { tripStats } from './trips.js';
import { itemUsage, deadWeight } from './insights.js';
import { learnPace } from './pace.js';
import { withVisits, visitTotal } from './workshop.js';
import { PART } from './care.js';
import { localDay } from './localday.js';

const p2 = (n) => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1-12

/** The same day n months away (YYYY-MM-DD); the 31st or 29 February becomes the last day of a shorter month. */
export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const k = y * 12 + (m - 1) + n;
  const ny = Math.floor(k / 12);
  const nm = (k % 12) + 1;
  return `${ny}-${p2(nm)}-${p2(Math.min(d, lastDay(ny, nm)))}`;
}
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * The two periods: { from, to, prevFrom, prevTo } (all days included).
 * to = today, from = the day after today − 12 months; the period before ends on today − 12 months.
 */
export function reviewWindow(today = localDay()) {
  const back = addMonths(today, -12);
  const back2 = addMonths(today, -24);
  return { from: addDays(back, 1), to: today, prevFrom: addDays(back2, 1), prevTo: back };
}
const inside = (date, from, to) => !!date && date >= from && date <= to;

/** A trip that happened: not skipped, started by today, and debriefed, marked done or over. */
export function tripDone(trip, debriefs = [], today = localDay()) {
  if (!trip || trip.skipped || !trip.startDate || trip.startDate > today) return false;
  return trip.status === 'done' || !!trip.finished || isOver(trip, today) || debriefs.some((d) => d.tripId === trip.id && d.status === 'done');
}

const days = (t) => Math.max(1, Number(t.days) || 1);
/** Nights outside: every night of a trip of 2 or more days, unless it slept in a hotel. */
const nights = (t) => (t.overnight === 'lodging' || t.overnight === 'none' ? 0 : days(t) - 1);
const pos = (v) => (typeof v === 'number' && v > 0 ? v : null);

/** km of a trip: the debrief's, else the route's, else the sum of its linked rides; null when unknown. */
function tripKm(t, debrief, rides) {
  const linked = rides.filter((r) => r.tripId === t.id).reduce((s, r) => s + (Number(r.km) || 0), 0);
  return pos(debrief?.km) ?? pos(t.route?.km) ?? pos(linked);
}

/** The numbers of one period (from, to). */
function period(from, to, { trips, debriefs, rides, learnings, visits, today }) {
  const dById = Object.fromEntries(debriefs.filter((d) => d.status === 'done').map((d) => [d.tripId, d]));
  const done = trips.filter((t) => tripDone(t, debriefs, today));
  const doneIds = new Set(done.map((t) => t.id));
  const startOf = Object.fromEntries(done.map((t) => [t.id, t.startDate]));
  const list = done.filter((t) => inside(t.startDate, from, to)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const rows = list.map((t) => ({ trip: t, km: tripKm(t, dById[t.id], rides) }));
  // A ride goes with its trip (by the trip's start); on its own it counts by its own date.
  const rideDay = (r) => (r.tripId && doneIds.has(r.tripId) ? startOf[r.tripId] : r.date);
  const rideList = rides.filter((r) => inside(rideDay(r), from, to));
  const solo = rideList.filter((r) => !(r.tripId && doneIds.has(r.tripId)));
  const km = rows.reduce((s, r) => s + (r.km ?? 0), 0) + solo.reduce((s, r) => s + (Number(r.km) || 0), 0);
  const learned = learnings.filter((l) => inside(learnedOn(l), from, to));
  const vis = visits.filter((v) => inside(v.date, from, to));
  const totals = vis.map(visitTotal);
  return {
    list,
    rows,
    rides: rideList,
    solo,
    learned,
    visits: vis,
    n: {
      trips: list.length,
      days: list.reduce((s, t) => s + days(t), 0),
      nights: list.reduce((s, t) => s + nights(t), 0),
      km: Math.round(km),
      climbM: Math.round(rideList.reduce((s, r) => s + (Number(r.gainM) || 0), 0)),
      movingH: Math.round(rideList.reduce((s, r) => s + (Number(r.movingH) || 0), 0) * 10) / 10,
      learnings: learned.length,
      visits: vis.length,
      chf: Math.round(totals.reduce((s, c) => s + (c ?? 0), 0)),
    },
    chfUnknown: totals.filter((c) => c == null).length,
  };
}

/** The day a learning was made: an imported one by its own date, else when it was added. */
export const learnedOn = (l) => (l?.source === 'import' && l.date ? String(l.date).slice(0, 10) : l?.createdAt ? localDay(new Date(l.createdAt)) : null);

/** The numbers that get a "+3 trips" against the 12 months before. */
export const DELTA_KEYS = ['trips', 'days', 'nights', 'km', 'climbM', 'movingH', 'learnings', 'visits', 'chf'];

/** { key: difference } only where both periods have a number above 0 and they differ. */
export function deltas(cur, prev) {
  const out = {};
  for (const k of DELTA_KEYS) {
    const a = cur[k];
    const b = prev[k];
    if (!(a > 0) || !(b > 0)) continue;
    const d = Math.round((a - b) * 10) / 10;
    if (d) out[k] = d;
  }
  return out;
}

/** km per calendar month of the window (the first and the last month are partly in it), oldest first. */
export function kmByMonth(cur, from, to) {
  const months = [];
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = addMonths(`${m}-01`, 1).slice(0, 7)) months.push({ month: m, km: 0 });
  const add = (date, km) => {
    const row = months.find((x) => x.month === date.slice(0, 7));
    if (row && km) row.km += km;
  };
  for (const r of cur.rows) add(r.trip.startDate, r.km ?? 0);
  for (const r of cur.solo) add(r.date, Number(r.km) || 0);
  return months.map((x) => ({ ...x, km: Math.round(x.km) }));
}

/**
 * The whole review. Every input is optional; pace: the setting value of "Your pace" (pace.js).
 * Returns { window, empty, ride, prev, delta, months, pack, learn, bikes, has } where has says which
 * section has something to show (a section without data is left out, never filled with zeros).
 */
export function yearReview({ today = localDay(), trips = [], debriefs = [], items = [], containers = [], bikes = [], visits = [], rides = [], learnings = [], pace = null } = {}) {
  const w = reviewWindow(today);
  const ctx = { trips, debriefs, rides, learnings, visits, today };
  const cur = period(w.from, w.to, ctx);
  const before = period(w.prevFrom, w.prevTo, ctx);
  const empty = !cur.list.length && !cur.rides.length;

  /* riding */
  const longest = cur.rows.filter((r) => r.km).sort((a, b) => b.km - a.km)[0] ?? null;
  const ride = { ...cur.n, longest: longest ? { id: longest.trip.id, title: longest.trip.title, km: Math.round(longest.km) } : null };

  /* packing */
  const byBike = Object.fromEntries(bikes.map((b) => [b.id, b]));
  const points = cur.list
    .filter((t) => t.entries?.length)
    .map((t) => {
      const s = tripStats(t, items, containers, byBike[t.bikeId] ?? null, null);
      return { id: t.id, title: t.title, date: t.startDate, g: s.baseG, missing: s.baseMissing };
    })
    .filter((p) => p.g > 0);
  const trend = points.length >= 2 ? { points, first: points[0], last: points.at(-1), diffG: points.at(-1).g - points[0].g } : null;
  const usage = itemUsage(cur.list, debriefs);
  const dead = deadWeight(items, usage);
  const dById = Object.fromEntries(debriefs.filter((d) => d.status === 'done').map((d) => [d.tripId, d]));
  const usedN = {};
  for (const t of cur.list)
    for (const id of new Set((t.entries ?? []).map((e) => e.itemId))) if (dById[t.id]?.items?.[id] !== 'unused') usedN[id] = (usedN[id] ?? 0) + 1;
  const iById = Object.fromEntries(items.map((i) => [i.id, i]));
  const top = Object.entries(usedN)
    .map(([id, n]) => ({ item: iById[id], n }))
    .filter((r) => r.item && r.n >= 2 && isInventory(r.item) && !isConsumable(r.item) && r.item.category !== 'bike' && !isWorn(r.item) && !inStandard(r.item))
    .sort((a, b) => b.n - a.n || a.item.name.localeCompare(b.item.name))
    .slice(0, 3);
  const bought = items.filter((i) => isInventory(i) && i.boughtAt && inside(localDay(new Date(i.boughtAt)), w.from, w.to)).sort((a, b) => b.boughtAt.localeCompare(a.boughtAt));
  const pack = { trend, dead: dead.dead.map((r) => ({ item: r.item, g: r.g, taken: r.u.taken })), deadG: dead.deadG, top, bought };

  /* learning */
  const newest = [...cur.learned].sort((a, b) => (learnedOn(b) ?? '').localeCompare(learnedOn(a) ?? '') || String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 3);
  const clothing = { cold: 0, fit: 0, warm: 0 };
  for (const t of cur.list) {
    const c = dById[t.id]?.clothing;
    if (c in clothing) clothing[c]++;
  }
  const paceRides = pace?.rides ?? [];
  const pNow = learnPace(paceRides.filter((r) => inside(r.date, w.from, w.to)));
  const pBefore = learnPace(paceRides.filter((r) => inside(r.date, w.prevFrom, w.prevTo)));
  const learn = {
    n: cur.learned.length,
    newest,
    clothing: clothing.cold + clothing.fit + clothing.warm ? clothing : null,
    pace: pNow ? { kmh: pNow.kmh, n: pNow.n, before: pBefore?.kmh ?? null, diff: pBefore ? Math.round((pNow.kmh - pBefore.kmh) * 10) / 10 : null } : null,
  };

  /* bikes */
  const kmPer = {};
  for (const r of cur.rows) if (r.km && r.trip.bikeId) kmPer[r.trip.bikeId] = (kmPer[r.trip.bikeId] ?? 0) + r.km;
  const bikeKm = Object.entries(kmPer)
    .map(([id, km]) => ({ bikeId: id, bike: byBike[id]?.name ?? cur.list.find((t) => t.bikeId === id)?.bike ?? id, km: Math.round(km) }))
    .sort((a, b) => b.km - a.km);
  const parts = bikes
    .flatMap((b) =>
      withVisits(b, visits).parts.flatMap((p) =>
        (p.history ?? []).filter((h) => h.action === 'replace' && inside(h.date, w.from, w.to)).map((h) => ({ bikeId: b.id, bike: b.name, part: p.key, name: PART[p.key]?.name ?? p.name ?? p.key, date: h.date, by: h.by ?? 'self' })),
      ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const bikeOut = { km: bikeKm, visits: cur.n.visits, chf: cur.n.chf, chfUnknown: cur.chfUnknown, parts };

  const has = {
    ride: !!(ride.trips || ride.km || ride.movingH),
    pack: !!(trend || pack.dead.length || top.length || bought.length),
    learn: !!(learn.n || learn.clothing || learn.pace),
    bikes: !!(bikeKm.length || bikeOut.visits || parts.length),
  };
  return {
    window: w,
    empty,
    ride,
    prev: before.n,
    delta: deltas(cur.n, before.n),
    months: kmByMonth(cur, w.from, w.to),
    pack,
    learn,
    bikes: bikeOut,
    has,
  };
}

/**
 * The numbers for the card on Today, at most 4, only those with a value:
 * [{ key: 'trips' | 'km' | 'nights' | 'base' | 'days', value }]. base: the change of the base weight
 * from the first to the last trip (grams, can be negative).
 */
export function cardNumbers(r) {
  if (!r || r.empty) return [];
  const out = [];
  if (r.ride.trips) out.push({ key: 'trips', value: r.ride.trips });
  if (r.ride.km) out.push({ key: 'km', value: r.ride.km });
  if (r.ride.nights) out.push({ key: 'nights', value: r.ride.nights });
  else if (r.ride.days) out.push({ key: 'days', value: r.ride.days });
  if (r.pack.trend && r.pack.trend.diffG) out.push({ key: 'base', value: r.pack.trend.diffG });
  return out.slice(0, 4);
}

/**
 * The one most interesting fact, for the card's line (the component writes the words):
 * { key, ...data } or null. In this order: the base weight went down by 200 g or more; clearly more
 * km than the 12 months before; the longest trip; dead weight; learnings added; the pace.
 */
export function highlight(r) {
  if (!r || r.empty) return null;
  const tr = r.pack.trend;
  if (tr && tr.diffG <= -200) return { key: 'lighter', g: -tr.diffG };
  if (r.delta.km > 0 && r.prev.km && r.delta.km >= r.prev.km * 0.1) return { key: 'moreKm', km: r.delta.km };
  if (r.ride.longest) return { key: 'longest', title: r.ride.longest.title, km: r.ride.longest.km };
  if (r.pack.dead.length) return { key: 'dead', n: r.pack.dead.length, g: r.pack.deadG };
  if (r.learn.n) return { key: 'learnings', n: r.learn.n };
  if (r.learn.pace) return { key: 'pace', kmh: r.learn.pace.kmh };
  return null;
}
