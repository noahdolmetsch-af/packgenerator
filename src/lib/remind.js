/**
 * Erinnerungen überall (mockups ER1–ER3, Noah «1a 2a 3a 4a 5b er1-er3 freigabe» 14.10.2026):
 * at sensible places the app asks once «Soll ich dich in Zukunft erinnern?» (1a: a card under what was
 * just saved), with a time from the history (3a). «Nein danke» asks again after 30 days (2a), «Nie
 * fragen» never again. All reminders are set on one page, Ich › Erinnerungen (4a), and show only in
 * Kalender › Merken, not on Heute (5b). A reminder is a to-do of merken.js with area and src.
 * Pure functions; remindStore.svelte.js and the pages write.
 */
import { addDays } from './merken.js';

/** The settings records: what was answered per place, and whether the app may ask at all (ER3). */
export const ASK_KEY = 'remind.ask';
export const OFFER_KEY = 'remind.offer';
export const ICS_KEY = 'remind.ics';
export const AGAIN_DAYS = 30;

/** The areas on Ich › Erinnerungen, in this order (ER3). */
export const AREAS = [
  { key: 'active', label: 'Active|place' },
  { key: 'trips', label: 'Trips|place' },
  { key: 'bike', label: 'Bike|area' },
  { key: 'own', label: 'Own|reminders' },
];
export const areaOf = (todo) => (AREAS.some((a) => a.key === todo.area) ? todo.area : 'own');

/**
 * Whether to ask at this place now. answers: the ASK_KEY record ({ [src]: { no: day } | { never: true } });
 * todos: the Merken list (a place that has a reminder is not asked again); offer: the ER3 switch.
 */
export function shouldAsk(src, { answers = {}, todos = [], today, offer = true } = {}) {
  if (!src || offer === false) return false;
  if (todos.some((t) => !t.doneAt && (t.src === src || t.src?.startsWith(`${src}:`)))) return false;
  const a = answers[src];
  if (a?.never) return false;
  if (a?.no && addDays(a.no, AGAIN_DAYS) > today) return false;
  return true;
}

/** The answer record after «Nein danke» (no) or «Nie fragen» (never); «Zurücksetzen» deletes it. */
export const answer = (answers, src, how, today) => ({ ...answers, [src]: how === 'never' ? { never: true } : { no: today } });
export const forget = (answers, src) => Object.fromEntries(Object.entries(answers).filter(([k]) => k !== src));
/** The places set to «Nie fragen» (ER3 «Nie gefragt»). */
export const neverAsked = (answers) => Object.keys(answers).filter((k) => answers[k]?.never);

/* ---------- 3a: the time from the history ---------- */

const pad = (n) => String(n).padStart(2, '0');
/** The weekday of a day, 0 = Monday … 6 = Sunday. */
export const weekdayOf = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
/** The next day on this weekday, today included. */
export const nextWeekday = (today, wd) => addDays(today, (wd - weekdayOf(today) + 7) % 7);

