/** «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): ⌘ Z takes the newest delete of this visit back (src/App.svelte, nav/keys.js isUndoChord). */
import { db } from '../db.js';
import { restoreEntry, lastDeleted } from './trash.js';
import { offerDone } from '../ui/rename.svelte.js';
import { t } from '../i18n.svelte.js';

/** → true when something came back. */
export async function undoLastDelete() {
  const last = lastDeleted.get();
  if (!last) return false;
  lastDeleted.set(null);
  try {
    const r = await restoreEntry(db, last.id);
    if (!r) return false;
    offerDone(t('"{name}" is back.', { name: last.name }));
    return true;
  } catch (err) {
    console.error(err);
    offerDone(t('Bringing it back didn\'t work. Your last backup still has "{name}".', { name: last.name }));
    return false;
  }
}
