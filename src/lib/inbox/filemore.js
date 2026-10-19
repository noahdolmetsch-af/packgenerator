/**
 * «Mail in die App» (Noah 19.10.2026 «1a» + «neue Ablage erstellen»): the six new targets of «Ablegen als …»
 * and the buttons on an entry's attachments. Each writes what it made into note.to.made, so «Rückgängig»
 * (undoMore) takes it back:
 *   ['docs', id] · ['bill', id] · ['gEvent', cal, gid, rowId] · ['gTask', list, id] · ['listpoint', listId, pointId]
 *   ['trips', id] · ['plan', tripId, planNoteId]
 * A target that needs Google (Termin, Aufgabe) says so when Google is not connected; nothing else changes then.
 */
import { db as appDb } from '../db.js';
import { addDoc, deleteDoc } from '../docs/client.svelte.js';
import { textPdf } from '../docs/textpdf.js';
import { addBill, deleteBill } from '../pay/bills.js';
import { agenda, saveEvent, saveTask, deleteEvent, deleteTask } from '../agenda/client.svelte.js';
import { calsToFetch } from '../agenda.js';
import { loadLists, uid } from '../listsdb.js';
import { LISTS_KEY, addPoint, newList } from '../ownlists.js';
import { newTrip } from '../trips.js';
import { addPlanNote, planNotesOf } from '../plannotes.js';
import { zipEntries } from '../zipread.js';
import { passLines, blobOfData, vcfLines } from '../mailin.js';
import { findDate } from '../docs.js';
import { parseIcs } from '../icsio.js';

