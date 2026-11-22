/**
 * «Datum in Alltagssprache» (Noah 05.11.2026 «N1»): «Velo putzen morgen 18 Uhr, jeden Sonntag» becomes the
 * words «Velo putzen» with the date, the reminder time and the repeat found in it. A rule, no AI, nothing
 * leaves the device: only a suggestion, the caller shows what was found as chips that can be changed or left out.
 * German and English words. Pure, on calendar days (YYYY-MM-DD), never Date.now().
 */
import { addDays } from '../merken.js';

const L = '[\\p{L}\\d]';
/** A word-bounded pattern (\b does not know umlauts). */
const W = (src) => new RegExp(`(?<!${L})(?:${src})(?!${L})`, 'iu');

/** Weekday words → getUTCDay() (0 = Sunday). */
const DAYS = [
  ['sonntag|sonntags|sunday', 0],
  ['montag|montags|monday', 1],
  ['dienstag|dienstags|tuesday', 2],
  ['mittwoch|mittwochs|wednesday', 3],
  ['donnerstag|donnerstags|thursday', 4],
  ['freitag|freitags|friday', 5],
  ['samstag|samstags|sonnabend|saturday', 6],
];
export const WEEKDAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dow = (day) => new Date(`${day}T12:00:00Z`).getUTCDay();
/** The next day with this weekday, strictly after today. */
export function nextWeekday(today, wd) {
  const diff = (wd - dow(today) + 7) % 7 || 7;
  return addDays(today, diff);
}
const pad = (n) => String(n).padStart(2, '0');

function cut(s, m) {
  return `${s.slice(0, m.index)} ${s.slice(m.index + m[0].length)}`;
}

/**
 * @returns {{ text: string, due: string|null, remind: {at:string,before:0}|null,
 *            repeat: {every:'day'|'week'|'month'}|null,
 *            found: Array<{kind:'due'|'time'|'repeat', value:any}> }}
 *   `text` is what is left of the words; `found` is what the words said (for the chips).
 */
