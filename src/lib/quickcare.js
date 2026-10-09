/**
 * v0.38.0 "Heute und Menü" (Noah 8a, 9a, 10a): Today's bike buttons, the ready light per bike, the
 * jumps and the season in numbers. Pure functions, tested in tests/quickcare.test.js; the page
 * (lib/home/*.svelte) writes the result into the database and offers Undo.
 *
 * The buttons write exactly what Bike care writes (care.js logPart, the part's history):
 * - chain lubed / waxed: a service of the chain, with date and km (counts the 150 km anew);
 * - chain wear measured: a check of the chain with the value in %; at the limit "work needed";
 * - sealant topped up: a service of "Tyres + sealant" (counts the 3 months anew);
 * - tyre pressure checked: a check of the tyres, the pressure front and rear can be added after;
 * - bike washed: new, the bike's own list bike.washes (no part has it); the log shows it;
 * - km: the bike's km and the day they were set (the same as "change km" in Bike care).
 */
import { logPart, PART, kmSince, lastValue, parseKm } from './care.js';
import { partStatus, yearSummary } from './care/last.js';
import { timeDue, tyreSetup, costByYear } from './workshop.js';
import { bikeCare } from './readiness.js';
import { finishedTrips, bikeRides } from './know.js';
import { tripEnd } from './debrief.js';

/** The six bike buttons, in this order (Noah 8a). */
export const QUICK = ['chain', 'wear', 'wash', 'sealant', 'pressure', 'km'];

const isWork = (h) => h.action === 'service' || h.action === 'replace';

/**
 * The ready light of one bike (Noah 10a): { tone, n } with tone
 * 'due' (red, "Due": something to do now), 'soon' (yellow, "Due soon": a part close to its interval or
 * wear limit, or due before the next trip on this bike), 'ok' (green, "Ready") or 'nodata' (grey:
 * nothing to judge by, never "ready"). n: how many things are due now (or soon).
 * bike: from withVisits (workshop.js).
 */
export function readyLight(bike, { tasks = [], visits = [], trip = null, today } = {}) {
  const care = bikeCare(bike, { tasks, visits, trip, today });
  if (!care) return { tone: 'nodata', n: 0 };
  if (care.status === 'due') return { tone: 'due', n: care.rows.length };
  const time = timeDue(bike, tyreSetup(bike, visits), today);
  const soon = (bike.parts ?? []).filter((p) => partStatus(bike, p, time, today).state === 'soon').length + (care.soon?.length ?? 0);
  if (soon) return { tone: 'soon', n: soon };
  return { tone: care.status === 'nodata' ? 'nodata' : 'ok', n: 0 };
}

/** The word of each light (English keys for t()); a colour is never alone. */
export const LIGHT_WORD = { due: 'Due|light', soon: 'Due soon', ok: 'Ready', nodata: 'No data|light' };

/**
 * What each button shows beside its name, from the bike as it is: { chain, wear, sealant, pressure, km, wash }.
 * chain: { left } km to the next lube (negative: overdue) or null; wear: the last value in % or null;
 * sealant: { days } until it is due (≤ 0: due), null without a record, false on tubes;
 * pressure: { f, r } the last pressures in bar or null; wash: the last wash day or null; km: the km or null.
 */
export function quickHints(bike, { visits = [], today } = {}) {
  const part = (key) => (bike.parts ?? []).find((p) => p.key === key) ?? null;
  const chain = part('chain');
  const since = chain ? kmSince(bike, [...(chain.history ?? [])].reverse().find(isWork)) : null;
  const every = PART.chain.everyKm;
  const setup = tyreSetup(bike, visits);
  const tubes = setup.front === 'tube' && setup.rear === 'tube';
  const sealant = tubes ? false : (timeDue(bike, setup, today).find((s) => s.key === 'tyres') ?? null);
  const tyres = part('tyres');
  const pressured = [...(tyres?.history ?? [])].reverse().find((h) => h.pressureF != null || h.pressureR != null) ?? null;
  return {
    chain: since == null ? null : { left: every - since, every },
    wear: chain ? (lastValue(chain)?.value ?? null) : null,
    sealant: sealant === false ? false : sealant && !sealant.never ? { days: sealant.days } : null,
    pressure: pressured ? { f: pressured.pressureF ?? null, r: pressured.pressureR ?? null } : null,
    wash: (bike.washes ?? []).at(-1)?.date ?? null,
    km: typeof bike.km === 'number' ? bike.km : null,
  };
}

/**
 * One tap on a bike button: the fields to store on the bike (from the bike AS STORED, not withVisits).
 * kind: 'chain' | 'wear' | 'wash' | 'sealant' | 'pressure'; value: the chain wear in % ('wear').
 * Returns { changes, entry } (changes: { parts } or { washes }; entry: what was written), or null.
 */
export function quickLog(stored, kind, { today, value = null } = {}) {
  const km = typeof stored.km === 'number' ? stored.km : null;
  const base = { date: today, km, value: null, by: 'self', model: null, note: '' };
  const parts = stored.parts ?? [];
  if (kind === 'chain') {
    const entry = { ...base, action: 'service', result: 'done' };
    return { changes: { parts: logPart(parts, 'chain', entry) }, entry };
  }
  if (kind === 'wear') {
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0 || v > 5) return null;
    const limit = parts.find((p) => p.key === 'chain')?.limit ?? PART.chain.limit;
    const entry = { ...base, value: Math.round(v * 100) / 100, action: 'check', result: v >= limit ? 'needed' : 'ok' };
    return { changes: { parts: logPart(parts, 'chain', entry) }, entry };
  }
  if (kind === 'sealant') {
    const entry = { ...base, action: 'service', result: 'done', note: '' };
    return { changes: { parts: logPart(parts, 'tyres', entry) }, entry };
  }
  if (kind === 'pressure') {
    const entry = { ...base, action: 'check', result: 'ok', note: '' };
    return { changes: { parts: logPart(parts, 'tyres', entry) }, entry };
  }
  if (kind === 'wash') {
    const entry = { date: today, km, by: 'self' };
    return { changes: { washes: [...(stored.washes ?? []), entry] }, entry };
  }
  return null;
}

