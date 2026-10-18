/**
 * Routine «Das tut mir gut» (mockups D1 and D2, Noah 12.10.2026 «d1-d5 freigeben», answer 1a: a wide
 * tile at the top of Heute). A short list of things that do you good, ticked off day by day.
 *
 * The record is the settings key «routine» (it travels in every backup with the settings table):
 *   { items: [{ id, name, days, link, time }], ticks: { [itemId]: ['YYYY-MM-DD', …] } }
 *   name: English key for t() (the examples) or the words typed; «{time}» in it is filled with `time`.
 *   days: null (every day) or the weekdays it is for, 0 = Monday … 6 = Sunday.
 *   link: null or 'meditation' (it ticks itself when Im Flow has a meditation that day).
 *   time: null or 'HH:MM' (e.g. «Up before 5:55»).
 * Days are calendar days ('YYYY-MM-DD', today from localDay()); all arithmetic is on the calendar
 * (UTC midnight of the day), never «now + n × 24 h». Pure functions, tested in tests/routine.test.js.
 * Everything is a suggestion: every example can be renamed or deleted, the tile taken off the wall.
 */

export const ROUTINE_KEY = 'routine';
/** The weekdays, 0 = Monday … 6 = Sunday (English keys for t(), short). */
export const WEEKDAYS = ['Mon|short', 'Tue|short', 'Wed|short', 'Thu|short', 'Fri|short', 'Sat|short', 'Sun|short'];
/** The links an item can have: none, or Im Flow's meditation. */
export const LINKS = [null, 'meditation'];
/** Milestones of days in a row; the footer shows the nearest one. */
export const STEPS = [7, 14, 30, 60, 100, 365];

/* ---------- days ---------- */
const MS = 864e5;
const toMs = (day) => Date.parse(`${day}T00:00:00Z`);
export const addDays = (day, n) => new Date(toMs(day) + n * MS).toISOString().slice(0, 10);
/** The weekday of a calendar day, 0 = Monday … 6 = Sunday. */
export const weekdayOf = (day) => (new Date(toMs(day)).getUTCDay() + 6) % 7;
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
/** «05:55» → «5:55». */
export const hm = (time) => (isTime(time) ? time.replace(/^0(\d)/, '$1') : '');

/* ---------- the examples (fictional, generic) ---------- */
/** The seven examples of the start (mockup D1); all can be renamed, moved or deleted. */
export function seedItems() {
  return [
    { id: 'wake', name: 'Up before {time}', time: '05:55' },
    { id: 'meditate', name: 'Meditated yet?', link: 'meditation' },
    { id: 'banana', name: 'A banana for breakfast' },
    { id: 'shower', name: 'A fresh shower' },
    { id: 'yoga', name: 'Yoga today?', days: [3] },
    { id: 'walk', name: 'A walk' },
    { id: 'kind', name: 'Say something kind to someone' },
  ].map(normItem);
}
/** What can be added with one tap (mockup D2 «Hinzufügen»), besides an own one. */
export const SUGGESTIONS = [
  { key: 'yoga', name: 'Yoga today?' },
  { key: 'invite', name: 'Invite someone' },
  { key: 'tidy', name: 'All tidy' },
  { key: 'family', name: 'Visit family' },
  { key: 'water', name: 'Drink 2 litres' },
  { key: 'bed', name: 'In bed before {time}', time: '22:30' },
  { key: 'meditate', name: 'Meditated yet?', link: 'meditation' },
  { key: 'walk', name: 'A walk' },
];

