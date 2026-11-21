/**
 * «Auf einen Blick» (Noah 21.11.2026 «1a 2a 3a 4a 5a», thread «Velopflege zum Inspektions-Begleiter machen»):
 * the four numbers on top of a bike's care page, all worked out from data that exists already: the chain
 * (wear.js), the last service (bikeservice.js, workshop visits), the last check (inspections) and what the
 * year cost. Pure functions, tested in tests/glance.test.js. Nothing is stored.
 */
import { wearRows } from '../wear.js';
import { serviceState } from '../bikeservice.js';
import { visitTotal, visitsOf } from '../workshop.js';
import { yearSummary } from './last.js';
import { partName } from '../care.js';
import { localDay } from '../localday.js';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * The chain: km done, km left, the day it runs out at the usual pace, the last measured value, since when and
 * at what price. bike: the view with workshop jobs (withVisits). → null when the chain has no start point or no life.
 */
export function chainGlance(bike, { entries = [], today = localDay() } = {}) {
  const row = wearRows(bike, { entries, today, keys: ['chain'] }).find((r) => r.km != null && r.life?.km);
  if (!row) return null;
  const part = (bike?.parts ?? []).find((p) => p.key === 'chain');
  const mounted = [...(part?.history ?? [])].reverse().find((h) => h.action === 'replace' && h.result !== 'needed');
  return {
    km: Math.round(row.km),
    life: row.life.km,
    left: row.left,
    frac: row.frac,
    state: row.state,
    due: row.left != null && row.left > 0 ? row.due : null,
    model: row.model || '',
    measured: row.meas ? { value: row.meas.value, date: row.meas.date, limit: row.meas.limit } : null,
    since: row.start ?? null,
    chf: num(mounted?.chf),
    own: row.life.source === 'own',
  };
}

/**
 * The last service of the whole bike with what it cost: the service point (bike.service.last), else the newest
 * workshop visit. → { kind: 'service'|'visit', day, km, shop, chf, sinceKm, kmLeft, next } or null.
 */
export function serviceGlance(bike, visits = [], today = localDay()) {
  const mine = visitsOf(visits, bike?.id);
  const s = serviceState(bike, null, today);
  const last = s.last;
  if (last) {
    const v = (last.visitId && mine.find((x) => x.id === last.visitId)) || mine.find((x) => x.date === last.day) || null;
    return {
      kind: 'service',
      day: last.day,
      km: num(last.km),
      shop: v?.shop || '',
      chf: v ? visitTotal(v) : null,
      sinceKm: s.sinceKm,
      kmLeft: s.kmLeft != null ? Math.max(0, Math.round(s.kmLeft)) : null,
      next: s.next,
    };
  }
  const v = mine[0];
  if (!v) return null;
  return { kind: 'visit', day: v.date, km: num(v.km), shop: v.shop || '', chf: visitTotal(v), sinceKm: null, kmLeft: null, next: null };
}

/**
 * The last finished inspection of any level and what it found; the next monthly check from the live state
 * (inspect.js inspectState). → { level, day, km, ok, watch, fix, next: { kmLeft, day, due } | null, fullDay } or null.
 */
export function checkGlance(inspections = [], bikeId, state = null) {
  const done = inspections.filter((x) => x?.bikeId === bikeId && x.done).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.doneAt ?? '').localeCompare(String(a.doneAt ?? '')));
  const last = done[0];
  if (!last) return null;
  const n = (s) => (last.results ?? []).filter((r) => r.state === s).length;
  const m = state?.monthly;
  const full = done.find((x) => x.level === 'full');
  return {
    level: last.level,
    day: last.date,
    km: num(last.km),
    ok: n('ok'),
    watch: n('watch'),
    fix: n('fix') + n('shop'),
    next: m && !m.off ? { kmLeft: m.kmLeft != null ? Math.max(0, Math.round(m.kmLeft)) : null, day: m.next ?? null, due: !!m.due } : null,
    fullDay: full?.date ?? null,
  };
}

/**
 * What the bike cost in a year: the workshop visits (and shop jobs with a price) plus the parts you paid for
 * yourself (a priced entry without a visit). → { year, total, work, parts, top: [{ key, name, chf }], unknown }.
 */
export function costGlance(bike, visits = [], year = localDay().slice(0, 4)) {
  const y = yearSummary(bike, visits, [], year);
  const own = {};
  for (const p of bike?.parts ?? []) {
    for (const h of p.history ?? []) {
      if (h.visitId || h.by === 'shop' || typeof h.chf !== 'number' || h.chf <= 0 || !String(h.date ?? '').startsWith(year)) continue;
      own[p.key] = (own[p.key] ?? 0) + h.chf;
    }
  }
  const round = (x) => Math.round(x * 100) / 100;
  const parts = round(Object.values(own).reduce((s, x) => s + x, 0));
  const top = Object.entries(own)
    .map(([key, chf]) => ({ key, name: partName({ key }), chf: round(chf) }))
    .sort((a, b) => b.chf - a.chf)
    .slice(0, 2);
  return { year, total: round(y.chf + parts), work: y.chf, parts, top, unknown: y.unknown };
}
