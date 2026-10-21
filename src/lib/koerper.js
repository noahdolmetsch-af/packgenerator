/**
 * «Körperwerte» (Noah 20.10.2026 «1-5 alle», «1a 2a 3a 4a 5a», «1-5a»): the values of the page behind the
 * heart rate tile that are not a plain Fitbit day value. Pure functions, tested in tests/koerper.test.js.
 *
 * - Blood pressure and water are your own entries, only on this device (db.settings, in the backup
 *   file): BP_KEY { entries: [{ day, sys, dia }] }, WATER_KEY { entries: [{ day, l }] }, one per day.
 *   Water is only what you drank; the target comes from «Wetter, Wind, Energie» (src/lib/wetter/).
 * - Zone minutes: the pulse histograms of the activities of a day in the zones in use (training.js).
 * - Meditation: the minutes of the meditation ticks (Aktiv), 10 when a tick has none.
 * - Bedtime: when the main night began, as minutes after noon (so 23:30 and 00:30 lie side by side).
 * - Cadence and speed: the bike rides of a day, weighted by their moving time.
 * - Kilometres of the year: the bike km added up month by month, this year against the year before.
 * - Temperature and pulse: one point per ride that has both (Strava/FIT data only, no weather source).
 * Health data is observation only: no rating, no goal.
 */
import { zoneSecs } from './training.js';
import { addDays } from './health.js';

export const BP_KEY = 'me.bp';
export const WATER_KEY = 'me.water';
export const MED_DEFAULT_MIN = 10;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const toNum = (v) => Number(String(v ?? '').trim().replace(',', '.'));

/** A blood pressure { sys, dia } in mmHg, or null when it is none (sys 70–250, dia 40–150, sys above dia). */
export function cleanBp(sys, dia) {
  const s = Math.round(toNum(sys));
  const d = Math.round(toNum(dia));
  return s >= 70 && s <= 250 && d >= 40 && d <= 150 && s > d ? { sys: s, dia: d } : null;
}
/** Litres with one decimal (0.1–10), or null. */
export function cleanL(v) {
  const l = Math.round(toNum(v) * 10) / 10;
  return l >= 0.1 && l <= 10 ? l : null;
}

/** The blood pressure entries, cleaned, oldest first, one per day. */
export function bpEntries(v) {
  const by = new Map();
  for (const e of Array.isArray(v?.entries) ? v.entries : []) {
    const bp = cleanBp(e?.sys, e?.dia);
    if (bp && DAY.test(String(e?.day ?? ''))) by.set(e.day, bp);
  }
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([day, bp]) => ({ day, ...bp }));
}
/** The water entries, cleaned, oldest first, one per day. */
export function waterEntries(v) {
  const by = new Map();
  for (const e of Array.isArray(v?.entries) ? v.entries : []) {
    const l = cleanL(e?.l);
    if (l != null && DAY.test(String(e?.day ?? ''))) by.set(e.day, l);
  }
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([day, l]) => ({ day, l }));
}
/** The entries with one day replaced (or removed when entry is null). */
export function withDay(entries, day, entry) {
  const rest = entries.filter((e) => e.day !== day);
  return entry ? [...rest, { day, ...entry }].sort((a, b) => a.day.localeCompare(b.day)) : rest;
}

/** Minutes per zone (five) of the day's activities, or null without a pulse histogram. */
export function zoneMinOf(row, bounds) {
  let out = null;
  for (const a of row?.acts ?? []) {
    const s = zoneSecs(a.hist, bounds);
    if (!s) continue;
    out = (out ?? [0, 0, 0, 0, 0]).map((m, i) => m + s[i] / 60);
  }
  return out ? out.map((m) => Math.round(m)) : null;
}

/** Map day → meditation minutes, from the Aktiv ticks (flowLog rows). */
export function medByDay(log = []) {
  const by = new Map();
  for (const e of log) {
    if (e?.actId !== 'meditation' || !DAY.test(String(e.day ?? ''))) continue;
    const m = fin(e.min) && e.min > 0 ? e.min : MED_DEFAULT_MIN;
    by.set(e.day, (by.get(e.day) ?? 0) + m);
  }
  return by;
}

