/**
 * Paket P4 «Aktiv» (mockup ME4, Noah 21.10.2026 «alle offenen Mockups freigegeben»): the yoga card on the
 * meditation page. Your regular classes (weekday, time, name), the studio (a link to its timetable and a
 * name, only on this device and in the backup), the next class and after it «war dort / ausgelassen».
 * «War dort» also ticks Yoga in Aktiv (sub-goal «Yoga Studio»), so it counts in the Rückblick as yoga,
 * apart from meditation. Settings record «yoga.studio». Pure functions, tested in tests/yogastudio.test.js.
 */
import { addDays } from './flow.js';
import { safeUrl } from './tennisday.js';

export const YOGA_KEY = 'yoga.studio';
export const YOGA_ACT = 'yoga';
/** Monday = 1 … Sunday = 7 (ISO), English keys for t(). */
export const WEEKDAYS = [
  { wd: 1, label: 'Mon|weekday' },
  { wd: 2, label: 'Tue|weekday' },
  { wd: 3, label: 'Wed|weekday' },
  { wd: 4, label: 'Thu|weekday' },
  { wd: 5, label: 'Fri|weekday' },
  { wd: 6, label: 'Sat|weekday' },
  { wd: 7, label: 'Sun|weekday' },
];

const hm = (s) => (/^\d{2}:\d{2}$/.test(s ?? '') ? s : '');
const wdOk = (n) => Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 7;

/** The ISO weekday (1–7) of a day 'YYYY-MM-DD'. */
export const weekdayOf = (day) => {
  const d = new Date(`${day}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
};

const cleanClass = (c = {}) => ({ id: String(c.id ?? ''), wd: wdOk(c.wd) ? Number(c.wd) : 1, time: hm(c.time) || '18:00', name: String(c.name ?? '').trim().slice(0, 60) });

/** The record made whole: { studio: { url, name }, classes: [{ id, wd, time, name }], visits: [{ day, classId, went, flowId? }] }. */
export function yogaOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const s = v.studio && typeof v.studio === 'object' ? v.studio : {};
  return {
    studio: { url: safeUrl(s.url), name: String(s.name ?? '').trim().slice(0, 60) },
    classes: (Array.isArray(v.classes) ? v.classes : []).filter((c) => c && c.id).map(cleanClass),
    visits: (Array.isArray(v.visits) ? v.visits : []).filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.day ?? '') && x.classId).map((x) => ({ day: x.day, classId: String(x.classId), went: !!x.went, ...(x.flowId ? { flowId: String(x.flowId) } : {}) })),
  };
}

export const setStudio = (v, { url = '', name = '' } = {}) => ({ ...yogaOf(v), studio: { url: safeUrl(url), name: String(name).trim().slice(0, 60) } });
export const addClass = (v, c, id = `yc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`) => {
  const y = yogaOf(v);
  return { ...y, classes: [...y.classes, cleanClass({ ...c, id })] };
};
export const editClass = (v, id, patch) => {
  const y = yogaOf(v);
  return { ...y, classes: y.classes.map((c) => (c.id === id ? cleanClass({ ...c, ...patch, id }) : c)) };
};
/** Delete a class; its visits stay (they are the history). */
export const dropClass = (v, id) => {
  const y = yogaOf(v);
  return { ...y, classes: y.classes.filter((c) => c.id !== id) };
};
/** Move class `from` to place `to` (arrows and drag). */
export function moveClass(v, from, to) {
  const y = yogaOf(v);
  const list = [...y.classes];
  if (from < 0 || from >= list.length) return y;
  const j = Math.max(0, Math.min(list.length - 1, to));
  const [x] = list.splice(from, 1);
  list.splice(j, 0, x);
  return { ...y, classes: list };
}

/** The next class from now on: { cls, day, inDays } or null. now: 'HH:MM'. */
export function nextClass(v, today, now = '00:00') {
  const { classes } = yogaOf(v);
  if (!classes.length) return null;
  let best = null;
  for (let i = 0; i <= 7; i++) {
    const day = addDays(today, i);
    const wd = weekdayOf(day);
    const list = classes.filter((c) => c.wd === wd && (i > 0 || c.time > now)).sort((a, b) => a.time.localeCompare(b.time));
    if (list.length) {
      best = { cls: list[0], day, inDays: i };
      break;
    }
  }
  return best;
}

/** The answer for a class on a day, or null. */
export const visitOf = (v, day, classId) => yogaOf(v).visits.find((x) => x.day === day && x.classId === classId) ?? null;

/**
 * After the class: the classes of today that are over, and of yesterday, without an answer, latest first.
 * → [{ cls, day }]
 */
export function openVisits(v, today, now = '23:59') {
  const y = yogaOf(v);
  const out = [];
  for (const day of [today, addDays(today, -1)]) {
    const wd = weekdayOf(day);
    for (const c of y.classes) if (c.wd === wd && (day < today || c.time <= now) && !visitOf(y, day, c.id)) out.push({ cls: c, day });
  }
  return out;
}

/** Note «war dort» (went) or «ausgelassen»; an answer for the same day and class is replaced. */
export function markVisit(v, { day, classId, went, flowId = null }) {
  const y = yogaOf(v);
  const rest = y.visits.filter((x) => !(x.day === day && x.classId === classId));
  return { ...y, visits: [...rest, { day, classId, went: !!went, ...(flowId ? { flowId } : {}) }].sort((a, b) => a.day.localeCompare(b.day)).slice(-200) };
}
/** Take an answer back (Undo). */
export const unmarkVisit = (v, day, classId) => {
  const y = yogaOf(v);
  return { ...y, visits: y.visits.filter((x) => !(x.day === day && x.classId === classId)) };
};

/** The last 30 days: { went, skipped }. */
export function visitCount(v, today) {
  const from = addDays(today, -29);
  const list = yogaOf(v).visits.filter((x) => x.day >= from && x.day <= today);
  return { went: list.filter((x) => x.went).length, skipped: list.filter((x) => !x.went).length };
}
