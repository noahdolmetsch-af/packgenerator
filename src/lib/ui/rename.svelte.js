/**
 * v0.72.0 «Feinschliff» (Umbenennen 1a, 5a): after a rename, «Renamed to "…" · Undo» for 10 s, the
 * same on every page (as the building blocks did before). The toast mounts itself once on the page
 * body the first time it is needed, so no page has to carry it and it stays when a dialog closes.
 * undo: an async function that puts the old name back (or null: no Undo).
 */
import { mount } from 'svelte';
import RenameToast from './RenameToast.svelte';
import { t } from '../i18n.svelte.js';

export const UNDO_MS = 10_000;
export const renamed = $state({ v: null });
let timer;
let held = null; // the undo function stays outside the reactive state
let mounted = false;

export function offerRename(name, undo = null) {
  if (!mounted && typeof document !== 'undefined') {
    mounted = true;
    mount(RenameToast, { target: document.body });
  }
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
