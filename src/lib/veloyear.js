/**
 * Velo-Jahresrückblick (Noah 26.10.2026 «3a»): per bike and year the km, the rides, the parts changed,
 * the services, what it cost and which part lasted longest; plus all bikes together. Pure (tests/veloyear.test.js).
 * bike: the view with its workshop jobs (workshop.js withVisits), entries: kmBook, visits: the workshop visits.
 */
import { counts } from './kmbook.js';
import { partName } from './care.js';
import { pastParts } from './wear.js';
import { visitTotal } from './workshop.js';

const inYear = (date, year) => typeof date === 'string' && date.slice(0, 4) === String(year);
const round = (n) => Math.round(n * 100) / 100;

/** The years with anything to show (rides, changes or visits), newest first. */
export function yearsWith(bikes = [], entries = [], visits = []) {
  const ys = new Set();
  for (const e of entries) if (e?.kind === 'ride' && counts(e) && e.date) ys.add(e.date.slice(0, 4));
  for (const v of visits) if (v?.date) ys.add(v.date.slice(0, 4));
  for (const b of bikes) for (const p of b.parts ?? []) for (const h of p.history ?? []) if (h.date && !h.start && (h.action === 'replace' || h.action === 'service')) ys.add(h.date.slice(0, 4));
  return [...ys].filter((y) => /^\d{4}$/.test(y)).sort((a, b) => b.localeCompare(a));
}

/**
 * One bike's year → { km, rides, longest, changed: [{ key, name, date, model, lasted }], services, visits,
 *   chf, unknown (visits without a price), best: { name, km, model } | null, oiled (own chain care entries) }.
 */
export function bikeYear(bike, { entries = [], visits = [], year } = {}) {
  const rides = entries.filter((e) => e?.bikeId === bike?.id && e.kind === 'ride' && counts(e) && inYear(e.date, year));
  const km = Math.round(rides.reduce((s, e) => s + (Number(e.km) || 0), 0));
  const longest = rides.reduce((m, e) => Math.max(m, Number(e.km) || 0), 0);
  const changed = [];
  let services = 0;
  let own = 0;
  let oiled = 0;
  let best = null;
  for (const p of bike?.parts ?? []) {
    const past = pastParts(p);
    for (const h of p.history ?? []) {
      if (!inYear(h.date, year) || h.result === 'needed') continue;
      if (h.action === 'replace' && !h.start) {
        const gone = past.find((x) => x.to === h.date);
        changed.push({ key: p.key, name: partName(p), date: h.date, model: h.model || '', lasted: gone ? gone.km : null });
      }
      if (h.action === 'service' && h.by !== 'shop') services++;
      if (h.action === 'service' && h.by !== 'shop' && p.key === 'chain') oiled++;
      if (h.by !== 'shop' && typeof h.chf === 'number') own += h.chf;
    }
    for (const x of past) if (inYear(x.to, year) && (!best || x.km > best.km)) best = { name: partName(p), km: x.km, model: x.model || '' };
  }
  const mine = visits.filter((v) => v?.bikeId === bike?.id && inYear(v.date, year));
  const totals = mine.map(visitTotal);
  return {
    km,
    rides: rides.length,
    longest: Math.round(longest),
    changed: changed.sort((a, b) => a.date.localeCompare(b.date)),
    services,
    visits: mine.length,
    chf: round(own + totals.reduce((s, t) => s + (t ?? 0), 0)),
    unknown: totals.filter((t) => t == null).length,
    best,
    oiled,
  };
}

/** All bikes in one year → { km, rides, changed, visits, chf, top: the bike with the most km (name) }. */
export function allYear(list = []) {
  const sum = (k) => list.reduce((s, x) => s + (typeof x.year[k] === 'number' ? x.year[k] : x.year[k].length), 0);
  const top = [...list].sort((a, b) => b.year.km - a.year.km)[0];
  return { km: sum('km'), rides: sum('rides'), changed: sum('changed'), visits: sum('visits'), chf: round(list.reduce((s, x) => s + x.year.chf, 0)), top: top && top.year.km > 0 ? top.name : null };
}
