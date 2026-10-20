/**
 * «Trainingspläne» (Noah 19.10.2026 «1a 2 kann eingestellt werden 3 a und b und gefühlte Anstrengung 4 1-4»):
 * four sample plans for ultracycling, written in our own words (the common build-up: three weeks a little
 * more, one week easier, the last two weeks easier still). «Try it» writes a plan's sessions into the week
 * plan of Aktiv › Training (training.plan); each session keeps the plan's id (src), so the plan can be taken
 * out again. The start is set: backwards from the race day, or from a chosen Monday. Own plans are copies
 * that can be renamed and deleted; the four samples can be hidden and shown again.
 * Everything is a suggestion. Days are calendar days (YYYY-MM-DD); nothing here reads the clock.
 */
import { shiftDay, mondayOf, cleanSession, zoneRange, zoneFeel, feelOf } from '../training.js';
import { powerRange } from './act/power.js';

export const TPL_KEY = 'training.tpl'; // the plan in use: { id, mode: 'race'|'start', date, hours, first }
export const OWN_KEY = 'training.tplOwn'; // own plans: [{ id, name, base, weeks, lo, hi, order }]
export const HIDE_KEY = 'training.tplHidden'; // ids of hidden sample plans
export const SRC = 'tpl'; // src of a session written by a plan

/**
 * A day of a plan: dow 0 = Monday … 6 = Sunday, share of the week's minutes, zone 1–5, the session's
 * name (English source for t()), long (the long ride of the week), b2b (the second long day: before the
 * last six weeks it is a shorter endurance ride).
 */
const D = (dow, share, zone, name, more = {}) => ({ dow, share, zone, name, ...more });

/** The four sample plans; names and texts are English sources for t(). */
export const PLAN_TEMPLATES = [
  {
    id: 'first',
    name: 'First long distance',
    who: 'For your first ride of 200 to 300 km, in one or two days.',
    weeks: 8,
    lo: 5,
    hi: 7,
    days: [D(1, 0.15, 2, 'Easy endurance ride'), D(3, 0.15, 3, 'Tempo: 2 × 15 min'), D(5, 0.5, 2, 'Long ride, calm', { long: true }), D(6, 0.2, 1, 'Easy spin')],
  },
  {
    id: 'multi',
    name: 'Multi-day race',
    who: 'For a race of 500 to 1000 km over several days.',
    weeks: 12,
    lo: 7,
    hi: 10,
    days: [D(1, 0.12, 2, 'Easy endurance ride'), D(2, 0.12, 4, 'Threshold: 3 × 10 min'), D(3, 0.12, 2, 'Endurance ride'), D(5, 0.36, 2, 'Long ride, calm', { long: true }), D(6, 0.28, 2, 'Second long day', { b2b: true })],
  },
  {
    id: 'ultra',
    name: 'Ultra long',
    who: 'For a race of more than 1000 km.',
    weeks: 16,
    lo: 8,
    hi: 12,
    days: [D(1, 0.1, 2, 'Easy endurance ride'), D(2, 0.12, 4, 'Threshold: 2 × 20 min'), D(3, 0.12, 3, 'Tempo: 3 × 15 min'), D(4, 0.06, 1, 'Easy spin'), D(5, 0.32, 2, 'Long ride, calm', { long: true }), D(6, 0.28, 2, 'Second long day', { b2b: true })],
  },
  {
    id: 'short',
    name: 'Little time',
    who: 'For about 5 hours a week: short and harder during the week, one long ride.',
    weeks: 12,
    lo: 4,
    hi: 6,
    days: [D(1, 0.15, 4, 'Short and hard: 4 × 8 min'), D(3, 0.15, 3, 'Tempo: 2 × 12 min'), D(5, 0.55, 2, 'Long ride, calm', { long: true }), D(6, 0.15, 1, 'Easy spin')],
  },
];

export const WEEKS_MIN = 4;
export const WEEKS_MAX = 24;
const clampN = (v, lo, hi, d) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : d);

