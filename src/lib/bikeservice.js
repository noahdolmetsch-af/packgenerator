/**
 * «Velo im Griff» #193 (Noah 19.10.2026): a service of the whole bike, for every bike, by km, riding
 * hours or days, whichever comes first (care.js firstDue).
 *
 * Kept on the bike (no new table): bike.service = { everyKm, everyHours, everyDays, last: { day, km, hours } }.
 * A field missing = the suggestion (SERVICE_STD: 3000 km, 100 h, 365 days); null = that measure is off.
 * All three off = no reminder. Without `last` nothing is due yet: «Service done» (or the date of the last
 * service) starts it. Everything stays a suggestion, changeable and switchable off.
 * Pure functions, tested in tests/bikeservice.test.js.
 */
import { firstDue } from './care.js';
import { hoursSince } from './bikehours.js';
import { localDay } from './localday.js';

/** The suggested intervals. */
export const SERVICE_STD = { everyKm: 3000, everyHours: 100, everyDays: 365 };
const FIELDS = ['everyKm', 'everyHours', 'everyDays'];
const ok = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** The intervals that count on this bike: { everyKm, everyHours, everyDays } (null: off). */
export function serviceValues(bike) {
  const s = bike?.service ?? {};
  return Object.fromEntries(FIELDS.map((f) => [f, Object.hasOwn(s, f) ? (ok(s[f]) ? s[f] : null) : SERVICE_STD[f]]));
}

/** Is the reminder on (at least one measure)? */
export const serviceOn = (bike) => Object.values(serviceValues(bike)).some((v) => v != null);

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/**
 * The state of the service on one bike. series: the bike's hours (bikehours.js hourSeries) or null.
 * → { on, values, last, never, sinceKm, sinceDays, sinceHours, hoursEst, due, by, kmLeft, daysLeft,
 *     hoursLeft, frac, next } (next: the day it is due by days, or null).
 */
export function serviceState(bike, series = null, today = localDay()) {
  const values = serviceValues(bike);
  const on = Object.values(values).some((v) => v != null);
  const last = bike?.service?.last?.day ? bike.service.last : null;
  const base = { on, values, last, never: !last, sinceKm: null, sinceDays: null, sinceHours: null, hoursEst: false, due: false, by: null, kmLeft: null, daysLeft: null, hoursLeft: null, frac: null, next: null };
  if (!on || !last) return base;
  const sinceKm = typeof bike.km === 'number' && typeof last.km === 'number' ? Math.max(0, bike.km - last.km) : null;
  const sinceDays = Math.max(0, daysBetween(last.day, today));
  const h = values.everyHours != null ? hoursSince(series, { day: last.day, km: last.km, hours: last.hours }) : null;
  const res = firstDue({ sinceKm, everyKm: values.everyKm, sinceDays, everyDays: values.everyDays, sinceHours: h?.hours ?? null, everyHours: values.everyHours });
  return { ...base, ...res, sinceKm, sinceDays, sinceHours: h?.hours ?? null, hoursEst: !!h?.est, next: values.everyDays != null ? addDays(last.day, values.everyDays) : null };
}

/** «Service done»: the patch { service } with last = today (km and hours then). */
export function serviceDone(bike, { day = localDay(), km = bike?.km ?? null, hours = null } = {}) {
  const s = bike?.service ?? {};
  // «Verschleiss» (Noah 20.10.2026): the service before stays in service.past, so every period can be shown (wear.js servicePeriods)
  const keep = s.last?.day && s.last.day !== day ? { past: [...(s.past ?? []), s.last] } : {};
  return { service: { ...s, ...keep, last: { day, km: typeof km === 'number' ? km : null, hours: typeof hours === 'number' ? hours : null } } };
}

/**
 * New intervals: values { everyKm, everyHours, everyDays } (null or '' = off for that measure).
 * A value equal to the suggestion is not kept (it goes back to «suggestion»). → { service }.
 */
export function serviceChange(bike, values) {
  const next = { ...(bike?.service ?? {}) };
  for (const f of FIELDS) {
    if (!(f in (values ?? {}))) continue;
    const v = values[f];
    if (ok(v) && v === SERVICE_STD[f]) delete next[f];
    else next[f] = ok(v) ? v : null;
  }
  return { service: next };
}

/** Everything back to the suggestion (the last service stays). → { service }. */
export const serviceReset = (bike) => ({ service: bike?.service?.last ? { last: bike.service.last } : {} });

/** Switch the whole reminder off (every measure null) or back on (the suggestion). → { service }. */
export const serviceSwitch = (bike, on) => (on ? serviceReset(bike) : { service: { ...(bike?.service ?? {}), everyKm: null, everyHours: null, everyDays: null } });

/** Did the person change the intervals? */
export const serviceChanged = (bike) => FIELDS.some((f) => Object.hasOwn(bike?.service ?? {}, f));

/** The last service by hand (a date and km from a receipt): → { service }. */
export function serviceLast(bike, { day, km = null, hours = null }) {
  if (!day) return { service: { ...(bike?.service ?? {}), last: null } };
  // a correction of the last service (from a receipt): it replaces the last one, nothing moves to past
  return { service: { ...(bike?.service ?? {}), last: { day, km: typeof km === 'number' ? km : null, hours: typeof hours === 'number' ? hours : null } } };
}
