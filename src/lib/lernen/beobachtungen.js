/**
 * Paket M «Aus Touren lernen» · «3 Beobachtungen pro Woche» (#294) with «Alles klug auswerten, z. B. Schlaf
 * und Tour» (#14) and «Nachwirkungen von Touren erkennen» (#247). Noah 19.10.2026: every Sunday three
 * observations in the Wochenrückblick, each a plain sentence with a small chart.
 *
 * On the device only: no KI, no network. Pure rules (tests/beobachtungen.test.js); the cards are
 * src/lib/lernen/Beobachtungen.svelte on the week review (#/flow/review).
 *
 * Kinds (each gives at most one candidate; the top three by score are shown, all of different kinds):
 *   week    this week against your usual (hours, km or active days; the four weeks before)
 *   sleep   sleep in the night after a ride or tour day against the other nights (Fitbit, else «Wi gaht's?»)
 *   after   the 1–3 days after a long tour or ride: resting heart rate, sleep or mood against normal days
 *   time    the weekday or time of day you ride most
 *   streak  active days in a row this week, or a long gap while you are usually active
 *   mind    mood on days with meditation against days without
 * A candidate needs enough data (MIN_DAYS per group, at least two long efforts, …); without it the kind is
 * listed as «noch zu wenig Daten», never guessed. score = effect (0–1) × enough data (0–1).
 *
 * Frozen per week (db.settings 'beobachtungen' = { on, weeks: { 'YYYY-Www': [obs] }, offKinds }): the three of
 * a week are worked out on its Sunday (from the morning, for the running week) or on the first visit after
 * it, and then stay as they are. An observation stores its sentence as a key with numbers (any language).
 * Health values are observation only: what was, never what is good.
 */
import { shiftDay, mondayOf, isoWeek } from '../training.js';
import { dayValues, weekSums, SLEEP_Q, MOOD_Q, USUAL_WEEKS } from '../weekreview.js';
import { tripEnd } from '../tripstate.js';
import { isoWeek as isoWeekKey } from '../kmbook.js';
import { isTestTrip, isArchived } from '../testname.js';

export const OBS_KEY = 'beobachtungen';
export const KINDS = ['week', 'sleep', 'after', 'time', 'streak', 'mind'];
/** The words of the kinds (for «Diese Art nicht mehr zeigen» and the switches). */
export const KIND_NAMES = { week: 'Week against your usual|obs', sleep: 'Sleep after riding|obs', after: 'Days after a long tour|obs', time: 'When you ride|obs', streak: 'Streaks and gaps|obs', mind: 'Mood and meditation|obs' };
/** Three a week. */
export const PER_WEEK = 3;
/** At least this many days in each group before a comparison counts. */
export const MIN_DAYS = 4;
/** The days looked back on for the comparisons (twelve weeks up to the week's end). */
export const WINDOW_DAYS = 84;
/** A long effort: this much moving time or these km in one activity, or a trip of two days or more. */
export const LONG_S = 4 * 3600;
export const LONG_KM = 80;
/** Days after a long effort that count as «after». */
export const AFTER_DAYS = 3;
/** Weeks kept in the record. */
export const KEEP_WEEKS = 52;

const r1 = (x) => Math.round(x * 10) / 10;
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const dow0 = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 Monday … 6 Sunday
const usableTrip = (x) => x?.startDate && !x.skipped && !x.idea && !isArchived(x) && !isTestTrip(x);

/* ---------------------------------------------------------------- weeks and the record */

/** 'YYYY-Www' of the week that starts on this Monday (the ISO year is the year of its Thursday). */
export const weekKey = (monday) => isoWeekKey(monday);

/**
 * The week whose observations are due on a day: on a Sunday the running week, on any other day the week that
 * ended last Sunday. → its Monday.
 */
export const dueMonday = (today) => (dow0(today) === 6 ? mondayOf(today) : shiftDay(mondayOf(today), -7));

/** Is the week (by its Monday) ready for its observations on this day? From its Sunday on. */
export const isReady = (monday, today) => shiftDay(monday, 6) <= today;

/** The stored record, cleaned. */
export function obsOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const weeks = {};
  for (const [k, list] of Object.entries(v.weeks ?? {})) if (/^\d{4}-W\d{2}$/.test(k) && Array.isArray(list)) weeks[k] = list.filter((o) => o && KINDS.includes(o.kind) && o.key);
  return { on: v.on !== false, weeks, offKinds: (Array.isArray(v.offKinds) ? v.offKinds : []).filter((k) => KINDS.includes(k)) };
}

