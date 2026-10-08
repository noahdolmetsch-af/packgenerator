/**
 * Workshop visits (Noah, 4.10.2026, answers 7a-20a): every visit to the bike shop is one record
 * with its receipt photos. Its jobs count as history of the bike's parts, so "what was done when",
 * the 1000 km check and the wear of each part know about them. The visits stay in their own table:
 * the bike's own history is never changed by an import, and a visit can be fixed or removed alone.
 *
 * Pure functions only, so they are easy to test.
 */
import { PART, PARTS, ensureParts, partInfo, checkState, wear, needsWork, kmSince, CHECK_KM, prepFor, prepRules, prepSummary, isPrep, taskBike, serviceName } from './care.js';
import { t as tr, tn, num, locale } from './i18n.svelte.js';
import { localDay } from './localday.js';

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
export function timeDue(bike, setup = { front: null, rear: null }, today = localDay()) {
  const anyTubeless = setup.front === 'tubeless' || setup.rear === 'tubeless';
  const unknown = setup.front == null && setup.rear == null;
  return (bike.parts ?? [])
    .map(partInfo)
    .filter((p) => p.everyDays && (!p.tubeless || anyTubeless || unknown))
    .map((p) => {
      const last = [...(p.history ?? [])].reverse().find((h) => h.action === 'service' || h.action === 'replace') ?? null;
      if (!last?.date) return { key: p.key, name: tr(p.due), every: p.everyDays, last: null, next: null, days: null, overdue: false, never: true };
      const next = addDays(last.date, p.everyDays);
      const days = daysBetween(today, next);
      return { key: p.key, name: tr(p.due), every: p.everyDays, last: last.date, next, days, overdue: days <= 0, never: false };
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
    .map(([key, chf]) => ({ key, name: tr(PART[key]?.name ?? 'Other'), chf: Math.round(chf * 100) / 100 }))
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
export function beforeTrip(bike, trip, setup = { front: null, rear: null }, today = localDay()) {
  if (!bike || !trip?.startDate) return null;
  const end = addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1);
  if (today > end) return null;
  // Earlier than 14 days before: only what is already due today (answer 10a).
  const early = today < addDays(trip.startDate, -REMIND_DAYS);
  const res = bikeDue(bike, trip, setup, today, end);
  return early ? { ...res, rows: res.rows.filter((r) => r.when === 'now' && (r.late || r.worn)) } : res;
}

/**
 * v0.22.0 (Noah 3a, 2026-10-07): how long something is overdue in words, not a raw date:
 * "overdue for 5 days", "overdue for 3 weeks", "overdue for 2 months". date and today: YYYY-MM-DD.
 */
export function overdueFor(date, today) {
  return overdueDays(Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000));
}
export function overdueDays(days) {
  days = Math.max(0, days);
  if (days === 0) return tr('due today');
  if (days < 14) return tn(days, 'overdue for {n} day', 'overdue for {n} days');
  if (days < 61) return tn(Math.round(days / 7), 'overdue for {n} week', 'overdue for {n} weeks');
  return tn(Math.round(days / 30), 'overdue for {n} month', 'overdue for {n} months');
}

/** v0.22.0: exported for readiness.js (the same rules for Home, Pack and Care). */
export function bikeDue(bike, trip, setup, today, end) {
  const tripKm = typeof trip.route?.km === 'number' ? trip.route.km : null;
  const rows = [];
  // By time: fork, shock, sealant.
  for (const t of timeDue(bike, setup, today)) {
    if (t.never || t.next > end) continue;
    const now = t.next < trip.startDate;
    rows.push({ key: t.key, name: t.name, when: now ? 'now' : 'during', late: t.overdue, detail: t.overdue ? overdueFor(t.next, today) : now ? tr('due {date}, before the start', { date: t.next }) : tr('due {date}, on the trip', { date: t.next }) });
  }
  // By km: services with their own interval (wax the chain every 150 km).
  for (const p of (bike.parts ?? []).map(partInfo).filter((x) => x.everyKm)) {
    const since = kmSince(bike, lastServiceOf(p));
    if (since == null) continue;
    const name = serviceName(p);
    if (since >= p.everyKm) rows.push({ key: p.key, name, when: 'now', late: true, detail: tr('{since} km since the last time (every {every} km)', { since, every: p.everyKm }) });
    else if (tripKm != null && since + tripKm >= p.everyKm) rows.push({ key: p.key, name, when: 'during', detail: tr('due after {km} km of the route', { km: p.everyKm - since }) });
  }
  // The 1000 km check: due now, or reached on the way.
  const check = checkState(bike);
  if (check.due) rows.push({ key: 'check', name: tr('{km} km check', { km: num(CHECK_KM) }), when: 'now', late: true, detail: tn(check.due, '{n} point due', '{n} points due') });
  else if (tripKm != null) {
    const soon = check.rows.filter((r) => r.since != null && r.since + tripKm >= CHECK_KM);
    if (soon.length) rows.push({ key: 'check', name: tr('{km} km check', { km: num(CHECK_KM) }), when: 'during', detail: tn(soon.length, '{n} point is reached on the route. Do it before.', '{n} points are reached on the route. Do it before.') });
  }
  // Worn parts and open work.
  for (const p of (bike.parts ?? []).filter((x) => needsWork(x) || wear(x) === 'worn')) {
    rows.push({ key: p.key, name: tr('{part}: replace or fix', { part: PART[p.key] ? tr(PART[p.key].name) : p.key }), when: 'now', worn: true, detail: needsWork(p) ? tr('work needed') : tr('worn') });
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
const short = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function tripPrep(bike, trip, tasks = [], setup = { front: null, rear: null }, today = localDay()) {
  if (!trip?.startDate) return null;
  const prep = prepFor(trip, tasks, today);
  const rows = prep
    .filter((r) => !r.finished)
    .map((r) => ({
      key: `prep:${r.task.id}`, kind: 'prep', name: r.task.task, late: r.overdue || r.needed, when: 'now', due: r.due, prep: r,
      detail: r.needed ? tr('work needed') : r.overdue ? overdueFor(r.due, today) : tr('by {date}', { date: short(r.due) }),
    }));
  for (const b of beforeTrip(bike, trip, setup, today)?.rows ?? []) {
    rows.push({ key: `bike:${b.key}:${b.when}`, kind: 'bike', name: b.name, detail: b.detail, late: !!(b.late || b.worn), when: b.when, due: null });
  }
  if (bike) {
    for (const t of tasks.filter((x) => !isPrep(x) && taskBike(x) === bike.id && (x.status === 'open' || x.status === 'needed'))) {
      rows.push({ key: `repair:${t.id}`, kind: 'repair', name: t.task, detail: t.status === 'needed' ? tr('work needed') : tr('open repair'), late: t.status === 'needed', when: 'now', due: null, task: t });
    }
  }
  const rank = (r) => (r.late ? 0 : r.when === 'during' ? 2 : 1);
  rows.sort((a, b) => rank(a) - rank(b) || (a.due ?? '9').localeCompare(b.due ?? '9'));
  // v0.21.0 (decision 5, answer 2b): group tells the preparation tasks (they stay on every trip)
  // from what the bike needs (workshop and repairs). An extra field, kind stays as it was.
  for (const r of rows) r.group = r.kind === 'prep' ? 'prep' : 'bike';
  return { rows, done: prep.filter((r) => r.finished).length, total: prep.length, prep: prepSummary(prep), rules: prepRules(trip, tasks).filter((r) => r.from <= today) };
}

/**
 * v0.21.0: the rows of tripPrep in two groups, for one folded line "Preparation: n open (m overdue)"
 * and the bike rows on their own. Rows without group (older callers) count by kind.
 * Returns { prep: { rows, late }, bike: { rows, late } }.
 */
export function prepGroups(rows = []) {
  const of = (g) => {
    const list = rows.filter((r) => (r.group ?? (r.kind === 'prep' ? 'prep' : 'bike')) === g);
    return { rows: list, late: list.filter((r) => r.late).length };
  };
  return { prep: of('prep'), bike: of('bike') };
}

/* ---------- workshop order (v0.19.3, N15, answer 8a) ---------- */

/** Which receipt lines tell the price of a job: part, action and, for the sealant, the words on the line. */
const PRICE_OF = {
  check: { part: 'bolts', action: 'check' },
  // A tubeless conversion also mentions sealant but costs much more than topping it up.
  tyres: { part: 'tyres', action: 'service', match: /sealant|dichtmilch/i, not: /convert|umbau/i },
};
/** The jobs in German, for the message to the bike shop. */
const DE = {
  fork: 'Gabel-Service', shock: 'Dämpfer-Service', tyres: 'Dichtmilch nachfüllen', check: '1000-km-Check (Bremsen, Kette, Reifen, Schrauben, Schaltung, Lager)',
  chain: 'Kette', chainring: 'Kettenblatt', cassette: 'Kassette', padsF: 'Bremsbeläge vorne', padsR: 'Bremsbeläge hinten', rotorF: 'Bremsscheibe vorne', rotorR: 'Bremsscheibe hinten',
  linkage: 'Hinterbau-Lager', saddle: 'Sattelhöhe', shifting: 'Schaltung', brakes: 'Bremsen', wheels: 'Laufräder', cockpit: 'Cockpit', bolts: 'Schrauben', bearings: 'Lager',
};

/**
 * What the shop charged last time for this job: this bike's newest receipt line first, else
 * another bike's. Returns { chf, date, bikeId, shop } or null.
 */
export function priceFor(visits, bikeId, key, action = 'service') {
  const want = PRICE_OF[key] ?? { part: key, action };
  const fits = (l) => l.part === want.part && l.action === want.action && typeof l.chf === 'number' && l.chf > 0 && (!want.match || want.match.test(l.what ?? '')) && !want.not?.test(l.what ?? '');
  const newest = [...visits].sort((a, b) => b.date.localeCompare(a.date));
  for (const mine of [true, false]) {
    for (const v of newest.filter((x) => (x.bikeId === bikeId) === mine)) {
      const l = (v.parts ?? []).find(fits);
      if (l) return { chf: l.chf, date: v.date, bikeId: v.bikeId, shop: v.shop };
    }
  }
  return null;
}

/**
 * One order for the bike shop: everything the bike needs before the next trip (or, without a
 * trip, what is due today), with a price from the receipts where one is known.
 * bike: from withVisits. Returns { rows, total, unknown, shop } with
 * rows: [{ key, name, de, detail, when, chf, from }]. Open repairs of the bike come last, without a price.
 * Waxing the chain is left out: that is done at home. Option skip(key): true leaves that job out
 * (v0.31.0: what the owner usually does himself, see care/last.js shopSkip).
 */
export function workshopOrder(bike, trip, tasks = [], visits = [], setup = { front: null, rear: null }, today = localDay(), { skip = null } = {}) {
  if (!bike) return null;
  const due = trip?.startDate && today <= addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1)
    ? bikeDue(bike, trip, setup, today, addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1))
    : bikeDue(bike, { startDate: today, days: 1 }, setup, today, today);
  // Waxing the chain every 150 km is done at home, not in the shop.
  // v0.31.0 (proposal 3/4): skip(key) leaves out the jobs the owner usually does himself
  // (part keys, 'check' for the 1000 km check); open repairs always stay.
  const rows = due.rows.filter((r) => !(r.key === 'chain' && !r.worn) && !skip?.(r.key)).map((r) => {
    const action = r.worn ? 'replace' : r.key === 'check' ? 'check' : 'service';
    const price = priceFor(visits, bike.id, r.key, action);
    const de = r.worn ? `${DE[r.key] ?? r.key} prüfen, wenn nötig ersetzen` : r.key === 'chain' ? 'Kette wachsen' : DE[r.key] ?? r.name;
    return { key: `${r.key}:${r.when}`, name: r.name, de, detail: r.detail, when: r.when, chf: price?.chf ?? null, from: price };
  });
  for (const t of tasks.filter((x) => !isPrep(x) && taskBike(x) === bike.id && (x.status === 'open' || x.status === 'needed'))) {
    rows.push({ key: `repair:${t.id}`, name: t.task, de: t.task, detail: t.status === 'needed' ? tr('work needed') : tr('open repair'), when: 'now', chf: null, from: null });
  }
  const shop = visitsOf(visits, bike.id)[0]?.shop ?? [...visits].sort((a, b) => b.date.localeCompare(a.date))[0]?.shop ?? '';
  return { rows, ...orderSum(rows), shop };
}

/** The estimate of the rows that are ticked: { total, unknown } (unknown: rows without a price). */
export function orderSum(rows) {
  const total = Math.round(rows.reduce((t, r) => t + (r.chf ?? 0), 0));
  return { total, unknown: rows.filter((r) => r.chf == null).length };
}

/** The message to the bike shop, in German (the bike shops speak German). */
export function orderText(rows, { bike, trip = null } = {}) {
  const date = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const { total, unknown } = orderSum(rows);
  const lines = [
    'Grüezi',
    '',
    trip?.startDate ? `Ich möchte mein ${bike.name} vor dem ${date(trip.startDate)} (${trip.title}) in den Service bringen. Bitte:` : `Ich möchte mein ${bike.name} in den Service bringen. Bitte:`,
    ...rows.map((r) => `- ${r.de}`),
    '',
  ];
  if (total) lines.push(`Nach meinen letzten Quittungen rechne ich mit etwa CHF ${total}${unknown ? ' plus Material' : ''}.`);
  lines.push('Wann hätten Sie Zeit?', '', 'Freundliche Grüsse');
  return lines.join('\n');
}

/* ---------- bike profile (v0.19.3, N14) ---------- */

/**
 * The facts about one bike in one place: km, what it cost this year and per 1000 km, what is
 * due next and the last workshop visit. bike: from withVisits.
 * Returns { km, kmDate, year: { year, chf, unknown, visits } | null, per, next: [{ name, detail, late }], last }.
 */
export function bikeProfile(bike, visits = [], setup = { front: null, rear: null }, today = localDay()) {
  const mine = visitsOf(visits, bike.id);
  const year = costByYear(mine).find((y) => y.year === today.slice(0, 4)) ?? null;
  const next = [];
  // Due now: overdue by time, the 1000 km check, worn parts (the same rules as Bike care).
  for (const r of bikeDue(bike, { startDate: today, days: 1 }, setup, today, today).rows.filter((x) => x.late || x.worn)) next.push({ name: r.name, detail: r.detail, late: true });
  if (!next.length) {
    const t = timeDue(bike, setup, today).find((x) => !x.never);
    if (t) next.push({ name: t.name, detail: tr('due {date}', { date: short(t.next) }), late: false, days: t.days });
    const check = checkState(bike).rows.filter((r) => r.since != null);
    if (check.length) {
      const left = CHECK_KM - Math.max(...check.map((r) => r.since));
      next.push({ name: tr('{km} km check', { km: num(CHECK_KM) }), detail: tr('in {km} km', { km: num(left) }), late: false });
    }
  }
  const lastVisit = mine[0] ?? null;
  return {
    km: typeof bike.km === 'number' ? bike.km : null,
    kmDate: bike.kmDate ?? null,
    year,
    per: costPer1000(mine, bike),
    next,
    last: lastVisit ? { date: lastVisit.date, shop: lastVisit.shop, chf: visitTotal(lastVisit), jobs: (lastVisit.parts ?? []).length } : null,
  };
}
