/**
 * A calendar file read into dates (Package G #84; split off 06.11.2026 so that the Spielerplus calendar, which
 * Today and the week load at the start, does not pull in the calendar writer of icsio.js). Pure functions.
 */
import { addDays } from './flow.js';

/** Unfold lines (RFC 5545: a line starting with a space continues the one before). */
const unfold = (text) => String(text ?? '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
const unesc = (s) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

/** «20261024» → «2026-10-24»; «20261024T180000» (+ Z or TZID) → { day, time } in Zurich. */
function when(value, params) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const day = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4] || /VALUE=DATE(?!-)/.test(params)) return { day, time: null };
  if (m[7]) {
    const d = new Date(`${day}T${m[4]}:${m[5]}:00Z`);
    return { day: d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }), time: d.toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' }) };
  }
  return { day, time: `${m[4]}:${m[5]}` }; // a local time (TZID, mostly Zurich) is taken as it stands
}

/**
 * A calendar file → [{ uid, title, day, lastDay, allDay, from, to, where, note, link? }] (at most 500, the
 * repeated ones only once, cancelled ones left out).
 */
export function parseIcs(text) {
  const out = [];
  let ev = null;
  let alarm = false;
  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') ev = {};
    else if (line === 'BEGIN:VALARM') alarm = true;
    else if (line === 'END:VALARM') alarm = false;
    else if (line === 'END:VEVENT' && ev) {
      if (ev.start && ev.status !== 'CANCELLED') {
        const allDay = !ev.start.time;
        let lastDay = ev.start.day;
        if (ev.end) lastDay = allDay ? addDays(ev.end.day, -1) : ev.end.day;
        if (lastDay < ev.start.day) lastDay = ev.start.day;
        out.push({ uid: ev.uid ?? '', title: (ev.title ?? '').trim() || '—', day: ev.start.day, lastDay, allDay, from: ev.start.time, to: ev.end?.time ?? null, where: ev.where ?? '', note: ev.note ?? '', ...(ev.link ? { link: ev.link } : {}) });
      }
      ev = null;
      if (out.length >= 500) break;
    } else if (ev && !alarm) {
      const i = line.indexOf(':');
      if (i < 0) continue;
      const [name, ...ps] = line.slice(0, i).split(';');
      const params = ps.join(';');
      const value = line.slice(i + 1);
      const key = name.toUpperCase();
      if (key === 'SUMMARY') ev.title = unesc(value);
      else if (key === 'DESCRIPTION') ev.note = unesc(value).slice(0, 1000);
      else if (key === 'LOCATION') ev.where = unesc(value).slice(0, 200);
      else if (key === 'UID') ev.uid = value;
      else if (key === 'STATUS') ev.status = value.toUpperCase();
      else if (key === 'URL') ev.link = value.trim().slice(0, 300);
      else if (key === 'DTSTART') ev.start = when(value.trim(), params);
      else if (key === 'DTEND') ev.end = when(value.trim(), params);
    }
  }
  const seen = new Set();
  return out.filter((e) => {
    const k = `${e.uid}|${e.day}|${e.title}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