/** The record with a week frozen (only the newest KEEP_WEEKS weeks stay). */
export function freeze(value, monday, list) {
  const c = obsOf(value);
  const weeks = { ...c.weeks, [weekKey(monday)]: list };
  const keep = Object.keys(weeks).sort().slice(-KEEP_WEEKS);
  return { ...c, weeks: Object.fromEntries(keep.map((k) => [k, weeks[k]])) };
}

/** Hide a kind or show it again. */
export const setKind = (value, kind, on) => {
  const c = obsOf(value);
  const off = new Set(c.offKinds);
  if (on) off.delete(kind);
  else if (KINDS.includes(kind)) off.add(kind);
  return { ...c, offKinds: KINDS.filter((k) => off.has(k)) };
};

/** The earlier frozen weeks before a Monday, newest first → [{ key, list }] (without hidden kinds). */
export function olderWeeks(value, monday, n = 8) {
  const c = obsOf(value);
  const here = weekKey(monday);
  return Object.keys(c.weeks).filter((k) => k < here).sort().reverse().slice(0, n).map((key) => ({ key, list: c.weeks[key].filter((o) => !c.offKinds.includes(o.kind)) })).filter((w) => w.list.length);
}

/* ---------------------------------------------------------------- the days from the data */

/**
 * The days the data knows → { active, ride, long, sleepMin, sleepFelt, rhr, mood, mind, minutes, times }.
 * data: { acts, rides, trips, health, answers, checks, log, flowActs }.
 */
export function daysOf(data = {}) {
  const acts = (data.acts ?? []).filter((a) => a?.day && ((Number(a.movingS) || 0) > 0 || (Number(a.km) || 0) > 0));
  const rides = (data.rides ?? []).filter((r) => r?.date);
  const trips = (data.trips ?? []).filter(usableTrip);
  const ring = new Map((data.flowActs ?? []).map((a) => [a.id, a.ring ?? 'move']));
  const active = new Set();
  const ride = new Set();
  const long = new Set();
  const minutes = new Map();
  for (const a of acts) {
    active.add(a.day);
    if (a.kind === 'bike') ride.add(a.day);
    if ((Number(a.movingS) || 0) >= LONG_S || (a.kind === 'bike' && (Number(a.km) || 0) >= LONG_KM)) long.add(a.day);
    minutes.set(a.day, (minutes.get(a.day) ?? 0) + Math.round((Number(a.movingS) || 0) / 60));
  }
  for (const r of rides) {
    const d = String(r.date).slice(0, 10);
    active.add(d);
    ride.add(d);
    if ((Number(r.km) || 0) >= LONG_KM || (Number(r.movingH) || 0) * 3600 >= LONG_S) long.add(d);
  }
  // the days of a ridden trip with a bike count as ride days; a trip of two days or more is a long effort (its last day)
  for (const tr of trips) {
    if (Array.isArray(tr.packs)) continue;
    const n = Math.max(1, Number(tr.days) || 1);
    for (let i = 0; i < n; i++) {
      const d = shiftDay(tr.startDate.slice(0, 10), i);
      active.add(d);
      ride.add(d);
    }
    if (n >= 2) long.add(tripEnd(tr));
  }
  for (const e of data.log ?? []) if (e?.day && ring.get(e.actId) === 'move') active.add(e.day);
  const mind = new Set((data.log ?? []).filter((e) => e?.day && ring.get(e.actId) === 'mind').map((e) => e.day));
  const sleepMin = new Map();
  const rhr = new Map();
  for (const h of data.health ?? []) {
    if (!h?.date) continue;
    if (Number.isFinite(h.sleep?.asleepMin) && h.sleep.asleepMin > 0) sleepMin.set(h.date, h.sleep.asleepMin);
    if (Number.isFinite(h.restingHr) && h.restingHr > 0) rhr.set(h.date, h.restingHr);
  }
  const vals = { answers: data.answers ?? [], checks: data.checks ?? [] };
  const times = acts.filter((a) => a.kind === 'bike' && /^\d{2}:\d{2}/.test(a.time ?? '')).map((a) => ({ day: a.day, hour: Number(a.time.slice(0, 2)) }));
  for (const r of rides) if (r.startAt) {
    const h = new Date(r.startAt);
    if (!Number.isNaN(h.getTime())) times.push({ day: String(r.date).slice(0, 10), hour: h.getHours() });
  }
  return { active, ride, long, minutes, mind, sleepMin, sleepFelt: dayValues(vals, SLEEP_Q), rhr, mood: dayValues(vals, MOOD_Q), times };
}

