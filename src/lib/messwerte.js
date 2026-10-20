/**
 * «Aktiv neu» (Noah 20.10.2026 «1a 2a 3a 4b 5b»): the measured values of every day in one place, from
 * Strava (all sports), the rides of the app and Fitbit. Read by «Deine Woche in Zahlen» on Aktiv
 * (flow/WeekNumbers.svelte), the diary of Ich › Daten › Verlauf and «Deine Messwerte» of the analysis.
 * Only to look at: no grades, every value names its source.
 *
 * dayTable(): Map day → { time (s), km, hm, azm, sleep (min), rhr, hrv, steps, hr, watt, acts }
 *   time, hr, watt: the Strava activities of the day (hr and watt weighted by the moving time);
 *   km, hm: the bike rides (app files + Strava, as «Velo» counts them, withStravaRides) plus the other
 *   Strava sports (run, hike, …);
 *   azm, sleep, rhr, hrv, steps: the Fitbit day (healthDays);
 *   kcal, kcalActive: the Fitbit calories of the day (all, active); kcalAct: the calories of the Strava
 *   activities (their kcal, else their kJ, about the same for cycling);
 *   hrMax: the highest pulse of the day (Fitbit, else the highest of the activities).
 */
import { addDays } from './health.js';

/** The values: sum over a window (time, km, hm, azm, steps) or the mean of the days that have one. */
export const METRICS = [
  { key: 'time', how: 'sum', src: 'strava', name: 'Time in motion', unit: 'h', about: 'All your Strava activities, every sport: the time you were moving.' },
  { key: 'km', how: 'sum', src: 'strava', name: 'Distance', unit: 'km', about: 'Bike rides (app and Strava) and runs or hikes from Strava.' },
  { key: 'hm', how: 'sum', src: 'strava', name: 'Climbing', unit: 'm', about: 'The metres climbed of the same rides, runs and hikes.' },
  { key: 'azm', how: 'sum', src: 'fitbit', name: 'Active zone minutes|metric', unit: 'min', about: 'Minutes your pulse was in the fat burn, cardio or peak zone. The WHO suggests 150 a week.' },
  { key: 'sleep', how: 'mean', src: 'fitbit', name: 'Sleep|metric', unit: 'h', about: 'Time asleep per night, as your Fitbit measured it. Most adults need 7 to 9 hours.' },
  { key: 'rhr', how: 'mean', src: 'fitbit', name: 'Resting pulse', unit: 'bpm', about: 'Your pulse at rest. Lower than your normal often means well rested; clearly higher can mean stress, illness or too little sleep.' },
  { key: 'hrv', how: 'mean', src: 'fitbit', name: 'HRV', unit: 'ms', about: 'Heart rate variability at night. Higher than your normal often means well recovered.' },
  { key: 'steps', how: 'mean', src: 'fitbit', name: 'Steps', unit: '', about: 'Steps per day from your Fitbit.' },
  { key: 'hr', how: 'mean', src: 'strava', name: 'Pulse in activities', unit: 'bpm', about: 'The mean pulse of your Strava activities, weighted by their time.' },
  { key: 'watt', how: 'mean', src: 'strava', name: 'Power', unit: 'W', about: 'The mean power of rides with a power meter.' },
];
export const METRIC = Object.fromEntries(METRICS.map((m) => [m.key, m]));
/** «Deine Woche in Zahlen»: the six values of the card, in this order. */
export const WEEK_KEYS = ['time', 'km', 'hm', 'azm', 'sleep', 'rhr'];

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const dayOf = (v) => (typeof v === 'string' ? v.slice(0, 10) : null);

/**
 * health: healthDays rows; acts: Strava activities (actRecord, all kinds); bikeRides: withStravaRides(…)
 * (bike rides of the app and Strava, { date, km, gainM, source, id }).
 */
