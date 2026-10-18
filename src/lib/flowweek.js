/**
 * v0.130.0 «Woche» (mockup AK1, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei"): Aktiv's
 * week, Monday to Sunday. Per day what was done, the fixed dates, what was planned and suggestions by
 * the open goals and the home weather. Everything is a suggestion: a tap plans it, «no thanks» hides it.
 *
 * Settings (db.settings, they travel with the backup):
 *   flow.fixed     [{ id, actId, wd 1 (Monday) … 7, time 'HH:MM', minutes }]  the fixed dates
 *   flow.weekPlan  [{ day, actId }]                                          tapped suggestions
 *   flow.weekNo    ['YYYY-MM-DD|actId']                                       hidden suggestions
 * Pure functions; the page is src/pages/flow/Week.svelte.
 */
import { addDays, daysBetween, activeGoals } from './flow.js';
import { wetPct } from './rainlimit.svelte.js';

export const FIXED_KEY = 'flow.fixed';
export const PLAN_KEY = 'flow.weekPlan';
export const NO_KEY = 'flow.weekNo';
/** Plans and hidden suggestions older than this many days are dropped when saving. */
export const KEEP_DAYS = 14;
/** At most this many suggestions per day, so the week stays readable. */
export const MAX_SUGG_DAY = 2;

/** Activities that like dry weather, and those done indoors (by their symbol, see ActIcon). */
export const OUTDOOR = ['bike', 'run', 'walk', 'climb', 'ski', 'swim'];
export const INDOOR = ['gym', 'spin', 'sauna', 'yoga', 'hockey', 'stretch', 'pushup', 'lotus'];

