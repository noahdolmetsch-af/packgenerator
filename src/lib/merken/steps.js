/**
 * «Schritte in einem To-do» (Noah 05.11.2026 «N2»): a to-do can hold steps, e.g. «Alpen-Tour vorbereiten» with
 * six small points. Stored on the to-do itself: todo.steps = [{ id, text, done: null | ISO }]. A to-do without
 * steps looks as before. The list shows «3 of 6» and a bar. Pure functions; the caller writes (merkendb.js).
 */

export const MAX_STEPS = 40;
export const stepsOf = (todo) => (Array.isArray(todo?.steps) ? todo.steps : []);

/** { done, total } of the steps; total 0 without steps. */
export function stepProgress(todo) {
  const s = stepsOf(todo);
  return { done: s.filter((x) => x.done).length, total: s.length };
}

/** The to-do with a new step at the end; empty text or too many steps change nothing. */
export function addStep(todo, text, { id } = {}) {
  const tx = String(text ?? '').trim().slice(0, 160);
  const s = stepsOf(todo);
  if (!tx || s.length >= MAX_STEPS) return todo;
  return { ...todo, steps: [...s, { id: id ?? `st-${Date.now().toString(36)}-${s.length}`, text: tx, done: null }] };
}
export const toggleStep = (todo, id, now = new Date().toISOString()) => ({ ...todo, steps: stepsOf(todo).map((x) => (x.id === id ? { ...x, done: x.done ? null : now } : x)) });
export const renameStep = (todo, id, text) => {
  const tx = String(text ?? '').trim().slice(0, 160);
  return tx ? { ...todo, steps: stepsOf(todo).map((x) => (x.id === id ? { ...x, text: tx } : x)) } : todo;
};
export const removeStep = (todo, id) => ({ ...todo, steps: stepsOf(todo).filter((x) => x.id !== id) });
/** A step moved from one place to another (arrows: ±1; dragging: any place). */
export function moveStep(todo, from, to) {
  const s = [...stepsOf(todo)];
  if (from === to || from < 0 || to < 0 || from >= s.length || to >= s.length) return todo;
  const [x] = s.splice(from, 1);
  s.splice(to, 0, x);
  return { ...todo, steps: s };
}
/** Every step open again (a to-do that repeats starts its steps again). */
export const resetSteps = (todo) => (stepsOf(todo).length ? { ...todo, steps: stepsOf(todo).map((x) => ({ ...x, done: null })) } : todo);
