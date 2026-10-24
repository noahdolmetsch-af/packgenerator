/**
 * Paket B «Touren ohne Überraschung» (Noah 24.10.2026 «1b 2a 3b 4b 5a», 996 Ideen):
 *
 *   Generalprobe  #/trip/<id>/probe  A few days before the start, try the trip at home once: route offline
 *                 in flight mode, plan B, check-in times, power, one day of food, a tube change, the
 *                 emergency card, a fresh backup. Each step: «Works», «Gap» or «Not needed». A gap
 *                 becomes a to-do in Merken (due the day before the start) with one tap.
 *   Gut ankommen  #/trip/<id>/heim   Back home: wet things, laundry, give back, receipts, the bike back to
 *                 everyday, «I'm home», charge, debrief. Gaps become to-dos for tomorrow.
 *
 * Stored on the trip (no new table, no schema version; an older trip simply has none):
 *   trip.probe = { steps: { [key]: { r: 'ok' | 'gap' | 'skip', at, todo } }, own: [{ id, name }] }
 *   trip.home  = the same shape
 * Some steps know their answer by themselves (auto): a saved offline copy, a recent backup, a plan B,
 * check-in times, a finished debrief. A step the user answered keeps the user's answer.
 * Pure functions, tested in tests/probe.test.js. Labels are English keys for t().
 */
import { HOME_COUNTRY } from '../situation.js';

export const RESULTS = ['ok', 'gap', 'skip'];
/** A backup counts as fresh for the dress rehearsal when it is at most this many days old. */
export const PROBE_BACKUP_DAYS = 7;
/** The dress rehearsal is suggested from this many days before the start. */
export const PROBE_FROM_DAYS = 7;

const multi = (trip) => (Number(trip?.days) || 1) > 1;
const bike = (trip) => !!trip?.bikeId;
const abroad = (trip) => !!trip?.country && String(trip.country).toUpperCase() !== HOME_COUNTRY;

/** The steps of the dress rehearsal. when(trip): does the step fit this trip at all. */
export const PROBE_STEPS = [
  { key: 'offline', name: 'Route offline in flight mode', sub: 'Save «Before you leave», then open map and route with flight mode on', href: '#/ride/abfahrt', when: () => true },
  { key: 'planb', name: 'Plan B ready', sub: 'A shorter variant or the train home, if the weather turns', href: '#/pack', trip: true, when: (tr) => multi(tr) || bike(tr) },
  { key: 'stays', name: 'Check-in times known', sub: 'Until when you can arrive at each night', href: '#/pack', trip: true, when: multi },
  { key: 'power', name: 'Charged and power bank tested', sub: 'Charge everything once and plug the phone into the power bank', href: '#/pack?charge', trip: true, when: () => true },
  { key: 'food', name: 'Lay out the food for one day', sub: 'Does it fit into the bag, is it enough?', when: multi },
  { key: 'repair', name: 'Change a tube once at home', sub: 'With the tools you take along, not the workshop ones', when: bike },
  { key: 'sos', name: 'Emergency card without unlocking', sub: 'Name, emergency number and allergies on the lock screen', href: '#/mountain/qr', when: () => true },
  { key: 'backup', name: 'Fresh backup', sub: 'Not older than a week, so nothing is lost on the way', href: '#/me/data', when: () => true },
  { key: 'abroad', name: 'Read the country info', sub: 'Emergency numbers, insurance, currency', href: '#/pack', trip: true, when: abroad },
];

/** The steps of «Gut ankommen». */
export const HOME_STEPS = [
  { key: 'dry', name: 'Hang up the wet things', sub: 'Tent, sleeping bag, rain jacket: open and dry before they go into the cupboard', when: multi },
  { key: 'laundry', name: 'Laundry into the machine', sub: 'Cycling clothes and what was worn', when: () => true },
  { key: 'arrived', name: 'Tell people you are home', sub: 'A short message to the ones who wait for it', when: () => true },
  { key: 'charge', name: 'Charge the devices for everyday life', sub: 'Phone, lights, bike computer', when: () => true },
  { key: 'giveback', name: 'Give back borrowed and rented things', sub: 'Before they wait in a corner for weeks', when: () => true },
  { key: 'receipts', name: 'Keep the receipts', sub: 'A photo of each, for the costs of the trip', when: () => true },
  { key: 'bike', name: 'Bike back to everyday', sub: 'Bags off, lights and lock as usual, clean the chain', href: 'care', when: bike },
  { key: 'debrief', name: 'Debrief', sub: 'What was missing, what stayed at home next time', href: 'debrief', trip: true, when: () => true },
];

/** The steps that fit this trip, with the user's own steps at the end. */
export function stepsFor(list, trip, rec = null) {
  const base = list.filter((s) => s.when(trip)).map(({ when, ...s }) => s);
  const own = (rec?.own ?? []).filter((o) => o && o.id && String(o.name ?? '').trim()).map((o) => ({ key: o.id, name: o.name, own: true }));
  return [...base, ...own];
}

