/**
 * Workshop visits (Noah, 4.10.2026, answers 7a-20a): every visit to the bike shop is one record
 * with its receipt photos. Its jobs count as history of the bike's parts, so "what was done when",
 * the 1000 km check and the wear of each part know about them. The visits stay in their own table:
 * the bike's own history is never changed by an import, and a visit can be fixed or removed alone.
 *
 * Pure functions only, so they are easy to test.
 */
import { PART, PARTS, ensureParts, partInfo, checkState, wear, needsWork, kmSince, CHECK_KM, prepFor, prepRules, isPrep, taskBike } from './care.js';

const DAY = 864e5;
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (date, n) => iso(new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY));
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / DAY);

/** The visits of one bike, newest first. */
export const visitsOf = (visits, bikeId) => visits.filter((v) => v.bikeId === bikeId).sort((a, b) => b.date.localeCompare(a.date));

/** What the visit cost: the total on the receipt, else the sum of its jobs; null when no price is known. */
export function visitTotal(v) {
  if (typeof v.totalChf === 'number') return v.totalChf;
  const priced = (v.parts ?? []).filter((p) => typeof p.chf === 'number');
  return priced.length ? Math.round(priced.reduce((t, p) => t + p.chf, 0) * 100) / 100 : null;
}

/** One job of a visit as a part history entry ("by bike shop"). */
const asEntry = (v, line) => ({
  date: v.date,
  km: typeof v.km === 'number' ? v.km : null,
  value: null,
  action: line.action,
  result: line.action === 'check' ? 'ok' : 'done',
  by: 'shop',
  model: line.model ?? null,
  note: line.what ?? '',
  visitId: v.id,
  chf: line.chf ?? null,
});

/**
 * The bike as the app shows it: its parts (with the parts added since) and the jobs of its visits
 * merged into each part's history by date. Only for showing and working things out; never store it,
 * or the visits would be counted twice.
 */
export function withVisits(bike, visits = []) {
  const mine = visits.filter((v) => v.bikeId === bike.id);
  const parts = ensureParts(bike).map((p) => {
    const jobs = mine.flatMap((v) => (v.parts ?? []).filter((l) => l.part === p.key).map((l) => asEntry(v, l)));
    if (!jobs.length) return p;
    // Stable merge by date: the bike's own entries keep their order.
    const history = [...(p.history ?? []), ...jobs].map((h, n) => [h, n]).sort(([a, i], [b, j]) => (a.date ?? '').localeCompare(b.date ?? '') || i - j).map(([h]) => h);
    // Answer 10a: the model of the last replaced part comes from the receipt when none is typed in.
    const model = p.model || [...jobs].reverse().find((h) => h.action === 'replace' && h.model)?.model || '';
    return { ...p, model, history };
  });
  return { ...bike, parts };
}

/* ---------- tube or tubeless (answer 12a) ---------- */

/** { front, rear }: 'tubeless' | 'tube' | null. The bike's own setting wins, else the newest receipt. */
export function tyreSetup(bike, visits = []) {
  const fromVisit = visitsOf(visits, bike.id).flatMap((v) => (v.parts ?? []).filter((l) => l.setup)).map((l) => l.setup)[0] ?? {};
  return { front: bike.tyreSetup?.front ?? fromVisit.front ?? null, rear: bike.tyreSetup?.rear ?? fromVisit.rear ?? null };
}

/* ---------- due by time (answers 13a-17b) ---------- */

/**
 * Services by time: fork and shock once a year, sealant every 3 months (only when a wheel is tubeless).
 * bike: from withVisits. Returns [{ key, name, last, next, days, overdue, never }], soonest first.
 * days: days until it is due (negative: overdue). never: nothing recorded yet, so no date.
 */
export function timeDue(bike, setup = { front: null, rear: null }, today = iso(new Date())) {
  const anyTubeless = setup.front === 'tubeless' || setup.rear === 'tubeless';
  const unknown = setup.front == null && setup.rear == null;
  return (bike.parts ?? [])
    .map(partInfo)
    .filter((p) => p.everyDays && (!p.tubeless || anyTubeless || unknown))
    .map((p) => {
      const last = [...(p.history ?? [])].reverse().find((h) => h.action === 'service' || h.action === 'replace') ?? null;
      if (!last?.date) return { key: p.key, name: p.due, every: p.everyDays, last: null, next: null, days: null, overdue: false, never: true };
      const next = addDays(last.date, p.everyDays);
      const days = daysBetween(today, next);
      return { key: p.key, name: p.due, every: p.everyDays, last: last.date, next, days, overdue: days <= 0, never: false };
    })
    .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity));
}

