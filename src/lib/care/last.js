/**
 * v0.31.0 (Velopflege redesign, answers 8a and 10a): per part, the last work done on it and its
 * state, so a part row can say "replaced 22 Mar 2026 · 3'900 km · CHF 129 · bike shop" next to a
 * bar and "what next", without opening the log.
 *
 * bike: from withVisits (workshop.js), so the jobs of the workshop visits count as history too.
 * Pure functions (the words follow the language), easy to test.
 */
import { PART, CHECK_PARTS, partInfo, wear, needsWork, lastValue, kmSince, taskBike, serviceName } from '../care.js';
import { visitsOf, visitTotal, costPer1000, overdueDays } from '../workshop.js';
import { t, tn, num, dateOf } from '../i18n.svelte.js';
import { localDay } from '../localday.js';

/** The groups of parts on the page, in this order (the mockup v3-pflege). */
export const GROUPS = [
  { key: 'drive', name: 'Drivetrain', parts: ['chain', 'chainring', 'cassette'] },
  { key: 'brakes', name: 'Brakes', parts: ['padsF', 'padsR', 'rotorF', 'rotorR', 'brakes'] },
  { key: 'suspension', name: 'Suspension', parts: ['fork', 'shock', 'linkage'] },
  { key: 'wheels', name: 'Tyres, wheels, shifting', parts: ['tyres', 'wheels', 'shifting'] },
  { key: 'other', name: 'Cockpit and more', parts: ['saddle', 'cockpit', 'bolts', 'bearings'] },
];
/** The group of a part key; unknown keys go to the last group. */
export const groupOf = (key) => (GROUPS.find((g) => g.parts.includes(key)) ?? GROUPS.at(-1)).key;

/** Parts that wear out and get swapped: "Replaced or done" on them means replaced. */
const WEARS = new Set(['chain', 'chainring', 'cassette', 'padsF', 'padsR', 'rotorF', 'rotorR']);
const isWork = (h) => h.action === 'service' || h.action === 'replace';

/**
 * The last work on one part: { main, also, by } or null when nothing is recorded.
 * main: the last service or replacement; a newer "work needed" wins (it is the newest fact);
 *   without any service or replacement, the newest entry.
 * also: the newest entry after main (a measurement first, else a check), or null.
 * by: who did main: 'self', 'shop' or null (not known).
 */
export function lastWork(part) {
  const h = part?.history ?? [];
  if (!h.length) return null;
  let i = h.length - 1;
  if (h[i].result !== 'needed') {
    const w = h.findLastIndex(isWork);
    if (w >= 0) i = w;
  }
  const main = h[i];
  const later = h.slice(i + 1);
  const also = [...later].reverse().find((x) => typeof x.value === 'number') ?? later.at(-1) ?? null;
  return { main, also, by: main.by ?? null };
}

/** The last work of every part of a bike: { [key]: lastWork }. */
export const lastWorkByPart = (bike) => Object.fromEntries((bike?.parts ?? []).map((p) => [p.key, lastWork(p)]));

/**
 * Who usually works on this part: 'shop' when most services and replacements (ties: the newest)
 * were done by the bike shop, else 'self'.
 */
export function usualBy(part) {
  const work = (part?.history ?? []).filter(isWork);
  const shop = work.filter((h) => h.by === 'shop').length;
  const self = work.filter((h) => h.by === 'self').length;
  if (shop !== self) return shop > self ? 'shop' : 'self';
  return work.at(-1)?.by === 'shop' ? 'shop' : 'self';
}

/**
 * v0.31.0 (proposal 3/4: "For the bike shop" takes only what I do not do myself): the skip
 * option of workshopOrder for one bike. A part with services or replacements on record that I
 * usually do is skipped; a part without any is kept. The 1000 km check ('check') is skipped
 * unless most of its checks on record were done by the bike shop.
 */
export function shopSkip(bike) {
  const parts = Object.fromEntries((bike?.parts ?? []).map((p) => [p.key, p]));
  const checks = (bike?.parts ?? []).filter((p) => CHECK_PARTS.includes(p.key)).flatMap((p) => (p.history ?? []).filter((h) => h.action === 'check'));
  const checkByShop = checks.filter((h) => h.by === 'shop').length > checks.filter((h) => h.by !== 'shop').length;
  return (key) => {
    if (key === 'check') return !checkByShop;
    const part = parts[key];
    if (!part || !(part.history ?? []).some(isWork)) return false;
    return usualBy(part) === 'self';
  };
}