/**
 * What a step knows by itself → 'ok' or null.
 * ctx: { offlineAt, backupAt, today, debriefDone, chargeDone, chargeTotal }
 */
export function autoResult(key, trip, ctx = {}) {
  const today = ctx.today ?? null;
  switch (key) {
    case 'offline':
      return ctx.offlineAt ? 'ok' : null;
    case 'planb':
      return trip?.planB && (trip.planB.note || trip.planB.route || trip.planB.kind === 'train') ? 'ok' : null;
    case 'stays': {
      const nights = Math.max(0, (Number(trip?.days) || 1) - 1);
      const set = (Array.isArray(trip?.stays) ? trip.stays : []).filter((s) => s && s.until);
      return nights > 0 && set.length >= nights ? 'ok' : null;
    }
    case 'power':
    case 'charge':
      return ctx.chargeTotal > 0 && ctx.chargeDone >= ctx.chargeTotal ? 'ok' : null;
    case 'backup':
      return ctx.backupAt && today && dayDiff(String(ctx.backupAt).slice(0, 10), today) <= PROBE_BACKUP_DAYS ? 'ok' : null;
    case 'debrief':
      return ctx.debriefDone ? 'ok' : null;
    default:
      return null;
  }
}

/** Whole days from a to b (YYYY-MM-DD), calendar arithmetic at noon so summer time never shifts it. */
export function dayDiff(a, b) {
  const d = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((d(b) - d(a)) / 86400000);
}

/** One day before or after a YYYY-MM-DD day. */
export function shiftDay(day, n) {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + n));
  return d.toISOString().slice(0, 10);
}

/** The rows of a list: [{ ...step, r, auto, todo }]. r is the user's answer, else the auto one, else null. */
export function rowsOf(list, trip, rec, ctx = {}) {
  const saved = rec?.steps ?? {};
  return stepsFor(list, trip, rec).map((s) => {
    const own = saved[s.key];
    const auto = autoResult(s.key, trip, ctx);
    return { ...s, r: RESULTS.includes(own?.r) ? own.r : auto, auto: !own?.r && !!auto, todo: own?.todo ?? null };
  });
}

/** { ok, gap, skip, open, total, done } — done: every step answered. skip does not count in total. */
export function summary(rows) {
  const n = { ok: 0, gap: 0, skip: 0, open: 0 };
  for (const r of rows) n[r.r ?? 'open'] += 1;
  const total = rows.length - n.skip;
  return { ...n, total, done: n.open === 0 && rows.length > 0 };
}

/** The record after one answer. A tap on the answer that is already set clears it (back to open). */
export function answer(rec, key, r, now = new Date().toISOString()) {
  const steps = { ...(rec?.steps ?? {}) };
  const cur = steps[key] ?? {};
  if (cur.r === r || !RESULTS.includes(r)) {
    const { r: _r, at: _at, ...rest } = cur;
    if (Object.keys(rest).length) steps[key] = rest;
    else delete steps[key];
  } else steps[key] = { ...cur, r, at: now };
  return { ...(rec ?? {}), steps };
}

/** The record with the id of the to-do made from a gap. */
export function withTodo(rec, key, todo) {
  const steps = { ...(rec?.steps ?? {}) };
  steps[key] = { ...(steps[key] ?? {}), todo };
  return { ...(rec ?? {}), steps };
}

/** Own steps: add, rename, remove (the answer of a removed step goes with it). */
export function addOwn(rec, name, id = `own-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`) {
  const nm = String(name ?? '').trim();
  if (!nm) return rec ?? {};
  return { ...(rec ?? {}), own: [...(rec?.own ?? []), { id, name: nm }] };
}
export function renameOwn(rec, id, name) {
  const nm = String(name ?? '').trim();
  if (!nm) return rec ?? {};
  return { ...(rec ?? {}), own: (rec?.own ?? []).map((o) => (o.id === id ? { ...o, name: nm } : o)) };
}
export function removeOwn(rec, id) {
  const steps = { ...(rec?.steps ?? {}) };
  delete steps[id];
  return { ...(rec ?? {}), steps, own: (rec?.own ?? []).filter((o) => o.id !== id) };
}

/** When the dress rehearsal is worth a row on «Gepackt» and on the trip: from 7 days before the start to the start. */
export function probeDue(trip, today) {
  if (!trip?.startDate || !today) return false;
  const d = dayDiff(today, trip.startDate);
  return d >= 0 && d <= PROBE_FROM_DAYS;
}

/** The due day of a to-do from a gap: the day before the start (probe), tomorrow (home). */
export function todoDue(kind, trip, today) {
  if (kind === 'probe' && trip?.startDate) {
    const eve = shiftDay(trip.startDate, -1);
    return eve >= today ? eve : today;
  }
  return shiftDay(today, 1);
}
