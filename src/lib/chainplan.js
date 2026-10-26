/**
 * «Kette vorausschauend» (Noah 25.10.2026, «Kette und Bike Service angehen … proaktive Wartungsvorschläge
 * insb. für Kette»): what the chain needs next, before it is too late.
 *
 * From what the app already knows (no new data):
 * - the measured values since the last new chain (messen.js chainValues), plus the new chain itself as
 *   0 % at its mounting km, so one measurement is already enough for a first forecast («estimated»);
 * - the stretch per 1000 km (least squares over the values), and from it the km and, at the pace of the
 *   last 8 weeks (wear.js weeklyKm), the day the chain reaches its warning value and its replace limit;
 * - when the next measurement is due (every MEASURE_EVERY km, every MEASURE_CLOSE km near the limit);
 * - the lube interval of the bike (quickcare.js quickHints);
 * - the next trip of the bike: does the chain reach its limit before or during it?
 *
 * The result is at most three steps, the most urgent first. Everything is a suggestion.
 * Pure functions only, tested in tests/chainplan.test.js.
 */
import { PART, partInfo, needsWork } from './care.js';
import { chainValues } from './messen.js';
import { quickHints } from './quickcare.js';
import { weeklyKm, dueDay } from './wear.js';
import { partStart } from './kmbook.js';
import { localDay } from './localday.js';

/** Measure the chain every this many km. */
export const MEASURE_EVERY = 500;
/** Near the limit (less than this many km left, or over the warning value): measure more often. */
export const MEASURE_CLOSE = 250;
/** Over this value the old chain may have worn the cassette and chainring too (care.js replaceHint). */
export const CASSETTE_AT = 0.75;
/** A step «soon» when the limit is this many km away or closer. */
export const SOON_KM = 300;
/** Lube «soon» when this many km are left to the interval. */
export const LUBE_SOON = 30;

const DAY = 864e5;
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const r50 = (km) => Math.max(0, Math.round(km / 50) * 50);

/**
 * The stretch per 1000 km from points [{ km, value }] (least squares), or null: it needs two points
 * at least 100 km apart, and a chain only gets longer (a rate ≤ 0 says nothing).
 */
export function stretchRate(points = []) {
  const p = points.filter((x) => isNum(x.km) && isNum(x.value));
  if (p.length < 2) return null;
  const kms = p.map((x) => x.km);
  if (Math.max(...kms) - Math.min(...kms) < 100) return null;
  const mk = kms.reduce((s, k) => s + k, 0) / p.length;
  const mv = p.reduce((s, x) => s + x.value, 0) / p.length;
  const num = p.reduce((s, x) => s + (x.km - mk) * (x.value - mv), 0);
  const den = p.reduce((s, x) => s + (x.km - mk) ** 2, 0);
  const rate = den ? (num / den) * 1000 : 0;
  return rate > 0 ? Math.round(rate * 1000) / 1000 : null;
}

/**
 * The forecast of the chain: { points, rate, estimated, now, kmToWarn, kmToLimit, warnDay, limitDay }.
 * bike: the withVisits view (a new chain from the bike shop starts the list anew), with km.
 * estimated: the forecast leans on the new chain as 0 % (only one value measured).
 * now: the value it should have today at that rate (never below the last measured value).
 */
export function chainForecast(bike, { entries = [], today = localDay() } = {}) {
  const part = (bike?.parts ?? []).find((p) => p.key === 'chain');
  if (!part) return null;
  const info = partInfo(part);
  const limit = isNum(info.limit) ? info.limit : PART.chain.limit;
  const warnAt = isNum(info.warnAt) ? info.warnAt : PART.chain.warnAt;
  const vals = chainValues(bike);
  const withKm = vals.filter((v) => isNum(v.km));
  const start = partStart(part);
  let points = withKm;
  let estimated = false;
  if (withKm.length === 1 && start && start.km < withKm[0].km) {
    points = [{ date: start.date, km: start.km, value: 0, mount: true }, ...withKm];
    estimated = true;
  }
  const rate = stretchRate(points);
  const last = vals.at(-1) ?? null;
  const perWeek = weeklyKm(entries, bike?.id, today);
  const out = { limit, warnAt, values: vals, points, rate, estimated, last, now: last?.value ?? null, kmToWarn: null, kmToLimit: null, warnDay: null, limitDay: null, perWeek };
  if (!last || !rate || !isNum(bike?.km)) return out;
  const lastKm = withKm.at(-1)?.km ?? null;
  const since = lastKm != null ? Math.max(0, bike.km - lastKm) : 0;
  const now = Math.max(last.value, last.value + (rate * since) / 1000);
  out.now = Math.round(now * 100) / 100;
  const toKm = (v) => (now >= v ? 0 : r50(((v - now) / rate) * 1000));
  out.kmToWarn = toKm(warnAt);
  out.kmToLimit = toKm(limit);
  out.warnDay = dueDay(out.kmToWarn, perWeek, today);
  out.limitDay = dueDay(out.kmToLimit, perWeek, today);
  return out;
}

/**
 * When the next measurement is due: { every, since, left, never } or null (km unknown).
 * since: km since the last measurement (or since the new chain); never: no value since the new chain.
 */
