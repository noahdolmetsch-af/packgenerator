/**
 * AB6 «So wird ausgewertet» (Noah 14.10.2026 «freigabe»): the analyses read from the one history
 * (abfragen.js mergeHistory), only to look at, never a grade. Pure functions (tests/abfragen.test.js).
 * Noah 14.10. 00:52:22 1a 2a 3b 4ab — 4ab: shown under Ich › Daten › Auswertung and on «Deine Abfragen»
 * (lib/abfragen/Auswertung.svelte, the same component in both).
 *   1 ownNormal     day value, mean of 7 days, your normal of 30 days as a band, the direction
 *   2 withWithout   days with a thing next to days without it, a result only from 5 days per group
 *   3 feltMeasured  felt next to measured, day by day, side by side, no judgement
 *   4 areaWeek      one value 0–100 per area and week (the balance ring)
 *   5 observation   a simple rule from your own similar days with its hit rate, only after ~2 weeks of data
 *   +  sourceCounts where the values come from (by hand, Fitbit, Strava, App)
 */
import { addDays, lastDays } from './flow.js';
import { AREAS, QUESTION, numberOf } from './abfragen.js';

const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

/** The number of a history row (via its question's form; an own question passes its form in `forms`). */
export function rowNumber(row, forms = {}) {
  const form = forms[row.qid] ?? QUESTION[row.qid]?.form ?? (row.kind === 'scale' || row.kind === 'number' ? { kind: row.kind } : null);
  return numberOf(form, row.value);
}

/** One value per day of a question: the mean of that day's answers, or null. → { [day]: value } */
export function dailyValues(rows = [], qid, forms = {}) {
  const per = {};
  for (const r of rows) {
    if (r.qid !== qid) continue;
    const v = rowNumber(r, forms);
    if (v == null) continue;
    (per[r.day] ??= []).push(v);
  }
  return Object.fromEntries(Object.entries(per).map(([d, vs]) => [d, mean(vs)]));
}

/** The usual spread of a list (standard deviation), 0 for fewer than two values. */
function spread(xs) {
  const m = mean(xs);
  return xs.length < 2 ? 0 : Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

/**
 * 1 Verlauf und eigenes Normal: { today, avg7, band: [lo, hi] | null, dir: 'up' | 'down' | 'same' | null,
 * series: [{ day, v }] (30 days), n } — the band (your mean ± the usual spread of the last 30 days) needs 5 days,
 * the direction compares the last 7 days with the 7 before (a step of at least 0.5).
 */
export function ownNormal(rows = [], qid, today, { forms = {}, days = 30 } = {}) {
  const per = dailyValues(rows, qid, forms);
  const series = lastDays(today, days).map((day) => ({ day, v: per[day] ?? null }));
  const vals = series.map((x) => x.v).filter((v) => v != null);
  const last7 = series.slice(-7).map((x) => x.v).filter((v) => v != null);
  const prev7 = series.slice(-14, -7).map((x) => x.v).filter((v) => v != null);
  const band = vals.length >= 5 ? [Math.round(mean(vals) - spread(vals)), Math.round(mean(vals) + spread(vals))] : null;
  const a = mean(last7);
  const b = mean(prev7);
  const dir = a == null || b == null ? null : a - b >= 0.5 ? 'up' : b - a >= 0.5 ? 'down' : 'same';
  return { today: r1(per[today] ?? null), avg7: r1(a), band, dir, series, n: vals.length };
}

/** At least this many days in each group before «Mit und ohne» shows a result. */
export const MIN_GROUP = 5;
/**
 * 2 Mit und ohne: the mean of a question on days with a thing and on days without it, always with the
 * number of days; ready only from MIN_GROUP days per group (else how many are still missing).
 * has(day) → true | false | null (null: not known that day, left out).
 */
export function withWithout(rows = [], qid, has, days = [], { forms = {}, min = MIN_GROUP } = {}) {
  const per = dailyValues(rows, qid, forms);
  const yes = [];
  const no = [];
  for (const d of days) {
    const v = per[d];
    if (v == null) continue;
    const h = has(d);
    if (h === true) yes.push(v);
    else if (h === false) no.push(v);
  }
  const ready = yes.length >= min && no.length >= min;
  return {
    with: { mean: ready ? r1(mean(yes)) : null, n: yes.length },
    without: { mean: ready ? r1(mean(no)) : null, n: no.length },
    ready,
    missing: { with: Math.max(0, min - yes.length), without: Math.max(0, min - no.length) },
  };
}

/** 3 Gefühlt neben gemessen: the last n days, both values side by side → [{ day, felt, measured }]. */
export function feltMeasured(felt = {}, measured = {}, today, n = 7) {
  return lastDays(today, n).map((day) => ({ day, felt: felt[day] ?? null, measured: measured[day] ?? null }));
}

/** Monday to Sunday of the week of a day. */
export function weekOf(day) {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  const mon = addDays(day, -((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** A row's value on 0–1 for the area value: 1–10 → 0–1, ja/nein 1 · 0.5 · 0, a chip with a value 0–1. Numbers with a unit stay out. */
export function share(row, forms = {}) {
  const form = forms[row.qid] ?? QUESTION[row.qid]?.form;
  if (!form || form.kind === 'number' || form.kind === 'text') return null;
  const v = numberOf(form, row.value);
  if (v == null) return null;
  if (form.kind === 'scale') return (v - 1) / 9;
  const top = Math.max(1, ...(form.options ?? []).map((o) => o.v ?? 0));
  return Math.min(1, Math.max(0, v / top));
}

/**
 * 4 Bereichs-Wert pro Woche (0–100): per area the mean share of its answers in the week, or null
 * without answers. → [{ area, value, n }] in the order of the areas.
 */
export function areaWeek(rows = [], week = [], { forms = {} } = {}) {
  const days = new Set(week);
  return AREAS.map(({ key }) => {
    const vs = rows.filter((r) => r.area === key && days.has(r.day)).map((r) => share(r, forms)).filter((v) => v != null);
    return { area: key, value: vs.length ? Math.round(mean(vs) * 100) : null, n: vs.length };
  });
}

/** Days of data before an observation shows (about 2 weeks). */
export const MIN_OBS_DAYS = 14;
/**
 * 5 Eine Beobachtung: on the days the condition holds, how often the outcome holds too.
 * when(day), then(day) → true | false | null. → { hits, n, rate, ready } (ready from MIN_OBS_DAYS days of data
 * and at least 3 days with the condition).
 */
export function observation(days = [], when, then, { minDays = MIN_OBS_DAYS, minCases = 3 } = {}) {
  let n = 0;
  let hits = 0;
  let data = 0;
  for (const d of days) {
    const c = when(d);
    const o = then(d);
    if (c != null || o != null) data++;
    if (c !== true || o == null) continue;
    n++;
    if (o === true) hits++;
  }
  return { hits, n, rate: n ? hits / n : null, ready: data >= minDays && n >= minCases };
}

/** Where the values come from: { hand, fitbit, strava, app } counted. */
export function sourceCounts(rows = []) {
  const out = { hand: 0, fitbit: 0, strava: 0, app: 0 };
  for (const r of rows) if (r.src in out) out[r.src]++;
  return out;
}