/* ---------- costs (answer 18a) ---------- */

/** Cost per year, newest year first: [{ year, chf, visits, unknown }] (unknown: visits without a price). */
export function costByYear(visits) {
  const by = {};
  for (const v of visits) {
    const y = v.date.slice(0, 4);
    by[y] ??= { year: y, chf: 0, visits: 0, unknown: 0 };
    const total = visitTotal(v);
    by[y].chf += total ?? 0;
    by[y].visits += 1;
    if (total == null) by[y].unknown += 1;
  }
  return Object.values(by)
    .map((r) => ({ ...r, chf: Math.round(r.chf * 100) / 100 }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

/** What cost the most, per part (jobs without a part go to "Other"): [{ key, name, chf }], highest first. */
export function costByPart(visits, top = 4) {
  const by = {};
  for (const v of visits) for (const l of v.parts ?? []) by[l.part] = (by[l.part] ?? 0) + (l.chf ?? 0);
  return Object.entries(by)
    .map(([key, chf]) => ({ key, name: PART[key]?.name ?? 'Other', chf: Math.round(chf * 100) / 100 }))
    .filter((r) => r.chf > 0)
    .sort((a, b) => b.chf - a.chf)
    .slice(0, top);
}

/**
 * Cost per 1000 km: everything paid from the first visit with known km and a known price on,
 * over the km ridden since that visit. Only after 1000 km, so one fresh visit does not look huge.
 * Returns { chf, km, since } or { wait: km still to ride } or null when the km are not known.
 */
export const PER_KM_AFTER = 1000;
export function costPer1000(visits, bike) {
  const known = visits.filter((v) => typeof v.km === 'number' && visitTotal(v) != null).sort((a, b) => a.date.localeCompare(b.date));
  if (!known.length || typeof bike.km !== 'number') return null;
  const first = known[0];
  const km = bike.km - first.km;
  if (km < PER_KM_AFTER) return { wait: PER_KM_AFTER - Math.max(0, km), since: first.date };
  const chf = visits.filter((v) => v.date >= first.date).reduce((t, v) => t + (visitTotal(v) ?? 0), 0);
  return { chf: Math.round((chf / km) * 1000), km, since: first.date };
}

/* ---------- wishlist (answer 19a) ---------- */

/** The last price paid for this part on this bike (a replaced part with a price): { chf, date, shop, model } or null. */
export function lastPrice(visits, bikeId, key) {
  for (const v of visitsOf(visits, bikeId)) {
    const l = (v.parts ?? []).find((x) => x.part === key && x.action === 'replace' && x.chf);
    if (l) return { chf: l.chf, date: v.date, shop: v.shop, model: l.model ?? '' };
  }
  return null;
}

/** Part keys that can hold a job, for the visit editor. */
export const JOB_PARTS = [...PARTS.map((p) => ({ key: p.key, name: p.name })), { key: 'other', name: 'Other' }];

/* ---------- workshop before a trip (v0.18.0, answers 9a and 10a) ---------- */

/** The reminder starts this many days before a trip. */
export const REMIND_DAYS = 14;

const lastServiceOf = (p) => [...(p.history ?? [])].reverse().find((h) => h.action === 'service' || h.action === 'replace') ?? null;

/**
 * What the bike needs before a trip: everything that is due now, and what becomes due on the way
 * (by date, or because the route's km push it over its interval). Only from 14 days before the
 * start until the last day; else null. bike: from withVisits.
 * Returns { days, rows: [{ key, name, when: 'now' | 'during', late, detail }] }, "now" first.
 * late: due already today (Bike care lists these under "Due now").
 */
export function beforeTrip(bike, trip, setup = { front: null, rear: null }, today = iso(new Date())) {
  if (!bike || !trip?.startDate) return null;
  const end = addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1);
  if (today > end) return null;
  // Earlier than 14 days before: only what is already due today (answer 10a).
  const early = today < addDays(trip.startDate, -REMIND_DAYS);
  const res = bikeDue(bike, trip, setup, today, end);
  return early ? { ...res, rows: res.rows.filter((r) => r.when === 'now' && (r.late || r.worn)) } : res;
}

function bikeDue(bike, trip, setup, today, end) {
  const tripKm = typeof trip.route?.km === 'number' ? trip.route.km : null;
  const rows = [];
  // By time: fork, shock, sealant.
  for (const t of timeDue(bike, setup, today)) {
    if (t.never || t.next > end) continue;
    const now = t.next < trip.startDate;
    rows.push({ key: t.key, name: t.name, when: now ? 'now' : 'during', late: t.overdue, detail: t.overdue ? `overdue since ${t.next}` : now ? `due ${t.next}, before the start` : `due ${t.next}, on the trip` });
  }
  // By km: services with their own interval (wax the chain every 150 km).
  for (const p of (bike.parts ?? []).map(partInfo).filter((x) => x.everyKm)) {
    const since = kmSince(bike, lastServiceOf(p));
    if (since == null) continue;
    const name = `${p.service} ${p.name.toLowerCase()}`;
    if (since >= p.everyKm) rows.push({ key: p.key, name, when: 'now', late: true, detail: `${since} km since the last time (every ${p.everyKm} km)` });
    else if (tripKm != null && since + tripKm >= p.everyKm) rows.push({ key: p.key, name, when: 'during', detail: `due after ${p.everyKm - since} km of the route` });
  }
  // The 1000 km check: due now, or reached on the way.
  const check = checkState(bike);
  if (check.due) rows.push({ key: 'check', name: `${CHECK_KM.toLocaleString('en')} km check`, when: 'now', late: true, detail: `${check.due} ${check.due === 1 ? 'point' : 'points'} due` });
  else if (tripKm != null) {
    const soon = check.rows.filter((r) => r.since != null && r.since + tripKm >= CHECK_KM);
    if (soon.length) rows.push({ key: 'check', name: `${CHECK_KM.toLocaleString('en')} km check`, when: 'during', detail: `${soon.length} ${soon.length === 1 ? 'point is' : 'points are'} reached on the route. Do it before.` });
  }
  // Worn parts and open work.
  for (const p of (bike.parts ?? []).filter((x) => needsWork(x) || wear(x) === 'worn')) {
    rows.push({ key: p.key, name: `${PART[p.key]?.name ?? p.key}: replace or fix`, when: 'now', worn: true, detail: needsWork(p) ? 'work needed' : 'worn' });
  }
  return { days: Math.max(0, daysBetween(today, trip.startDate)), rows: rows.sort((a, b) => Number(a.when !== 'now') - Number(b.when !== 'now')) };
}

/* ---------- one list "Before the trip" (v0.18.2, answer 3a) ---------- */

/**
 * Everything to do before a trip, in one list for Home, Pack and Bike care: the preparation
 * tasks with their dates, what the bike needs (workshop, from 14 days before; things due
 * today always) and open repairs of this bike.
 * Returns { rows, done, total, rules } or null without a dated trip.
 * rows: [{ key, kind: 'prep' | 'bike' | 'repair', name, detail, late, when: 'now' | 'during', due, prep?, task? }],
 * late first, then by date, things due on the way last. done/total count the preparation tasks.
 */
const short = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function tripPrep(bike, trip, tasks = [], setup = { front: null, rear: null }, today = iso(new Date())) {
  if (!trip?.startDate) return null;
  const prep = prepFor(trip, tasks, today);
  const rows = prep
    .filter((r) => !r.finished)
    .map((r) => ({
      key: `prep:${r.task.id}`, kind: 'prep', name: r.task.task, late: r.overdue || r.needed, when: 'now', due: r.due, prep: r,
      detail: r.needed ? 'work needed' : r.overdue ? `was due ${short(r.due)}` : `by ${short(r.due)}`,
    }));
  for (const b of beforeTrip(bike, trip, setup, today)?.rows ?? []) {
    rows.push({ key: `bike:${b.key}:${b.when}`, kind: 'bike', name: b.name, detail: b.detail, late: !!(b.late || b.worn), when: b.when, due: null });
  }
  if (bike) {
    for (const t of tasks.filter((x) => !isPrep(x) && taskBike(x) === bike.id && (x.status === 'open' || x.status === 'needed'))) {
      rows.push({ key: `repair:${t.id}`, kind: 'repair', name: t.task, detail: t.status === 'needed' ? 'work needed' : 'open repair', late: t.status === 'needed', when: 'now', due: null, task: t });
    }
  }
  const rank = (r) => (r.late ? 0 : r.when === 'during' ? 2 : 1);
  rows.sort((a, b) => rank(a) - rank(b) || (a.due ?? '9').localeCompare(b.due ?? '9'));
  return { rows, done: prep.filter((r) => r.finished).length, total: prep.length, rules: prepRules(trip, tasks).filter((r) => r.from <= today) };
}
