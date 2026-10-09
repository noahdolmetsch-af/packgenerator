/**
 * v0.39.0 (AP28): one toast for the template pages ("… archived · Undo"). It lives outside the
 * pages, so it stays when the list opens after "Delete" in a template. snap: a bulk.js undoBulk
 * snapshot ({ templates: the settings record before }).
 */
import { db } from '../db.js';
import { TEMPLATES_KEY, saveTemplates } from '../templates.js';
import { undoBulk } from '../gear/bulk.js';

export const toast = $state({ v: null });
let timer;
// The snapshot stays outside the reactive state: IndexedDB cannot store a reactive proxy.
let held = null;

export function offer(text, snap = null) {
  clearTimeout(timer);
  held = snap;
  toast.v = { text, undo: !!snap };
  timer = setTimeout(() => ((toast.v = null), (held = null)), 8000);
}

export async function undo() {
  const snap = held;
  clearTimeout(timer);
  held = null;
  toast.v = null;
  if (snap) await undoBulk(db, snap);
}

/** Change the template list (fn(list) → new list) with Undo; returns nothing. */
export async function changeTemplates(fn, text) {
  const rec = await db.settings.get(TEMPLATES_KEY);
  await saveTemplates(db, fn(rec?.value ?? []));
  offer(text, { templates: rec ?? null });
}