/** One own plan, cleaned; null when its base is unknown or it has no name. */
export function cleanOwn(p) {
  const base = PLAN_TEMPLATES.find((x) => x.id === p?.base);
  const name = String(p?.name ?? '').trim().slice(0, 60);
  if (!base || !name) return null;
  const lo = clampN(p.lo, 1, 30, base.lo);
  const hi = Math.max(lo, clampN(p.hi, 1, 30, base.hi));
  return { id: String(p.id || `own-${Math.random().toString(36).slice(2, 9)}`), name, base: base.id, weeks: clampN(p.weeks, WEEKS_MIN, WEEKS_MAX, base.weeks), lo, hi, order: Number(p.order) || 0 };
}
export const ownOf = (v) => (Array.isArray(v) ? v.map(cleanOwn).filter(Boolean) : []);

/**
 * Every plan to show: the samples not hidden, then the own ones (by order). An own plan has its days from
 * its base and own: true; its name is the user's text (never through t()).
 */
export function allPlans(own = [], hidden = []) {
  const samples = PLAN_TEMPLATES.filter((p) => !hidden.includes(p.id)).map((p) => ({ ...p, own: false }));
  const mine = [...own].sort((a, b) => a.order - b.order).map((o) => {
    const b = PLAN_TEMPLATES.find((x) => x.id === o.base);
    return { ...b, ...o, who: b.who, days: b.days, own: true };
  });
  return [...samples, ...mine];
}
export const planById = (id, own = [], hidden = []) => allPlans(own, []).find((p) => p.id === id) ?? null;

/** The hours a plan uses by default: the middle of its span, in half hours. */
export const midHours = (p) => Math.round(((p.lo + p.hi) / 2) * 2) / 2;

/**
 * The share of the chosen hours in week i (0-based) of n: rising from 80 % to 110 %, every fourth week
 * easier (65 % of it), the second-to-last week 70 %, the last (race) week 40 %. → { f, kind }
 */
export function weekFactor(i, n) {
  if (n >= 3 && i === n - 1) return { f: 0.4, kind: 'race' };
  if (n >= 3 && i === n - 2) return { f: 0.7, kind: 'taper' };
  const build = Math.max(1, n - 3);
  const f = 0.8 + 0.3 * Math.min(1, i / build);
  return i % 4 === 3 ? { f: Math.round(f * 0.65 * 100) / 100, kind: 'easy' } : { f: Math.round(f * 100) / 100, kind: 'build' };
}

/** Minutes rounded to 15, at least 30, at most 10 hours. */
const mins15 = (m) => Math.min(600, Math.max(30, Math.round(m / 15) * 15));

/**
 * The first Monday of a plan. mode 'race': the race day is in the last week; mode 'start': the week of
 * the given day. Without a valid day: null.
 */
export function firstMonday(plan, mode, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) return null;
  return mode === 'race' ? shiftDay(mondayOf(date), -7 * (plan.weeks - 1)) : mondayOf(date);
}

/**
 * The weeks of a plan from its first Monday with the chosen hours per week. In race mode no session lies
 * on or after the race day. → [{ i, monday, kind, mins, sessions: [{ day, kind, name, mins, zone, long }] }]
 * Session names are English sources (t() when written into the week plan).
 */
export function buildPlan(plan, { first, hours, race = null }) {
  if (!plan || !first) return [];
  const h = Math.min(30, Math.max(1, Number(hours) || midHours(plan)));
  const out = [];
  for (let i = 0; i < plan.weeks; i++) {
    const monday = shiftDay(first, 7 * i);
    const { f, kind } = weekFactor(i, plan.weeks);
    const week = h * 60 * f;
    const b2bOn = i >= plan.weeks - 6 && kind !== 'taper' && kind !== 'race';
    const sessions = [];
    for (const d of plan.days) {
      const day = shiftDay(monday, d.dow);
      if (race && day >= race) continue;
      const second = d.b2b && !b2bOn;
      sessions.push({ day, kind: 'bike', name: second ? 'Endurance ride' : d.name, mins: mins15(week * d.share * (second ? 0.6 : 1)), zone: d.zone, long: !!d.long || (d.b2b && b2bOn) });
    }
    out.push({ i, monday, kind, mins: sessions.reduce((s, x) => s + x.mins, 0), sessions });
  }
  return out;
}

/** The longest session of a week in minutes (for the overview). */
export const longestOf = (week) => Math.max(0, ...week.sessions.map((s) => s.mins));

/**
 * The week plan with a plan written in: sessions of any plan from today on are taken out first, then the
 * plan's sessions from today on are added (names through tr, the translate function). Sessions the user
 * planned by hand stay. → sessions
 */
