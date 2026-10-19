/**
 * Google Kalender und Aufgaben (package GA): the live state for the page «Termine und Aufgaben»
 * (#/me/agenda) and the copy of Google's events and tasks on this device (db.gEvents, db.gTasks).
 *
 * - The same Google login as Fitbit and Drive (api/_lib/google.js), asking for calendar and tasks in
 *   addition (services ['calendar', 'tasks']); the device key from Strava proves it is Noah's device.
 * - Automatic: when the app opens or comes back, at most every 15 minutes (as Fitbit).
 * - A change (new task, ticked, new event) goes to Google first; then the copy here follows.
 * Everything is a suggestion: calendar and tasks can each be switched off, nothing is a must.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { call } from '../health.js';
import { readKey } from '../strava/client.svelte.js';
import { localDay } from '../localday.js';
import { syncOwn, savePrefs as saveOwn } from '../googleown.js';
import { AGENDA_KEY, BACK_DAYS, AHEAD_DAYS, prefsOf, calsToFetch, addDays } from '../agenda.js';
import { keepDayEvents } from '../daydata.js';

export const AGENDA_HASH = '#/me/agenda';
/** db.meta (this device only): when this device last tried to fetch. */
export const TRY_KEY = 'agenda.try';
export const AUTO_EVERY_MS = 15 * 60 * 1000;

export const agenda = $state({ loaded: false, busy: false, error: '', justConnected: false, prefs: prefsOf(null), events: [], tasks: [] });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => [(await appDb.settings.get(AGENDA_KEY))?.value, await appDb.gEvents.toArray(), await appDb.gTasks.toArray()]).subscribe({
    next: ([p, events, tasks]) => {
      agenda.prefs = prefsOf(p);
      agenda.events = events;
      agenda.tasks = tasks;
      agenda.loaded = true;
    },
    error: () => (agenda.loaded = true),
  });
}

export async function savePrefs(patch, db = appDb) {
  // read and write in one step, so a change made meanwhile is not undone
  await db.transaction('rw', db.settings, async () => {
    const old = (await db.settings.get(AGENDA_KEY))?.value ?? {};
    await db.settings.put({ key: AGENDA_KEY, value: { ...old, ...patch } });
  });
}

/** Keep Google's events (the whole span is fetched each time, so the old copy goes). */
export async function keepEvents(db, events) {
  await db.transaction('rw', db.gEvents, async () => {
    await db.gEvents.clear();
    await db.gEvents.bulkPut(events);
  });
}

export async function keepTasks(db, tasks) {
  await db.transaction('rw', db.gTasks, async () => {
    await db.gTasks.clear();
    await db.gTasks.bulkPut(tasks);
  });
}

/** Ask the server what Google allows; remember it. Returns the status or null (no answer). */
export async function checkAllowed({ db = appDb, c = call } = {}) {
  if (!readKey()) return null;
  try {
    const st = await c('status');
    await savePrefs({ calendar: !!st.calendar, tasks: !!st.tasks }, db);
    // package G: may the app make its own calendar «Packgenerator»?
    await saveOwn({ owncal: !!st.owncal }, db);
    return st;
  } catch (err) {
    agenda.error = err?.code ?? 'network';
    return null;
  }
}

let running = null;
/** «Jetzt holen»: calendars, events of the span and tasks. Returns true when done. */
export function fetchNow({ db = appDb, c = call, today = localDay() } = {}) {
  if (running) return running;
  running = (async () => {
    agenda.busy = true;
    agenda.error = '';
    try {
      await db.meta.put({ key: TRY_KEY, at: new Date().toISOString() });
      const p = prefsOf((await db.settings.get(AGENDA_KEY))?.value);
      const patch = {};
      if (p.calendar) {
        const { calendars } = await c('cal-list');
        patch.calendars = calendars;
        const cals = calsToFetch({ ...p, calendars }).filter((id) => id === 'primary' || calendars.some((x) => x.id === id));
        const from = addDays(today, -BACK_DAYS);
        const to = addDays(today, AHEAD_DAYS);
        const { events } = await c('cal-events', { params: { from, to, cal: cals.join(',') } });
        await keepEvents(db, events);
        // «Erkenntnisse» (Noah 19.10.2026 «3a»): the appointments per day, kept beyond the 7 days of the copy
        await keepDayEvents(db, events, from, to, today).catch(() => {});
      }
      if (p.tasks) {
        const { lists } = await c('task-lists');
        patch.lists = lists;
        const { tasks } = await c('tasks');
        await keepTasks(db, tasks);
      }
      await savePrefs({ ...patch, lastSync: new Date().toISOString() }, db);
      // package G: the tours into «Packgenerator», the notes into Google Tasks (each only when switched on)
      await syncOwn({ db, c, today });
      return true;
    } catch (err) {
      const code = err?.code ?? 'network';
      agenda.error = code;
      if (code === 'not_connected') await savePrefs({ calendar: false, tasks: false }, db);
      if (code === 'calendar_not_allowed') await savePrefs({ calendar: false }, db);
      if (code === 'tasks_not_allowed') await savePrefs({ tasks: false }, db);
      return false;
    } finally {
      agenda.busy = false;
    }
  })().finally(() => (running = null));
  return running;
}

