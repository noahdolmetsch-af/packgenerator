/**
 * «Wochenrückblick» (mockups W1–W6, Noah 15.10.2026 «1-5 a»): one week, Monday to Sunday, looked back at.
 * Pure rules, no database, no clock: every function gets the days it needs (YYYY-MM-DD, calendar days).
 * The page is src/pages/flow/WeekReview.svelte (#/flow/review, ?w=<Monday> for an older week).
 *
 *   W1 weekFive      the week in five numbers, each with its change against the week before
 *   W2 weekStrip     Monday to Sunday: training, recovery, meditation, and sleep and mood when answered
 *   W3 weekNotes     two or three calm sentences from fixed rules (observation only, never a rating)
 *   W4 weekHighs     longest ride, best 20 minutes, most climbing, new best values
 *   W5 weekAhead     one suggestion for next week from the load of the last weeks
 *   W6 summaryText   the week as plain text, to copy for Claude (only when the KI-Helfer is on)
 *
 * Health data (sleep, mood, heart rate) is observation only: the sentences say what was, never what is good.
 */
import { shiftDay, mondayOf, isoWeek, zoneSecs, doneBy, hmm } from './training.js';
import { flowStates } from './flow.js';
import { weekGoals } from './flowweek.js';
import { loadsOf } from './training/week/weeks.js';

/** The two «Wi gaht's?» questions the strip shows (abfragen.js), and their field in the old daily check. */
export const SLEEP_Q = 'erholung.schlaf';
export const MOOD_Q = 'spass.stimmung';
/** How many weeks before the shown one make «your usual» (the means). */
export const USUAL_WEEKS = 4;
/** At most this many sentences in «Gut gelaufen · gefehlt». */
export const MAX_NOTES = 3;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const dow = (day) => new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 Sunday … 6 Saturday
export const weekDays = (monday) => Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
const inWeek = (day, monday) => !!day && day >= monday && day < shiftDay(monday, 7);
const round1 = (x) => Math.round(x * 10) / 10;
const mean = (list) => (list.length ? list.reduce((s, x) => s + x, 0) / list.length : null);

/**
 * The week shown when no ?w= is given. On a Monday the new week has hardly begun, so the page shows the
 * week just finished; from Tuesday on it shows the running week (until today). The ‹ › arrows reach the other.
 */
export const defaultMonday = (today) => (dow(today) === 1 ? shiftDay(mondayOf(today), -7) : mondayOf(today));

/** The Monday of ?w= (any day counts as its week), never later than this week; else the default. */
export function weekParam(w, today) {
  if (!DAY_RE.test(String(w ?? '')) || Number.isNaN(Date.parse(`${w}T12:00:00Z`))) return defaultMonday(today);
  const m = mondayOf(w);
  return m > mondayOf(today) ? mondayOf(today) : m;
}

/** The address of a week; the default week has no ?w=. */
export const weekHref = (monday, today) => (monday === defaultMonday(today) ? '#/flow/review' : `#/flow/review?w=${monday}`);

/** The last day that counts: Sunday, or today in the running week. */
export const weekEnd = (monday, today) => (shiftDay(monday, 6) < today ? shiftDay(monday, 6) : today);

/* ---------------------------------------------------------------- the Aktiv log */

/** The rings of the Aktiv activities: Map actId → 'move' | 'mind' | 'rest'. */
const ringsOf = (flowActs = []) => new Map(flowActs.map((a) => [a.id, a.ring ?? 'move']));
/** Strava kinds an Aktiv activity stands for (by its symbol), so a ticked ride and its Strava ride count once. */
const ICON_KIND = { bike: 'bike', run: 'run', walk: 'hike' };

/* ---------------------------------------------------------------- W1 the week in five numbers */