/** 1 (Monday) … 7 (Sunday). */
export const weekdayOf = (day) => ((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
/** The 7 days Monday to Sunday of the week of the day. */
export const weekOf = (day) => {
  const mon = addDays(day, 1 - weekdayOf(day));
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
};

/** A fixed date made whole; null when it has no activity. */
export function normFixed(f = {}) {
  if (!f?.actId) return null;
  const wd = Math.min(7, Math.max(1, Math.round(Number(f.wd) || 1)));
  const time = /^\d{2}:\d{2}$/.test(f.time ?? '') ? f.time : '18:00';
  return {
    id: f.id || `fx-${f.actId}-${wd}-${time.replace(':', '')}`,
    actId: f.actId,
    wd,
    time,
    minutes: Math.max(5, Math.round(Number(f.minutes) || 60)),
  };
}
export const fixedList = (v) =>
  Array.isArray(v)
    ? v
        .map(normFixed)
        .filter(Boolean)
        .sort((a, b) => a.wd - b.wd || a.time.localeCompare(b.time))
    : [];

/** The list without entries older than KEEP_DAYS (plans: { day }, hidden: 'day|actId'). */
export const prunePlans = (list = [], today) => list.filter((p) => p?.day && daysBetween(p.day, today) <= KEEP_DAYS);
export const pruneNo = (list = [], today) => list.filter((k) => typeof k === 'string' && daysBetween(k.slice(0, 10), today) <= KEEP_DAYS);

/** A tapped suggestion: planned (or planned no more when it was). */
export function togglePlan(list = [], day, actId, today) {
  const has = list.some((p) => p.day === day && p.actId === actId);
  return prunePlans(has ? list.filter((p) => !(p.day === day && p.actId === actId)) : [...list, { day, actId }], today);
}
export const hideSugg = (list = [], day, actId, today) => pruneNo([...new Set([...list, `${day}|${actId}`])], today);

/** The weather of a day from the home forecast: { max, rain: 'none'|'showers'|'rain', wet, dry } or null. */
export function wxOf(forecast, day) {
  const d = forecast?.days?.find((x) => x.date === day);
  if (!d) return null;
  const wet = d.rain === 'rain' || wetPct(Number(d.rainPct) || 0); // v0.144.0 RE: the one rain limit (was 60 %)
  return { max: d.max, rain: d.rain, wet, dry: !wet && d.rain !== 'showers' };
}

/** How much a day suits an activity (higher is better). */
function score(act, wx, load, idx) {
  let s = -load - idx * 0.1;
  if (wx && OUTDOOR.includes(act.icon)) s += (wx.dry ? 2 : wx.wet ? -3 : 0) + (Number(wx.max) || 0) / 10;
  if (wx && INDOOR.includes(act.icon) && wx.wet) s += 1;
  return s;
}
function why(act, wx) {
  if (act.ring === 'rest') return 'recovery';
  if (wx && OUTDOOR.includes(act.icon) && wx.dry) return 'dry';
  if (wx && INDOOR.includes(act.icon) && wx.wet) return 'rain';
  return 'goal';
}

/**
 * The week: { days: [{ day, past, today, wx, items }], tip }.
 * items: { kind: 'done', actId, n, min } | { kind: 'fix', actId, time, id } | { kind: 'plan', actId }
 *      | { kind: 'sug', actId, why: 'daily'|'dry'|'rain'|'recovery'|'goal' }
 * tip: the outdoor suggestion on the day with the best weather of the rest of the week ({ day, actId })
 * when there are at least 3 days of forecast left, else null.
 * states: flowStates (only the live, not resting ones get suggestions).
 */
export function weekPlan({ acts = [], states = [], log = [], today, fixed = [], plans = [], no = [], forecast = null }) {
  const days = weekOf(today);
  const actOf = new Map(acts.map((a) => [a.id, a]));
  const hidden = new Set(no);
  const out = days.map((day) => ({
    day,
    past: day < today,
    today: day === today,
    wx: wxOf(forecast, day),
    items: [],
  }));
  const doneOn = new Set();
  for (const d of out) {
    if (d.day > today) continue;
    const by = new Map();
    for (const e of log) {
      if (e.day !== d.day || !actOf.has(e.actId)) continue;
      const x = by.get(e.actId) ?? {
        kind: 'done',
        actId: e.actId,
        n: 0,
        min: 0,
      };
      x.n += Number(e.n) || 1;
      x.min += Number(e.min) || 0;
      by.set(e.actId, x);
      doneOn.add(`${d.day}|${e.actId}`);
    }
    d.items.push(...by.values());
  }
  const usable = (id, day) => {
    const a = actOf.get(id);
    return a && !a.paused && activeGoals(a, day).length > 0;
  };
  for (const d of out) {
    if (d.past) continue;
    for (const f of fixed) if (f.wd === weekdayOf(d.day) && usable(f.actId, d.day) && !doneOn.has(`${d.day}|${f.actId}`)) d.items.push({ kind: 'fix', actId: f.actId, time: f.time, id: f.id });
    for (const p of plans) if (p.day === d.day && usable(p.actId, d.day) && !doneOn.has(`${d.day}|${p.actId}`) && !d.items.some((x) => x.actId === p.actId)) d.items.push({ kind: 'plan', actId: p.actId });
  }
  const ahead = out.filter((d) => !d.past);
  const has = (d, id) => d.items.some((x) => x.actId === id);
  const room = (d) => d.items.filter((x) => x.kind === 'sug').length < MAX_SUGG_DAY;
  for (const s of states) {
    if (s.resting || !s.goals.length) continue;
    const a = s.act;
    if (s.daily) {
      const d = ahead[0];
      if (d && s.open && room(d) && !has(d, a.id) && !hidden.has(`${d.day}|${a.id}`)) d.items.push({ kind: 'sug', actId: a.id, why: 'daily' });
      continue;
    }
    let need = s.goals.reduce((n, r) => n + Math.max(0, r.goal.count - r.done), 0);
    need -= ahead.filter((d) => d.items.some((x) => x.actId === a.id && x.kind !== 'done')).length;
    if (need <= 0) continue;
    const pick = ahead
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => room(d) && !has(d, a.id) && !hidden.has(`${d.day}|${a.id}`))
      .sort((x, y) => score(a, y.d.wx, y.d.items.length, y.i) - score(a, x.d.wx, x.d.items.length, x.i))
      .slice(0, need);
    for (const { d } of pick) if (room(d)) d.items.push({ kind: 'sug', actId: a.id, why: why(a, d.wx) });
  }
  const order = { done: 0, fix: 1, plan: 2, sug: 3 };
  for (const d of out) d.items.sort((x, y) => order[x.kind] - order[y.kind] || (x.time ?? '').localeCompare(y.time ?? ''));
  let tip = null;
  const known = ahead.filter((d) => d.wx);
  if (known.length >= 3) {
    const best = [...known].sort((x, y) => y.wx.dry - x.wx.dry || (Number(y.wx.max) || 0) - (Number(x.wx.max) || 0))[0];
    const sug = best.wx.dry ? best.items.find((x) => x.kind === 'sug' && OUTDOOR.includes(actOf.get(x.actId)?.icon)) : null;
    if (sug) tip = { day: best.day, actId: sug.actId };
  }
  return { days: out, tip };
}

/** The goals of the week: per live activity its stand (n of m, daily ones as days of 7); a daily one is met when today is done. */
export function weekGoals(states = []) {
  return states
    .filter((s) => !s.resting && s.goals.length)
    .map((s) => ({
      act: s.act,
      n: Math.min(s.stand.n, s.stand.of),
      of: s.stand.of,
      daily: s.daily,
      met: s.daily ? !s.open : s.met,
    }));
}

/** The next date (YYYY-MM-DD, today included) with the weekday wd. */
export const nextOn = (today, wd) => addDays(today, (wd - weekdayOf(today) + 7) % 7);
const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
/** The fixed dates as weekly calendar events and the planned ones as all-day events (for icsCalendar). */
export function weekEvents({ fixed = [], plans = [], today, name = (id) => id }) {
  return [
    ...fixed.map((f) => ({
      uid: `fixed-${f.id}`,
      title: name(f.actId),
      day: nextOn(today, f.wd),
      time: f.time,
      minutes: f.minutes,
      rrule: `FREQ=WEEKLY;BYDAY=${BYDAY[f.wd - 1]}`,
    })),
    ...plans
      .filter((p) => p.day >= today)
      .map((p) => ({
        uid: `plan-${p.day}-${p.actId}`,
        title: name(p.actId),
        day: p.day,
      })),
  ];
}
