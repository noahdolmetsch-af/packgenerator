/**
 * «Rückmeldungen» (Noah 19.10.2026 «1a 2a 3a 4b»): deleting works the same in every window.
 *
 * 1. askDelete() asks in the app's own window (DeleteSheet), never with the browser's confirm().
 *    A thing still used somewhere offers «Archive» first (1a).
 * 2. deleteWithUndo() deletes, then shows «"…" deleted. · Undo» for 4 s (rule «Löschen» 14.10.2026,
 *    Ü4a 15.10.2026). When the delete fails, it says so and nothing is gone.
 *
 * Report and every text: notes/rueckmeldungen-2026-10-19/README.md (Q1–Q3, M9, M10, F8, F9).
 */
import { mount, unmount } from 'svelte';
import DeleteSheet from './DeleteSheet.svelte';
import { offerDone } from './rename.svelte.js';
import { t } from '../i18n.svelte.js';

let open = null; // the question shown now: a second tap on «Delete» does not open a second one

/**
 * Ask before deleting. → 'delete', 'archive' (only when `archive` is given) or null (Cancel, ✕,
 * Escape, back, a tap beside it).
 * title: «"Tent" löschen?»; text: one or two sentences what happens; lines: names (many at once);
 * label: the red button (default «Delete»); archive: the label of the safer choice, or '';
 * del: false when only «Archive» is offered (an item used on trips, swiped away).
 */
export function askDelete({ title, text = '', lines = [], label = '', archive = '', del = true } = {}) {
  if (typeof document === 'undefined') return Promise.resolve(null);
  if (open) return Promise.resolve(null);
  open = new Promise((resolve) => {
    // on the page body: as a modal window it sits above any window still open (top layer), and no
    // key or click of the question reaches the window under it
    const target = document.createElement('div');
    document.body.append(target);
    const comp = mount(DeleteSheet, {
      target,
      props: {
        title,
        text,
        lines,
        label,
        archive,
        del,
        ondone: (answer) => {
          open = null;
          resolve(answer);
          // after the close event: the sheet and its holder go
          queueMicrotask(() => {
            unmount(comp);
            target.remove();
          });
        },
      },
    });
  });
  return open;
}

/**
 * Delete and offer «Undo» for 4 s. run(): deletes and returns what undo() needs; undo(saved): puts
 * it back. text: «"Tent" deleted.»; name: shown in «"Tent" is back.» and in the error lines.
 * → true when deleted, false when it failed (the error line says so, nothing is gone).
 */
export async function deleteWithUndo({ run, undo = null, text, name = '' }) {
  let saved;
  try {
    saved = await run();
  } catch (err) {
    console.error(err);
    offerDone(t('"{name}" couldn\'t be deleted. It\'s still there. Try again.', { name }));
    return false;
  }
  offerDone(
    text,
    undo
      ? async () => {
          try {
            await undo(saved);
            offerDone(t('"{name}" is back.', { name }));
          } catch (err) {
            console.error(err);
            offerDone(t('Bringing it back didn\'t work. Your last backup still has "{name}".', { name }));
          }
        }
      : null,
  );
  return true;
}

/**
 * The words for a failed save (F6, F7): a full device storage gets its own sentence.
 * The window stays open with what was typed.
 */
export function saveFailed(err) {
  console.error(err);
  const full = err?.name === 'QuotaExceededError' || err?.inner?.name === 'QuotaExceededError';
  return full
    ? t("This device's storage is full. Delete old photos or rides, or free up space in the browser. What you typed stays here.")
    : t("Saving didn't work. What you typed stays here. Try again. If it fails again: Me › Data and backup › Save backup, then reload the page.");
}

/**
 * One run at a time: a second tap while the first save or delete still runs does nothing
 * (repeated clicks). Use: const save = once(async () => { … }).
 */
export function once(fn) {
  let busy = false;
  return async function (...args) {
    args[0]?.preventDefault?.(); // a form's submit: never the browser's own, also not on the second tap
    if (busy) return;
    busy = true;
    try {
      return await fn.apply(this, args);
    } finally {
      busy = false;
    }
  };
}