/** Hours, km, Hm and sessions of one week. Sessions: Strava activities plus Aktiv entries of the move ring that are not already one of them. */
export function weekSums({ acts = [], log = [], flowActs = [] }, monday) {
  const list = acts.filter((a) => inWeek(a.day, monday));
  const ring = ringsOf(flowActs);
  const icon = new Map(flowActs.map((a) => [a.id, a.icon]));
  const daily = new Set(flowActs.filter((a) => (a.goals ?? []).length && a.goals.every((q) => q.days === 1)).map((a) => a.id));
  const stravaOn = new Set(list.map((a) => `${a.day}|${a.kind}`));
  const extra = log.filter((e) => inWeek(e.day, monday) && ring.get(e.actId) === 'move' && !daily.has(e.actId) && e.via !== 'trip' && !stravaOn.has(`${e.day}|${ICON_KIND[icon.get(e.actId)] ?? '-'}`));
  return {
    secs: list.reduce((s, a) => s + (Number(a.movingS) || 0), 0),
    km: round1(list.reduce((s, a) => s + (Number(a.km) || 0), 0)),
    hm: Math.round(list.reduce((s, a) => s + (Number(a.hm) || 0), 0)),
    n: list.length + extra.length,
  };
}

/** The goals of the Aktiv page reached at the end of the week (rolling, as on Aktiv › Woche): { met, of } or null without goals. */
export function weekGoalsMet({ flowActs = [], log = [], tripDays = [] }, monday, today) {
  if (!flowActs.length) return null;
  const end = weekEnd(monday, today);
  const goals = weekGoals(flowStates(flowActs, log, end, tripDays));
  return goals.length ? { met: goals.filter((g) => g.met).length, of: goals.length } : null;
}

/**
 * W1: five numbers and their change against the week before.
 * → [{ key: 'hours' | 'km' | 'hm' | 'n' | 'goals', value, prev, diff }] (goals: value = met, of).
 */
export function weekFive(data, monday, today) {
  const now = weekSums(data, monday);
  const before = weekSums(data, shiftDay(monday, -7));
  const g = weekGoalsMet(data, monday, today);
  const gb = weekGoalsMet(data, shiftDay(monday, -7), today);
  const row = (key, value, prev) => ({ key, value, prev, diff: key === 'km' ? round1(value - prev) : value - prev });
  const out = [row('hours', now.secs, before.secs), row('km', now.km, before.km), row('hm', now.hm, before.hm), row('n', now.n, before.n)];
  if (g) out.push({ ...row('goals', g.met, gb?.met ?? 0), of: g.of });
  return out;
}

/** True when the week has anything to show at all (an activity, an Aktiv entry or an answer). */
export const hasAnything = (data, monday) =>
  (data.acts ?? []).some((a) => inWeek(a.day, monday)) || (data.log ?? []).some((e) => inWeek(e.day, monday)) || (data.answers ?? []).some((r) => inWeek(r.day, monday)) || (data.checks ?? []).some((c) => inWeek(c.day, monday));

/** A change as people read it: «+1:20», «−0:45», «+12», «±0» (the unit is the caller's). seconds: as h:mm. */
export function diffText(diff, { seconds = false, fmt = (x) => String(x) } = {}) {
  if (!diff) return '±0';
  const sign = diff > 0 ? '+' : '−';
  return `${sign}${seconds ? hmm(Math.abs(diff)) : fmt(Math.abs(diff))}`;
}

/* ---------------------------------------------------------------- W2 the strip */

/** One scale answer per day and question (1–10): the «Wi gaht's?» answers first, else the old daily check. */
export function dayValues({ answers = [], checks = [] }, qid) {
  const field = qid === SLEEP_Q ? 'sleep' : qid === MOOD_Q ? 'mood' : null;
  const by = new Map();
  for (const r of answers) {
    if (r?.qid !== qid || typeof r.value !== 'number' || !r.day) continue;
    const l = by.get(r.day) ?? [];
    l.push(r.value);
    by.set(r.day, l);
  }
  const out = new Map([...by].map(([d, l]) => [d, round1(mean(l))]));
  if (field) for (const c of checks) if (c?.day && !out.has(c.day) && Number.isFinite(c[field])) out.set(c.day, c[field]);
  return out;
}

