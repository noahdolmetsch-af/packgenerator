/**
 * v0.76.0 «Fünf Orte» 1 (mockup orte-tastenkuerzel): the keyboard shortcuts on a computer.
 * g then a letter opens a place (g h Heute, g t Touren, g m Material, g v Velos, g a Aktiv);
 * / searches, n opens «Neu», i opens «Ich», ? shows the list. Letters only when no field is active
 * and no dialog is open, never with Ctrl, Alt or Cmd (App.svelte asks typing() first).
 */
import { PLACES, placeHref } from '../nav.js';

/** How long «g» waits for its letter (ms). */
export const G_WAIT = 1500;

/**
 * What a key does: { go: href } | { act: 'search' | 'new' | 'me' | 'help' } | { wait: true } (a «g»
 * that waits for the letter) | null. afterG: the key before was «g» (within G_WAIT).
 * P3b «Bedienregeln», Ü1a (Noah 15.10.2026 «1a»): «g + letter» opens the tab opened last there, the
 * same as the bar (on the place you are on: its first tab). current: the place you are on.
 */
export function shortcutOf(key, afterG = false, current = null) {
  if (afterG) {
    const p = PLACES.find((x) => x.letter === key);
    if (p) return { go: placeHref(p, current) };
  }
  if (key === 'g') return { wait: true };
  if (key === '/') return { act: 'search' };
  if (key === 'n' || key === 'N') return { act: 'new' };
  if (key === 'i') return { act: 'me' };
  if (key === '?') return { act: 'help' };
  return null;
}

/** True when the key belongs to what the person is typing or to an open dialog (no shortcut then). */
export function typing(e) {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return true;
  const el = e.target;
  if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return true;
  return typeof document !== 'undefined' && !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
}
