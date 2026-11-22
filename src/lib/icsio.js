/**
 * Package G #84 «Termine als .ics hinein und hinaus» and #163 «Tour als Kalender-Termin mit
 * Packen-Erinnerung»: the tours as one calendar file (each with a reminder two days before at 18:00),
 * and a calendar file read into events the app can put into Google. Pure functions.
 */
import { icsCalendar } from './flowmed.js';
import { addDays } from './flow.js';

/** A reminder 30 hours before the start of an all-day event = two days before at 18:00. */
export const PACK_ALARM = '-PT30H';

/**
 * The tours as a calendar file. trips: { id, title, startDate, days }; words: { title(name), note }.
 * Several days are one event over all days; the reminder to pack is a VALARM.
 */
export function tripsIcs(trips = [], { title = (n) => n, note = '', remind = true, now = Date.now() } = {}) {
  const base = icsCalendar([], now).split('\r\n');
  const end = base.indexOf('END:VCALENDAR');
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const ymd = (d) => d.replace(/-/g, '');
  const events = trips
    .filter((tr) => tr?.startDate)
    .flatMap((tr) => {
      const day = tr.startDate.slice(0, 10);
      const last = addDays(day, Math.max(1, Number(tr.days) || 1) - 1);
      return [
        'BEGIN:VEVENT',
        `UID:trip-${esc(tr.id)}@packgenerator`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(day)}`,
        `DTEND;VALUE=DATE:${ymd(addDays(last, 1))}`,
        `SUMMARY:${esc(title(tr.title || tr.name || ''))}`,
        ...(note ? [`DESCRIPTION:${esc(note)}`] : []),
        ...(remind ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title(tr.title || tr.name || ''))}`, `TRIGGER:${PACK_ALARM}`, 'END:VALARM'] : []),
        'END:VEVENT',
      ];
    });
  return `${[...base.slice(0, end), ...events, 'END:VCALENDAR'].join('\r\n')}\r\n`;
}

export { parseIcs } from './icsparse.js';
