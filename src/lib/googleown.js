/**
 * Package G «Daten kommen von selbst»:
 * - #85 + #163 (Noah 19.10.2026 «2a»): the app writes its tours into its own Google calendar
 *   «Packgenerator» (no read link, no copy on the server). Each tour gets a reminder to pack two days
 *   before, at 18:00. The calendar then shows on every device where Noah's Google calendar is.
 * - #1003 (Noah «5b»): the open notes are a list «Packgenerator Notizen» in Google Tasks, in both
 *   directions: ticked in Google = done in the app, done in the app = ticked in Google, a new task in
 *   that list = a new note.
 * Both are switches (db.settings OWN_KEY, in backups); off by default. Everything stays a suggestion.
 */
import { db as appDb } from './db.js';
import { call } from './health.js';
import { localDay } from './localday.js';
import { addDays } from './agenda.js';
import { newNote } from './notes.js';
import { t } from './i18n.svelte.js';
import { isTestTrip, isArchived } from './testname.js';
import { wearRows, wearItems } from './wear.js';
import { withVisits } from './workshop.js';

export const OWN_KEY = 'google.own';
/** Reminder of a tour: two days before at 18:00 (an all-day event starts at 0:00, 30 hours later). */
export const PACK_REMIND_MIN = 2 * 24 * 60 - 18 * 60;
/** Tours from a week back up to a year ahead go into the calendar. */
const BACK = 7;
const AHEAD = 366;

export const prefsOf = (v) => ({
  cal: v?.cal === true,
  notes: v?.notes === true,
  remind: v?.remind !== false,
  // Noah 26.10.2026 «7a»: the coming part changes of the bikes too (on with the calendar, own switch)
  wear: v?.wear !== false,
  // the Google login allows the own calendar (status «owncal»)
  owncal: v?.owncal === true,
  calId: typeof v?.calId === 'string' ? v.calId : null,
  listId: typeof v?.listId === 'string' ? v.listId : null,
  // the tasks this device knows from the list (a note deleted in the app removes its task)
  known: Array.isArray(v?.known) ? v.known.filter((x) => typeof x === 'string') : [],
  lastCal: typeof v?.lastCal === 'string' ? v.lastCal : null,
  calAt: typeof v?.calAt === 'string' ? v.calAt : null,
  notesAt: typeof v?.notesAt === 'string' ? v.notesAt : null,
});

export async function savePrefs(patch, db = appDb) {
  await db.transaction('rw', db.settings, async () => {
    const old = (await db.settings.get(OWN_KEY))?.value ?? {};
    await db.settings.put({ key: OWN_KEY, value: { ...old, ...patch } });
  });
}

/** The last day of a tour. */
const lastDayOf = (trip) => addDays(trip.startDate.slice(0, 10), Math.max(1, Number(trip.days) || 1) - 1);

/** The tours as calendar items (pure). */
export function tripItems(trips = [], today, { remind = true } = {}) {
  return trips
    .filter((tr) => tr?.id && tr.startDate && !tr.skipped && !isTestTrip(tr) && !isArchived(tr))
    .filter((tr) => lastDayOf(tr) >= addDays(today, -BACK) && tr.startDate.slice(0, 10) <= addDays(today, AHEAD))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((tr) => ({
      key: `trip:${String(tr.id).replace(/[^\w:.-]/g, '-').slice(0, 100)}`,
      title: t('Tour: {name}', { name: (tr.title || tr.name || t('Tour')).slice(0, 180) }),
      day: tr.startDate.slice(0, 10),
      lastDay: lastDayOf(tr),
      allDay: true,
      note: remind ? t('From the Pack Generator. Two days before, it reminds you to pack.') : t('From the Pack Generator.'),
      remind: remind ? [PACK_REMIND_MIN] : [],
    }));
}

/** A short fingerprint of the items, so an unchanged list is not sent again. */
export const fingerprint = (items) => {
  const s = JSON.stringify(items);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `${items.length}:${(h >>> 0).toString(36)}`;
};

/** The tours into the calendar «Packgenerator». force: also when nothing changed. → result or null. */
export async function syncCal({ db = appDb, c = call, today = localDay(), force = false } = {}) {
  const p = prefsOf((await db.settings.get(OWN_KEY))?.value);
  if (!p.cal) return null;
  const items = tripItems(await db.trips.toArray(), today, { remind: p.remind });
  if (p.wear) {
    const [bikes, visits, entries] = await Promise.all([db.bikes.toArray(), db.visits.toArray(), db.kmBook.toArray()]);
    items.push(...wearItems(bikes.map((b) => ({ bike: b, rows: wearRows(withVisits(b, visits), { entries, today }) })), today, t));
  }
  const fp = fingerprint(items);
  const fresh = p.calAt && Date.now() - Date.parse(p.calAt) < 24 * 3600e3;
  if (!force && fp === p.lastCal && fresh) return { skipped: true };
  const res = await c('own-sync', { method: 'POST', body: { items } });
  await savePrefs({ calId: res.cal ?? p.calId, lastCal: fp, calAt: new Date().toISOString() }, db);
  return res;
}

