/**
 * v0.49.0 R1 «Rückblick ruhig» (Noah 1b, 2a, 3a, 4a-7a): the numbers of the one Rückblick page,
 * of the table «Vergangene Touren» and of a trip's saved Rückblick, from the data the app has today
 * (trips, debriefs, uploaded rides, the route of the plan, the forecast saved on the trip, learnings).
 *
 * - tripFacts: one row per trip that happened (yearreview.js tripDone) and per uploaded ride on its
 *   own, newest first. Every number may be null (unknown is never 0): the page shows a calm «–».
 * - periodOf / periodStats: «Letzte 12 Monate» (rolling), «Jahr» (this calendar year up to today,
 *   against the same days of last year) or «Alle»; per number the value, the previous period, the
 *   average per trip and the best trip.
 * - compareSet: «Touren im Vergleich», the last 10 trips, the 12 months or the same kind (Art) as the
 *   newest one; 7 numbers with their values (oldest → newest), average and best.
 * - planVsReal / dayRows / nextHints: a trip's saved Rückblick (drei «A»).
 * Pure functions; the words are written by the components. Tested in tests/rueckblick049.test.js.
 */
import { tripDone, reviewWindow, addMonths, learnedOn } from '../yearreview.js';
import { tripEnd } from '../debrief.js';
import { hasBike, domainOf, BIKEPACKING } from '../domains.js';
import { isEvent } from '../care.js';
import { tripStats } from '../trips.js';
import { localDay } from '../localday.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const sum = (list, f) => {
  const vals = list.map(f).filter((v) => typeof v === 'number' && Number.isFinite(v));
  return vals.length ? vals.reduce((s, v) => s + v, 0) : null;
};
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The kinds the «Art» button filters by, in their order (English keys for t()). */
export const ARTS = [
  { key: 'day', name: 'Day ride|art' },
  { key: 'multi', name: 'Multi-day|art' },
  { key: 'event', name: 'Race|art' },
  { key: 'other', name: 'Without a bike|art' },
  { key: 'rain', name: 'With rain|art' },
];

/** The kind of a trip: 'event' (race, organised ride), 'other' (no bike), 'multi' or 'day'. */
export function artOf(trip) {
  if (!trip) return 'day';
  if (!hasBike(trip)) return 'other';
  if (trip.event || (trip.event == null && isEvent(trip))) return 'event';
  return (Number(trip.days) || 1) > 1 ? 'multi' : 'day';
}

/** Does a row match the Art filter ('all', one of ARTS)? */
export const matchesArt = (row, art) => !art || art === 'all' || (art === 'rain' ? row.rain?.wet === true : row.art === art);

/**
 * The weather of a trip: { wet: true | false | null, days: [day numbers 1…n with rain], tmin, tmax }.
 * From the forecast saved on the trip (its days; 1 mm or more counts as rain), else the packing
 * weather (trip.wx). Nothing known: wet null and no temperatures.
 */
export function weatherOf(trip) {
  const want = new Set(Array.from({ length: Math.max(1, Number(trip?.days) || 1) }, (_, n) => (trip?.startDate ? addDays(trip.startDate, n) : null)));
  const fc = (trip?.forecast?.days ?? []).filter((d) => want.has(d.date)).sort((a, b) => a.date.localeCompare(b.date));
  if (fc.length) {
    const mins = fc.map((d) => d.min).filter((v) => typeof v === 'number');
    const maxs = fc.map((d) => d.max).filter((v) => typeof v === 'number');
    const wetDays = fc.map((d, n) => ((d.rainMm ?? 0) >= 1 ? Math.round((Date.parse(`${d.date}T00:00:00Z`) - Date.parse(`${trip.startDate}T00:00:00Z`)) / 864e5) + 1 : null)).filter((n) => n != null);
    return { wet: wetDays.length > 0, days: wetDays, tmin: mins.length ? Math.floor(Math.min(...mins)) : null, tmax: maxs.length ? Math.ceil(Math.max(...maxs)) : null, mm: sum(fc, (d) => d.rainMm) };
  }
  const wx = trip?.wx;
  if (wx) return { wet: wx.rain ? wx.rain !== 'none' : null, days: [], tmin: typeof wx.min === 'number' ? wx.min : null, tmax: typeof wx.max === 'number' ? wx.max : null, mm: null };
  return { wet: null, days: [], tmin: null, tmax: null, mm: null };
}