/** The automatic fetch: allowed, a Strava key on this device, 15 minutes passed. */
export async function autoFetch({ db = appDb, now = new Date() } = {}) {
  if (!readKey() || agenda.busy) return null;
  const p = prefsOf((await db.settings.get(AGENDA_KEY))?.value);
  if (!p.calendar && !p.tasks) return null; // the own calendar and the notes need calendar or tasks too
  const tried = Date.parse((await db.meta.get(TRY_KEY))?.at ?? '');
  if (Number.isFinite(tried) && now.getTime() - tried < AUTO_EVERY_MS) return null;
  return fetchNow({ db });
}

export function watchAutoFetch() {
  if (typeof document === 'undefined') return;
  const go = () => autoFetch().catch(() => {});
  go();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') go();
  });
}

/** «Mit Google verbinden»: the Google login asks for calendar and/or tasks; back to this page. */
export async function connect(services = ['calendar', 'tasks'], { c = call, loc = globalThis.location } = {}) {
  agenda.error = '';
  try {
    const { url } = await c('start', { method: 'POST', body: { services, returnTo: `${loc.origin}${loc.pathname}${AGENDA_HASH}` } });
    loc.href = url;
    return url;
  } catch (err) {
    agenda.error = err?.code ?? 'network';
    return null;
  }
}

/** Back from the Google login: «#/me/agenda?google=connected». Read once; then the first fetch. */
export function takeReturn(loc = globalThis.location, hist = globalThis.history, db = appDb) {
  const h = loc?.hash ?? '';
  if (!h.startsWith(AGENDA_HASH)) return null;
  const i = h.indexOf('?');
  if (i < 0) return null;
  const q = new URLSearchParams(h.slice(i + 1));
  const g = q.get('google');
  if (!g) return null;
  try {
    hist?.replaceState(null, '', `${loc.pathname}${loc.search}${h.slice(0, i)}`);
  } catch {
    /* the address stays */
  }
  if (g === 'connected') {
    agenda.error = '';
    agenda.justConnected = true;
    checkAllowed({ db })
      .then((st) => (st ? fetchNow({ db }) : null))
      .catch(() => {});
    return { connected: true };
  }
  agenda.error = q.get('error') || 'denied';
  return { error: agenda.error };
}

/** «Ausblenden»: the app stops showing calendar or tasks; Google keeps everything. */
export async function hide(what, { db = appDb } = {}) {
  await savePrefs({ [what]: false }, db);
  if (what === 'calendar') await db.gEvents.clear();
  if (what === 'tasks') await db.gTasks.clear();
}

/** Which calendars show (at least one). */
export async function chooseCals(ids, { db = appDb } = {}) {
  await savePrefs({ cals: ids }, db);
  return fetchNow({ db });
}

async function change(step, body, after, { c = call } = {}) {
  agenda.error = '';
  try {
    const res = await c(step, { method: 'POST', body });
    await after(res);
    return res;
  } catch (err) {
    agenda.error = err?.code ?? 'network';
    return null;
  }
}

/** A new or changed task. { list, id?, title?, notes?, due?, done? } */
export const saveTask = (v, { db = appDb, c = call } = {}) => change('task-save', v, (res) => res.task && db.gTasks.put(res.task), { c });
export const deleteTask = (x, { db = appDb, c = call } = {}) => change('task-delete', { list: x.list, id: x.id }, () => db.gTasks.delete(x.id), { c });
/** A new or changed event. { cal, gid?, title, day, lastDay?, allDay, from?, to?, where?, note? } */
export const saveEvent = (v, { db = appDb, c = call } = {}) => change('cal-save', v, (res) => res.event && db.gEvents.put(res.event), { c });
export const deleteEvent = (e, { db = appDb, c = call } = {}) => change('cal-delete', { cal: e.cal, gid: e.gid }, () => db.gEvents.delete(e.id), { c });
