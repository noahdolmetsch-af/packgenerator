/**
 * v0.72.0 «Feinschliff» (Umbenennen 1a, 5a): after a rename, «Renamed to "…" · Undo» for 10 s, the
 * same on every page (as the building blocks did before). The toast mounts itself once on the page
 * body the first time it is needed, so no page has to carry it and it stays when a dialog closes.
 * undo: an async function that puts the old name back (or null: no Undo).
 * A window (modal <dialog>) still open under the rename sheet makes the page behind it inert, so the
 * toast moves into that window while it is open (Undo stays tappable) and back to the body after.
 */
import { mount } from 'svelte';
import RenameToast from './RenameToast.svelte';
import { t } from '../i18n.svelte.js';

export const UNDO_MS = 10_000;
export const renamed = $state({ v: null });
let timer;
let held = null; // the undo function stays outside the reactive state
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

export function offerRename(name, undo = null) {
  if (typeof document !== 'undefined') place();
  clearTimeout(timer);
  held = undo;
  renamed.v = { text: t('Renamed to "{name}".', { name }), undo: !!undo };
  timer = setTimeout(() => ((renamed.v = null), (held = null)), UNDO_MS);
}

export async function undoRename() {
  const fn = held;
  clearTimeout(timer);
  held = null;
  renamed.v = null;
  if (fn) await fn();
}