/** The learnings of a trip: made from its debrief (source = its title) or from one of its rides. */
export function learningsOf(trip, learnings = [], rideIds = new Set()) {
  return learnings.filter((l) => (l.tripId && l.tripId === trip.id) || (l.rideId && rideIds.has(l.rideId)) || (!!trip.title && l.source === trip.title));
}

/**
 * One row per trip that happened and per uploaded ride without a trip, newest first:
 * { id, kind: 'trip' | 'ride', trip, rides, title, start, end, days, art, bike, km, gainM, movingH,
 *   totalH, kmh, pauses, rain, tmin, tmax, learnings, learning, special, baseG, debrief, href, profile }.
 */
export function tripFacts({ trips = [], debriefs = [], rides = [], learnings = [], items = [], containers = [], bikes = [], today = localDay() } = {}) {
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const bikeBy = Object.fromEntries(bikes.map((b) => [b.id, b]));
  const done = trips.filter((t) => tripDone(t, debriefs, today));
  const doneIds = new Set(done.map((t) => t.id));
  const fromRide = new Set(trips.map((t) => t.fromRide).filter(Boolean));
  const rows = done.map((trip) => {
    const own = rides.filter((r) => r.tripId === trip.id).sort((a, b) => (a.startAt ?? a.date ?? '').localeCompare(b.startAt ?? b.date ?? ''));
    const d = dBy[trip.id] ?? null;
    const km = pos(d?.status === 'done' ? d.km : null) ?? pos(sum(own, (r) => r.km)) ?? pos(trip.route?.km) ?? pos(d?.km);
    const gainM = pos(sum(own, (r) => r.gainM)) ?? pos(trip.route?.gainM);
    const movingH = r2(pos(sum(own, (r) => r.movingH)));
    const totalH = r2(pos(sum(own, (r) => Math.max(r.totalH ?? 0, r.movingH ?? 0))));
    const ridesKm = pos(sum(own, (r) => r.km));
    const wx = weatherOf(trip);
    const ls = learningsOf(trip, learnings, new Set(own.map((r) => r.id)));
    const note = (d?.note ?? '').trim();
    const learning = ls[0]?.rule ?? (note || null);
    const items0 = (trip.entries ?? []).length;
    const debrief = d?.status === 'done' ? 'done' : items0 && !trip.noDebrief ? (d ? 'draft' : 'open') : 'none';
    const art = artOf(trip);
    const baseG = art === 'multi' && items.length && items0 ? tripStats(trip, items, containers, bikeBy[trip.bikeId] ?? null, null).baseG || null : null;
    const pauses = own.flatMap((r) => r.pauses ?? []);
    return {
      id: trip.id,
      kind: 'trip',
      trip,
      rides: own,
      title: trip.title ?? '',
      start: trip.startDate,
      end: tripEnd(trip) ?? trip.startDate,
      days: Math.max(1, Number(trip.days) || 1),
      art,
      domain: domainOf(trip),
      bike: trip.bike ?? bikeBy[trip.bikeId]?.name ?? null,
      km: r1(km),
      gainM: gainM == null ? null : Math.round(gainM),
      movingH,
      totalH,
      kmh: ridesKm && movingH ? r1(ridesKm / movingH) : null,
      pauses: pauses.length ? { n: pauses.length, min: pauses.reduce((s, p) => s + (p.min ?? 0), 0) } : null,
      rain: { wet: wx.wet, days: wx.days },
      tmin: wx.tmin,
      tmax: wx.tmax,
      learnings: ls,
      learning,
      special: ls.length && note && note !== learning ? note : null,
      baseG,
      debrief,
      href: trip.fromRide && !items0 ? `#/debrief/ride/${encodeURIComponent(trip.fromRide)}` : debrief === 'none' && !items0 ? '#/pack' : `#/debrief/${encodeURIComponent(trip.id)}`,
      profile: own.length === 1 && own[0].profile?.length ? own[0].profile : trip.route?.profile?.length ? trip.route.profile : null,
    };
  });
  const solo = rides
    .filter((r) => r.date && r.date <= today && !(r.tripId && doneIds.has(r.tripId)) && !fromRide.has(r.id) && !(r.tripId && trips.some((t) => t.id === r.tripId)))
    .map((r) => {
      const ls = learnings.filter((l) => l.rideId === r.id);
      return {
        id: r.id,
        kind: 'ride',
        trip: null,
        rides: [r],
        title: r.name ?? '',
        start: r.date,
        end: r.date,
        days: 1,
        art: 'day',
        domain: BIKEPACKING,
        bike: null,
        km: r1(pos(r.km)),
        gainM: pos(r.gainM) == null ? null : Math.round(r.gainM),
        movingH: pos(r.movingH),
        totalH: pos(Math.max(r.totalH ?? 0, r.movingH ?? 0)),
        kmh: pos(r.km) && pos(r.movingH) ? r1(r.km / r.movingH) : null,
        pauses: r.pauses?.length ? { n: r.pauses.length, min: r.pauses.reduce((s, p) => s + (p.min ?? 0), 0) } : null,
        rain: { wet: null, days: [] },
        tmin: null,
        tmax: null,
        learnings: ls,
        learning: ls[0]?.rule ?? null,
        special: null,
        baseG: null,
        debrief: 'none',
        href: `#/debrief/ride/${encodeURIComponent(r.id)}`,
        profile: r.profile?.length ? r.profile : null,
      };
    });
  return [...rows, ...solo].sort((a, b) => (b.start ?? '').localeCompare(a.start ?? '') || (b.rides[0]?.startAt ?? '').localeCompare(a.rides[0]?.startAt ?? '') || a.title.localeCompare(b.title));
}