/** One history entry in words: "replaced", "waxed", "measured 0.4 %", "checked", "«skips in 3rd»". */
export function workWords(key, h) {
  const p = PART[key] ?? { unit: '' };
  const value = typeof h.value === 'number' ? `${num(h.value)} ${p.unit}`.trim() : '';
  if (h.result === 'needed') return h.note ? `«${h.note}»` : t('work needed');
  if (h.action === 'replace') {
    if (typeof h.sealantMl === 'number') return t('{ml} ml sealant added', { ml: num(h.sealantMl) });
    return WEARS.has(key) || h.visitId ? t('replaced') : t('done');
  }
  if (h.action === 'service') {
    if (typeof h.sealantMl === 'number') return t('{ml} ml sealant added', { ml: num(h.sealantMl) });
    return p.service ? t(p.service).toLowerCase() : t('serviced');
  }
  return value ? t('measured {value}', { value }) : t('checked');
}

/**
 * The "last done" line of a part: [{ text }] pieces, e.g.
 * ["replaced 22 Mar 2026", "3'900 km", "CHF 129", "measured 70 % on 29 Sept 2026"].
 */
export function lastLine(key, last) {
  if (!last) return [];
  const { main, also } = last;
  const out = [`${workWords(key, main)} ${dateOf(main.date)}`.trim()];
  if (typeof main.km === 'number') out.push(`${num(main.km)} km`);
  if (typeof main.chf === 'number' && main.chf > 0) out.push(`CHF ${Number.isInteger(main.chf) ? num(main.chf) : main.chf.toFixed(2)}`);
  if (main.action !== 'check' && typeof main.value === 'number') out.push(t('measured {value}', { value: `${num(main.value)} ${PART[key]?.unit ?? ''}`.trim() }));
  if (also) out.push(t('{what} on {date}', { what: workWords(key, also), date: dateOf(also.date) }));
  return out;
}

const clamp = (x) => Math.max(0, Math.min(1, x));
const RANK = { none: 0, ok: 1, soon: 2, due: 3, overdue: 4, work: 5 };
const inDays = (d) => (d < 45 ? tn(d, 'in {n} day', 'in {n} days') : tn(Math.round(d / 30.4), 'in {n} month', 'in {n} months'));
const every = (days) => (days >= 365 ? t('yearly') : t('every {n} months', { n: Math.round(days / 30.4) }));

/**
 * The state of one part: { state, fill, tone, next }.
 * state: 'none' (nothing to judge by), 'ok', 'soon', 'due', 'overdue' or 'work' (work needed).
 * fill: how much of the interval or the wear is used, 0..1 (null: no bar). tone: 'ok' | 'warn' | 'bad'.
 * next: what comes next, in words ("replace below 50 %", "18 Oct 2026 · in 10 days").
 * time: the timeDue rows of the bike (workshop.js); a part with a time interval that is not in
 * them (sealant on a bike with tubes) says so.
 */
