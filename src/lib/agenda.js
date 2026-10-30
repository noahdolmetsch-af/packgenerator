/**
 * Google Kalender und Aufgaben (package GA «Google Teil 2», Noah 15.10.2026 «3 beides», 21:11 «3b»: the
 * calendar comes with «Woche planen»). Pure helpers for the rows the app keeps from Google:
 *
 *   db.gEvents  { id: `${cal}|${gid}`, gid, cal, title, where, note, allDay, day, lastDay, start, end, link, busy }
 *   db.gTasks   { id, list, title, notes, due (YYYY-MM-DD|null), done, doneAt, parent, position }
 *
 * (api/_lib/googleplan.js makes them). Both tables are a copy of Google on this device only: not in
 * backups, Google keeps the truth. «Woche planen» reads them through weekItems().
 */
export const AGENDA_KEY = 'agenda';
/** The span kept on the device: a week back, two months ahead. */
export const BACK_DAYS = 7;
export const AHEAD_DAYS = 60;
/** The page shows the next two weeks. */
export const SHOW_DAYS = 14;

export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Every day from..to (inclusive). */
export function daysOf(from, to) {
  const out = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The settings as stored (db.settings AGENDA_KEY, in backups), with the defaults filled in. */
export const prefsOf = (v) => ({
  calendar: v?.calendar === true,
  tasks: v?.tasks === true,
  // the calendars shown (ids); empty = only the main calendar
  cals: Array.isArray(v?.cals) ? v.cals.filter((c) => typeof c === 'string' && c) : [],
  calendars: Array.isArray(v?.calendars) ? v.calendars.filter((c) => c && typeof c.id === 'string') : [],
  lists: Array.isArray(v?.lists) ? v.lists.filter((l) => l && typeof l.id === 'string') : [],
  lastSync: typeof v?.lastSync === 'string' ? v.lastSync : null,
});

/** The calendars to fetch: the chosen ones, else the main one. */
export const calsToFetch = (p) => (p.cals.length ? p.cals : [p.calendars.find((c) => c.primary)?.id ?? 'primary']);

/** «08:30» in Zurich for a timed event, '' for an all-day one. */
export const timeOf = (e) => (e?.allDay || !e?.start ? '' : new Date(e.start).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' }));

/** The day and the time («2026-10-29», «18:30») of a moment as the clock shows it in a time zone. */
export function clockIn(iso, tz = 'Europe/Zurich') {
  const o = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: `${o.year}-${o.month}-${o.day}`, time: `${o.hour}:${o.minute}` };
}

/** The time zones the editor offers (Zurich first); an event's own zone is added when it is none of them. */
export const ZONES = ['Europe/Zurich', 'Europe/London', 'Europe/Lisbon', 'Europe/Athens', 'Europe/Istanbul', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'];

/** Reminders ↔ the editor's rows: { minutes, method } ↔ { n, unit, method }, in the biggest whole unit. */
export const UNITS = { minutes: 1, hours: 60, days: 1440, weeks: 10080 };
export function remindRow(r) {
  const m = r.minutes;
  const unit = m && m % 10080 === 0 ? 'weeks' : m && m % 1440 === 0 ? 'days' : m && m % 60 === 0 ? 'hours' : 'minutes';
  return { n: m / UNITS[unit], unit, method: r.method === 'email' ? 'email' : 'popup' };
}
export const remindMinutes = (row) => ({ minutes: Math.round(Number(row.n) * UNITS[row.unit]), method: row.method === 'email' ? 'email' : 'popup' });

/** Events by day for the days from..to: an event over several days stands on each of them. */
export function byDay(events, from, to) {
  const map = new Map(daysOf(from, to).map((d) => [d, []]));
  for (const e of events ?? []) {
    const last = e.lastDay && e.lastDay > e.day ? e.lastDay : e.day;
    for (let d = e.day < from ? from : e.day; d <= last && d <= to; d = addDays(d, 1)) map.get(d)?.push(e);
  }
  for (const list of map.values()) list.sort((a, b) => Number(!a.allDay) - Number(!b.allDay) || String(a.start).localeCompare(String(b.start)) || a.title.localeCompare(b.title));
  return [...map].map(([day, list]) => ({ day, events: list }));
}

const minutesOf = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
/** The shortest block the week grid draws (minutes), so a short appointment can still be tapped. */
export const MIN_BLOCK = 30;

/**
 * The week grid (Google's «Week» view): for every day the all-day entries and the timed ones with their
 * minute span on that day and a lane, so appointments at the same time stand side by side.
 *   [{ day, allDay: [event], timed: [{ e, from, to, lane, lanes }] }]   (from/to in minutes since 00:00 Zurich)
 */
export function weekLayout(events, days) {
  return byDay(events, days[0], days.at(-1))
    .filter((d) => days.includes(d.day))
    .map(({ day, events: list }) => {
      const allDay = list.filter((e) => e.allDay);
      const items = list
        .filter((e) => !e.allDay && e.start)
        .map((e) => {
          const a = clockIn(e.start);
          const b = clockIn(e.end || e.start);
          const from = a.day < day ? 0 : minutesOf(a.time);
          const to = b.day > day ? 1440 : minutesOf(b.time);
          return { e, from, to: Math.min(1440, Math.max(to, from + MIN_BLOCK)) };
        })
        .sort((x, y) => x.from - y.from || y.to - x.to);
      // lanes: a group is a run of appointments that touch each other; each gets the first free lane
      const timed = [];
      let group = [];
      let end = 0;
      const close = () => {
        const lanes = Math.max(1, ...group.map((x) => x.lane + 1));
        for (const x of group) timed.push({ ...x, lanes });
        group = [];
      };
      for (const it of items) {
        if (group.length && it.from >= end) close();
        const used = new Set(group.filter((x) => x.to > it.from).map((x) => x.lane));
        let lane = 0;
        while (used.has(lane)) lane++;
        group.push({ ...it, lane });
        end = Math.max(end, it.to);
      }
      close();
      return { day, allDay, timed };
    });
}

const TASK_ORDER = ['late', 'today', 'soon', 'later', 'open', 'done'];
/** Where a task stands: late, today, soon (next 7 days), later, open (no date) or done. */
export function taskWhen(task, today) {
  if (task.done) return 'done';
  if (!task.due) return 'open';
  if (task.due < today) return 'late';
  if (task.due === today) return 'today';
  return task.due <= addDays(today, 7) ? 'soon' : 'later';
}

/** Tasks in groups (late first, done last); sub-tasks follow their parent's group. */
export function taskGroups(tasks, today, { list = null } = {}) {
  const rows = (tasks ?? []).filter((x) => !list || x.list === list);
  const groups = Object.fromEntries(TASK_ORDER.map((k) => [k, []]));
  for (const x of rows) groups[taskWhen(x, today)].push(x);
  const byDue = (a, b) => String(a.due ?? '9999').localeCompare(String(b.due ?? '9999')) || String(a.position).localeCompare(String(b.position)) || a.title.localeCompare(b.title);
  groups.done.sort((a, b) => String(b.doneAt ?? '').localeCompare(String(a.doneAt ?? '')));
  for (const k of TASK_ORDER.slice(0, -1)) groups[k].sort(byDue);
  return TASK_ORDER.map((key) => ({ key, rows: groups[key] })).filter((g) => g.rows.length);
}

/**
 * For «Woche planen» (WP1): one item per day and entry, in the week's own shape.
 *   { day, kind: 'termin' | 'todo', id, title, time, allDay, done, where, src: 'google', link }
 * Tasks without a date are left out (the Sunday planning offers them as «Noch einplanen»).
 */
export function weekItems({ events = [], tasks = [], from, to }) {
  const out = [];
  for (const { day, events: list } of byDay(events, from, to)) {
    for (const e of list) out.push({ day, kind: 'termin', id: e.id, title: e.title, time: timeOf(e), allDay: !!e.allDay, done: false, where: e.where ?? '', src: 'google', link: e.link ?? null });
  }
  for (const x of tasks) {
    if (x.due && x.due >= from && x.due <= to) out.push({ day: x.due, kind: 'todo', id: x.id, title: x.title, time: '', allDay: true, done: !!x.done, where: '', src: 'google', link: null });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || (a.kind === b.kind ? 0 : a.kind === 'termin' ? -1 : 1) || a.time.localeCompare(b.time));
}

/** Open tasks without a date (for «Noch einplanen»). */
export const undatedTasks = (tasks) => (tasks ?? []).filter((x) => !x.done && !x.due && !x.parent);