/** The days from `from` to `to` (both included). */
function span(from, to) {
  const out = [];
  for (let d = from; d <= to; d = shiftDay(d, 1)) out.push(d);
  return out;
}

/** Two groups of values compared: { a, b, na, nb, diff, d (effect in spreads), ok } (ok: MIN_DAYS in each). */
export function compare(as, bs, min = MIN_DAYS) {
  const ok = as.length >= min && bs.length >= min;
  const a = mean(as);
  const b = mean(bs);
  const spread = sd([...as, ...bs]) || 1;
  const diff = a == null || b == null ? 0 : a - b;
  return { a: a == null ? null : r1(a), b: b == null ? null : r1(b), na: as.length, nb: bs.length, diff: r1(diff), d: diff / spread, ok };
}

const enough = (n, full) => clamp01(n / full);

/* ---------------------------------------------------------------- the kinds */

/** week: this week against the mean of the four weeks before (the measure that moved most). */
function weekObs(data, days, monday, asOf) {
  const prev = Array.from({ length: USUAL_WEEKS }, (_, i) => shiftDay(monday, -7 * (i + 1)));
  const sums = (m) => {
    const s = weekSums({ acts: data.acts ?? [] }, m);
    const end = m === monday ? asOf : shiftDay(m, 6);
    const n = span(m, end).filter((d) => days.active.has(d)).length;
    return { hours: s.secs / 3600, km: s.km, days: n };
  };
  const before = prev.map(sums);
  const withData = before.filter((w) => w.days > 0).length;
  if (withData < 3) return { kind: 'week', few: true };
  const now = sums(monday);
  const best = [];
  for (const k of ['hours', 'km', 'days']) {
    const usual = mean(before.map((w) => w[k]));
    if (!usual) continue;
    const rel = (now[k] - usual) / usual;
    if (k === 'days' ? Math.abs(now[k] - usual) < 1 : Math.abs(rel) < 0.2) continue;
    best.push({ k, rel, usual, value: now[k] });
  }
  if (!best.length) return null;
  const top = best.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel))[0];
  const round = (x) => (top.k === 'days' ? Math.round(x) : r1(x));
  const weeks = [...prev].reverse().concat(monday);
  const vals = [...before].reverse().concat(now);
  return {
    kind: 'week',
    key: `week-${top.k}-${top.rel > 0 ? 'more' : 'less'}`,
    vars: { a: round(top.value), b: round(top.usual), p: Math.round(Math.abs(top.rel) * 100) },
    score: clamp01(Math.abs(top.rel)) * enough(withData, USUAL_WEEKS),
    chart: { type: 'bars', unit: top.k, bars: weeks.map((m, i) => ({ l: { kw: isoWeek(m) }, v: round(vals[i][top.k]), hi: m === monday })) },
  };
}

/** sleep: the night after a ride day (sleep counts to the day you wake up) against the other nights. */
function sleepObs(days, from, to) {
  const fit = [...days.sleepMin.keys()].filter((d) => d >= from && d <= to).length >= MIN_DAYS * 2;
  const vals = fit ? days.sleepMin : days.sleepFelt;
  const after = [];
  const other = [];
  for (const d of span(from, to)) {
    const v = vals.get(d);
    if (!Number.isFinite(v)) continue;
    (days.ride.has(shiftDay(d, -1)) ? after : other).push(v);
  }
  const c = compare(after, other);
  if (!c.ok) return { kind: 'sleep', few: true };
  const minDiff = fit ? 10 : 0.5;
  if (Math.abs(c.diff) < minDiff || Math.abs(c.d) < 0.3) return null;
  const unit = fit ? 'min' : 'pt';
  return {
    kind: 'sleep',
    key: `sleep-${fit ? 'min' : 'felt'}-${c.diff > 0 ? 'more' : 'less'}`,
    vars: { a: c.a, b: c.b, diff: r1(Math.abs(c.diff)), na: c.na, nb: c.nb },
    score: clamp01(Math.abs(c.d)) * enough(Math.min(c.na, c.nb), 10),
    chart: { type: 'two', unit, a: { l: { en: 'After riding|obs' }, v: c.a, n: c.na }, b: { l: { en: 'Other nights|obs' }, v: c.b, n: c.nb } },
  };
}