/**
 * The pressures added after "Tyre pressure checked": the last tyre entry of that day gets them.
 * f, r: bar (null: not given). Returns the new parts or null when there is no such entry.
 */
export function addPressure(stored, { f = null, r = null, today } = {}) {
  const parts = stored.parts ?? [];
  const tyres = parts.find((p) => p.key === 'tyres');
  const i = (tyres?.history ?? []).findLastIndex((h) => h.date === today && h.action === 'check');
  if (i < 0) return null;
  const extra = { ...(f != null ? { pressureF: f } : {}), ...(r != null ? { pressureR: r } : {}) };
  return parts.map((p) => (p.key === 'tyres' ? { ...p, history: p.history.map((h, n) => (n === i ? { ...h, ...extra } : h)) } : p));
}

/** A pressure as typed ("1,8", "1.8 bar"): bar between 0.5 and 8, else NaN; empty: null. */
export function parseBar(text) {
  const s = String(text ?? '').trim().replace(/\s*bar$/i, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0.5 && n <= 8 ? Math.round(n * 100) / 100 : NaN;
}

/**
 * "km nachtragen" (Noah 8a): the ridden difference ("+42") or the new counter ("5042").
 * Returns the new km, null for an empty field, NaN for anything else (or a counter below the old one
 * by more than a typo: a new counter must not be smaller, a difference must be > 0).
 */
export function kmFrom(text, current = null) {
  const s = String(text ?? '').trim();
  if (s === '') return null;
  const plus = /^\+/.test(s);
  const n = parseKm(s.replace(/^\+\s*/, ''));
  if (n == null || Number.isNaN(n)) return NaN;
  if (plus) return n > 0 ? (current ?? 0) + n : NaN;
  return n;
}

/** The 0.05 % steps of the chain checker, kept between 0 and 1.5 %. */
export const stepWear = (v, dir) => Math.max(0, Math.min(1.5, Math.round(((Number(v) || 0) + dir * 0.05) * 100) / 100));

/* ---------- Jump to (Noah 9a) ---------- */

/**
 * What is due on all bikes: { points, bikes } (points: the rows due now, bikes: how many bikes).
 * bikes: from withVisits.
 */
export function dueAll(bikes = [], { tasks = [], visits = [], today } = {}) {
  const per = bikes.map((b) => bikeCare(b, { tasks, visits, today })?.rows.length ?? 0);
  return { points: per.reduce((s, n) => s + n, 0), bikes: per.filter(Boolean).length };
}

const shift = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);

/**
 * A year ago (Noah 9a): the trip that ran closest to this day last year (within 3 weeks), with its
 * learnings (learnings keep the trip's title as source). → { trip, learnings, debriefed } or null.
 */
export function yearAgo(trips = [], debriefs = [], learnings = [], today) {
  const day = shift(today, -365);
  const from = shift(day, -21);
  const to = shift(day, 21);
  const dist = (t) => Math.abs(Date.parse(`${t.startDate}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`));
  const trip = trips
    .filter((t) => !t.skipped && t.startDate && t.startDate <= to && (tripEnd(t) ?? t.startDate) >= from)
    .sort((a, b) => dist(a) - dist(b) || (a.title ?? '').localeCompare(b.title ?? ''))[0];
  if (!trip) return null;
  return { trip, learnings: learnings.filter((l) => l.source === trip.title).length, debriefed: debriefs.some((d) => d.tripId === trip.id && d.status === 'done') };
}

/**
 * The season in numbers (Noah 9a): this calendar year's km (from the debriefs of the trips, the app
 * keeps no km history), finished trips, their days and the care jobs (mine and the bike shop's).
 * cost: the workshop visits of the year (workshop.js costByYear) or null.
 * → { year, km, kmBikes, trips, days, jobs, cost } or null when the year has nothing yet.
 */
export function seasonNumbers(bikes = [], trips = [], debriefs = [], visits = [], tasks = [], today) {
  const year = today.slice(0, 4);
  const done = finishedTrips(trips, debriefs, today).filter((t) => t.startDate.startsWith(year));
  const kmPer = bikes.map((b) => bikeRides(b.id, trips, debriefs).filter((r) => r.date.startsWith(year)).reduce((s, r) => s + r.km, 0));
  const km = kmPer.reduce((s, n) => s + n, 0);
  const jobs = bikes.reduce((s, b) => {
    const y = yearSummary(b, visits, tasks, year);
    const washes = (b.washes ?? []).filter((w) => String(w.date ?? '').startsWith(year)).length;
    return s + y.self + y.shop + washes;
  }, 0);
  const days = done.reduce((s, t) => s + Math.max(1, Number(t.days) || 1), 0);
  const cost = costByYear(visits).find((y) => y.year === year) ?? null;
  if (!km && !done.length && !jobs && !cost) return null;
  return { year, km, kmBikes: kmPer.filter(Boolean).length, trips: done.length, days, jobs, cost };
}
