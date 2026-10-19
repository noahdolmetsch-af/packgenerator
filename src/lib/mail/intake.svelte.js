/**
 * «Mail in die App» (Noah 19.10.2026): what comes into the Eingang from outside the app.
 * - takeMail: one Gmail mail with its attachments becomes one Eingang entry («In die App übernehmen», 1a).
 * - fetchOutside: when the Eingang opens (at most every 10 minutes): the mails with the Gmail label
 *   «Packgenerator» (2a), the open tasks of a Google task list «Packgenerator» (4a), and Google calendar
 *   appointments with «#pack» in the title (3a) come in once each. Nothing is changed in Google.
 * The ids already taken are kept in settings 'mail.taken' (they sync, so a mail comes in on one device only).
 * Pure rules in ../mailin.js.
 */
import { db as appDb } from '../db.js';
import { call } from '../health.js';
import { readKey } from '../strava/client.svelte.js';
import { localDay } from '../localday.js';
import { TAKEN_KEY, LABEL_QUERY, MAIL_LABEL, filesToFetch, mailNote, dataUrlOf, takenWith } from '../mailin.js';

export const intake = $state({ busy: '', error: '', came: 0 });

/** db.meta-like device memory: when this device last looked outside. */
const LOOKED_LS = 'pg.mailin.looked';
export const LOOK_EVERY_MS = 10 * 60 * 1000;

const stamp = () => `mail-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export async function takenIds(db = appDb) {
  const v = (await db.settings.get(TAKEN_KEY))?.value;
  return Array.isArray(v) ? v : [];
}
async function markTaken(db, id) {
  await db.transaction('rw', db.settings, async () => {
    const v = (await db.settings.get(TAKEN_KEY))?.value;
    await db.settings.put({ key: TAKEN_KEY, value: takenWith(v, id) });
  });
}

/** The entry that already holds this Gmail mail, or null. */
export const noteOfMail = async (id, db = appDb) => (await db.notes.toArray()).find((n) => n.mail?.id === id) ?? null;

/**
 * One mail into the Eingang. Returns { note, existed } or null (why in intake.error).
 * mail: the opened mail when the page has it already (saves one request).
 */
export async function takeMail(id, { mail = null, db = appDb, c = call } = {}) {
  intake.busy = 'take';
  intake.error = '';
  try {
    const had = await noteOfMail(id, db);
    if (had) return { note: had, existed: true };
    const m = mail?.id === id && Array.isArray(mail.files) ? mail : (await c('mail-get', { params: { id } })).mail;
    const { take, skip } = filesToFetch(m.files ?? []);
    const files = [];
    for (const f of take) {
      try {
        const res = await c('mail-file', { params: { id, att: f.att } });
        files.push({ name: f.name, type: f.type, size: res.size ?? f.size, data: dataUrlOf(res.data, f.type) });
      } catch {
        skip.push(f.name);
      }
    }
    const note = mailNote(m, files, { id: stamp(), skipped: skip });
    await db.notes.put(note);
    await markTaken(db, id);
    return { note, existed: false };
  } catch (err) {
    intake.error = err?.code ?? 'network';
    return null;
  } finally {
    intake.busy = '';
  }
}

/** 2a: the labelled mails not taken yet. Returns how many came. */
export async function fetchLabelled({ db = appDb, c = call } = {}) {
  const taken = new Set(await takenIds(db));
  const res = await c('mail-list', { params: { q: LABEL_QUERY } });
  let n = 0;
  for (const m of (res.mails ?? []).slice().reverse()) {
    if (taken.has(m.id)) continue;
    if (await takeMail(m.id, { db, c })) n++;
  }
  return n;
}

/** 4a: the open tasks of a Google task list named «Packgenerator». Returns how many came. */
export async function fetchTaskList({ db = appDb, c = call } = {}) {
  const { lists } = await c('task-lists');
  const list = (lists ?? []).find((l) => String(l.title ?? '').trim().toLowerCase() === MAIL_LABEL.toLowerCase());
  if (!list) return 0;
  const { tasks } = await c('tasks', { params: { list: list.id } });
  const taken = new Set(await takenIds(db));
  let n = 0;
  for (const x of tasks ?? []) {
    const key = `task:${x.id}`;
    if (x.done || taken.has(key) || !String(x.title ?? '').trim()) continue;
    const text = [x.title, x.notes].filter((s) => String(s ?? '').trim()).join('\n\n');
    await db.notes.put({ id: stamp(), at: new Date().toISOString(), text, photo: null, page: 'tasks', tripId: null, bikeId: null, status: 'open', to: null, sortedAt: null, ...(x.due ? { due: x.due } : {}) });
    await markTaken(db, key);
    n++;
  }
  return n;
}

/** 3a: Google appointments (the copy on this device) with «#pack» in the title, from today on. */
export async function fetchPackEvents({ db = appDb, today = localDay() } = {}) {
  const taken = new Set(await takenIds(db));
  const events = (await db.gEvents.toArray()).filter((e) => /#pack\b/i.test(e.title ?? '') && (e.lastDay ?? e.day) >= today);
  let n = 0;
  for (const e of events) {
    const key = `cal:${e.gid ?? e.id}`;
    if (taken.has(key)) continue;
    const title = String(e.title).replace(/#pack\b/gi, '').replace(/\s+/g, ' ').trim() || '—';
    const days = e.lastDay && e.lastDay > e.day ? Math.round((Date.parse(`${e.lastDay}T12:00:00Z`) - Date.parse(`${e.day}T12:00:00Z`)) / 864e5) + 1 : 1;
    await db.notes.put({ id: stamp(), at: new Date().toISOString(), text: `${title}\n${e.day.split('-').reverse().join('.')}${e.where ? ` · ${e.where}` : ''}`, photo: null, page: 'calendar', tripId: null, bikeId: null, status: 'open', to: null, sortedAt: null, plan: { title, day: e.day, days } });
    await markTaken(db, key);
    n++;
  }
  return n;
}

/**
 * When the Eingang opens: look outside (at most every 10 minutes; force = the «Jetzt holen» button).
 * Each source is tried on its own; a missing Google permission just skips it. Returns how many came.
 */
export async function fetchOutside({ db = appDb, c = call, force = false, ls = globalThis.localStorage, now = Date.now() } = {}) {
  if (intake.busy) return 0;
  let last = 0;
  try {
    last = Number(ls?.getItem(LOOKED_LS)) || 0;
  } catch {
    /* private mode: look every time */
  }
  if (!force && now - last < LOOK_EVERY_MS) return 0;
  try {
    ls?.setItem(LOOKED_LS, String(now));
  } catch {
    /* fine */
  }
  intake.busy = 'look';
  intake.error = '';
  let n = 0;
  try {
    n += await fetchPackEvents({ db }).catch(() => 0);
    if (readKey()) {
      n += await fetchLabelled({ db, c }).catch((err) => ((intake.error = force ? (err?.code ?? '') : ''), 0));
      n += await fetchTaskList({ db, c }).catch(() => 0);
    }
  } finally {
    intake.busy = '';
  }
  intake.came = n;
  return n;
}