export function measureDue(bike, fc) {
  if (!isNum(bike?.km) || !fc) return null;
  const part = (bike.parts ?? []).find((p) => p.key === 'chain');
  const start = part ? partStart(part) : null;
  const lastKm = [...(fc.values ?? [])].reverse().find((v) => isNum(v.km))?.km ?? null;
  const from = lastKm ?? start?.km ?? null;
  if (from == null) return null;
  const close = (fc.now != null && fc.now >= fc.warnAt) || (fc.kmToLimit != null && fc.kmToLimit < MEASURE_CLOSE * 2);
  const every = close ? MEASURE_CLOSE : MEASURE_EVERY;
  const since = Math.max(0, bike.km - from);
  return { every, since, left: every - since, never: lastKm == null, close };
}

/**
 * The trip check: does the chain reach its limit before or during the trip?
 * trip: { id, name, startDate, days, route: { km } }. → { when: 'before' | 'during', trip } or null.
 * Without route km it counts the pace of the last weeks until the last day.
 */
export function chainForTrip(fc, trip, today = localDay()) {
  if (!fc || !trip?.startDate || fc.kmToLimit == null) return null;
  if (fc.kmToLimit === 0) return { when: 'before', trip };
  const days = Math.max(1, Number(trip.days) || 1);
  const end = addDays(trip.startDate, days - 1);
  const before = fc.perWeek ? Math.max(0, (daysBetween(today, trip.startDate) / 7) * fc.perWeek) : 0;
  if (fc.limitDay && fc.limitDay < trip.startDate) return { when: 'before', trip };
  const routeKm = isNum(trip.route?.km) ? trip.route.km : null;
  if (routeKm != null) return fc.kmToLimit <= before + routeKm ? { when: before >= fc.kmToLimit ? 'before' : 'during', trip } : null;
  return fc.limitDay && fc.limitDay <= end ? { when: 'during', trip } : null;
}

/**
 * The plan for the chain: { fc, measure, lube, steps } with at most three steps, the most urgent first.
 * A step: { kind, tone: 'due' | 'soon', ... }. Kinds:
 * - 'replace': measured at or over the limit, or work needed (cassette: over CASSETTE_AT, check it too);
 * - 'trip': it reaches the limit before or during the next trip (when, trip);
 * - 'soon': the limit is SOON_KM km away or closer by the forecast (km, day);
 * - 'measure': a measurement is due (since, never);
 * - 'lube': the lube interval is reached or nearly (left).
 * bike: withVisits view with km; trip: the bike's next trip or null.
 */
export function chainPlan(bike, { entries = [], today = localDay(), trip = null, visits = [] } = {}) {
  const part = (bike?.parts ?? []).find((p) => p.key === 'chain');
  if (!part) return null;
  const fc = chainForecast(bike, { entries, today });
  const measure = measureDue(bike, fc);
  const hints = quickHints(bike, { visits, today });
  const lube = hints.chain;
  const steps = [];
  const worn = (fc.last && fc.last.value >= fc.limit) || needsWork(part);
  if (worn) steps.push({ kind: 'replace', tone: 'due', value: fc.last?.value ?? null, cassette: (fc.last?.value ?? 0) > CASSETTE_AT });
  else {
    const tr = chainForTrip(fc, trip, today);
    if (tr) steps.push({ kind: 'trip', tone: tr.when === 'before' ? 'due' : 'soon', when: tr.when, trip: tr.trip });
    else if (fc.kmToLimit != null && fc.kmToLimit <= SOON_KM) steps.push({ kind: 'soon', tone: fc.kmToLimit === 0 ? 'due' : 'soon', km: fc.kmToLimit, day: fc.limitDay });
    if (measure && measure.left <= 0) steps.push({ kind: 'measure', tone: measure.close ? 'due' : 'soon', since: measure.since, never: measure.never });
  }
  if (lube && lube.left <= LUBE_SOON) steps.push({ kind: 'lube', tone: lube.left <= 0 ? 'due' : 'soon', left: lube.left });
  const rank = { due: 0, soon: 1 };
  steps.sort((a, b) => rank[a.tone] - rank[b.tone]);
  return { fc, measure, lube, steps: steps.slice(0, 3) };
}

/**
 * The phone reminders (push kind 'wear', «Teile abgenutzt»): «measure the chain» when a measurement is due,
 * once per last measured km; «new chain before the trip» once per trip. → [{ key, day, kind, bike, url, ... }]
 * bikes: withVisits views; tripOf(bike) gives the bike's next trip or null.
 */
export function chainPush(bikes = [], { entries = [], today = localDay(), tripOf = () => null } = {}) {
  const out = [];
  for (const b of bikes) {
    if (b.status === 'sold' || b.archived) continue;
    const plan = chainPlan(b, { entries, today, trip: tripOf(b) });
    if (!plan) continue;
    const url = `#/bikes?tab=care&view=wear&bike=${encodeURIComponent(b.id)}`;
    for (const s of plan.steps) {
      if (s.kind === 'measure') out.push({ key: `chainmeasure:${b.id}:${b.km - plan.measure.since}`, day: today, kind: 'measure', bike: b.name, since: plan.measure.since, url });
      if (s.kind === 'trip') out.push({ key: `chaintrip:${b.id}:${s.trip.id ?? s.trip.startDate}`, day: today, kind: 'trip', bike: b.name, trip: s.trip.name || '', url });
    }
  }
  return out;
}

/**
 * The rides that wait in Strava «To check» (no bike yet, or this bike unsure): their km do not count for
 * the chain yet, so the forecast is too slow. → the number of such rides.
 */
export const openRides = (entries = [], bikeId = null) => entries.filter((e) => e.kind === 'ride' && e.state === 'open' && (!e.bikeId || e.bikeId === bikeId)).length;
