/**
 * «Weg zum Ziel» (Idee G, Noah 05.11.2026 «1b 2b 3a 4a 5a»): a big goal with a start day. The app counts back
 * from the start day and lays out steps (training, bike ready, tests, packing …). Everything is a suggestion:
 * every step can be renamed, moved, deleted, reordered and ticked by hand; own steps can be added.
 *
 * This file is the frame (K1): the store, the pure functions and the helpers every kind of step uses. The
 * page, the sheet «New way» and the kinds of steps come in later small PRs.
 *
 * Storage: no new table, no Dexie version. The settings record WEG_KEY (it travels in every backup and in the
 * sync like every settings record):
 *   { goals: [{ id, title, kind: 'race' | 'trip' | 'free', start: 'YYYY-MM-DD' | '', tripId?, at,
 *       steps: [{ id, type, title, offset: days before the start | null, due: 'YYYY-MM-DD' | '',
 *                 done, by: 'auto' | 'user' | '', note?, own? }] }],
 *     onToday: true }
 * `due` is the day the user chose; without it the day is start − offset. A goal without a start day («free»,
 * an open period) keeps its steps without days until a start is set.
 *
 * The kinds of steps (training, bike ready, …) live in `./types/<type>.js`, one file each, collected in
 * `./types/index.js`. A type is { type, label, icon, defaults(goal) → [{ title, offset, note? }],
 * auto(goal, step, ctx) → true | false | null, link(goal, step) → '#/…' }. `auto` may tick a step by itself
 * (true) but never takes a tick back; a step the user unticked (`by: 'user'`) is never ticked again by the app.
 * Pure functions, tested in tests/weg.test.js. Labels are English keys for t().
 */

export const WEG_KEY = 'weg';

export const KINDS = ['race', 'trip', 'free'];

const D = (day) => Date.parse(`${day}T12:00:00Z`);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
export const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const days = (a, b) => Math.round((D(b) - D(a)) / 864e5);
/** A calendar day ± n days (no clock involved). */
export const shift = (day, n) => iso(D(day) + n * 864e5);

/** The store made safe. */
export function wegOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {
    goals: Array.isArray(v.goals) ? v.goals.filter((g) => g?.id).map(goalOf) : [],
    onToday: v.onToday !== false,
  };
}

/** One goal made safe (an older or hand-edited record never breaks the page). */
export function goalOf(g) {
  return {
    ...g,
    title: String(g.title ?? '').trim(),
    kind: KINDS.includes(g.kind) ? g.kind : 'free',
    start: isDay(g.start) ? g.start : '',
    steps: Array.isArray(g.steps) ? g.steps.filter((s) => s?.id).map(stepOf) : [],
  };
}

export function stepOf(s) {
  return {
    ...s,
    type: typeof s.type === 'string' && s.type ? s.type : 'own',
    title: String(s.title ?? '').trim(),
    offset: Number.isFinite(s.offset) ? Math.round(s.offset) : null,
    due: isDay(s.due) ? s.due : '',
    done: !!s.done,
    by: s.by === 'auto' || s.by === 'user' ? s.by : '',
  };
}

/* ---------- goals ---------- */

export function newGoal({ title, kind = 'free', start = '', tripId = '' }, { id = `weg-${Date.now().toString(36)}`, now = new Date().toISOString() } = {}) {
  const g = { id, title: String(title ?? '').trim(), kind: KINDS.includes(kind) ? kind : 'free', start: isDay(start) ? start : '', at: now, steps: [] };
  return tripId ? { ...g, tripId } : g;
}

export const addGoal = (w, goal) => ({ ...w, goals: [...w.goals, goal] });
export const renameGoal = (w, id, title) => (String(title ?? '').trim() ? mapGoal(w, id, (g) => ({ ...g, title: String(title).trim() })) : w);
export const removeGoal = (w, id) => ({ ...w, goals: w.goals.filter((g) => g.id !== id) });
/** Goals moved with the arrows or by drag. */
export function moveGoal(w, from, to) {
  const goals = [...w.goals];
  if (from < 0 || from >= goals.length || to < 0 || to >= goals.length) return w;
  goals.splice(to, 0, goals.splice(from, 1)[0]);
  return { ...w, goals };
}
const mapGoal = (w, id, fn) => ({ ...w, goals: w.goals.map((g) => (g.id === id ? fn(g) : g)) });

/** A new start day (or none): steps with a day of their own keep it, the others move with the start. */
export const setStart = (w, id, start) => mapGoal(w, id, (g) => ({ ...g, start: isDay(start) ? start : '' }));

/* ---------- steps ---------- */

