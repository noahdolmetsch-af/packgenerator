/**
 * Paket N «Pläne und Träume» (Noah 19.10.2026 «4b», «5 a und nutzer kann b ausschalten und ausblenden»):
 * the page Ich › Mein Kompass (#/me/compass), apart from the notes.
 *
 * - #337 Neue Ablagen: boxes for resolutions, dreams, things to remember and ideas. They are groups like
 *   every other («Gruppen überall»): add your own, rename, delete (entries go to «Ohne Ablage» or another box).
 * - #338 Ideen sammeln und ordnen: every box is a list you order with arrows and drag; an entry can be
 *   ticked done or become a goal.
 * - #1047 «Hilf mir planen»: a goal with a day gets steps. You type them and the app spreads the dates up
 *   to the goal's day (5a); the AI helper can suggest steps (5b), which you switch off and hide in the
 *   page's settings. Once a week the question «Wie läuft's?» (on the page and in the Wochenrückblick).
 *
 * Storage: no new table. The settings record COMPASS_KEY (in every backup):
 *   { boxes: [{ key, name, raw? }], entries: [{ id, box, text, at, done? }],
 *     goals: [{ id, title, due, at, done?, steps: [{ id, text, date, done }], checks: [{ week, how, at }] }],
 *     ai: { off?: true, hidden?: true } }
 * Pure functions, tested in tests/compass.test.js. Labels are English keys for t().
 */

export const COMPASS_KEY = 'compass';

/** The Standard boxes (English keys for t()). */
export const STD_BOXES = [
  { key: 'resolutions', name: 'Resolutions' },
  { key: 'dreams', name: 'Dreams|compass' },
  { key: 'remember', name: 'To remember' },
  { key: 'ideas', name: 'Ideas|compass' },
];

/** The three answers of «Wie läuft's?» (English keys for t()). */
export const HOW = [
  { key: 'good', name: 'Going well' },
  { key: 'ok', name: 'So-so' },
  { key: 'stuck', name: 'Stuck' },
];

/** The store made safe. */
export function compassOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {
    boxes: Array.isArray(v.boxes) && v.boxes.length ? v.boxes.filter((b) => b?.key) : STD_BOXES.map((b) => ({ ...b })),
    entries: Array.isArray(v.entries) ? v.entries.filter((e) => e?.id) : [],
    goals: Array.isArray(v.goals) ? v.goals.filter((g) => g?.id).map((g) => ({ steps: [], checks: [], ...g })) : [],
    ai: { off: !!v.ai?.off, hidden: !!v.ai?.hidden },
  };
}

/** A box as shown: a typed name as it is (never through t()), a Standard name translated; '' is «No box». */
export const boxName = (boxes, key, tr) => {
  const b = boxes.find((x) => x.key === key);
  return !b ? tr('No box') : b.raw ? b.name : tr(b.name);
};

/* ---------- boxes (groups) ---------- */

export function addBox(c, name, id = `box-${Date.now().toString(36)}`) {
  const n = String(name ?? '').trim();
  return n ? { ...c, boxes: [...c.boxes, { key: id, name: n, raw: true }] } : c;
}
/** Renamed as typed; empty brings a Standard box back to its own name. */
export function renameBox(c, key, name) {
  const n = String(name ?? '').trim();
  const std = STD_BOXES.find((b) => b.key === key);
  return { ...c, boxes: c.boxes.map((b) => (b.key !== key ? b : n ? { key, name: n, raw: true } : std ? { ...std } : b)) };
}
/** Deleted: its entries go to box `to`, or keep their mark and show under «No box». Never deletes entries. */
export function deleteBox(c, key, to = null) {
  return { ...c, boxes: c.boxes.filter((b) => b.key !== key), entries: to ? c.entries.map((e) => (e.box === key ? { ...e, box: to } : e)) : c.entries };
}
/** The entries of a box in their order; key '' gives the ones whose box is gone. */
export function entriesOf(c, key) {
  const have = new Set(c.boxes.map((b) => b.key));
  return c.entries.filter((e) => (key === '' ? !have.has(e.box) : e.box === key));
}

/* ---------- entries ---------- */