export function parseWhen(input, today) {
  const orig = String(input ?? '');
  let s = ` ${orig} `;
  let due = null;
  let time = null;
  let repeat = null;
  let repeatWd = null;
  let m;

  // repeat: «jeden Sonntag» repeats weekly and also names the first day
  const DAYRX = DAYS.map(([src]) => src).join('|');
  if ((m = s.match(W(`(?:jeden|every|each)\\s+(${DAYRX})`)))) {
    repeat = { every: 'week' };
    repeatWd = DAYS.find(([src, n]) => new RegExp(`^(?:${src})$`, 'i').test(m[1]))?.[1] ?? null;
    s = cut(s, m);
  } else if ((m = s.match(W('jeden\\s+tag|jeder\\s+tag|täglich|taeglich|every\\s+day|daily')))) {
    repeat = { every: 'day' };
    s = cut(s, m);
  } else if ((m = s.match(W('jede\\s+woche|wöchentlich|woechentlich|every\\s+week|weekly')))) {
    repeat = { every: 'week' };
    s = cut(s, m);
  } else if ((m = s.match(W('jeden\\s+monat|jeder\\s+monat|monatlich|every\\s+month|monthly')))) {
    repeat = { every: 'month' };
    s = cut(s, m);
  }

  // day
  if ((m = s.match(W('übermorgen|uebermorgen|day\\s+after\\s+tomorrow')))) {
    due = addDays(today, 2);
    s = cut(s, m);
  } else if ((m = s.match(W('morgen|tomorrow')))) {
    due = addDays(today, 1);
    s = cut(s, m);
  } else if ((m = s.match(W('heute|today')))) {
    due = today;
    s = cut(s, m);
  } else if ((m = s.match(W('(?:am\\s+|this\\s+)?wochenende|(?:on\\s+)?the\\s+weekend|this\\s+weekend')))) {
    due = nextWeekday(addDays(today, -1), 6); // Saturday, today included
    s = cut(s, m);
  } else if ((m = s.match(W('(?:in|nach)\\s+(\\d{1,3})\\s+(tag(?:en|e)?|days?|wochen?|weeks?|monat(?:en|e)?|months?)')))) {
    const n = +m[1];
    const u = m[2].toLowerCase();
    due = u.startsWith('tag') || u.startsWith('day') ? addDays(today, n) : u.startsWith('woche') || u.startsWith('week') ? addDays(today, 7 * n) : addDays(today, 30 * n);
    s = cut(s, m);
  } else if ((m = s.match(/(?<![\p{L}\d])(\d{4})-(\d{2})-(\d{2})(?![\p{L}\d])/u)) && validDay(`${m[1]}-${m[2]}-${m[3]}`)) {
    due = `${m[1]}-${m[2]}-${m[3]}`;
    s = cut(s, m);
  } else if ((m = s.match(/(?<![\p{L}\d.])(\d{1,2})\.(\d{1,2})\.(\d{2,4})?(?![\p{L}\d])/u)) && (due = fromDM(m, today))) {
    s = cut(s, m);
  } else if ((m = s.match(W(`(?:am\\s+|on\\s+|nächsten\\s+|naechsten\\s+|next\\s+|this\\s+)?(${DAYRX})`)))) {
    const wd = DAYS.find(([src]) => new RegExp(`^(?:${src})$`, 'i').test(m[1]))?.[1];
    due = nextWeekday(today, wd);
    s = cut(s, m);
  }
  if (!due && repeatWd != null) due = nextWeekday(today, repeatWd);

  // time of day: «18 Uhr», «18:30», «um 18.30 Uhr», «6pm»
  if ((m = s.match(W('(?:um\\s+|at\\s+)?(\\d{1,2})(?:[:.](\\d{2}))?\\s*uhr')))) {
    time = hm(+m[1], +(m[2] ?? 0));
    if (time) s = cut(s, m);
  } else if ((m = s.match(/(?<![\p{L}\d.])(?:um\s+|at\s+)?(\d{1,2}):(\d{2})(?![\p{L}\d])/iu))) {
    time = hm(+m[1], +m[2]);
    if (time) s = cut(s, m);
  } else if ((m = s.match(W('(?:at\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)')))) {
    let h = +m[1] % 12;
    if (m[3].toLowerCase() === 'pm') h += 12;
    time = hm(h, +(m[2] ?? 0));
    if (time) s = cut(s, m);
  }

  const found = [];
  if (!due && time) due = today; // a time alone means today
  if (due) found.push({ kind: 'due', value: due });
  if (time) found.push({ kind: 'time', value: time });
  if (repeat) found.push({ kind: 'repeat', value: repeat.every });
  if (!found.length) return { text: orig.trim(), due: null, remind: null, repeat: null, found: [] };

  let text = s.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').replace(/^[\s,.;:–-]+|[\s,.;:–-]+$/g, '').replace(/\s+(?:am|um|on|at|am|bis|by)$/i, '').trim();
  if (!text) return { text: orig.trim(), due: null, remind: null, repeat: null, found: [] }; // only date words: keep them as the text
  return { text, due, remind: time ? { at: time, before: 0 } : null, repeat, found };
}

function hm(h, mi) {
  return h >= 0 && h <= 23 && mi >= 0 && mi <= 59 ? `${pad(h)}:${pad(mi)}` : null;
}
function validDay(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === day;
}
/** «24.12.» or «24.12.2026»: this year, or next year when the day has passed. */
function fromDM(m, today) {
  const dd = +m[1];
  const mm = +m[2];
  const y0 = +today.slice(0, 4);
  let y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : y0;
  let day = `${y}-${pad(mm)}-${pad(dd)}`;
  if (!validDay(day)) return null;
  if (!m[3] && day < today) {
    y += 1;
    day = `${y}-${pad(mm)}-${pad(dd)}`;
    if (!validDay(day)) return null;
  }
  return day;
}