/** What happened on each day: kinds 'train' | 'rest' | 'mind' (in that order), [] = nothing. */
function kindsByDay({ acts = [], log = [], flowActs = [], tripDays = [] }) {
  const ring = ringsOf(flowActs);
  const by = new Map();
  const add = (d, k) => (by.get(d) ?? by.set(d, new Set()).get(d)).add(k);
  for (const a of acts) if (a.day) add(a.day, 'train');
  for (const d of tripDays) add(d, 'train');
  for (const e of log) {
    const r = ring.get(e.actId);
    if (r === 'move') add(e.day, 'train');
    else if (r === 'rest') add(e.day, 'rest');
    else if (r === 'mind') add(e.day, 'mind');
  }
  return by;
}
const ORDER = ['train', 'rest', 'mind'];

/** W2: Monday to Sunday → [{ day, kinds, sleep, mood, future }]. */
export function weekStrip(data, monday, today) {
  const by = kindsByDay(data);
  const sleep = dayValues(data, SLEEP_Q);
  const mood = dayValues(data, MOOD_Q);
  return weekDays(monday).map((day) => ({ day, kinds: ORDER.filter((k) => by.get(day)?.has(k)), sleep: sleep.get(day) ?? null, mood: mood.get(day) ?? null, future: day > today }));
}

/* ---------------------------------------------------------------- W3 the sentences */

/** Share of Z1–Z2 in % of the heart rate time of a span (activities with a histogram), or null. */
export function baseShare(acts, from, to, bounds) {
  let all = 0;
  let base = 0;
  for (const a of acts) {
    if (!a.day || a.day < from || a.day >= to) continue;
    const z = zoneSecs(a.hist, bounds);
    if (!z) continue;
    all += z.reduce((s, x) => s + x, 0);
    base += z[0] + z[1];
  }
  return all ? Math.round((base / all) * 100) : null;
}

/** The longest run of training days in a row that ends inside the week (it may start before Monday). */
export function trainStreak(data, monday, today) {
  const by = kindsByDay(data);
  const trained = (d) => by.get(d)?.has('train');
  let best = 0;
  for (const d of weekDays(monday)) {
    if (d > today || !trained(d)) continue;
    let n = 0;
    for (let x = d; trained(x); x = shiftDay(x, -1)) n++;
    best = Math.max(best, n);
  }
  return best;
}

/**
 * W3: two or three calm sentences, by these rules in this order (each only when it says something):
 *   plan      planned sessions (Training › Plan) done, or which stayed open (past days only)
 *   sleep     the week's sleep against your own mean of the four weeks before (a point or more apart)
 *   streak    five or more days of training in a row without a day off
 *   hours     a fifth more or less time than the mean of the four weeks before
 *   base      the share in Z1–Z2 ten points or more apart from its mean of the four weeks before
 * → [{ key, kind: 'good' | 'gap' | 'note', vars }] (at most MAX_NOTES). Never a judgement on health.
 */
