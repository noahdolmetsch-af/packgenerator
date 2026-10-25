/**
 * Merken (Kal1, mockups PL1–PL3, Noah «PL1-PL3 freigeben» and «1a» on 14.10.2026): own to-dos with
 * an optional date, a reminder and a repeat by time or by km. Pure functions; merkendb.js writes.
 *   todo = { id, text, due: 'YYYY-MM-DD' | null, remind: null | { at: 'HH:MM', before: 0 | 1 },
 *            repeat: null | { every: 'day' | 'week' } | { every: 'month', n? } | { every: 'km', km, bikeId, fromKm }
 *                    | { every: 'rain', bikeId },
 *            list: string | null, created, doneAt: null | ISO,
 *            area?: 'active' | 'trips' | 'bike' | 'own', src?: the place that offered it (remind.js), off?: true }
 * Only «text» is needed (PL2: «Nur «Was?» ist nötig»); everything else is a suggestion.
 * Erinnerungen (ER1–ER3, Noah «1a 2a 3a 4a 5b er1-er3 freigabe» 14.10.2026) are to-dos with a reminder,
 * so they show in Kalender › Merken (5b) and Ich › Erinnerungen lists and switches them (off).
 */

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar-day arithmetic on YYYY-MM-DD (UTC noon, so no time zone shifts the day). */
export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Same day n months later (default 1); the 31st becomes the last day of a shorter month. */
export function addMonth(day, n = 1) {
  const [y, m, dd] = day.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  const d = new Date(Date.UTC(y, m - 1 + n, Math.min(dd, last), 12));
  return d.toISOString().slice(0, 10);
}

/** A new to-do; empty text gives null. */
export function newTodo({ text, due = null, remind = null, repeat = null, list = null, area = null, src = null, wait = null } = {}, { id, now = new Date().toISOString() } = {}) {
  const tx = String(text ?? '').trim();
  if (!tx) return null;
  const td = { id, text: tx, due: DAY.test(due ?? '') ? due : null, remind: due ? remind : null, repeat, list, created: now, doneAt: null };
  if (area) td.area = area;
  if (src) td.src = src;
  if (wait) td.wait = wait; // Paket A part 1 (stand/stand.js): what the to-do waits on
  return td;
}

/**
 * Ticking a to-do off. A to-do without repeat is done. One that repeats by time stays open and moves on
 * to its next date (after today when it was late); one by km waits for the next km mark.
 * Returns the changed to-do (the caller keeps the old one for Undo).
 */
export function tick(todo, { today, now = new Date().toISOString(), bikeKm = null } = {}) {
  const r = todo.repeat;
  if (r?.every === 'day' || r?.every === 'week' || r?.every === 'month') {
    const step = r.every === 'day' ? (d) => addDays(d, 1) : r.every === 'week' ? (d) => addDays(d, 7) : (d) => addMonth(d, r.n ?? 1);
    let next = step(todo.due ?? today);
    while (next <= today) next = step(next);
    return { ...todo, due: next, lastDone: now };
  }
  if (r?.every === 'km' && r.km > 0) return { ...todo, repeat: { ...r, fromKm: bikeKm ?? r.fromKm ?? 0 }, lastDone: now };
  if (r?.every === 'rain') return { ...todo, lastDone: now };
  return { ...todo, doneAt: now };
}

/** km left until a km to-do is due again; null without a km repeat or a counter. */
export function kmLeft(todo, bikeKm) {
  const r = todo.repeat;
  if (r?.every !== 'km' || bikeKm == null) return null;
  return (r.fromKm ?? 0) + r.km - bikeKm;
}

/** Is the to-do due on this day (or late)? km to-dos count when their km are reached. */
export function isDue(todo, today, bikeKm = null) {
  if (todo.doneAt || todo.off) return false;
  const left = kmLeft(todo, bikeKm);
  if (left != null && left <= 0) return true;
  return !!todo.due && todo.due <= today;
}

export const GROUPS = ['late', 'today', 'week', 'later', 'none'];

/**
 * The open to-dos in the groups of PL3: late · today · this week (next 7 days) · later · without date.
 * Each group is sorted by date, then by when it was written. kmOf(bikeId) gives a bike's counter;
 * rainSince(bikeId, iso) whether that bike rode in the rain since then (a «after rain» reminder).
 * A reminder switched off (Ich › Erinnerungen) does not show. Birthdays and plants (kind) are left out.
 */
export function groupTodos(todos, today, kmOf = () => null, rainSince = () => false) {
  const out = Object.fromEntries(GROUPS.map((g) => [g, []]));
  const week = addDays(today, 7);
  for (const td of todos) {
    if (td.doneAt || td.off || td.kind) continue; // birthdays and plants have their own groups (merken/kinds.js)
    const left = kmLeft(td, td.repeat?.bikeId ? kmOf(td.repeat.bikeId) : null);
    if (left != null && left <= 0) out.today.push(td);
    else if (td.repeat?.every === 'rain') {
      if (rainSince(td.repeat.bikeId, td.lastDone ?? td.created)) out.today.push(td);
    }
    else if (!td.due) out.none.push(td);
    else if (td.due < today) out.late.push(td);
    else if (td.due === today) out.today.push(td);
    else if (td.due <= week) out.week.push(td);
    else out.later.push(td);
  }
  const by = (a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || String(a.created).localeCompare(String(b.created));
  for (const g of GROUPS) out[g].sort(by);
  return out;
}

/** Done to-dos, newest first (decision 11.10: «Erledigte To-dos wandern nach «Erledigt»»). */
export const doneTodos = (todos) => todos.filter((t) => t.doneAt).sort((a, b) => b.doneAt.localeCompare(a.doneAt));

/** The day a reminder shows: on the due day, or one day before. */
export const remindDay = (todo) => (todo.due && todo.remind ? addDays(todo.due, -(todo.remind.before ?? 0)) : null);
