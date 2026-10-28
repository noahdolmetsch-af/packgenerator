/**
 * «Deine Gewohnheiten» on top of Heute (Noah 27.10.2026 «1a 2a und b 3b»): the card that was always
 * meditation (ME1, «Meditation, dann Tageskarte, dann Tourkarte», 14.10.2026) now shows what the person
 * picks: up to three activities from Aktiv (2a) or items of «Das tut mir gut» (2b), in their order (3b).
 * The pencil on the card and «Customise the start page» open the same window (1a).
 * Without a choice yet it stays as it was: the meditation activity, when there is one.
 * Setting HABITS_KEY: [{ kind: 'act' | 'routine', id }] (an empty list = no card yet, with a hint).
 */
export const HABITS_KEY = 'homeHabits';
export const MAX_HABITS = 3;

export const refKey = (r) => `${r.kind}:${r.id}`;
const isRef = (r) => !!r && (r.kind === 'act' || r.kind === 'routine') && typeof r.id === 'string' && r.id !== '';

/** The stored list made safe: known kinds, no doubles, at most three. → [{ kind, id }] | null (nothing chosen yet) */
export function normHabits(v) {
  if (!Array.isArray(v)) return null;
  const seen = new Set();
  const out = [];
  for (const r of v) {
    if (!isRef(r) || seen.has(refKey(r))) continue;
    seen.add(refKey(r));
    out.push({ kind: r.kind, id: r.id });
    if (out.length === MAX_HABITS) break;
  }
  return out;
}

/**
 * The cards to show: the chosen ones that still exist (a deleted or paused activity, a deleted item
 * drops out), or, with nothing chosen yet, the meditation activity as before.
 * acts: the activities of Aktiv (not paused), each { id, page? }; items: the items of «Das tut mir gut».
 * → [{ kind, id }]
 */
export function habitsOf(v, acts = [], items = [], isMed = () => false) {
  const list = normHabits(v);
  if (list === null) {
    const med = acts.find(isMed);
    return med ? [{ kind: 'act', id: med.id }] : [];
  }
  const actIds = new Set(acts.map((a) => a.id));
  const itemIds = new Set(items.map((x) => x.id));
  return list.filter((r) => (r.kind === 'act' ? actIds.has(r.id) : itemIds.has(r.id)));
}

/** Add one at the end (not when three are chosen already or it is in). → a new list */
export function addHabit(list, ref) {
  const l = normHabits(list) ?? [];
  if (!isRef(ref) || l.length >= MAX_HABITS || l.some((r) => refKey(r) === refKey(ref))) return l;
  return [...l, { kind: ref.kind, id: ref.id }];
}
/** Take one away. → a new list */
export const removeHabit = (list, ref) => (normHabits(list) ?? []).filter((r) => refKey(r) !== refKey(ref));
/** Move one from place `from` to `to` (arrows and drag). → a new list */
export function moveHabit(list, from, to) {
  const l = [...(normHabits(list) ?? [])];
  if (from < 0 || from >= l.length || to < 0 || to >= l.length || from === to) return l;
  const [x] = l.splice(from, 1);
  l.splice(to, 0, x);
  return l;
}

/**
 * The last seven days as dots, oldest first, from a set of done days. → [{ day, on }]
 * addDays(day, n) is passed in so the calendar arithmetic stays that of the caller.
 */
export const lastSeven = (done, today, addDays) => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((day) => ({ day, on: done.has(day) }));