/**
 * Notes ↔ tasks (pure): what to do. notes: db.notes; tasks: the tasks of the own list (open ones and
 * the ones done in the last 30 days); known: task ids seen before. → {
 *   create: [note] (an open note without task), tick: [{ note, task }] (done in the app),
 *   reopen: [] (unused, a done note stays done), done: [{ note, task }] (ticked in Google),
 *   rename: [{ note, task }] (the note's text changed in the app), newNotes: [task] (new in Google),
 *   remove: [taskId] (the note was deleted in the app) }
 */
export function planNotes({ notes = [], tasks = [], known = [] }) {
  const byTask = new Map(notes.filter((n) => n.gTask).map((n) => [n.gTask, n]));
  const taskById = new Map(tasks.map((x) => [x.id, x]));
  const seen = new Set(known);
  const out = { create: [], tick: [], done: [], rename: [], newNotes: [], remove: [] };
  for (const n of notes) {
    if (!n.gTask) {
      if (n.status === 'open' && n.text?.trim()) out.create.push(n);
      continue;
    }
    const task = taskById.get(n.gTask);
    if (!task) continue; // done longer ago, or deleted in Google: the note stays as it is
    if (task.done && n.status === 'open') out.done.push({ note: n, task });
    else if (!task.done && n.status !== 'open') out.tick.push({ note: n, task });
    else if (!task.done && n.text.trim().slice(0, 300) !== task.title) out.rename.push({ note: n, task });
  }
  for (const task of tasks) {
    if (byTask.has(task.id)) continue;
    if (seen.has(task.id)) out.remove.push(task.id);
    else if (!task.done && task.title) out.newNotes.push(task);
  }
  return out;
}

/** One round of notes ↔ Google Tasks. → counts or null (switched off). */
export async function syncNotes({ db = appDb, c = call, now = new Date() } = {}) {
  const p = prefsOf((await db.settings.get(OWN_KEY))?.value);
  if (!p.notes) return null;
  const listId = p.listId ?? (await c('own-list', { method: 'POST', body: {} })).list.id;
  const { tasks } = await c('tasks', { params: { list: listId } });
  const plan = planNotes({ notes: await db.notes.toArray(), tasks, known: p.known });
  const save = (body) => c('task-save', { method: 'POST', body: { list: listId, ...body } });
  const at = now.toISOString();
  for (const n of plan.create) {
    const { task } = await save({ title: n.text.trim().slice(0, 300), notes: t('From the Pack Generator') });
    if (task?.id) await db.notes.update(n.id, { gTask: task.id });
  }
  for (const { task } of plan.tick) await save({ id: task.id, done: true });
  for (const { note, task } of plan.rename) await save({ id: task.id, title: note.text.trim().slice(0, 300) });
  for (const { note } of plan.done) await db.notes.update(note.id, { status: 'sorted', to: { kind: 'done', label: 'Done, nothing to keep', ref: null }, sortedAt: at });
  for (const task of plan.newNotes) await db.notes.put({ ...newNote({ text: task.title, page: 'google' }, { id: `note-g-${task.id}`.slice(0, 80), now: at }), gTask: task.id });
  for (const id of plan.remove) await c('task-delete', { method: 'POST', body: { list: listId, id } }).catch(() => null);
  const ids = (await db.notes.toArray()).map((n) => n.gTask).filter(Boolean);
  await savePrefs({ listId, known: ids, notesAt: at }, db);
  return { created: plan.create.length, ticked: plan.tick.length, done: plan.done.length, renamed: plan.rename.length, added: plan.newNotes.length, removed: plan.remove.length };
}

/** Both, after every Google fetch; an error is kept, never thrown. */
export async function syncOwn(opts = {}) {
  const out = {};
  for (const [k, f] of [['cal', syncCal], ['notes', syncNotes]]) {
    try {
      out[k] = await f(opts);
    } catch (err) {
      out[k] = { error: err?.code ?? 'network' };
    }
  }
  return out;
}

/** «Packgenerator» calendar on: the Google login also asks for the right to make that calendar. */
export async function connectOwn({ c = call, loc = globalThis.location, back = '#/me/agenda' } = {}) {
  const { url } = await c('start', { method: 'POST', body: { services: ['calendar', 'tasks', 'owncal'], returnTo: `${loc.origin}${loc.pathname}${back}` } });
  loc.href = url;
  return url;
}