/** «23:30» → minutes after noon (690); «00:30» → 750. null when it is no time. */
export function bedMin(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''));
  if (!m) return null;
  const t = Number(m[1]) * 60 + Number(m[2]);
  return (t - 720 + 1440) % 1440;
}
/** Minutes after noon → «23:30». */
export function bedText(min) {
  if (fin(min) == null) return '–';
  const t = Math.round(min + 720) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
/** How regular the bedtimes are: the standard deviation in minutes (at least 3 nights), or null. */
export function spreadMin(mins) {
  const v = mins.filter((x) => fin(x) != null);
  if (v.length < 3) return null;
  const m = v.reduce((s, x) => s + x, 0) / v.length;
  return Math.round(Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length));
}

const rides = (row) => (row?.acts ?? []).filter((a) => a.kind === 'bike' && fin(a.movingS) > 0);
/** The mean cadence of the day's rides (rpm, weighted by time), or null. */
export function cadOf(row) {
  const r = rides(row).filter((a) => fin(a.cad) > 0);
  if (!r.length) return null;
  const s = r.reduce((x, a) => x + a.movingS, 0);
  return Math.round(r.reduce((x, a) => x + a.cad * a.movingS, 0) / s);
}
/** The mean speed of the day's rides (km/h: their km over their moving time), or null. */
export function spdOf(row) {
  const r = rides(row).filter((a) => fin(a.km) > 0);
  if (!r.length) return null;
  const h = r.reduce((x, a) => x + a.movingS, 0) / 3600;
  return Math.round((r.reduce((x, a) => x + a.km, 0) / h) * 10) / 10;
}

/**
 * The bike km of a year added up per month, and of the year before: 12 points { key: 'YYYY-MM-01',
 * now, before } (now is null after the current month). today decides how far this year goes.
 */
export function yearKm(table, year, today) {
  const per = (y) => {
    const m = Array(12).fill(0);
    for (const [d, r] of table) if (d.startsWith(`${y}-`) && fin(r.bikeKm)) m[Number(d.slice(5, 7)) - 1] += r.bikeKm;
    return m;
  };
  const a = per(year);
  const b = per(year - 1);
  const lastM = String(year) === today.slice(0, 4) ? Number(today.slice(5, 7)) : 12;
  let x = 0;
  let y = 0;
  return a.map((v, i) => {
    x += v;
    y += b[i];
    return { key: `${year}-${String(i + 1).padStart(2, '0')}-01`, now: i < lastM ? Math.round(x) : null, before: Math.round(y) };
  });
}
/** This year up to today against the year before up to the same day: { now, before } in km. */
export function yearToDate(table, today) {
  const y = Number(today.slice(0, 4));
  const same = `${y - 1}${today.slice(4)}`;
  let now = 0;
  let before = 0;
  for (const [d, r] of table) {
    if (!fin(r.bikeKm)) continue;
    if (d.startsWith(`${y}-`) && d <= today) now += r.bikeKm;
    if (d.startsWith(`${y - 1}-`) && d <= same) before += r.bikeKm;
  }
  return { now: Math.round(now), before: Math.round(before) };
}

/** One point per ride from..to with a temperature and a mean pulse: [{ id, day, temp, hr }]. */
export function tempPoints(table, from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const a of rides(table.get(d))) {
      if (fin(a.tempAvg) != null && fin(a.hrAvg) > 0) out.push({ id: a.id, day: d, temp: a.tempAvg, hr: a.hrAvg });
    }
  }
  return out;
}
/** The mean pulse in three temperature bands (below 10, 10 to 20, from 20 °C): [{ band, hr, n }]. */
export function tempBands(points) {
  const bands = [
    { band: 'cold', test: (t) => t < 10 },
    { band: 'mild', test: (t) => t >= 10 && t < 20 },
    { band: 'warm', test: (t) => t >= 20 },
  ];
  return bands.map(({ band, test }) => {
    const p = points.filter((x) => test(x.temp));
    return { band, n: p.length, hr: p.length ? Math.round(p.reduce((s, x) => s + x.hr, 0) / p.length) : null };
  });
}
