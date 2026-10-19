/**
 * Package G #226 «Feste Termine unter Heute im Blick»: the fixed dates of the day for the Tages-Check,
 * from Aktiv › Woche (flow.fixed: weekday and time) and the timed appointments of the Google calendar
 * on this device (db.gEvents). Pure; all-day appointments are left out (they are no fixed time).
 * → [{ key, time 'HH:MM', title, kind: 'fixed' | 'google' }] by time.
 */
import { fixedList, weekdayOf } from './flowweek.js';
import { timeOf } from './agenda.js';

export function todayAppointments({ fixed = [], events = [], today, nameOf = (id) => id }) {
  const wd = weekdayOf(today);
  const out = fixedList(fixed)
    .filter((f) => f.wd === wd)
    .map((f) => ({ key: `fixed:${f.id}`, time: f.time, title: nameOf(f.actId), kind: 'fixed' }));
  for (const e of events) {
    if (!e || e.allDay || e.day !== today) continue;
    out.push({ key: `google:${e.id}`, time: timeOf(e), title: e.title, kind: 'google' });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title));
}