export function partStatus(bike, part, time = [], today = localDay()) {
  const p = partInfo(part);
  if (needsWork(part)) return { state: 'work', fill: null, tone: 'bad', next: usualBy(part) === 'shop' ? t('have the bike shop do it') : t('replace or fix') };
  const found = [];
  // Wear from the last measurement (chain longer, pads and rotors thinner).
  const v = lastValue(part)?.value;
  if (v != null && p.limit != null) {
    // A new pad is 100 %; a new rotor about a third thicker than its limit (2.0 mm for 1.5 mm).
    const fresh = p.unit === '%' ? 100 : p.limit * (4 / 3);
    const fill = p.lowIsWorn ? (fresh - v) / (fresh - p.limit) : v / p.limit;
    const w = wear(part);
    const unit = p.unit === '%' ? ' %' : ` ${p.unit}`;
    found.push({
      state: w === 'worn' ? 'due' : w === 'warn' ? 'soon' : 'ok',
      fill: clamp(fill),
      tone: w === 'worn' ? 'bad' : w === 'warn' ? 'warn' : 'ok',
      next: p.lowIsWorn ? t('replace below {limit}', { limit: `${num(p.limit)}${unit}` }) : t('replace at {limit}', { limit: `${num(p.limit)}${unit}` }),
    });
  }
  // A service by km (wax the chain every 150 km).
  if (p.everyKm) {
    const last = [...(part.history ?? [])].reverse().find(isWork);
    const since = kmSince(bike, last);
    if (since != null) {
      const f = since / p.everyKm;
      found.push({
        state: f >= 1 ? 'due' : f >= 0.8 ? 'soon' : 'ok',
        fill: clamp(f),
        tone: f >= 1 ? 'warn' : f >= 0.8 ? 'warn' : 'ok',
        next: f >= 1 ? t('{what}: now (every {km} km)', { what: serviceName(p), km: num(p.everyKm) }) : t('in {km} km (every {every} km)', { km: num(p.everyKm - since), every: num(p.everyKm) }),
      });
    }
  }
  // A service by time (fork and shock yearly, sealant every 3 months).
  if (p.everyDays) {
    const row = time.find((r) => r.key === part.key);
    if (row && !row.never) {
      const f = 1 - row.days / row.every;
      found.push({
        state: row.days <= 0 ? 'overdue' : row.days <= 30 ? 'soon' : 'ok',
        fill: clamp(f),
        tone: row.days <= 0 ? 'bad' : row.days <= 30 ? 'warn' : 'ok',
        next: row.days <= 0 ? `${overdueDays(-row.days)} (${every(row.every)})` : `${dateOf(row.next)} · ${inDays(row.days)}`,
      });
    } else if (!row && part.history?.length) found.push({ state: 'ok', fill: null, tone: 'ok', next: t('only for tubeless wheels') });
  }
  if (found.length) return found.reduce((a, b) => (RANK[b.state] > RANK[a.state] ? b : a));
  if (!part.history?.length) return { state: 'none', fill: null, tone: null, next: '' };
  const age = kmSince(bike, [...part.history].reverse().find((h) => h.action === 'replace'));
  const next = part.key === 'brakes' ? t('bleed when the lever feels soft') : age != null && age >= 0 ? t('{km} km old', { km: num(age) }) : '';
  return { state: 'ok', fill: null, tone: 'ok', next };
}

/** Is this state one to act on (the filter "Only due")? */
export const isDueState = (state) => state === 'due' || state === 'overdue' || state === 'work';

/**
 * One year on one bike (the card "2026 on this bike"): { year, self, shop, chf, unknown, per }.
 * self: the jobs I did (entries by me on one day with the same action and note count once: a
 * 1000 km check of 9 points is one job), plus repairs I ticked off; shop: workshop visits;
 * chf: what the visits cost (unknown: visits without a price); per: costPer1000 of all visits.
 * bike: as stored or from withVisits (entries from a visit are skipped, the visit counts).
 */
export function yearSummary(bike, visits = [], tasks = [], year = localDay().slice(0, 4)) {
  const jobs = new Set();
  for (const p of bike?.parts ?? []) {
    for (const h of p.history ?? []) {
      if (h.visitId || h.by !== 'self' || !String(h.date ?? '').startsWith(year)) continue;
      jobs.add(`${h.date}|${h.action}|${h.result}|${h.note ?? ''}`);
    }
  }
  for (const x of tasks) if (taskBike(x) === bike?.id && x.status === 'done' && x.by === 'self' && String(x.statusDate ?? '').startsWith(year)) jobs.add(`task:${x.id}`);
  const mine = visitsOf(visits, bike?.id).filter((v) => v.date.startsWith(year));
  const totals = mine.map(visitTotal);
  // Entries marked "bike shop" without a workshop visit: one visit per day (its prices, if any).
  const shopDays = {};
  for (const p of bike?.parts ?? [])
    for (const h of p.history ?? []) if (!h.visitId && h.by === 'shop' && h.result !== 'needed' && String(h.date ?? '').startsWith(year)) (shopDays[h.date] ??= []).push(h);
  for (const list of Object.values(shopDays)) {
    const priced = list.filter((h) => typeof h.chf === 'number');
    totals.push(priced.length ? priced.reduce((s, h) => s + h.chf, 0) : null);
  }
  const chf = Math.round(totals.reduce((s, x) => s + (x ?? 0), 0) * 100) / 100;
  return { year, self: jobs.size, shop: mine.length + Object.keys(shopDays).length, chf, unknown: totals.filter((x) => x == null).length, per: costPer1000(visitsOf(visits, bike?.id), bike ?? {}) };
}
