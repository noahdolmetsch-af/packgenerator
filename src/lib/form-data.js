/**
 * «Form und Erholung» (Noah 20.10.2026 «1a 2b 3a 4a 5a»): everything the card and the page «Form» need,
 * live from the database: the day table (messwerte-data.js), the trips and the answers of the morning
 * check. The calculation is in form.js (pure, tested).
 */
import { liveQuery } from 'dexie';
import { db } from './db.js';
import { loadTable } from './messwerte-data.js';
import { addDays } from './health.js';
import { dayLoads, formSeries, recoveryParts, readiness, recoveryAlarm, tourOf, pastTours, RAMP_MAX } from './form.js';
import { ftpEstimate, DEFAULT_MAX } from './training.js';
import { checkOf } from './flowcheck.js';

/** The highest pulse of the last year's activities (at least 160), else the app's default. */
export function maxOf(acts, today) {
  const from = addDays(today, -365);
  const m = Math.max(0, ...acts.filter((a) => a.day >= from && Number.isFinite(a.hrMax)).map((a) => a.hrMax));
  return m >= 160 ? m : DEFAULT_MAX;
}

/** The median resting pulse of the 30 days before today, else 55. */
function restOf(table, today) {
  const v = Array.from({ length: 30 }, (_, i) => table.get(addDays(today, -1 - i))?.rhr)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return v.length >= 3 ? v[v.length >> 1] : 55;
}

/** All of «Form und Erholung» for today, from the parts the database holds. */
export function formOf({ table, trips = [], checks = [], today, days = 84 }) {
  const acts = [...table.values()].flatMap((r) => r.acts ?? []);
  const opts = { ftp: ftpEstimate(acts, today), rest: restOf(table, today), max: maxOf(acts, today) };
  const loads = dayLoads(acts, opts);
  const series = formSeries(loads, addDays(today, -(days - 1)), today);
  const c = checkOf(checks.find((x) => x.day === today), today);
  const felt = { sleep: c.sleep, energy: c.energy };
  const parts = recoveryParts(table, today, felt);
  const ready = readiness({ series, parts });
  return {
    today,
    opts,
    series,
    ready,
    rampHigh: ready?.ramp != null && ready.ramp > RAMP_MAX,
    alarm: recoveryAlarm(table, today),
    tour: tourOf(trips, table, today),
    past: pastTours(trips, table, today),
    felt,
    table,
  };
}

export async function loadForm(today, d = db) {
  const [table, trips, checks] = await Promise.all([loadTable(d), d.trips ? d.trips.toArray() : [], d.flowChecks ? d.flowChecks.where('day').aboveOrEqual(addDays(today, -1)).toArray() : []]);
  return formOf({ table, trips, checks, today });
}
/** A Svelte store: the whole «Form und Erholung» of today, again after every change. */
export const formQuery = (today) => liveQuery(() => loadForm(today));
