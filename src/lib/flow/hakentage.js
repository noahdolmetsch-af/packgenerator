/**
 * «Nach harten Tagen» (Noah 27.11.2026 «18-22 alle» / «13-17 alle», Fragen 13, 14 und 17, Thread «Abhaken auf einen Blick verbessern»): your resting pulse
 * and your sleep the day after a hard day, after an easier day and after a day without movement, and the distance between two hard days.
 * A hard day is the app's own rule (ruhetag.js hardFrom: at or above YOUR upper quarter of the last 42 days). Pure rules over the day table of the
 * app (messwerte.js dayTable: rhr, sleep in minutes) and the loads per day (form.js dayLoads). Observation only: a pattern, never a cause.
 */
import { addDays, daysBetween } from '../flow.js';
import { hardFrom } from '../ruhetag.js';

/** The days looked at. */
export const WINDOW = 180;
/** At least this many days in a group for a mean. */
export const MIN_GROUP = 6;
/** The smallest difference (hard against rest) worth a sentence. */
export const MIN_DIFF = { rhr: 0.5, sleep: 10 };
/** The fewest hard days for the distance, and the days the distance is looked at. */
export const MIN_HARD = 5;
export const GAP_DAYS = 120;

const fin = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** The hard days (sorted, oldest first) of the last `days` days up to yesterday-or-today. loads: Map day → load. */
export function hardDays(loads = new Map(), today, days = WINDOW) {
  const { hard } = hardFrom(loads, today);
  const from = addDays(today, -(days - 1));
  return [...loads].filter(([d, l]) => d >= from && d <= today && l >= hard).map(([d]) => d).sort();
}

/**
 * The next day's resting pulse and the night's sleep after a hard day, an easier day with movement, and a day without movement.
 * table: Map day → { rhr, sleep }; loads: Map day → load; moved: Set of the days with movement (units), optional (else the days with a load).
 * → { hard, easy, rest: { n: { rhr, sleep }, rhr, sleep } each, rows: how many days, verdict: { rhr, sleep } 'higher' | 'lower' | 'none' (hard against rest) } or null
 */
export function afterHard({ table = new Map(), loads = new Map(), moved = null, today }) {
  const { hard } = hardFrom(loads, today);
  const groups = { hard: { rhr: [], sleep: [] }, easy: { rhr: [], sleep: [] }, rest: { rhr: [], sleep: [] } };
  for (let i = 1; i < WINDOW; i++) {
    const day = addDays(today, -i - 1); // the day itself; the day after it must be over (up to yesterday)
    const next = table.get(addDays(day, 1));
    if (!next) continue;
    const load = loads.get(day) ?? 0;
    const did = moved ? moved.has(day) || load > 0 : load > 0;
    const g = groups[load >= hard && load > 0 ? 'hard' : did ? 'easy' : 'rest'];
    const r = fin(next.rhr);
    const s = fin(next.sleep);
    if (r != null) g.rhr.push(r);
    if (s != null && s > 0) g.sleep.push(s);
  }
  const out = {};
  for (const k of ['hard', 'easy', 'rest']) {
    const g = groups[k];
    out[k] = { n: { rhr: g.rhr.length, sleep: g.sleep.length }, rhr: g.rhr.length >= MIN_GROUP ? mean(g.rhr) : null, sleep: g.sleep.length >= MIN_GROUP ? mean(g.sleep) : null };
  }
  const verdict = {};
  for (const m of ['rhr', 'sleep']) {
    const d = out.hard[m] != null && out.rest[m] != null ? out.hard[m] - out.rest[m] : null;
    verdict[m] = d == null ? null : Math.abs(d) < MIN_DIFF[m] ? 'none' : d > 0 ? 'higher' : 'lower';
  }
  if (verdict.rhr == null && verdict.sleep == null) return null;
  return { ...out, verdict };
}

/**
 * The distance between two hard days: { n (hard days in the last 120), usual (median days between two), since (days since the last one) } or null under 5 hard days.
 */
export function hardGap(loads = new Map(), today) {
  const days = hardDays(loads, today, GAP_DAYS);
  if (days.length < MIN_HARD) return null;
  const gaps = [];
  for (let i = 1; i < days.length; i++) gaps.push(daysBetween(days[i - 1], days[i]));
  return { n: days.length, usual: Math.max(1, median(gaps)), since: daysBetween(days[days.length - 1], today) };
}

/** The fewest days with your feeling «hard» (and with «light» or «good») for a comparison. */
export const MIN_FEEL_DAYS = 6;

/**
 * Frage 15: how hard it felt against what it did (Noah 27.11.2026): the days you ticked with the feeling «hard» against the days with «light» or «good»,
 * and your resting pulse, HRV and sleep the day after. A day counts as «hard» when any tick of it says so. Only a pattern, never a cause.
 * log: flowLog (day, feel); table: Map day → { rhr, hrv, sleep }.
 * → { answered (days with a feeling), hard, easy: { n, rhr, hrv, sleep }, enough, missing (days still needed per group) }; null without any feeling
 */
export function afterFeel({ log = [], table = new Map(), today }) {
  const from = addDays(today, -(WINDOW - 1));
  const by = new Map();
  for (const e of log) {
    if (!e?.day || e.day < from || e.day >= today || !['light', 'good', 'hard'].includes(e.feel)) continue;
    const had = by.get(e.day);
    by.set(e.day, had === 'hard' || e.feel === 'hard' ? 'hard' : 'easy');
  }
  if (!by.size) return null;
  const groups = { hard: { days: 0, rhr: [], hrv: [], sleep: [] }, easy: { days: 0, rhr: [], hrv: [], sleep: [] } };
  for (const [day, kind] of by) {
    const g = groups[kind];
    g.days += 1;
    const next = table.get(addDays(day, 1));
    for (const k of ['rhr', 'hrv', 'sleep']) {
      const v = fin(next?.[k]);
      if (v != null && (k !== 'sleep' || v > 0)) g[k].push(v);
    }
  }
  const out = {};
  for (const k of ['hard', 'easy']) {
    const g = groups[k];
    out[k] = { n: g.days, rhr: g.rhr.length >= MIN_FEEL_DAYS ? mean(g.rhr) : null, hrv: g.hrv.length >= MIN_FEEL_DAYS ? mean(g.hrv) : null, sleep: g.sleep.length >= MIN_FEEL_DAYS ? mean(g.sleep) : null };
  }
  const enough = out.hard.n >= MIN_FEEL_DAYS && out.easy.n >= MIN_FEEL_DAYS;
  return { answered: by.size, hard: out.hard, easy: out.easy, enough, missing: { hard: Math.max(0, MIN_FEEL_DAYS - out.hard.n), easy: Math.max(0, MIN_FEEL_DAYS - out.easy.n) } };
}