/** Clock time 'HH:MM' of an ISO moment on this device, rounded to the quarter hour. */
export function clockOf(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  let m = Math.round((d.getHours() * 60 + d.getMinutes()) / 15) * 15;
  if (m >= 24 * 60) m = 24 * 60 - 15;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
const median = (list) => {
  const s = [...list].sort();
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

/**
 * The rhythm the entries of one activity suggest (ER1 «Du warst die letzten 3 Wochen jeden Dienstag»):
 * entries [{ day, at }]. 5 of the last 7 days → every day; else the weekday seen at least twice in the
 * last 3 weeks → every week; else every week on today's weekday. at: the usual clock time.
 * → { every: 'day' | 'week', weekday, at, weeks, seen }
 */
export function suggestRhythm(entries = [], today, fallbackAt = '18:00') {
  const recent = entries.filter((e) => e.day && e.day <= today && e.day > addDays(today, -21));
  const days = new Set(recent.map((e) => e.day));
  const at = median(recent.map((e) => (e.at ? clockOf(e.at) : null)).filter(Boolean)) ?? fallbackAt;
  const week = [...days].filter((d) => d > addDays(today, -7)).length;
  if (week >= 5) return { every: 'day', weekday: null, at, seen: week };
  const count = Array(7).fill(0);
  for (const d of days) count[weekdayOf(d)]++;
  const best = count.indexOf(Math.max(...count));
  if (count[best] >= 2) return { every: 'week', weekday: best, at, seen: count[best] };
  return { every: 'week', weekday: weekdayOf(today), at, seen: 0 };
}

/** «1 Std. vorher»: the clock an hour earlier. */
export function hourBefore(at) {
  const [h, m] = at.split(':').map(Number);
  return `${pad((h + 23) % 24)}:${pad(m)}`;
}

/**
 * The reminder for an activity: the first day after today (or today when the time is still ahead).
 * nowClock: 'HH:MM' now on this device.
 */
export function activityReminder(act, rhythm, { today, nowClock = '00:00', earlier = false, at = null } = {}) {
  const time = at ?? (earlier ? hourBefore(rhythm.at) : rhythm.at);
  let due = rhythm.every === 'day' ? today : nextWeekday(today, rhythm.weekday);
  if (due === today && time <= nowClock) due = addDays(due, rhythm.every === 'day' ? 1 : 7);
  return { text: act.name, due, remind: { at: time, before: 0 }, repeat: { every: rhythm.every }, area: 'active', src: `act:${act.id}` };
}

/* ---------- ER2: before a tour ---------- */

/** The three steps before a trip (ER2 «packen, laden, Wetter prüfen»), each with its day and time. */
export const TRIP_STEPS = [
  { key: 'pack', label: 'Pack', days: 2, at: '18:00' },
  { key: 'charge', label: 'Charge', days: 1, at: '20:00' },
  { key: 'weather', label: 'Weather', days: 1, at: '18:00' },
];

/** The steps still ahead for a trip starting on startDate (a step whose day passed is left out). */
export const tripSteps = (startDate, today) => (startDate ? TRIP_STEPS.map((s) => ({ ...s, day: addDays(startDate, -s.days) })).filter((s) => s.day >= today) : []);

/** The to-dos for the chosen steps. */
export const tripReminders = (trip, steps, texts) => steps.map((s) => ({ text: texts[s.key](trip.title || ''), due: s.day, remind: { at: s.at, before: 0 }, area: 'trips', src: `trip:${trip.id}:${s.key}` }));

/* ---------- ER2: bike care ---------- */

/** The ways after «Kette geölt» (ER2): after 300 km, every month, after rain. */
export const CARE_WAYS = ['km', 'month', 'rain'];

/** The reminder after a care job on a bike. way: one of CARE_WAYS. */
export function careReminder({ bike, kind, text, today, way, km = 300 }) {
  const src = `care:${bike.id}:${kind}`;
  if (way === 'km') return { text, area: 'bike', src, repeat: { every: 'km', km, bikeId: bike.id, fromKm: bike.km ?? 0 } };
  if (way === 'rain') return { text, area: 'bike', src, repeat: { every: 'rain', bikeId: bike.id } };
  return { text, area: 'bike', src, due: addDays(today, 30), remind: { at: '08:00', before: 0 }, repeat: { every: 'month' } };
}

/* ---------- the phone calendar (ER3 «Google-Kalender mit Alarm») ---------- */

/** A calendar file for reminders with a time, each with an alarm at that time (VALARM). icsCalendar: flowmed.js. */
export function remindIcs(todos, icsCalendar, now = Date.now()) {
  const rr = (r) => (r?.every === 'day' ? 'FREQ=DAILY' : r?.every === 'week' ? 'FREQ=WEEKLY' : r?.every === 'month' ? `FREQ=MONTHLY${r.n > 1 ? `;INTERVAL=${r.n}` : ''}` : undefined);
  const events = todos.filter((t) => t.due && t.remind && !t.off).map((t) => ({ uid: `remind-${t.id}`, title: t.text, day: addDays(t.due, -(t.remind.before ?? 0)), time: t.remind.at, minutes: 15, rrule: rr(t.repeat) }));
  return icsCalendar(events, now).replace(/END:VEVENT/g, 'BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder\r\nTRIGGER:PT0M\r\nEND:VALARM\r\nEND:VEVENT');
}