export function applyPlan(sessions, weeks, planId, today, tr = (x) => x) {
  const keep = sessions.filter((s) => !(String(s.src ?? '').startsWith(`${SRC}:`) && s.day >= today));
  const add = weeks.flatMap((w) => w.sessions).filter((s) => s.day >= today).map((s) => cleanSession({ ...s, id: '', name: tr(s.name), src: `${SRC}:${planId}` }));
  return [...keep, ...add.filter(Boolean)];
}

/** The week plan without a plan's sessions from today on (the past stays as it was). */
export const removePlan = (sessions, today) => sessions.filter((s) => !(String(s.src ?? '').startsWith(`${SRC}:`) && s.day >= today));

/** How many weeks of a plan lie before this week (they fall away when the race is close). */
export const weeksGone = (first, today) => (first ? Math.max(0, Math.round((Date.parse(`${mondayOf(today)}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / (7 * 864e5))) : 0);

/**
 * How hard a zone is, in the three ways (Noah «a und b und gefühlte Anstrengung»): heart rate from the
 * zones, watts from the FTP (null without one), felt effort 1–10. → { hr: {from,to}, w: {from,to}|null, feel: [a,b] }
 */
export function zoneWays(zone, bounds, ftp) {
  if (!(zone >= 1 && zone <= 5)) return null;
  return { hr: bounds ? zoneRange(zone - 1, bounds) : null, w: ftp > 0 ? powerRange(zone - 1, ftp) : null, feel: zoneFeel(zone) };
}

/** «Rückwärts» suggestion for a missed session of this week (thread «Trainingspläne» 5, default a). */
const WEEK_DAYS = 7;
/**
 * For each missed session of this week (from the states of inhalt-woche.js sessionStates): a free day of
 * this week from today on to move it to, or null (then «leave it out» is the suggestion). Long rides
 * first, each free day once. → [{ s, to }]
 */
export function moveSuggestions(states, sessions, today) {
  const monday = mondayOf(today);
  const end = shiftDay(monday, WEEK_DAYS);
  const busy = new Set(sessions.map((s) => s.day));
  const free = [];
  for (let d = today; d < end; d = shiftDay(d, 1)) if (!busy.has(d)) free.push(d);
  const missed = states.filter((r) => r.state === 'missed' && r.s.day >= monday).sort((a, b) => b.s.mins - a.s.mins);
  return missed.map((r) => ({ s: r.s, to: free.shift() ?? null }));
}

/**
 * The ride to ask «How hard was it?» about: the newest bike activity of the last 3 days without an own
 * answer, without Strava's and not skipped. Null when there is none.
 */
export function feelToAsk(acts, today) {
  const from = shiftDay(today, -3);
  return (
    [...acts]
      .filter((a) => a.kind === 'bike' && a.day >= from && a.day <= today && feelOf(a) == null && !a.feelSkip)
      .sort((a, b) => `${b.day} ${b.time ?? ''}`.localeCompare(`${a.day} ${a.time ?? ''}`))[0] ?? null
  );
}

/*
 * Coupled to a race (Noah 19.10.2026 «1a», idea 1): the races are trips with a start day ahead that Paket U
 * «Rennen» keeps in the settings record 'races' (read only here), or trips marked as race / organised ride
 * (trip.event). Choosing one sets the race day; when the trip's start day moves, the plan says so.
 */
export const RACES_KEY = 'races';
const racesIn = (v) => (v && typeof v === 'object' && v.races && typeof v.races === 'object' ? v.races : {});
/** The races to choose from, soonest first. → [{ id, title, day }] */
export function raceChoices(trips = [], racesValue = null, today = '') {
  const races = racesIn(racesValue);
  return trips
    .filter((t) => t && /^\d{4}-\d{2}-\d{2}$/.test(String(t.startDate ?? '')) && t.startDate > today && (races[t.id] || t.event || t.sets?.race))
    .map((t) => ({ id: t.id, title: String(t.title ?? '').trim(), day: t.startDate }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
/** The plan in use against its race: the new day when the race moved, else null. */
export function raceMoved(active, trips = []) {
  if (!active?.tripId || active.mode !== 'race') return null;
  const t = trips.find((x) => x.id === active.tripId);
  return t?.startDate && t.startDate !== active.date ? t.startDate : null;
}
