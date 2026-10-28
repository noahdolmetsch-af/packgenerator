/**
 * v0.72.0 «Feinschliff» (Umbenennen 1a, 5a): after a rename, «Renamed to "…" · Undo» for 4 s (Ü4a), the
 * same on every page (as the building blocks did before). The toast mounts itself once on the page
 * body the first time it is needed, so no page has to carry it and it stays when a dialog closes.
 * undo: an async function that puts the old name back (or null: no Undo).
 * A window (modal <dialog>) still open under the rename sheet makes the page behind it inert, so the
 * toast moves into that window while it is open (Undo stays tappable) and back to the body after.
 *
 * B22 «Rückgängig gleitet» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): the notes stack. Before, a second note
 * replaced the first one and its Undo was gone (two deletes in a row: only the second could come back).
 * Now an older note that has Undo stays above the new one until its own 4 s are over (at most 3); an
 * older note without Undo goes at once, it has nothing to lose. The newest note is `.rtoast`, the
 * older ones `.rtoast-old`.
 */
import { mount } from 'svelte';
import RenameToast from './RenameToast.svelte';
import { t } from '../i18n.svelte.js';

export { UNDO_MS } from './undo.js';
import { UNDO_MS } from './undo.js';

/** At most this many notes at once (the oldest goes first). */
export const MAX_TOASTS = 3;
/** The notes on screen, oldest first: { id, text, undo (has Undo), ms }. */
export const toasts = $state({ list: [] });
const held = new Map(); // id → { fn, timer }: the undo functions stay outside the reactive state
let seq = 0;
let host = null;

function place() {
  if (!host) {
    host = document.createElement('div');
    host.className = 'rtoast-host';
    document.body.append(host);
    mount(RenameToast, { target: host });
  }
  const open = [...document.querySelectorAll('dialog[open]:not(.rename)')].filter((d) => d.matches(':modal'));
  const win = open.at(-1);
  if (!win) return document.body.append(host);
  win.append(host);
  win.addEventListener('close', () => host.parentNode === win && document.body.append(host), { once: true });
}

/** Take one note away (its time is over, it was closed or undone). */
export function closeToast(id) {
  const h = held.get(id);
  if (h) clearTimeout(h.timer);
  held.delete(id);
  toasts.list = toasts.list.filter((x) => x.id !== id);
}

function push(text, undo, ms) {
  if (typeof document !== 'undefined') place();
  for (const x of toasts.list) if (!x.undo) closeToast(x.id);
  while (toasts.list.length >= MAX_TOASTS) closeToast(toasts.list[0].id);
  const id = ++seq;
  held.set(id, { fn: undo, timer: setTimeout(() => closeToast(id), ms) });
  toasts.list = [...toasts.list, { id, text, undo: !!undo, ms }];
  return id;
}

export function offerRename(name, undo = null) {
  return push(t('Renamed to "{name}".', { name }), undo, UNDO_MS);
}

/**
 * v0.125.0 A-J1: the same calm toast for any saved thing, «<text> · Undo» for 10 s
 * (e.g. «Workshop visit saved.»). text: already translated; undo: async function or null.
 * ms: how long it stays (Taschen-Setups: 4 s, Noah's rule for deleting).
 */
export function offerDone(text, undo = null, ms = UNDO_MS) {
  return push(text, undo, ms);
}

/** Undo of one note (B22: every note on the stack keeps its own). */
export async function undoToast(id) {
  const fn = held.get(id)?.fn;
  closeToast(id);
  if (fn) await fn();
}

/** Undo of the newest note. */
export async function undoRename() {
  const last = toasts.list.at(-1);
  if (last) await undoToast(last.id);
}