const short = (s, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const titleOf = (note) => short(String(note.mail?.subject || (note.text ?? '').split('\n')[0] || '—').trim(), 120);

/** One attachment (or the entry's text) as a row of Ich › Dokumente. */
async function docOf(note, f, { name, group = '', db }) {
  const base = { name: name || titleOf(note), group, source: 'mail', docDate: findDate(note.text) ?? (note.mail?.date ? note.mail.date.slice(0, 10) : null), text: String(note.text ?? '').slice(0, 4000), mode: 'color' };
  if (f?.kind === 'pdf' || f?.kind === 'photo') {
    return addDoc({ ...base, name: name || f.name.replace(/\.[a-z0-9]+$/i, ''), kind: f.kind, data: f.data, bytes: f.size ?? 0 }, { db });
  }
  if (f?.kind === 'pkpass') {
    const [entry] = await zipEntries(blobOfData(f.data), (n) => n === 'pass.json');
    const lines = passLines(entry ? JSON.parse(await entry.text()) : {});
    const data = await textPdf(lines, { title: lines[0] });
    return addDoc({ ...base, name: name || lines[0], kind: 'pdf', data, bytes: Math.round((data.length * 3) / 4) }, { db });
  }
  const lines = [titleOf(note), note.mail ? `${note.mail.fromName || note.mail.from}${note.mail.date ? ` · ${note.mail.date.slice(0, 10).split('-').reverse().join('.')}` : ''}` : '', '', ...String(note.text ?? '').split('\n').slice(note.mail ? 2 : 0)];
  const data = await textPdf(lines, { title: lines[0] });
  return addDoc({ ...base, kind: 'pdf', data, bytes: Math.round((data.length * 3) / 4) }, { db });
}

/** The entry's files with this one marked done (what it became). */
const filesDone = (note, ids, what, byEntry = false) => (note.files ?? []).map((f) => (ids.includes(f.id) ? { ...f, done: what, ...(byEntry ? { byEntry: true } : {}) } : f));

/**
 * File an entry as one of the six new targets. Returns the stored note.
 * opts per kind:
 *   doc     { name, group, files: [file id] (default: every PDF, photo, ticket), text: true = the text too }
 *   bill    { to, amount (CHF), due, iban, purpose, keepPdf }
 *   event   { title, day, from, to }
 *   task    { title, due }
 *   list    { listId | newName }
 *   newtrip { title, startDate, days, bike, items, trips }
 */
export async function fileMore(note, kind, opts = {}, { db = appDb, now = new Date().toISOString() } = {}) {
  const made = [];
  let label = '';
  let ref = null;
  let files = note.files ?? [];
  if (kind === 'doc') {
    const chosen = files.filter((f) => (opts.files ? opts.files.includes(f.id) : ['pdf', 'photo', 'pkpass'].includes(f.kind) && !f.done));
    for (const f of chosen) made.push(['docs', (await docOf(note, f, { name: chosen.length === 1 ? opts.name : '', group: opts.group ?? '', db })).id]);
    if (opts.text || !chosen.length) made.push(['docs', (await docOf(note, null, { name: opts.name, group: opts.group ?? '', db })).id]);
    files = filesDone(note, chosen.map((f) => f.id), 'doc', true);
    label = 'Documents';
    ref = made[0]?.[1] ?? null;
  } else if (kind === 'bill') {
    const bill = await addBill({ to: opts.to ?? '', iban: opts.iban ?? '', amount: typeof opts.amount === 'number' ? Math.round(opts.amount * 100) : null, purpose: opts.purpose ?? titleOf(note), due: opts.due || undefined }, db);
    made.push(['bill', bill.id]);
    if (opts.keepPdf) {
      const pdfs = files.filter((f) => f.kind === 'pdf' && !f.done);
      for (const f of pdfs) made.push(['docs', (await docOf(note, f, { db })).id]);
      files = filesDone(note, pdfs.map((f) => f.id), 'bill', true);
    }
    label = 'To pay';
    ref = bill.id;
  } else if (kind === 'event') {
    const cal = calsToFetch(agenda.prefs)[0] ?? 'primary';
    const timed = !!opts.from;
    const res = await saveEvent({ cal, title: opts.title || titleOf(note), day: opts.day, allDay: !timed, ...(timed ? { from: opts.from, to: opts.to || opts.from } : {}), note: short(String(note.text ?? ''), 900) }, { db });
    if (!res?.event) throw new Error(agenda.error === 'calendar_not_allowed' || agenda.error === 'unauthorized' || agenda.error === 'not_connected' ? 'Connect the Google calendar first: Me › Appointments.' : 'The calendar could not be reached. Try again later.');
    made.push(['gEvent', res.event.cal, res.event.gid, res.event.id]);
    label = 'Calendar';
    ref = res.event.id;
  } else if (kind === 'task') {
    const list = agenda.prefs.lists[0]?.id ?? '@default';
    const res = await saveTask({ list, title: opts.title || titleOf(note), ...(opts.due ? { due: opts.due } : {}), notes: short(String(note.text ?? ''), 1500) }, { db });
    if (!res?.task) throw new Error(agenda.error === 'tasks_not_allowed' || agenda.error === 'unauthorized' || agenda.error === 'not_connected' ? 'Connect Google tasks first: Me › Appointments.' : 'Google tasks could not be reached. Try again later.');
    made.push(['gTask', res.task.list, res.task.id]);
    label = 'Tasks';
    ref = res.task.id;
  } else if (kind === 'list') {
    const pointId = uid('pt');
    let listId = opts.listId;
    await db.transaction('rw', db.settings, async () => {
      let lists = await loadLists(db);
      if (!listId) {
        const fresh = newList({ name: opts.newName }, { id: uid(), now });
        if (!fresh) throw new Error('Give the list a name.');
        lists = [...lists, fresh];
        listId = fresh.id;
      }
      const target = lists.find((l) => l.id === listId);
      if (!target) throw new Error('This list is gone.');
      const text = titleOf(note);
      lists = lists.map((l) => (l.id === listId ? addPoint(l, text, { id: pointId, now }) : l));
      await db.settings.put({ key: LISTS_KEY, value: JSON.parse(JSON.stringify(lists)) });
      label = target.name;
    });
    made.push(['listpoint', listId, pointId]);
    ref = listId;
  } else if (kind === 'newtrip') {
    if (!opts.bike) throw new Error('Choose a bike.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.startDate ?? '')) throw new Error('Choose the start day.');
    const trip = newTrip({ title: opts.title || titleOf(note), startDate: opts.startDate, days: opts.days ?? 1, bike: opts.bike }, opts.trips ?? (await db.trips.toArray()), opts.items ?? (await db.items.toArray()));
    await db.trips.put(trip);
    made.push(['trips', trip.id]);
    label = trip.title;
    ref = trip.id;
  } else {
    throw new Error('This note could not be sorted.');
  }
  const stored = { ...note, files, status: 'sorted', sortedAt: now, to: { kind, label, ref, made } };
  await db.notes.put(stored);
  return stored;
}

/** «Tour» on a trip that has not started yet: a planning note on that trip (IS 246 «Planungs-Notizen»). */
export async function fileToPlan(note, trip, { db = appDb, now = new Date() } = {}) {
  const fresh = await db.trips.get(trip.id);
  if (!fresh) throw new Error('This trip is gone.');
  const before = planNotesOf(fresh);
  const list = addPlanNote(before, titleOf(note), now);
  const added = list[list.length - 1];
  await db.trips.update(fresh.id, { planNotes: list });
  const stored = { ...note, status: 'sorted', sortedAt: now.toISOString(), to: { kind: 'tour', plan: true, label: 'Plan', ref: fresh.id, made: [['plan', fresh.id, added.id]] } };
  await db.notes.put(stored);
  return stored;
}

/** Take back what fileMore / fileToPlan made (called by inboxdb.unfile). */
export async function undoMore(made, { db = appDb } = {}) {
  for (const m of made ?? []) {
    try {
      if (m[0] === 'docs') await deleteDoc(m[1], { db });
      else if (m[0] === 'bill') await deleteBill(m[1], db);
      else if (m[0] === 'gEvent') await deleteEvent({ cal: m[1], gid: m[2], id: m[3] }, { db });
      else if (m[0] === 'gTask') await deleteTask({ list: m[1], id: m[2] }, { db });
      else if (m[0] === 'trips') await db.trips.delete(m[1]);
      else if (m[0] === 'listpoint') {
        await db.transaction('rw', db.settings, async () => {
          const lists = (await loadLists(db)).map((l) => (l.id === m[1] ? { ...l, items: l.items.filter((x) => x.id !== m[2]) } : l));
          await db.settings.put({ key: LISTS_KEY, value: lists });
        });
      } else if (m[0] === 'plan') {
        const tr = await db.trips.get(m[1]);
        if (tr) await db.trips.update(tr.id, { planNotes: planNotesOf(tr).filter((x) => x.id !== m[2]) });
      }
    } catch {
      /* already gone: nothing to take back */
    }
  }
}

/* ---------- the buttons on one attachment (4a, 2a) ---------- */

/** «In Dokumente» for one file. Returns the stored note. */
export async function fileToDoc(note, fileId, { db = appDb } = {}) {
  const f = (note.files ?? []).find((x) => x.id === fileId);
  if (!f) throw new Error('This file is gone.');
  const doc = await docOf(note, f, { db });
  const stored = { ...note, files: filesDone(note, [fileId], 'doc'), fileMade: [...(note.fileMade ?? []), ['docs', doc.id]] };
  await db.notes.put(stored);
  return stored;
}

/** «Als Termin» for a calendar file: every event in it (at most 10) into the Google calendar. */
export async function fileIcs(note, fileId, { db = appDb } = {}) {
  const f = (note.files ?? []).find((x) => x.id === fileId);
  if (!f) throw new Error('This file is gone.');
  const events = parseIcs(await blobOfData(f.data).text()).slice(0, 10);
  if (!events.length) throw new Error('No appointment found in this file.');
  const cal = calsToFetch(agenda.prefs)[0] ?? 'primary';
  const made = [];
  for (const e of events) {
    const res = await saveEvent({ cal, title: e.title, day: e.day, lastDay: e.lastDay, allDay: e.allDay, ...(e.allDay ? {} : { from: e.from, to: e.to || e.from }), where: e.where, note: e.note }, { db });
    if (!res?.event) throw new Error(agenda.error === 'calendar_not_allowed' || agenda.error === 'unauthorized' || agenda.error === 'not_connected' ? 'Connect the Google calendar first: Me › Appointments.' : 'The calendar could not be reached. Try again later.');
    made.push(['gEvent', res.event.cal, res.event.gid, res.event.id]);
  }
  const stored = { ...note, files: filesDone(note, [fileId], 'event'), fileMade: [...(note.fileMade ?? []), ...made] };
  await db.notes.put(stored);
  return stored;
}

/** «In die Notiz» for a contact file: its lines go under the text. */
export async function fileContact(note, fileId, { db = appDb } = {}) {
  const f = (note.files ?? []).find((x) => x.id === fileId);
  if (!f) throw new Error('This file is gone.');
  const lines = vcfLines(await blobOfData(f.data).text());
  const stored = { ...note, text: `${note.text ?? ''}\n\n${lines.join('\n')}`.trim(), files: filesDone(note, [fileId], 'contact') };
  await db.notes.put(stored);
  return stored;
}

/**
 * «Als Tour oder Fahrt» for a GPX: the same way as a GPX shared to the app (public/share-target.js): the file
 * waits in the share cache, then the komoot sheet (a planned route) or the ride upload opens. Returns the address.
 */
export async function routeOf(note, fileId, { db = appDb } = {}) {
  const f = (note.files ?? []).find((x) => x.id === fileId);
  if (!f) throw new Error('This file is gone.');
  const { SHARE_CACHE, SHARE_KEY } = await import('../gpx.js');
  const { sharedKind, SHARE_TEXT } = await import('../komoot.js');
  const blob = blobOfData(f.data);
  const text = await blob.text();
  const base = location.pathname.replace(/[^/]*$/, '');
  const cache = await caches.open(SHARE_CACHE);
  await cache.put(`${base}${SHARE_KEY}`, new Response(blob, { headers: { 'Content-Type': 'application/gpx+xml', 'X-File-Name': encodeURIComponent(f.name), [SHARE_TEXT]: encodeURIComponent(titleOf(note)) } }));
  await db.notes.put({ ...note, files: filesDone(note, [fileId], 'route') });
  return sharedKind(text) === 'route' ? '#/komoot/shared' : '#/debrief/ride/shared';
}