export function addEntry(c, box, text, { id = `cp-${Date.now().toString(36)}`, now = new Date().toISOString() } = {}) {
  const tx = String(text ?? '').trim();
  return tx ? { ...c, entries: [{ id, box, text: tx, at: now }, ...c.entries] } : c;
}
export const editEntry = (c, id, patch) => ({ ...c, entries: c.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
export const removeEntry = (c, id) => ({ ...c, entries: c.entries.filter((e) => e.id !== id) });

/** Move an entry within its box from place `from` to `to` (places as shown in entriesOf). */
export function moveEntry(c, box, from, to) {
  const rows = entriesOf(c, box);
  if (from === to || from < 0 || from >= rows.length) return c;
  const next = [...rows];
  const [e] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, e);
  const ids = new Set(rows.map((r) => r.id));
  const rest = c.entries.filter((x) => !ids.has(x.id));
  return { ...c, entries: [...next, ...rest] };
}

/* ---------- goals and steps (#1047) ---------- */

const D = (day) => Date.parse(`${day}T12:00:00Z`);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** The Monday of a day's week (calendar days). */
export function mondayOf(day) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * n dates spread evenly after `from` up to `due` (the last step on the due day). Without a due day or
 * when it is not after from: one step a week from next week on.
 */
export function spreadDates(n, from, due) {
  if (n <= 0) return [];
  if (!isDay(due) || due <= from) return Array.from({ length: n }, (_, i) => iso(D(from) + (i + 1) * 7 * 864e5));
  const span = Math.round((D(due) - D(from)) / 864e5);
  return Array.from({ length: n }, (_, i) => iso(D(from) + Math.max(1, Math.round(((i + 1) * span) / n)) * 864e5));
}

export function newGoal({ title, due = '' }, { id = `goal-${Date.now().toString(36)}`, now = new Date().toISOString() } = {}) {
  return { id, title: String(title ?? '').trim(), due: isDay(due) ? due : '', at: now, steps: [], checks: [] };
}

/**
 * Steps typed one per line (5a) added to a goal; the open steps without a date get their dates spread
 * from today to the goal's day. Steps you dated yourself keep their date.
 */
export function addSteps(goal, lines, today, { ids = (i) => `st-${Date.now().toString(36)}-${i}` } = {}) {
  const texts = String(lines ?? '').split('\n').map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
  const steps = [...goal.steps, ...texts.map((text, i) => ({ id: ids(i), text, date: '', done: false }))];
  return { ...goal, steps: spreadOpen(steps, today, goal.due) };
}

/** Dates for the open steps without one, spread after the last dated open step (or today) up to the goal's day. */
export function spreadOpen(steps, today, due) {
  const open = steps.filter((s) => !s.done && !s.date);
  if (!open.length) return steps;
  const last = steps.filter((s) => !s.done && s.date && s.date >= today).map((s) => s.date).sort().pop() ?? today;
  const dates = spreadDates(open.length, last, due);
  let i = 0;
  return steps.map((s) => (!s.done && !s.date ? { ...s, date: dates[i++] } : s));
}

/** Steps suggested by the AI helper (5b) taken over: the checked ones are added with their dates. */
export function takeSuggested(goal, rows, today, { ids = (i) => `st-${Date.now().toString(36)}-ai${i}` } = {}) {
  const add = rows.filter((r) => r.take !== false && r.text?.trim()).map((r, i) => ({ id: ids(i), text: r.text.trim(), date: isDay(r.date) && r.date >= today ? r.date : '', done: false, ai: true }));
  return { ...goal, steps: spreadOpen([...goal.steps, ...add], today, goal.due) };
}

/** How far a goal is: { done, total, next: the next open step or null, late: open steps before today }. */
export function goalProgress(goal, today) {
  const open = goal.steps.filter((s) => !s.done).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  return { done: goal.steps.length - open.length, total: goal.steps.length, next: open[0] ?? null, late: open.filter((s) => s.date && s.date < today).length };
}

/** Does a goal want this week's «Wie läuft's?»: open, with steps, not answered this week. */
export const checkDue = (goal, today) => !goal.done && goal.steps.length > 0 && !goal.checks.some((c) => c.week === mondayOf(today));

/** This week's answer to «Wie läuft's?» (one per week; a second answer replaces the first). */
export function answerCheck(goal, how, today, now = new Date().toISOString()) {
  const week = mondayOf(today);
  return { ...goal, checks: [...goal.checks.filter((c) => c.week !== week), { week, how, at: now }] };
}

/** The goals that want an answer this week (for the Wochenrückblick and the page). */
export const goalsToCheck = (c, today) => c.goals.filter((g) => checkDue(g, today));

/** The input for the helper task 'steps' (api/_lib/helper.js): only the goal, its day and the steps you have. */
export const stepsPayload = (goal, today, lang = 'de') => ({ goal: goal.title, due: goal.due || '', today, have: goal.steps.map((s) => s.text), lang });

/** An entry turned into a goal (#338 «Aus Idee wird …»): the entry is ticked done and links to the goal. */
export function entryToGoal(c, entryId, { id, now = new Date().toISOString(), due = '' } = {}) {
  const e = c.entries.find((x) => x.id === entryId);
  if (!e) return c;
  const goal = { ...newGoal({ title: e.text, due }, { id, now }), from: e.id };
  return { ...editEntry(c, entryId, { done: true, goalId: goal.id }), goals: [goal, ...c.goals] };
}
