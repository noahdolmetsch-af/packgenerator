/**
 * Google Kalender und Aufgaben (package GA «Google Teil 2», Noah 15.10.2026 12:16 «3 beides»: tasks and
 * calendar in one package; 21:11 «3b»: the calendar comes with «Woche planen»). Pure helpers: Google's
 * answers become small rows the app keeps, and the app's rows become what Google expects.
 * The server keeps nothing of it; the rows live on Noah's devices only.
 */
export const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.calendarlist.readonly'];
export const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';
export const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
export const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';
export const TZ = 'Europe/Zurich';
/** At most this many days in one events call (a quarter). */
export const MAX_EVENT_DAYS = 92;
/** At most this many calendars in one events call. */
export const MAX_CALS = 10;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (v) => typeof v === 'string' && DAY.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Days from..to inclusive, or 0 when not two days in order. */
export function spanOf(from, to) {
  if (!isDay(from) || !isDay(to) || to < from) return 0;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5) + 1;
}

/** The day in Zurich of a moment («2026-10-16T23:30:00Z» → «2026-10-17»). */
export const zurichDay = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ });

/** The offset of Zurich at that day and hour, e.g. «+02:00» in summer, «+01:00» in winter. */
export function zurichOffset(day, time = '12:00') {
  const at = new Date(`${day}T${time}:00Z`);
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+01:00';
  const m = part.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] ?? '00'}` : '+01:00';
}

/** «from 00:00 Zurich» and «to 24:00 Zurich» as RFC 3339, for timeMin/timeMax. */
export const dayStart = (day) => `${day}T00:00:00${zurichOffset(day, '00:00')}`;
export const dayEnd = (day) => `${addDays(day, 1)}T00:00:00${zurichOffset(addDays(day, 1), '00:00')}`;

const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const note = (v, max = 2000) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);

/** One Google event → { id, cal, title, where, note, allDay, day, lastDay, start, end, link, busy, updated }. */
export function eventRow(e, cal) {
  if (!e?.id || e.status === 'cancelled') return null;
  const allDay = !!e.start?.date;
  const start = allDay ? e.start.date : e.start?.dateTime;
  const end = allDay ? e.end?.date : e.end?.dateTime;
  if (!start) return null;
  const day = allDay ? start : zurichDay(start);
  // Google's end of an all-day event is the day after; the app keeps the last day itself
  const lastDay = allDay ? (isDay(end) && end > start ? addDays(end, -1) : start) : end ? zurichDay(new Date(Date.parse(end) - 1).toISOString()) : day;
  return {
    id: `${cal}|${e.id}`,
    gid: e.id,
    cal,
    title: text(e.summary, 200) || '(ohne Titel)',
    where: text(e.location, 200),
    note: note(e.description, 1000),
    allDay,
    day,
    lastDay: lastDay < day ? day : lastDay,
    start,
    end: end ?? start,
    link: typeof e.htmlLink === 'string' ? e.htmlLink : null,
    busy: e.transparency !== 'transparent',
    updated: e.updated ?? null,
  };
}

/** The app's new or changed event → Google's body. Throws a message when something is missing. */
export function eventBody(v) {
  const title = text(v?.title, 200);
  if (!title) throw new Error('title');
  const day = v?.day;
  if (!isDay(day)) throw new Error('day');
  const body = { summary: title };
  if (v.where != null) body.location = text(v.where, 200);
  if (v.note != null) body.description = note(v.note, 1000);
  const time = /^\d{2}:\d{2}$/;
  if (v.allDay !== false || !time.test(v.from ?? '')) {
    const last = isDay(v.lastDay) && v.lastDay >= day ? v.lastDay : day;
    body.start = { date: day };
    body.end = { date: addDays(last, 1) };
  } else {
    const to = time.test(v.to ?? '') && v.to > v.from ? v.to : `${String(Math.min(23, Number(v.from.slice(0, 2)) + 1)).padStart(2, '0')}${v.from.slice(2)}`;
    body.start = { dateTime: `${day}T${v.from}:00`, timeZone: TZ };
    body.end = { dateTime: `${day}T${to === v.from ? '23:59' : to}:00`, timeZone: TZ };
  }
  return body;
}

/** One Google task → { id, list, title, notes, due, done, doneAt, parent, position, updated }. */
export function taskRow(t, list) {
  if (!t?.id || t.deleted) return null;
  return {
    id: t.id,
    list,
    title: text(t.title, 300),
    notes: note(t.notes, 2000),
    due: typeof t.due === 'string' ? t.due.slice(0, 10) : null,
    done: t.status === 'completed',
    doneAt: t.completed ?? null,
    parent: t.parent ?? null,
    position: t.position ?? '',
    updated: t.updated ?? null,
  };
}

/** The app's new or changed task → Google's body (only what is given). */
export function taskBody(v) {
  const body = {};
  if (v?.title != null) {
    const title = text(v.title, 300);
    if (!title) throw new Error('title');
    body.title = title;
  }
  if (v?.notes != null) body.notes = note(v.notes, 2000);
  if (v?.due !== undefined) {
    if (v.due !== null && !isDay(v.due)) throw new Error('due');
    // Google keeps only the day of «due»; the time must be midnight UTC
    body.due = v.due ? `${v.due}T00:00:00.000Z` : null;
  }
  if (v?.done != null) {
    body.status = v.done ? 'completed' : 'needsAction';
    if (!v.done) body.completed = null;
  }
  return body;
}

export const calRow = (c) => (c?.id ? { id: c.id, name: text(c.summaryOverride ?? c.summary, 120) || c.id, color: c.backgroundColor ?? null, primary: !!c.primary, write: c.accessRole === 'owner' || c.accessRole === 'writer' } : null);
export const listRow = (l) => (l?.id ? { id: l.id, title: text(l.title, 120) || 'Aufgaben' } : null);
