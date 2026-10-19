/**
 * Paket M #88 «Notizen von unterwegs werden To-dos» (Noah 19.10.2026 «1 b und a oder andere Ablageorte
 * vom Nutzer zum Bestimmen möglich»): in the debrief every note on the way gets «Als To-do». Where it goes
 * is the user's choice and is remembered:
 *   'checklist'     one checklist note per trip in Notizen («To-dos nach …», made on the first one)
 *   'note:<id>'     any kept note of the user, the to-do goes onto its checklist
 *   'gtask:<list>'  a list in Google Tasks (only when Google Tasks is on)
 * settings 'notizTodo': { target, sent: { [noteKey]: { target, at } } }
 */
import { newKeptNote, noteTitle } from '../notebook.js';

export const TODO_KEY = 'notizTodo';
export const DEFAULT_TARGET = 'checklist';
export const checklistId = (tripId) => `todo-${tripId}`;

export function todoConfig(v) {
  return { target: typeof v?.target === 'string' ? v.target : DEFAULT_TARGET, sent: v?.sent && typeof v.sent === 'object' ? v.sent : {} };
}

/**
 * The places to choose: [{ key, name, own }]. name is English for the fixed ones (the page uses t()),
 * the user's own note title or Google list title as it is (own: true).
 */
export function todoTargets({ notes = [], prefs = null, tripId = null } = {}) {
  const out = [{ key: 'checklist', name: 'New checklist in Notes', own: false }];
  const mine = notes
    .filter((n) => n?.status === 'kept' && n.id !== checklistId(tripId) && noteTitle(n))
    .sort((a, b) => (b.editedAt ?? b.at ?? '').localeCompare(a.editedAt ?? a.at ?? ''))
    .slice(0, 12);
  for (const n of mine) out.push({ key: `note:${n.id}`, name: noteTitle(n), own: true, group: 'note' });
  if (prefs?.tasks) for (const l of prefs.lists?.length ? prefs.lists : [{ id: '@default', title: 'Google Tasks' }]) out.push({ key: `gtask:${l.id}`, name: l.title || 'Google Tasks', own: true, group: 'gtask' });
  return out;
}

/** The target to use: the remembered one if it still exists, else the checklist. */
export const pickTarget = (targets, wanted) => (targets.some((x) => x.key === wanted) ? wanted : DEFAULT_TARGET);

/** The checklist note of a trip with one more to-do (a new note when there is none yet). */
export function withTodo(existing, text, { tripId, title, now = new Date().toISOString() }) {
  const item = { text: String(text).trim(), done: false };
  if (existing) {
    const list = existing.checklist ?? [];
    if (list.some((c) => c.text === item.text)) return existing;
    return { ...existing, checklist: [...list, item], editedAt: now };
  }
  return { ...newKeptNote({ text: title, checklist: [item] }, { id: checklistId(tripId), now }), title };
}

/** Puts a to-do into a kept note's checklist (no double entries). */
export function appendTodo(note, text, now = new Date().toISOString()) {
  const item = { text: String(text).trim(), done: false };
  const list = note.checklist ?? [];
  if (list.some((c) => c.text === item.text)) return note;
  return { ...note, checklist: [...list, item], editedAt: now };
}

/**
 * Sends one note's text to the target. deps: { db, saveTask } (saveTask from agenda/client). Returns
 * true when it arrived. title: the name of the trip checklist, already in the user's language.
 */
export async function sendTodo(target, text, { db, saveTask = null, tripId, title, now = new Date().toISOString() }) {
  if (target.startsWith('gtask:')) {
    if (!saveTask) return false;
    const res = await saveTask({ list: target.slice(6), title: String(text).trim().slice(0, 300) });
    return !!res;
  }
  if (target.startsWith('note:')) {
    const n = await db.notes.get(target.slice(5));
    if (!n) return false;
    await db.notes.put(appendTodo(n, text, now));
    return true;
  }
  const old = await db.notes.get(checklistId(tripId));
  await db.notes.put(withTodo(old, text, { tripId, title, now }));
  return true;
}
