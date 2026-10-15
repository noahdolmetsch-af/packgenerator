/**
 * «Woche planen» (mockups WP1–WP4, Noah 15.10.2026 21:11 «1a 2a 3b 4a 5a»): one week, Monday to
 * Sunday, with sport and the training plan, dates, to-dos, holidays and bike service in one place.
 * Everything is a suggestion: each kind can be hidden, every suggestion taken or skipped.
 *
 * Nothing is copied: the training plan stays in Aktiv › Training (training.plan), the fixed dates in
 * Aktiv › Woche (flow.fixed, flow.weekPlan), the bike care in Velos › Pflege, trips in Touren. The
 * week reads them and only keeps what is its own (db.settings, they travel with the backup):
 *   week.items     [{ id, kind 'date'|'todo'|'bike', title, day|null, time, done, bikeId?, part? }]
 *   week.away      [{ id, from, to, title, type 'bike'|'off'|'ski', pause, service, pack, shift }]
 *   week.hide      ['sport'|'date'|'todo'|'away'|'bike']  kinds hidden in the week (filter chips)
 *   week.no        ['<ref>|<monday>']                      suggestions skipped for one week
 *   week.planned   'YYYY-MM-DD'                            the Monday last planned with «Woche planen»
 *   week.calendar  [{ id, title, day, time, minutes, src }] dates of an outside calendar. Filled by
 *                  Google Teil 2 (GA, Google Kalender); the week only reads it (CAL_KEY, calEntries).
 * Pure functions; the pages are src/pages/Woche*.svelte, the data comes from lib/woche/load.js.
 */
import { shiftDay, mondayOf, doneBy } from './training.js';

export const ITEMS_KEY = 'week.items';
export const AWAY_KEY = 'week.away';
export const HIDE_KEY = 'week.hide';
export const NO_KEY = 'week.no';
export const PLANNED_KEY = 'week.planned';
/** The door for an outside calendar (Google Teil 2): a list of dates, read here, written there. */
export const CAL_KEY = 'week.calendar';

/** The kinds in the order of the filter chips; each has its colour (app.css --wk-*). */
export const KINDS = ['sport', 'date', 'todo', 'away', 'bike'];
export const KIND_NAMES = { sport: 'Sport and training plan', date: 'Dates|week', todo: 'To-dos', away: 'Holidays and trips', bike: 'Bike service' };
export const AWAY_TYPES = ['bike', 'off', 'ski'];
export const AWAY_NAMES = { bike: 'Bike trip|away', off: 'Holidays without a bike', ski: 'Ski tour|away' };
/** The quiet line under «Add»: sport is planned where it lives, the week only shows it. */
export const TRAIN_NOTE = 'Sport comes from Aktiv › Training and Aktiv › Week. You change it there.';
/** Items done or older than this many days go when the list is saved. */
export const KEEP_DAYS = 60;

const isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d ?? ''));
const isTime = (x) => /^\d{2}:\d{2}$/.test(String(x ?? ''));
const newId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The 7 days of the week of a Monday. */
export const daysOf = (monday) => Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
/** The week «Woche planen» plans: from Saturday on the next one, else this one. */
export const planMonday = (today) => {
  const wd = ((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
  return wd >= 6 ? shiftDay(mondayOf(today), 7) : mondayOf(today);
};

/** One own item made whole; null when it has no title. */
export function cleanItem(x = {}) {
  const title = String(x?.title ?? '').trim().slice(0, 80);
  if (!title) return null;
  const kind = ['date', 'todo', 'bike'].includes(x.kind) ? x.kind : 'todo';
  const day = isDay(x.day) ? x.day : null;
  return {
    id: String(x.id || newId('wi')),
    kind,
    title,
    day: kind === 'date' && !day ? null : day,
    time: isTime(x.time) ? x.time : '',
    done: !!x.done,
    ...(x.bikeId ? { bikeId: String(x.bikeId) } : {}),
    ...(x.part ? { part: String(x.part) } : {}),
  };
}
export const itemsOf = (v) => (Array.isArray(v) ? v.map(cleanItem).filter((x) => x && (x.kind !== 'date' || x.day)) : []);
/** The list without what is long past (done ones and dates older than KEEP_DAYS). */
export const pruneItems = (items, today) => items.filter((x) => !x.day || x.day >= shiftDay(today, -KEEP_DAYS));

/** One holiday made whole (from ≤ to); null without days. The follow-ups default to on (Noah 4a). */
export function cleanAway(a = {}) {
  if (!isDay(a?.from)) return null;
  const to = isDay(a.to) && a.to >= a.from ? a.to : a.from;
  const type = AWAY_TYPES.includes(a.type) ? a.type : 'bike';
  const on = (v, d) => (v === undefined ? d : !!v);
  return {
    id: String(a.id || newId('wa')),
    from: a.from,
    to,
    title: String(a.title ?? '').trim().slice(0, 80),
    type,
    pause: on(a.pause, true),
    service: on(a.service, type === 'bike'),
    pack: on(a.pack, type !== 'off'),
    shift: on(a.shift, false),
  };
}
export const awayOf = (v) => (Array.isArray(v) ? v.map(cleanAway).filter(Boolean).sort((a, b) => a.from.localeCompare(b.from)) : []);
export const awayOn = (away, day) => away.find((a) => a.from <= day && day <= a.to) ?? null;

/** The dates of the outside calendar (Google Teil 2) made whole. */
export const calEntries = (v) =>
  Array.isArray(v)
    ? v
        .filter((x) => isDay(x?.day) && String(x?.title ?? '').trim())
        .map((x) => ({ id: String(x.id ?? `${x.day}-${x.title}`), title: String(x.title).trim().slice(0, 80), day: x.day, time: isTime(x.time) ? x.time : '', src: String(x.src || 'calendar') }))
    : [];

/**
 * The follow-ups of a new holiday (Noah 4a), as changes the page saves:
 *   pack   a to-do «Prepare the packing list» the day before (bike trip, ski tour)
 *   shift  open to-dos dated inside the holidays move to the day after
 * pause and service need no change: the week reads them (sessions paused, service planned before).
 * → { items } the new list of own items.
 */
export function applyAway(away, items = [], name = (s) => s) {
  let next = items.slice();
  if (away.pack && away.type !== 'off' && !next.some((x) => x.ref === `pack:${away.id}`)) {
    const it = cleanItem({ kind: 'todo', title: name('Prepare the packing list: {title}', away.title), day: shiftDay(away.from, -1) });
    if (it) next.push({ ...it, ref: `pack:${away.id}` });
  }
  if (away.shift) next = next.map((x) => (x.kind !== 'date' && !x.done && x.day && x.day >= away.from && x.day <= away.to ? { ...x, day: shiftDay(away.to, 1) } : x));
  return { items: next };
}

/** A day with room: the day from `from` on with the fewest entries, not on holidays (null when none). */
export function freeDay(days, from, away = []) {
  const open = days.filter((d) => d.day >= from && !awayOn(away, d.day));
  if (!open.length) return null;
  return open.reduce((best, d) => (d.entries.length < best.entries.length ? d : best), open[0]).day;
}

/**
 * The week. sources:
 *   monday, today, items, away, hide, no, cal (calEntries), trips [{ id, title, startDate, days }],
 *   sessions (training plan), acts (Strava activities, for «done»), fixed [{ actId, wd, time }],
 *   plans [{ day, actId }] (Aktiv › Woche), actName(id), care [{ bikeId, bikeName, key, part, name }]
 * → { days: [{ day, today, past, away, entries: [{ id, kind, title, sub, time, done, own }] }],
 *     sums: { sessions, mins, goalMins, dates, todos, away, bike }, suggestions: [...], paused: [...] }
 * suggestions: { ref, kind, title, sub, day (proposed), act 'take'|'drop' }
 */
export function buildWeek(src) {
  const { monday, today, items = [], away = [], hide = [], no = [], cal = [], trips = [], sessions = [], acts = [], fixed = [], plans = [], actName = (id) => id, care = [], goalHours = null } = src;
  const week = daysOf(monday);
  const end = shiftDay(monday, 7);
  const skipped = new Set(no.filter((k) => k.endsWith(`|${monday}`)).map((k) => k.slice(0, k.lastIndexOf('|'))));
  const days = week.map((day) => ({ day, today: day === today, past: day < today, away: awayOn(away, day), entries: [] }));
  const at = (day) => days.find((d) => d.day === day);
  const paused = [];

  // sport: the training plan (paused on holidays that pause it), Aktiv's fixed and planned dates
  for (const s of sessions) {
    const d = at(s.day);
    if (!d) continue;
    const a = awayOn(away, s.day);
    if (a?.pause) {
      paused.push({ ref: `drop:${s.id}`, kind: 'sport', title: s.name || null, mins: s.mins, sessionKind: s.kind, day: s.day, away: a });
      continue;
    }
    d.entries.push({ id: `tr:${s.id}`, kind: 'sport', title: s.name || null, sessionKind: s.kind, sub: { mins: s.mins }, time: '', done: !!doneBy(s, acts), own: false, href: '#/flow/training' });
  }
  for (const d of days) {
    if (d.away?.pause) continue;
    const wd = week.indexOf(d.day) + 1;
    for (const f of fixed) if (f.wd === wd) d.entries.push({ id: `fx:${f.id ?? f.actId}`, kind: 'sport', title: actName(f.actId), sub: null, time: f.time ?? '', done: false, own: false, href: '#/flow/week' });
    for (const p of plans) if (p.day === d.day) d.entries.push({ id: `pl:${p.actId}`, kind: 'sport', title: actName(p.actId), sub: null, time: '', done: false, own: false, href: '#/flow/week' });
  }
  // dates: your own and the outside calendar's
  for (const x of cal) at(x.day)?.entries.push({ id: `cal:${x.id}`, kind: 'date', title: x.title, sub: { src: x.src }, time: x.time, done: false, own: false });
  // holidays and trips with dates
  for (const d of days) if (d.away) d.entries.push({ id: `aw:${d.away.id}`, kind: 'away', title: d.away.title || null, sub: { away: d.away.type }, time: '', done: false, own: false, href: '#/week/away' });
  for (const tr of trips) {
    if (!isDay(tr.startDate)) continue;
    const n = Math.max(1, Math.round(Number(tr.days) || 1));
    for (let i = 0; i < n; i++) {
      const d = at(shiftDay(tr.startDate, i));
      if (d && !d.entries.some((e) => e.kind === 'away' && e.title === tr.title)) d.entries.push({ id: `trip:${tr.id}:${i}`, kind: 'away', title: tr.title || null, sub: { trip: i + 1, of: n }, time: '', done: false, own: false, href: '#/trips' });
    }
  }
  // own items: dates, to-dos and bike service with a day in the week
  for (const x of items) {
    if (!x.day) continue;
    at(x.day)?.entries.push({ id: x.id, kind: x.kind, title: x.title, sub: null, time: x.time, done: x.done, own: true });
  }
  const order = { away: 0, date: 1, sport: 2, bike: 3, todo: 4 };
  for (const d of days) d.entries.sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || order[a.kind] - order[b.kind]);

  // suggestions: to-dos without a day, bike care not planned yet, sessions paused by holidays
  const from = monday > today ? monday : today;
  const nextAway = away.find((a) => a.to >= from && a.from < end) ?? null;
  const suggestions = [];
  for (const x of items) if (x.kind === 'todo' && !x.day && !x.done && !skipped.has(`todo:${x.id}`)) suggestions.push({ ref: `todo:${x.id}`, kind: 'todo', title: x.title, sub: null, day: freeDay(days, from, away), act: 'take', id: x.id });
  const planned = new Set(items.filter((x) => x.kind === 'bike' && !x.done).map((x) => `${x.bikeId}:${x.part}`));
  for (const c of care) {
    const ref = `bike:${c.bikeId}:${c.key}`;
    if (planned.has(`${c.bikeId}:${c.key}`) || skipped.has(ref)) continue;
    // before the next holidays that ask for it (Noah 4a «Velo-Service vorher»), else the first free day
    const before = nextAway?.service && nextAway.from > from ? shiftDay(nextAway.from, -1) : null;
    const day = before && before < end ? freeDay(days.filter((d) => d.day <= before), from, away) ?? before : freeDay(days, from, away);
    suggestions.push({ ref, kind: 'bike', title: c.name, sub: { bike: c.bikeName, before: before && nextAway ? nextAway.title || true : null }, day, act: 'take', bikeId: c.bikeId, part: c.key });
  }
  for (const p of paused) if (!skipped.has(p.ref)) suggestions.push({ ...p, sub: { paused: p.away.title || true }, act: 'drop' });

  const shown = (k) => !hide.includes(k);
  const all = days.flatMap((d) => d.entries);
  const sums = {
    sessions: all.filter((e) => e.kind === 'sport').length,
    mins: all.filter((e) => e.id.startsWith('tr:')).reduce((n, e) => n + (e.sub?.mins ?? 0), 0),
    goalMins: goalHours ? Math.round(goalHours * 60) : null,
    dates: all.filter((e) => e.kind === 'date').length,
    todos: all.filter((e) => e.kind === 'todo' && !e.done).length,
    away: days.filter((d) => d.entries.some((e) => e.kind === 'away')).map((d) => d.day),
    bike: all.filter((e) => e.kind === 'bike' && !e.done).length + suggestions.filter((s) => s.kind === 'bike').length,
  };
  return {
    days: days.map((d) => ({ ...d, entries: d.entries.filter((e) => shown(e.kind)) })),
    sums,
    suggestions: suggestions.filter((s) => shown(s.kind)),
    paused,
  };
}

/** Skip a suggestion for the week of that Monday (old ones go after two weeks). */
export const skipFor = (no = [], ref, monday) => [...new Set([...no.filter((k) => k.slice(-10) >= shiftDay(monday, -14)), `${ref}|${monday}`])];

/** The kinds of a day's entries, once each, for the dots on Heute. */
export const dotsOf = (day) => [...new Set(day.entries.map((e) => e.kind))];

/** The day range of two days as «23.–25.10.» parts are left to the page; here: the number of days. */
export const awayDays = (a) => Math.round((Date.parse(`${a.to}T12:00:00Z`) - Date.parse(`${a.from}T12:00:00Z`)) / 864e5) + 1;