let seq = 0;
const stepId = () => `ws-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** Steps added; templates are { title, offset?, due?, type?, note? }. Returns the goal. */
export function addSteps(goal, templates, { ids = stepId } = {}) {
  const add = templates.filter((t) => String(t?.title ?? '').trim()).map((t, i) => stepOf({ ...t, id: t.id ?? ids(i), done: false, by: '' }));
  return { ...goal, steps: [...goal.steps, ...add] };
}

/** An own step (any day, any text) — always possible. */
export const addOwnStep = (goal, { title, due = '', offset = null }, opts) => addSteps(goal, [{ title, due, offset, type: 'own', own: true }], opts);

const mapStep = (goal, id, fn) => ({ ...goal, steps: goal.steps.map((s) => (s.id === id ? stepOf(fn(s)) : s)) });
export const renameStep = (goal, id, title) => (String(title ?? '').trim() ? mapStep(goal, id, (s) => ({ ...s, title: String(title).trim() })) : goal);
export const removeStep = (goal, id) => ({ ...goal, steps: goal.steps.filter((s) => s.id !== id) });
/** The user ticks or unticks. An untick by the user stops the app from ticking it again. */
export const setDone = (goal, id, done = true) => mapStep(goal, id, (s) => ({ ...s, done: !!done, by: 'user' }));
/** A day of the user's own; '' gives the step back to «start − offset». */
export const setDue = (goal, id, due) => mapStep(goal, id, (s) => ({ ...s, due: isDay(due) ? due : '' }));
/** Steps ordered with the arrows or by drag (the order only matters between steps of the same day). */
export function moveStep(goal, from, to) {
  const steps = [...goal.steps];
  if (from < 0 || from >= steps.length || to < 0 || to >= steps.length) return goal;
  steps.splice(to, 0, steps.splice(from, 1)[0]);
  return { ...goal, steps };
}

/** The day of a step: the one the user chose, else start − offset, else '' (no day yet). */
export function dueOf(goal, step) {
  if (step.due) return step.due;
  if (goal.start && step.offset != null) return shift(goal.start, -step.offset);
  return '';
}

/* ---------- timeline ---------- */

/** The groups of the timeline, by weeks before the start (English keys for t()). */
const phaseKey = (weeksBefore) => (weeksBefore >= 13 ? 'far' : weeksBefore >= 5 ? 'build' : weeksBefore >= 2 ? 'prepare' : weeksBefore >= 0 ? 'last' : 'after');
export const PHASE_NAMES = { far: 'Far ahead', build: 'Building up', prepare: 'Getting ready', last: 'Last two weeks', after: 'After the start', open: 'No day yet' };

/**
 * The steps in time order with their day and where they stand:
 * [{ step, due, state: 'done' | 'late' | 'open', weeksBefore, phase }]. Steps without a day come last.
 * Stable: steps of the same day keep the order the user gave them.
 */
export function timeline(goal, today) {
  const rows = goal.steps.map((step, i) => {
    const due = dueOf(goal, step);
    const weeksBefore = due && goal.start ? Math.floor(days(due, goal.start) / 7) : null;
    const state = step.done ? 'done' : due && due < today ? 'late' : 'open';
    return { step, due, state, weeksBefore, phase: weeksBefore == null ? 'open' : phaseKey(weeksBefore), i };
  });
  rows.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.i - b.i);
  return rows.map(({ i, ...r }) => r);
}

/** How far a goal is: { done, total, next: the next open step (row) or null, late }. */
export function progress(goal, today) {
  const rows = timeline(goal, today);
  const open = rows.filter((r) => r.state !== 'done');
  return { done: rows.length - open.length, total: rows.length, next: open[0] ?? null, late: open.filter((r) => r.state === 'late').length };
}

/** The same for one kind of step (the strip «3 of 5 sorted» above the timeline). */
export function typeProgress(goal, type, today) {
  const rows = timeline(goal, today).filter((r) => r.step.type === type);
  const open = rows.filter((r) => r.state !== 'done');
  return { done: rows.length - open.length, total: rows.length, next: open[0] ?? null };
}

/** Whole weeks and days from today to the start; null without a start day, negative once it is past. */
export function untilStart(goal, today) {
  if (!goal.start) return null;
  const d = days(today, goal.start);
  return { days: d, weeks: Math.floor(d / 7) };
}

/** «Is there enough time?» (idea 2b): the plan needs planWeeks weeks, the start is untilStart away. */
export function timeBuffer(goal, today, planWeeks) {
  const u = untilStart(goal, today);
  if (!u || !(planWeeks > 0)) return null;
  const buffer = u.weeks - planWeeks;
  return { weeksLeft: u.weeks, planWeeks, buffer, state: buffer >= 2 ? 'ok' : buffer >= 0 ? 'tight' : 'short' };
}

/* ---------- ticking by itself ---------- */

/**
 * Lets the kinds of steps tick what the app already knows. `types` is the registry (a list of types), `ctx` what
 * the types read (trips, plans, rides … handed in by the page). Only open steps never touched by the user get
 * ticked, never the other way round. Returns the goal (the same object when nothing changed).
 */
export function applyAuto(goal, types, ctx = {}) {
  let changed = false;
  const steps = goal.steps.map((s) => {
    if (s.done || s.by === 'user') return s;
    const t = types.find((x) => x.type === s.type);
    if (!t?.auto) return s;
    let r = null;
    try { r = t.auto(goal, s, ctx); } catch { r = null; }
    if (r !== true) return s;
    changed = true;
    return { ...s, done: true, by: 'auto' };
  });
  return changed ? { ...goal, steps } : goal;
}

/** The step to show as one line on Heute: the next open step with a day, of the goal that starts first. */
export function todayStep(w, today) {
  if (!w.onToday) return null;
  const c = w.goals
    .filter((g) => g.start && g.start >= today)
    .map((g) => ({ goal: g, p: progress(g, today) }))
    .filter((x) => x.p.next?.due)
    .sort((a, b) => a.goal.start.localeCompare(b.goal.start))[0];
  return c ? { goal: c.goal, row: c.p.next } : null;
}

/* ---------- a way as a template (idea 5c, later) ---------- */

/** The steps of a goal as templates for a new one: offsets kept, ticks and own days dropped. */
export function templateOf(goal) {
  return goal.steps.map((s) => ({ type: s.type, key: s.key, title: s.title, offset: s.offset ?? (goal.start && s.due ? days(s.due, goal.start) : null), note: s.note, own: s.own }));
}
