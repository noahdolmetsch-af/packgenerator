/**
 * Workshop visits (Noah, 4.10.2026, answers 7a-20a): every visit to the bike shop is one record
 * with its receipt photos. Its jobs count as history of the bike's parts, so "what was done when",
 * the 1000 km check and the wear of each part know about them. The visits stay in their own table:
 * the bike's own history is never changed by an import, and a visit can be fixed or removed alone.
 *
 * Pure functions only, so they are easy to test.
 */
import { PART, PARTS, ensureParts, partInfo } from './care.js';

const DAY = 864e5;
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (date, n) => iso(new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY));
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / DAY);

/** The visits of one bike, newest first. */
export const visitsOf = (visits, bikeId) => visits.filter((v) => v.bikeId === bikeId).sort((a, b) => b.date.localeCompare(a.date));

/** What the visit cost: the total on the receipt, else the sum of its jobs. */
export const visitTotal = (v) => (typeof v.totalChf === 'number' ? v.totalChf : Math.round((v.parts ?? []).reduce((t, p) => t + (p.chf ?? 0), 0) * 100) / 100);

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

/** Cost per year, newest year first: [{ year, chf, visits }]. */
export function costByYear(visits) {
  const by = {};
  for (const v of visits) {
    const y = v.date.slice(0, 4);
    by[y] ??= { year: y, chf: 0, visits: 0 };
    by[y].chf += visitTotal(v);
    by[y].visits += 1;
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
 * Cost per 1000 km: the visits after the first one with known km, over the km ridden since then.
 * Needs the km at two points (a visit and the bike now); null when they are not known.
 */
export function costPer1000(visits, bike) {
  const known = visits.filter((v) => typeof v.km === 'number').sort((a, b) => a.km - b.km);
  if (!known.length || typeof bike.km !== 'number') return null;
  const first = known[0];
  const km = bike.km - first.km;
  if (km < 100) return null;
  const chf = visits.filter((v) => v !== first && v.date >= first.date).reduce((t, v) => t + visitTotal(v), 0);
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