/** The search of Past trips: every word in the title, bike, place, learnings or the debrief sentence. */
export function searchFacts(rows, q = '') {
  const words = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  return rows.filter((r) => {
    const hay = [r.title, r.bike, r.trip?.place?.name, r.trip?.route?.name, r.special, r.trip ? null : r.rides[0]?.name, ...r.learnings.map((l) => `${l.rule} ${l.action ?? ''}`)].filter(Boolean).join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** The periods: '12m' (rolling), 'year' (1 January up to today), 'all'. { from, to, prevFrom?, prevTo? }. */
export function periodOf(mode, today = localDay()) {
  if (mode === 'all') return { mode, from: null, to: today, prevFrom: null, prevTo: null };
  if (mode === 'year') {
    const y = Number(today.slice(0, 4));
    return { mode, from: `${y}-01-01`, to: today, prevFrom: `${y - 1}-01-01`, prevTo: addMonths(today, -12) };
  }
  const w = reviewWindow(today);
  return { mode: '12m', ...w };
}
const inside = (iso, from, to) => !!iso && (!from || iso >= from) && iso <= to;

/** The 7 numbers of «Letzte 12 Monate» in their order. */
export const STAT_KEYS = ['trips', 'km', 'gainM', 'movingH', 'kmh', 'rain', 'learnings'];

function numbers(rows, learnings, from, to) {
  const known = (f) => rows.filter((r) => f(r) != null);
  const kmRows = known((r) => r.km);
  const speedRows = rows.filter((r) => r.movingH && r.rides.length);
  const ridesKm = sum(speedRows, (r) => sum(r.rides, (x) => x.km));
  const ridesH = sum(speedRows, (r) => r.movingH);
  const weather = rows.filter((r) => r.rain.wet != null);
  return {
    trips: rows.length,
    days: rows.reduce((s, r) => s + r.days, 0),
    km: kmRows.length ? Math.round(sum(kmRows, (r) => r.km)) : null,
    gainM: known((r) => r.gainM).length ? Math.round(sum(rows, (r) => r.gainM)) : null,
    movingH: known((r) => r.movingH).length ? r2(sum(rows, (r) => r.movingH)) : null,
    kmh: ridesKm && ridesH ? r1(ridesKm / ridesH) : null,
    kmhN: speedRows.length,
    rain: weather.length ? weather.filter((r) => r.rain.wet).length : null,
    rainKnown: weather.length,
    learnings: learnings.filter((l) => inside(learnedOn(l), from, to)).length,
  };
}

/**
 * The numbers of a period: { period, rows, empty, stats: [{ key, value, prev, delta, pct, avg, best }],
 * bars: [{ key, label, km }] }. delta/pct only where both periods have a number above 0.
 * avg: per trip of the known ones (trips: days on the way; rain: share of trips with known weather;
 * kmh: rides counted). best: { value, title, id } (trips: { value, month }; rain: most wet days).
 */
export function periodStats(facts = [], learnings = [], mode = '12m', today = localDay()) {
  const p = periodOf(mode, today);
  const rows = facts.filter((r) => inside(r.start, p.from, p.to));
  const prevRows = p.prevFrom ? facts.filter((r) => inside(r.start, p.prevFrom, p.prevTo)) : null;
  const cur = numbers(rows, learnings, p.from, p.to);
  const prev = prevRows ? numbers(prevRows, learnings, p.prevFrom, p.prevTo) : null;
  const top = (f, low = false) => {
    const xs = rows.filter((r) => f(r) != null).sort((a, b) => (low ? f(a) - f(b) : f(b) - f(a)));
    return xs.length ? { value: f(xs[0]), title: xs[0].title, id: xs[0].id } : null;
  };
  const avg = (f) => {
    const xs = rows.map(f).filter((v) => v != null);
    return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null;
  };
  const byMonth = {};
  for (const r of rows) byMonth[r.start.slice(0, 7)] = (byMonth[r.start.slice(0, 7)] ?? 0) + 1;
  const bestMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0];
  const stat = (key, value, extra = {}) => {
    const pv = prev ? prev[key] : null;
    const both = typeof value === 'number' && typeof pv === 'number' && value > 0 && pv > 0;
    return { key, value, prev: pv, delta: both ? r1(value - pv) : null, pct: both ? Math.round(((value - pv) / pv) * 100) : null, avg: null, best: null, ...extra };
  };
  const wetMost = rows.filter((r) => r.rain.days?.length).sort((a, b) => b.rain.days.length - a.rain.days.length)[0];
  const learnMost = rows.filter((r) => r.learnings.length).sort((a, b) => b.learnings.length - a.learnings.length)[0];
  const stats = [
    stat('trips', cur.trips, { avg: cur.days || null, best: bestMonth ? { value: bestMonth[1], month: bestMonth[0] } : null }),
    stat('km', cur.km, { avg: r1(avg((r) => r.km)), best: top((r) => r.km) }),
    stat('gainM', cur.gainM, { avg: avg((r) => r.gainM) == null ? null : Math.round(avg((r) => r.gainM)), best: top((r) => r.gainM) }),
    stat('movingH', cur.movingH, { avg: avg((r) => r.movingH), best: top((r) => r.movingH) }),
    stat('kmh', cur.kmh, { avg: cur.kmhN || null, best: top((r) => r.kmh) }),
    stat('rain', cur.rain, { avg: cur.rainKnown ? Math.round((cur.rain / cur.rainKnown) * 100) : null, best: wetMost ? { value: wetMost.rain.days.length, title: wetMost.title, id: wetMost.id } : null }),
    stat('learnings', cur.learnings, { avg: null, best: learnMost ? { value: learnMost.learnings.length, title: learnMost.title, id: learnMost.id } : null }),
  ];
  return { period: p, rows, empty: !rows.length, stats, bars: barsOf(rows, p, facts) };
}

/** km per month (12 months, this year) or per year (all), oldest first: [{ key, km }]. */
function barsOf(rows, p, facts) {
  const add = (out, key, km) => {
    const b = out.find((x) => x.key === key);
    if (b && km) b.km += km;
  };
  if (p.mode === 'all') {
    const years = [...new Set(facts.map((r) => r.start?.slice(0, 4)).filter(Boolean))].sort();
    if (!years.length) return [];
    const out = [];
    for (let y = Number(years[0]); y <= Number(p.to.slice(0, 4)); y++) out.push({ key: String(y), km: 0 });
    for (const r of rows) add(out, r.start.slice(0, 4), r.km ?? 0);
    return out.slice(-12).map((b) => ({ ...b, km: Math.round(b.km) }));
  }
  const out = [];
  for (let m = p.from.slice(0, 7); m <= p.to.slice(0, 7); m = addMonths(`${m}-01`, 1).slice(0, 7)) out.push({ key: m, km: 0 });
  for (const r of rows) add(out, r.start.slice(0, 7), r.km ?? 0);
  return out.map((b) => ({ ...b, km: Math.round(b.km) }));
}

/** The 7 numbers of «Touren im Vergleich» (low: a smaller number is the best one). */
export const COMPARE_KEYS = [
  { key: 'km', f: (r) => r.km },
  { key: 'gainM', f: (r) => r.gainM },
  { key: 'movingH', f: (r) => r.movingH },
  { key: 'kmh', f: (r) => r.kmh },
  { key: 'baseG', f: (r) => r.baseG, low: true },
  { key: 'rainDays', f: (r) => (r.rain.wet == null ? null : r.rain.wet ? Math.max(1, r.rain.days.length) : 0) },
  { key: 'learnings', f: (r) => (r.trip || r.learnings.length ? r.learnings.length : null) },
];
/** How many trips the comparison shows. */
export const COMPARE_N = 10;

/**
 * «Touren im Vergleich»: base 'last10' | '12m' | 'same' (the same Art as the newest trip).
 * → { latest, rows (newest first, at most COMPARE_N), total, metrics: [{ key, values (oldest → newest,
 * { id, v }), latest, avg, best }], sentence: { title, shorter, faster, kmh, hmPerKm } | null }.
 */
export function compareSet(facts = [], base = 'last10', today = localDay()) {
  const latest = facts[0] ?? null;
  let pool = facts;
  if (base === '12m') {
    const w = reviewWindow(today);
    pool = facts.filter((r) => inside(r.start, w.from, w.to));
  } else if (base === 'same' && latest) pool = facts.filter((r) => r.art === latest.art);
  const rows = pool.slice(0, COMPARE_N);
  const oldestFirst = [...rows].reverse();
  const metrics = COMPARE_KEYS.map(({ key, f, low }) => {
    const values = oldestFirst.map((r) => ({ id: r.id, v: f(r) }));
    const known = values.map((x) => x.v).filter((v) => v != null);
    const avg = known.length ? known.reduce((s, v) => s + v, 0) / known.length : null;
    const best = known.length ? (low ? Math.min(...known) : Math.max(...known)) : null;
    return { key, values, latest: latest && rows.includes(latest) ? f(latest) : null, avg, best, low: !!low };
  });
  let sentence = null;
  if (latest && rows.includes(latest) && rows.length >= 2) {
    const others = rows.filter((r) => r !== latest);
    const avgOf = (f) => {
      const xs = others.map(f).filter((v) => v != null);
      return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null;
    };
    const aKm = avgOf((r) => r.km);
    const aKmh = avgOf((r) => r.kmh);
    sentence = {
      title: latest.title,
      shorter: latest.km != null && aKm != null ? latest.km < aKm : null,
      faster: latest.kmh != null && aKmh != null ? latest.kmh > aKmh : null,
      kmh: latest.kmh,
      hmPerKm: latest.km && latest.gainM != null ? Math.round(latest.gainM / latest.km) : null,
    };
  }
  return { latest, rows, total: pool.length, metrics, sentence };
}

/**
 * A trip's plan against what happened: [{ key: 'km' | 'gainM' | 'movingH' | 'kmh', plan, real, diff }],
 * only the numbers both sides know. Plan: the route (km, climbing) and the time the rides were
 * planned with (ride.plan, gpx.js plannedFor); real: the debrief's km, else the rides'.
 */
export function planVsReal(row) {
  if (!row?.trip) return [];
  const trip = row.trip;
  const rides = row.rides ?? [];
  const planH = rides.length && rides.every((r) => pos(r.plan?.hours)) ? r2(sum(rides, (r) => r.plan.hours)) : null;
  const planKm = pos(trip.route?.km) ?? (rides.length && rides.every((r) => pos(r.plan?.km)) ? sum(rides, (r) => r.plan.km) : null);
  const planGain = pos(trip.route?.gainM) ?? (rides.length && rides.every((r) => r.plan?.gainM != null) ? sum(rides, (r) => r.plan.gainM) : null);
  const realKm = row.km;
  const realGain = rides.length ? pos(sum(rides, (r) => r.gainM)) : null;
  const realH = row.movingH;
  const out = [
    { key: 'km', plan: planKm, real: realKm },
    { key: 'gainM', plan: planGain, real: realGain },
    { key: 'movingH', plan: planH, real: realH },
    { key: 'kmh', plan: planKm && planH ? r1(planKm / planH) : null, real: row.kmh },
  ];
  return out.filter((x) => x.plan != null && x.real != null).map((x) => ({ ...x, plan: x.key === 'movingH' ? x.plan : r1(x.plan), diff: x.key === 'movingH' ? Math.round((x.real - x.plan) * 100) / 100 : r1(x.real - x.plan) }));
}

/** The days of a trip of 2 or more days: [{ n, date, km, gainM, movingH, rain (mm), tmin, tmax }]. */
export function dayRows(row) {
  if (!row?.trip || row.days < 2) return [];
  const trip = row.trip;
  return Array.from({ length: row.days }, (_, i) => {
    const date = addDays(trip.startDate, i);
    const rs = row.rides.filter((r) => r.date === date);
    const fc = (trip.forecast?.days ?? []).find((d) => d.date === date) ?? null;
    return {
      n: i + 1,
      date,
      km: rs.length ? r1(sum(rs, (r) => r.km)) : null,
      gainM: rs.length ? sum(rs, (r) => r.gainM) : null,
      movingH: rs.length ? r2(sum(rs, (r) => r.movingH)) : null,
      rain: fc?.rainMm ?? null,
      tmin: typeof fc?.min === 'number' ? Math.floor(fc.min) : null,
      tmax: typeof fc?.max === 'number' ? Math.ceil(fc.max) : null,
    };
  });
}

/** The next trip still ahead (not called off), the same area first; null when there is none. */
export function nextTripAfter(trip, trips = [], today = localDay()) {
  const ahead = trips.filter((t) => t.id !== trip?.id && !t.skipped && t.startDate && t.startDate > today && t.status !== 'done').sort((a, b) => a.startDate.localeCompare(b.startDate));
  return ahead.find((t) => domainOf(t) === domainOf(trip)) ?? ahead[0] ?? null;
}

/**
 * What this trip says for the next one: [{ kind: 'unused' | 'missing' | 'broken' | 'learning' | 'note', text, itemId? }].
 * unused: not used here and packed again on the next trip; missing: missed here; broken: to check;
 * learning: the learnings of the trip; note: the debrief's sentence for next time.
 */
export function nextHints({ debrief, next, learnings = [], byId = {} }) {
  if (!debrief) return [];
  const nextIds = new Set((next?.entries ?? []).map((e) => e.itemId));
  const out = [];
  for (const [id, st] of Object.entries(debrief.items ?? {})) {
    if (st === 'unused' && next && nextIds.has(id) && byId[id]) out.push({ kind: 'unused', itemId: id, item: byId[id] });
    if (st === 'broken' && byId[id]) out.push({ kind: 'broken', itemId: id, item: byId[id] });
  }
  for (const m of debrief.missing ?? []) out.push({ kind: 'missing', text: m.name, itemId: m.itemId ?? null, packed: !!(m.itemId && nextIds.has(m.itemId)) });
  const note = (debrief.note ?? '').trim();
  if (note && !learnings.some((l) => l.rule === note)) out.push({ kind: 'note', text: note });
  return out;
}