export function dayTable({ health = [], acts = [], bikeRides = [] } = {}) {
  const map = new Map();
  const at = (d) => {
    if (!map.has(d)) map.set(d, { day: d, acts: [] });
    return map.get(d);
  };
  const add = (row, k, v) => {
    if (v == null) return;
    row[k] = (row[k] ?? 0) + v;
  };
  for (const r of bikeRides ?? []) {
    const d = dayOf(r?.date);
    if (!d) continue;
    const row = at(d);
    add(row, 'km', fin(Number(r.km)));
    add(row, 'hm', fin(r.gainM));
  }
  // the weighted means need the time per value
  const hrW = new Map();
  const wW = new Map();
  for (const a of acts ?? []) {
    if (!a?.day || a.hidden) continue;
    const row = at(a.day);
    row.acts.push(a);
    const s = fin(a.movingS) ?? 0;
    add(row, 'time', s || null);
    if (a.kind !== 'bike') {
      add(row, 'km', fin(a.km) || null);
      add(row, 'hm', fin(a.hm) || null);
    }
    const kc = fin(a.kcal) ?? fin(a.kj);
    add(row, 'kcalAct', kc ? Math.round(kc) : null);
    if (fin(a.hrMax)) row.actHrMax = Math.max(row.actHrMax ?? 0, a.hrMax);
    const w = s || 1;
    if (fin(a.hrAvg)) {
      const x = hrW.get(a.day) ?? [0, 0];
      hrW.set(a.day, [x[0] + a.hrAvg * w, x[1] + w]);
    }
    if (fin(a.wAvg) && a.wDevice) {
      const x = wW.get(a.day) ?? [0, 0];
      wW.set(a.day, [x[0] + a.wAvg * w, x[1] + w]);
    }
  }
  for (const [d, [v, w]] of hrW) at(d).hr = Math.round(v / w);
  for (const [d, [v, w]] of wW) at(d).watt = Math.round(v / w);
  for (const h of health ?? []) {
    if (!h?.date) continue;
    const row = at(h.date);
    if (fin(h.azm) != null) row.azm = h.azm;
    if (fin(h.sleep?.asleepMin) != null) row.sleep = h.sleep.asleepMin;
    if (fin(h.restingHr) != null) row.rhr = h.restingHr;
    if (fin(h.hrvMs) != null) row.hrv = h.hrvMs;
    if (fin(h.steps) != null) row.steps = h.steps;
    if (fin(h.kcal) != null) row.kcal = h.kcal;
    if (fin(h.kcalActive) != null) row.kcalActive = h.kcalActive;
    if (fin(h.hrMax) != null) row.hrMax = h.hrMax;
  }
  for (const row of map.values()) if (row.hrMax == null && row.actHrMax) row.hrMax = row.actHrMax;
  for (const row of map.values()) row.acts.sort((a, b) => String(a.start ?? a.time ?? '').localeCompare(String(b.start ?? b.time ?? '')));
  return map;
}

/** The value of one metric over the days from..to (both included); null when no day has one. */
export function windowValue(table, key, from, to) {
  const m = METRIC[key];
  const vals = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const v = table.get(d)?.[key];
    if (fin(v) != null) vals.push(v);
  }
  if (!vals.length) return null;
  const sum = vals.reduce((s, v) => s + v, 0);
  return m?.how === 'mean' ? sum / vals.length : sum;
}

/**
 * «Deine Woche in Zahlen»: per value the last 7 days (today included) next to the mean week of the
 * 4 weeks before. pct: the change in % (null without a base); flat when it is within ±5 %.
 */
export function weekNumbers(table, today, keys = WEEK_KEYS) {
  const from = addDays(today, -6);
  return keys.map((key) => {
    const m = METRIC[key];
    const now = windowValue(table, key, from, today);
    const olds = [1, 2, 3, 4].map((w) => windowValue(table, key, addDays(from, -7 * w), addDays(today, -7 * w))).filter((v) => v != null);
    const base = olds.length ? olds.reduce((s, v) => s + v, 0) / olds.length : null;
    const pct = now != null && base ? Math.round(((now - base) / base) * 100) : null;
    return { key, m, now, base, pct, flat: pct != null && Math.abs(pct) <= 5 };
  });
}

/** n weeks of one value, the oldest first; each { from, to, v }. The last week ends today. */
export function weekSeries(table, key, today, n = 12) {
  return Array.from({ length: n }, (_, i) => {
    const to = addDays(today, -7 * (n - 1 - i));
    const from = addDays(to, -6);
    return { from, to, v: windowValue(table, key, from, to) };
  });
}

/** «Dein Normal» of one value: today (or the latest day), the mean of 7 days, the median of 30 days. */
export function normalOf(table, key, today) {
  const vals = (days) => Array.from({ length: days }, (_, i) => table.get(addDays(today, -i))?.[key]).filter((v) => fin(v) != null);
  const last = vals(7)[0] ?? null;
  const w = vals(7);
  const s = vals(30).sort((a, b) => a - b);
  const mid = s.length >> 1;
  const median = s.length >= 7 ? (s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2) : null;
  return { key, m: METRIC[key], last, mean7: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null, normal: median, n: s.length };
}

/** A value for people: time and sleep as «5 h 20», the rest rounded; fmt: the number format of the app (num). */
export function shown(key, v, fmt = String) {
  if (v == null) return null;
  if (key === 'time' || key === 'sleep') {
    const min = key === 'time' ? Math.round(v / 60) : Math.round(v);
    const h = Math.floor(min / 60);
    const mm = min % 60;
    return h ? `${h} h ${String(mm).padStart(2, '0')}` : `${mm} min`;
  }
  if (key === 'km') return fmt(Math.round(v * 10) / 10);
  return fmt(Math.round(v));
}
