/**
 * «Neue Leute merken» (Noah 26.10.2026 «1-5 alle»; promised: «Nach dem Event bekommst du eine Erinnerung
 * ‹Wen hast du kennengelernt?›»; built in the check of 27.10.2026): an event group of several days puts one
 * to-do into Kalender › Merken for the day after it ends. Its text says where the people go: Ich › Mit Freunden › Kontaktkarte.
 * Like every reminder it can be changed, ticked off and deleted (Ich › Erinnerungen, area «people»).
 */
import { addTodo, loadTodos } from '../merkendb.js';
import { addDays } from '../merken.js';
import { zurichDay } from '../spur/spur.js';

export const MET_SRC = 'group-met:';

/** The to-do fields for an event group that ends at `end` (ms or ISO), or null for a group of one day. */
export function metTodoOf({ gid, end, days = 1 }, text) {
  const at = typeof end === 'number' ? end : Date.parse(end);
  if (!gid || !(Number(days) > 1) || !Number.isFinite(at)) return null;
  return { text, due: addDays(zurichDay(at), 1), remind: { before: 0 }, area: 'people', src: MET_SRC + gid };
}

/** Puts the reminder in once per group; → { todo, undo } or null (one day, or already there). */
export async function addMetReminder(db, group, text) {
  const f = metTodoOf(group, text);
  if (!f) return null;
  if ((await loadTodos(db)).some((x) => x.src === f.src)) return null;
  return addTodo(db, f);
}
