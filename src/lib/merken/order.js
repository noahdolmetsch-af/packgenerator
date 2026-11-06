/**
 * Wischen und Verschieben bei To-dos (Noah 05.11.2026 «F2», rule «Pfeile und Ziehen überall»): a to-do can be moved
 * up or down within its group (arrows, or dragging the handle) and pushed to tomorrow. The order is kept as
 * todo.pos on the to-dos of the group that was moved; to-dos without pos stay in the old order (date, then written)
 * after the moved ones. Pure functions.
 */
import { addDays } from '../merken.js';

/** The list with the group (ids as shown) in a new order: the to-do at `from` goes to `to`. */
export function reorderGroup(todos, ids, from, to) {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return todos;
  const order = [...ids];
  const [x] = order.splice(from, 1);
  order.splice(to, 0, x);
  const pos = new Map(order.map((id, i) => [id, (i + 1) * 10]));
  return todos.map((td) => (pos.has(td.id) ? { ...td, pos: pos.get(td.id) } : td));
}

/** «Morgen»: the changes that push a to-do to tomorrow (a reminder keeps its time; a manual place is dropped). */
export function postponeChanges(todo, today) {
  const day = addDays(today, 1);
  return { due: day, remind: todo.remind ?? null, pos: null };
}