/** after: the 1–3 days after a long effort against normal days, for resting heart rate, sleep and mood. */
function afterObs(days, from, to) {
  const events = [...days.long].filter((d) => d >= shiftDay(from, -AFTER_DAYS) && d < to).sort();
  const offset = new Map(); // day → 1..3 (the nearest long effort before it)
  for (const e of events) for (let k = 1; k <= AFTER_DAYS; k++) {
    const d = shiftDay(e, k);
    if (!days.long.has(d) && (!offset.has(d) || offset.get(d) > k)) offset.set(d, k);
  }
  const measures = [
    ['rhr', days.rhr, 'bpm', 2],
    ['sleep', days.sleepMin, 'min', 10],
    ['mood', days.mood, 'pt', 0.5],
  ];
  if (events.filter((e) => e >= shiftDay(from, -AFTER_DAYS)).length < 2) return { kind: 'after', few: true };
  let best = null;
  let anyOk = false;
  for (const [m, map, unit, minDiff] of measures) {
    const after = [];
    const normal = [];
    const per = [[], [], []];
    for (const d of span(from, to)) {
      const v = map.get(d);
      if (!Number.isFinite(v) || days.long.has(d)) continue;
      const k = offset.get(d);
      if (k) {
        after.push(v);
        per[k - 1].push(v);
      } else normal.push(v);
    }
    const c = compare(after, normal);
    if (!c.ok) continue;
    anyOk = true;
    if (Math.abs(c.diff) < minDiff || Math.abs(c.d) < 0.4) continue;
    const score = clamp01(Math.abs(c.d) / 1.5) * enough(Math.min(c.na, c.nb), 8);
    if (!best || score > best.score) best = { m, unit, c, per, score };
  }
  if (!anyOk) return { kind: 'after', few: true };
  if (!best) return null;
  const { m, unit, c, per, score } = best;
  return {
    kind: 'after',
    key: `after-${m}-${c.diff > 0 ? 'more' : 'less'}`,
    vars: { a: c.a, b: c.b, n: events.length, na: c.na },
    score,
    chart: { type: 'bars', unit, bars: [{ l: { en: 'Normal|obs' }, v: c.b }, ...per.map((list, i) => ({ l: { en: 'Day {n}|after', vars: { n: i + 1 } }, v: list.length ? r1(mean(list)) : null, hi: true }))] },
  };
}

/** time: the weekday or the part of the day you ride most (from 8 rides in the twelve weeks). */
export const PARTS = [
  { key: 'morning', to: 10 },
  { key: 'midday', to: 14 },
  { key: 'afternoon', to: 18 },
  { key: 'evening', to: 24 },
];
function timeObs(days, from, to) {
  const list = days.times.filter((x) => x.day >= from && x.day <= to);
  if (list.length < 8) return { kind: 'time', few: true };
  const wd = Array(7).fill(0);
  const pt = Array(4).fill(0);
  for (const x of list) {
    wd[dow0(x.day)]++;
    pt[PARTS.findIndex((p) => x.hour < p.to)]++;
  }
  const excess = (arr) => {
    const top = Math.max(...arr);
    const u = 1 / arr.length;
    return { i: arr.indexOf(top), share: top / list.length, ex: (top / list.length - u) / (1 - u) };
  };
  const w = excess(wd);
  const p = excess(pt);
  const useDay = w.ex >= p.ex;
  const top = useDay ? w : p;
  if (top.ex < 0.15) return null;
  return {
    kind: 'time',
    key: useDay ? 'time-day' : 'time-part',
    vars: { i: top.i, part: useDay ? null : PARTS[top.i].key, p: Math.round(top.share * 100), n: list.length },
    score: clamp01(top.ex * 1.5) * enough(list.length, 20),
    chart: { type: 'bars', unit: 'n', bars: useDay ? wd.map((v, i) => ({ l: { day: i }, v, hi: i === top.i })) : pt.map((v, i) => ({ l: { en: `${PARTS[i].key}|part` }, v, hi: i === top.i })) },
  };
}

