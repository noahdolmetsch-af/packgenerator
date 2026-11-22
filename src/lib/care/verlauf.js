/**
 * «Verlauf» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt D): one timeline of a bike with what was done and what it
 * cost: workshop visits and shop jobs («service»), finished inspections («check») and the parts you replaced or
 * serviced yourself («part»). Everything is worked out from data that exists already, nothing is stored.
 * The year sum adds up the same prices as «Costs» in «Auf einen Blick» (glance.js costGlance), so both agree.
 * Pure functions, tested in tests/verlauf.test.js.
 */
import { partName } from '../care.js';
import { visitsOf, visitTotal } from '../workshop.js';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const round = (x) => Math.round(x * 100) / 100;
const isWork = (h) => (h.action === 'replace' || h.action === 'service') && h.result !== 'needed';

/** The kinds of rows, in the order of the filter chips. */
export const KINDS = ['service', 'check', 'part'];

/**
 * The timeline of one bike, newest first.
 * bike: the view with workshop jobs (withVisits) or as stored; visits: all visits; inspections: all finished or open
 * inspections (only finished ones count).
 * → [{ id, kind, day, km, chf, ... }] with
 *   service: { shop, jobs: [part names], visitId?, chf (null: no price known) }
 *   check:   { level, ok, watch, fix }
 *   part:    { name, action: 'replace'|'service', model, by, chf }
 */
export function verlaufRows(bike, visits = [], inspections = []) {
  const rows = [];
  for (const v of visitsOf(visits, bike?.id)) {
    rows.push({
      id: `v-${v.id}`,
      kind: 'service',
      day: v.date,
      km: num(v.km),
      shop: v.shop || '',
      jobs: (v.parts ?? []).map((l) => partName({ key: l.part, name: l.name })).filter(Boolean),
      visitId: v.id,
      chf: visitTotal(v),
    });
  }
  // shop entries without a visit: one row per day (its prices, if any), like yearSummary counts them
  const shopDays = {};
  const own = [];
  for (const p of bike?.parts ?? []) {
    for (const h of p.history ?? []) {
      if (h.visitId || !isWork(h)) continue;
      if (h.by === 'shop') (shopDays[h.date] ??= []).push({ p, h });
      else own.push({ p, h });
    }
  }
  for (const [day, list] of Object.entries(shopDays)) {
    const priced = list.filter((x) => typeof x.h.chf === 'number');
    rows.push({
      id: `s-${day}`,
      kind: 'service',
      day,
      km: num(list.find((x) => num(x.h.km) != null)?.h.km),
      shop: '',
      jobs: list.map((x) => partName(x.p)),
      visitId: null,
      chf: priced.length ? round(priced.reduce((s, x) => s + x.h.chf, 0)) : null,
    });
  }
  own.forEach(({ p, h }, n) =>
    rows.push({
      id: `p-${p.key}-${h.date}-${n}`,
      kind: 'part',
      day: h.date,
      km: num(h.km),
      name: partName(p),
      action: h.action,
      model: h.model || p.model || '',
      by: h.by ?? null,
      chf: typeof h.chf === 'number' && h.chf > 0 ? h.chf : null,
    }),
  );
  for (const x of inspections) {
    if (x?.bikeId !== bike?.id || !x.done) continue;
    const n = (s) => (x.results ?? []).filter((r) => r.state === s).length;
    rows.push({ id: `i-${x.id ?? x.date}-${x.level}`, kind: 'check', day: x.date, km: num(x.km), level: x.level, ok: n('ok'), watch: n('watch'), fix: n('fix') + n('shop'), chf: null });
  }
  return rows.filter((r) => r.day).sort((a, b) => String(b.day).localeCompare(String(a.day)) || (b.km ?? 0) - (a.km ?? 0) || a.id.localeCompare(b.id));
}

/** The years that have rows, newest first. */
export const yearsOf = (rows) => [...new Set(rows.map((r) => String(r.day).slice(0, 4)))].sort().reverse();

/** Narrow the rows to a kind ('all' = every kind) and a year ('' = every year). */
export const filterRows = (rows, kind = 'all', year = '') => rows.filter((r) => (kind === 'all' || r.kind === kind) && (!year || String(r.day).startsWith(year)));

/** What the rows cost: { chf, unknown } (unknown: service rows without a price). Checks and unpriced parts cost nothing. */
export function sumRows(rows) {
  let chf = 0;
  let unknown = 0;
  for (const r of rows) {
    if (typeof r.chf === 'number') chf += r.chf;
    else if (r.kind === 'service') unknown += 1;
  }
  return { chf: round(chf), unknown };
}