export function weekNotes(data, monday, today, bounds) {
  const out = [];
  const end = shiftDay(monday, 7);
  const before = shiftDay(monday, -7 * USUAL_WEEKS);
  // plan
  const sessions = (data.sessions ?? []).filter((s) => inWeek(s.day, monday) && s.day <= today);
  if (sessions.length) {
    const acts = data.acts ?? [];
    const open = sessions.filter((s) => s.day < today && !doneBy(s, acts)).sort((a, b) => a.day.localeCompare(b.day));
    const done = sessions.length - sessions.filter((s) => !doneBy(s, acts)).length;
    if (!open.length && done === sessions.length) out.push({ key: 'plan-all', kind: 'good', vars: { n: sessions.length } });
    else if (open.length) out.push({ key: 'plan-open', kind: 'gap', vars: { n: done, m: sessions.length, day: open[0].day } });
  }
  // sleep
  const sleep = dayValues(data, SLEEP_Q);
  const wk = [...sleep].filter(([d]) => inWeek(d, monday)).map(([, v]) => v);
  const prev = [...sleep].filter(([d]) => d >= before && d < monday).map(([, v]) => v);
  if (wk.length >= 3 && prev.length >= 5) {
    const a = round1(mean(wk));
    const b = round1(mean(prev));
    if (a <= b - 1) out.push({ key: 'sleep-low', kind: 'gap', vars: { a, b } });
    else if (a >= b + 1) out.push({ key: 'sleep-high', kind: 'good', vars: { a, b } });
  }
  // streak
  const streak = trainStreak(data, monday, today);
  if (streak >= 5) out.push({ key: 'streak', kind: 'note', vars: { n: streak } });
  // hours against the usual
  const secs = weekSums(data, monday).secs;
  const usual = mean(Array.from({ length: USUAL_WEEKS }, (_, i) => weekSums(data, shiftDay(monday, -7 * (i + 1))).secs));
  if (usual > 0 && secs > 0 && Math.abs(secs - usual) >= usual * 0.2) out.push({ key: secs > usual ? 'hours-more' : 'hours-less', kind: secs > usual ? 'good' : 'note', vars: { a: secs, b: Math.round(usual) } });
  else if (usual > 0 && !secs && monday < mondayOf(today)) out.push({ key: 'hours-none', kind: 'note', vars: { b: Math.round(usual) } });
  // Z1–Z2
  const share = baseShare(data.acts ?? [], monday, end, bounds);
  const shares = Array.from({ length: USUAL_WEEKS }, (_, i) => shiftDay(monday, -7 * (i + 1))).map((m) => baseShare(data.acts ?? [], m, shiftDay(m, 7), bounds)).filter((x) => x != null);
  if (share != null && shares.length >= 2) {
    const m = Math.round(mean(shares));
    if (Math.abs(share - m) >= 10) out.push({ key: share > m ? 'base-more' : 'base-less', kind: 'note', vars: { n: share, m } });
  }
  return out.slice(0, MAX_NOTES);
}

/* ---------------------------------------------------------------- W4 the highlights */

const maxBy = (list, f) => list.reduce((b, a) => (f(a) > 0 && (!b || f(a) > f(b)) ? a : b), null);
const BEST_FIELDS = [
  ['km', (a) => Number(a.km) || 0],
  ['hm', (a) => Number(a.hm) || 0],
  ['time', (a) => Number(a.movingS) || 0],
  ['w20', (a) => (a.wDevice ? Number(a.w20) || 0 : 0)],
];

/**
 * W4: { longest, w20, hm, bests: [{ key: 'km' | 'hm' | 'time' | 'w20', act, value, was }] } of the week; null
 * without an activity. Longest = the longest moving time; a best value counts only when there were activities
 * before (the first week ever has no «new best»).
 */
export function weekHighs(acts = [], monday) {
  const list = acts.filter((a) => inWeek(a.day, monday));
  if (!list.length) return null;
  const earlier = acts.filter((a) => a.day && a.day < monday);
  const bests = [];
  if (earlier.length) {
    for (const [key, f] of BEST_FIELDS) {
      const top = maxBy(list, f);
      const was = Math.max(0, ...earlier.map(f));
      if (top && f(top) > was && was > 0) bests.push({ key, act: top, value: f(top), was });
    }
  }
  return { longest: maxBy(list, (a) => Number(a.movingS) || 0), w20: maxBy(list, (a) => (a.wDevice ? Number(a.w20) || 0 : 0)), hm: maxBy(list, (a) => Number(a.hm) || 0), bests };
}

/* ---------------------------------------------------------------- W5 next week */

/**
 * W5: one suggestion for the week after the shown one, from the load (power, else Relative Effort, else the
 * moving time) of the shown week and the three before it.
 *   calmer   the load rose three weeks in a row → «a calmer week»
 *   back     the shown week had less than half the usual → «your usual rhythm again»
 *   keep     otherwise → «keep your rhythm», about as many hours as the shown week
 * plan: the sessions already planned for the week after. → { key, hours, plan: { n, mins } } or null without any activity.
 */