/** streak: the most active days in a row that end in this week, or the longest gap while you are usually active. */
function streakObs(days, monday, asOf) {
  const week = span(monday, asOf);
  if (!week.length) return null;
  const usual = mean(Array.from({ length: USUAL_WEEKS }, (_, i) => shiftDay(monday, -7 * (i + 1))).map((m) => span(m, shiftDay(m, 6)).filter((d) => days.active.has(d)).length));
  const before = [...days.active].some((d) => d < monday && d >= shiftDay(monday, -7 * USUAL_WEEKS));
  if (!before) return { kind: 'streak', few: true };
  let run = 0;
  for (const d of week) {
    if (!days.active.has(d)) continue;
    let n = 0;
    for (let x = d; days.active.has(x); x = shiftDay(x, -1)) n++;
    run = Math.max(run, n);
  }
  let gap = 0;
  let cur = 0;
  for (const d of week) {
    cur = days.active.has(d) ? 0 : cur + 1;
    gap = Math.max(gap, cur);
  }
  const chart = { type: 'bars', unit: 'minutes', bars: span(monday, shiftDay(monday, 6)).map((d) => ({ l: { day: dow0(d) }, v: d > asOf ? null : days.minutes.get(d) ?? (days.active.has(d) ? 1 : 0), hi: days.active.has(d) })) };
  const runScore = run >= 4 ? clamp01((run - 2) / 5) : 0;
  const gapScore = gap >= 4 && usual >= 3 ? clamp01((gap - 2) / 5) : 0;
  if (!runScore && !gapScore) return null;
  return runScore >= gapScore
    ? { kind: 'streak', key: 'streak-run', vars: { n: run }, score: runScore, chart }
    : { kind: 'streak', key: 'streak-gap', vars: { n: gap, u: r1(usual) }, score: gapScore * 0.9, chart };
}

/** mind: mood on days with meditation against days without. */
function mindObs(days, from, to) {
  if (!days.mind.size) return { kind: 'mind', few: true };
  const yes = [];
  const no = [];
  for (const d of span(from, to)) {
    const v = days.mood.get(d);
    if (!Number.isFinite(v)) continue;
    (days.mind.has(d) ? yes : no).push(v);
  }
  const c = compare(yes, no);
  if (!c.ok) return { kind: 'mind', few: true };
  if (Math.abs(c.diff) < 0.5 || Math.abs(c.d) < 0.3) return null;
  return {
    kind: 'mind',
    key: `mind-${c.diff > 0 ? 'more' : 'less'}`,
    vars: { a: c.a, b: c.b, na: c.na, nb: c.nb },
    score: clamp01(Math.abs(c.d)) * enough(Math.min(c.na, c.nb), 10),
    chart: { type: 'two', unit: 'pt', a: { l: { en: 'With meditation|obs' }, v: c.a, n: c.na }, b: { l: { en: 'Without|obs' }, v: c.b, n: c.nb } },
  };
}

/**
 * Every candidate of a week (Monday), with the data up to asOf (its Sunday, or today when earlier):
 * → { list: [obs, sorted by score], few: [kind …] (not enough data yet) }. offKinds are left out.
 */
export function candidates(data, monday, asOf, { offKinds = [] } = {}) {
  const end = asOf < shiftDay(monday, 6) ? asOf : shiftDay(monday, 6);
  const from = shiftDay(end, -(WINDOW_DAYS - 1));
  const days = daysOf(data);
  const all = [weekObs(data, days, monday, end), sleepObs(days, from, end), afterObs(days, from, end), timeObs(days, from, end), streakObs(days, monday, end), mindObs(days, from, end)].filter(Boolean).filter((o) => !offKinds.includes(o.kind));
  return { list: all.filter((o) => !o.few && o.score > 0).sort((a, b) => b.score - a.score), few: all.filter((o) => o.few).map((o) => o.kind) };
}

/** The three of a week: the top scores, each kind once. */
export function pickThree(data, monday, asOf, opts = {}) {
  const { list, few } = candidates(data, monday, asOf, opts);
  const out = [];
  for (const o of list) if (out.length < PER_WEEK && !out.some((x) => x.kind === o.kind)) out.push({ ...o, score: Math.round(o.score * 100) / 100 });
  return { list: out, few };
}

/**
 * What the week review shows for a week → { state, list, few, store? }:
 *   'off'      the observations are switched off
 *   'frozen'   the week's three, as stored (hidden kinds left out)
 *   'new'      worked out now; `store` is the record to save (frozen from now on)
 *   'thin'     ready, but not one observation has enough data yet (nothing is stored, so it can come later)
 *   'waiting'  the running week before its Sunday
 */
export function weekView(value, data, monday, today) {
  const c = obsOf(value);
  if (!c.on) return { state: 'off', list: [], few: [] };
  const stored = c.weeks[weekKey(monday)];
  if (stored) return { state: 'frozen', list: stored.filter((o) => !c.offKinds.includes(o.kind)), few: [] };
  if (!isReady(monday, today)) return { state: 'waiting', list: [], few: [] };
  const { list, few } = pickThree(data, monday, today < shiftDay(monday, 6) ? today : shiftDay(monday, 6), { offKinds: c.offKinds });
  if (!list.length) return { state: 'thin', list, few };
  return { state: 'new', list, few, store: freeze(c, monday, list) };
}