/* ---------- the record ---------- */
export function normItem(x = {}) {
  const days = Array.isArray(x.days) ? [...new Set(x.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b) : null;
  return {
    id: String(x.id || `r-${Math.random().toString(36).slice(2, 9)}`),
    name: String(x.name ?? '').slice(0, 80),
    days: days && days.length && days.length < 7 ? days : null,
    link: LINKS.includes(x.link) ? x.link : null,
    time: isTime(x.time) ? x.time : null,
  };
}
/** A stored record made safe; without one the seven examples and no ticks. */
export function routineOf(value) {
  if (!value || !Array.isArray(value.items)) return { items: seedItems(), ticks: {} };
  const seen = new Set();
  const items = value.items.filter((x) => x && x.id && !seen.has(x.id) && seen.add(x.id)).map(normItem);
  const ticks = {};
  for (const [id, list] of Object.entries(value.ticks ?? {})) {
    if (!seen.has(id) || !Array.isArray(list)) continue;
    const ok = [...new Set(list.filter(isDay))].sort();
    if (ok.length) ticks[id] = ok;
  }
  return { items, ticks };
}

/* ---------- which items, which day ---------- */
/** Is the item for this day (every day, or one of its weekdays)? */
export const isFor = (item, day) => !item.days || item.days.includes(weekdayOf(day));
/** The items for a day, in the list's order. */
export const itemsFor = (items = [], day) => items.filter((x) => isFor(x, day));
/**
 * The list as the editor shows it for a chip (mockup D2): 'all' the items of every day, a weekday
 * (0–6) the items of that day. extra(w): how many items that day has besides those of every day («Do · +1»).
 */
export const listFor = (items = [], view = 'all') => (view === 'all' ? items.filter((x) => !x.days) : items.filter((x) => !x.days || x.days.includes(view)));
export const extraOn = (items = [], w) => items.filter((x) => x.days && x.days.includes(w)).length;

/* ---------- ticks ---------- */
/**
 * The days an item counts as done: its own ticks and, for a linked one, the days Im Flow knows
 * (auto: { meditation: Set of days }).
 */
export function doneDays(routine, item, auto = {}) {
  const own = routine.ticks[item.id] ?? [];
  const linked = item.link && auto[item.link] ? [...auto[item.link]] : [];
  return new Set([...own, ...linked]);
}
export const isDone = (routine, item, day, auto = {}) => doneDays(routine, item, auto).has(day);
/** Ticked by the link (not by hand) that day. */
export const isAuto = (routine, item, day, auto = {}) => !!(item.link && auto[item.link]?.has(day));
/** Tick an item for a day, or take the tick back (a second tap). → a new record */
export function toggleTick(routine, id, day) {
  const list = routine.ticks[id] ?? [];
  const next = list.includes(day) ? list.filter((d) => d !== day) : [...list, day].sort();
  const ticks = { ...routine.ticks };
  if (next.length) ticks[id] = next;
  else delete ticks[id];
  return { ...routine, ticks };
}
/** «3 of 7»: the items done of the items for the day. */
export function countFor(routine, day, auto = {}) {
  const list = itemsFor(routine.items, day);
  return { n: list.filter((x) => isDone(routine, x, day, auto)).length, of: list.length };
}

/**
 * Days in a row: the days the item is for, counted back from today, all done. Today not yet done
 * does not break it (the day is not over), it starts from the day before then. Days the item is not
 * for are skipped (a Thursday item counts Thursdays). Any other day not done breaks the row, an empty
 * day too (Noah 18.10.2026 «6b»). → n
 */
export function streakOf(routine, item, today, auto = {}) {
  const done = doneDays(routine, item, auto);
  if (!done.size) return 0;
  let day = today;
  if (!done.has(day)) day = addDays(day, -1);
  let n = 0;
  for (let i = 0; i < 800; i++) {
    if (isFor(item, day)) {
      if (!done.has(day)) break;
      n++;
    }
    day = addDays(day, -1);
  }
  return n;
}
/** A streak is shown from 2 days in a row (mockup D1 «🔥 12 Tage»). */
export const SHOW_STREAK = 2;

/**
 * The nearest milestone: of the items with a streak, the one closest to its next step.
 * → { item, streak, goal, left } or, with no streak yet, { item: null, goal: 14, left: 14 }.
 */
export function nextMilestone(routine, today, auto = {}) {
  let best = null;
  for (const item of routine.items) {
    const s = streakOf(routine, item, today, auto);
    if (s < 1) continue;
    const goal = STEPS.find((g) => g > s) ?? null;
    if (!goal) continue;
    const left = goal - s;
    if (!best || left < best.left) best = { item, streak: s, goal, left };
  }
  return best ?? { item: null, streak: 0, goal: 14, left: 14 };
}

/* ---------- the list ---------- */
export const newItem = (name, extra = {}) => normItem({ ...extra, id: `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: String(name ?? '').trim() });
export const addItem = (routine, item) => ({ ...routine, items: [...routine.items, normItem(item)] });
export const renameItem = (routine, id, name) => ({ ...routine, items: routine.items.map((x) => (x.id === id && String(name).trim() ? { ...x, name: String(name).trim().slice(0, 80) } : x)) });
export const patchItem = (routine, id, patch) => ({ ...routine, items: routine.items.map((x) => (x.id === id ? normItem({ ...x, ...patch, id }) : x)) });
/** Delete an item; its ticks go along (and come back with «Undo», which puts the old record back). */
export function removeItem(routine, id) {
  const ticks = { ...routine.ticks };
  delete ticks[id];
  return { items: routine.items.filter((x) => x.id !== id), ticks };
}
/** Move item `id` to place `to` among the items of the list. */
export function moveItem(routine, id, to) {
  const i = routine.items.findIndex((x) => x.id === id);
  if (i < 0) return routine;
  const items = [...routine.items];
  const [x] = items.splice(i, 1);
  items.splice(Math.max(0, Math.min(items.length, to)), 0, x);
  return { ...routine, items };
}
/** One place up (−1) or down (+1) within a shown list (the ids as shown), keeping the others where they are. */
export function stepItem(routine, shownIds, id, dir) {
  const i = shownIds.indexOf(id);
  const other = shownIds[i + dir];
  if (i < 0 || !other) return routine;
  return moveItem(routine, id, routine.items.findIndex((x) => x.id === other));
}
/** Days for the weekday chips: toggling one; all seven or none means every day (null). */
export function toggleDay(days, w) {
  const cur = days ?? [0, 1, 2, 3, 4, 5, 6];
  const next = cur.includes(w) ? cur.filter((d) => d !== w) : [...cur, w].sort((a, b) => a - b);
  return next.length && next.length < 7 ? next : null;
}
/** Plain for saving (no proxies). */
export const recordOf = (routine) => JSON.parse(JSON.stringify({ items: routine.items, ticks: routine.ticks }));