export function weekAhead(acts = [], sessions = [], monday) {
  const ms = Array.from({ length: USUAL_WEEKS }, (_, i) => shiftDay(monday, (i - USUAL_WEEKS + 1) * 7));
  const loads = loadsOf(acts);
  const sum = (m, f) => acts.filter((a) => inWeek(a.day, m)).reduce((s, a) => s + f(a), 0);
  const byLoad = ms.map((m) => sum(m, (a) => loads.get(a.id) ?? 0));
  const bySecs = ms.map((m) => sum(m, (a) => Number(a.movingS) || 0));
  const series = byLoad.some((x) => x > 0) ? byLoad : bySecs;
  if (!series.some((x) => x > 0)) return null;
  const next = shiftDay(monday, 7);
  const planned = sessions.filter((s) => inWeek(s.day, next));
  const plan = { n: planned.length, mins: planned.reduce((s, x) => s + x.mins, 0) };
  const [, a, b, c] = series;
  const usual = mean(series.slice(0, -1));
  let key = 'keep';
  if (a > 0 && b > a && c > b) key = 'calmer';
  else if (usual > 0 && c < usual * 0.5) key = 'back';
  return { key, secs: bySecs.at(-1), usualSecs: Math.round(mean(bySecs.slice(0, -1)) ?? 0), plan, next, kw: isoWeek(next) };
}

/* ---------------------------------------------------------------- W6 the text for Claude */

/**
 * W6: the week as plain text, to copy for Claude. Only what the page shows, no names of places or people.
 * t, num and day (a day as words) come from the page, so this stays pure and the text is in the app's language.
 */
export function summaryText({ monday, five = [], strip = [], notes = [], highs = null, ahead = null }, { t = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m), num = String, day = (d) => d, noteText = (n) => n.key } = {}) {
  const lines = [t('My week from {from} to {to} (week {kw}):', { from: day(monday), to: day(shiftDay(monday, 6)), kw: isoWeek(monday) })];
  for (const f of five) {
    if (f.key === 'hours') lines.push(t('- Moving time {a} h ({d} against the week before)', { a: hmm(f.value), d: diffText(f.diff, { seconds: true }) }));
    if (f.key === 'km') lines.push(t('- {a} km ({d} km)', { a: num(f.value), d: diffText(f.diff, { fmt: num }) }));
    if (f.key === 'hm') lines.push(t('- {a} m climbed ({d} m)', { a: num(f.value), d: diffText(f.diff, { fmt: num }) }));
    if (f.key === 'n') lines.push(t('- {a} sessions ({d})', { a: f.value, d: diffText(f.diff) }));
    if (f.key === 'goals') lines.push(t('- {a} of {b} Aktiv goals reached', { a: f.value, b: f.of }));
  }
  const days = strip.filter((d) => !d.future);
  if (days.length) {
    lines.push(t('- Days with training: {n}, with recovery: {r}, with meditation: {m}', { n: days.filter((d) => d.kinds.includes('train')).length, r: days.filter((d) => d.kinds.includes('rest')).length, m: days.filter((d) => d.kinds.includes('mind')).length }));
    const s = days.map((d) => d.sleep).filter((x) => x != null);
    const m = days.map((d) => d.mood).filter((x) => x != null);
    if (s.length) lines.push(t('- Sleep (1–10): mean {n} on {d} days', { n: num(round1(mean(s))), d: s.length }));
    if (m.length) lines.push(t('- Mood (1–10): mean {n} on {d} days', { n: num(round1(mean(m))), d: m.length }));
  }
  for (const n of notes) lines.push(`- ${noteText(n)}`);
  if (highs?.longest) lines.push(t('- Longest activity: {a} h, {km} km', { a: hmm(highs.longest.movingS), km: num(highs.longest.km) }));
  if (highs?.w20) lines.push(t('- Best 20 minutes: {w} W', { w: highs.w20.w20 }));
  if (ahead) lines.push(t('- Planned for next week: {n} sessions', { n: ahead.plan.n }));
  lines.push('', t('How was my week? Please answer in three short sentences: what went well, what was missing, one idea for next week. No medical advice.'));
  return lines.join('\n');
}
