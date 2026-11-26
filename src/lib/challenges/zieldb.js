/**
 * «Challenges» PR 3: reading and writing the own daily goals (settings key `tagesziele`, src/lib/tagesziel.js). The list
 * travels in every backup and in the device sync like every other settings record.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { putSetting } from '../flowdb.js';
import { toast } from '../flow/ui.svelte.js';
import { askDelete, deleteWithUndo } from '../ui/ask.js';
import { t } from '../i18n.svelte.js';
import { TAGESZIELE_KEY, tageszieleOf, putZiel, removeZiel, withAuto } from '../tagesziel.js';
import { PUSH_KEY } from '../push/schedule.js';
import { zielRemindOn } from '../zielpush.js';
import { resyncPhone } from '../ruhig/store.js';

// with the phone reminder on, the phone gets its new list (a day that reaches the goal sends none)
const resync = async () => (zielRemindOn((await db.settings.get(PUSH_KEY))?.value) ? resyncPhone() : undefined);

/** The list of goals, live (undefined while reading). A goal that belongs to Meditation also reads the sessions (`auto`). */
export const zieleQuery = () =>
  liveQuery(async () => {
    const list = tageszieleOf((await db.settings.get(TAGESZIELE_KEY))?.value);
    if (!list.some((c) => c.link === 'meditation')) return list;
    return withAuto(list, await db.flowLog.where('actId').equals('meditation').toArray());
  });
/** One goal added or changed (read again at the moment of saving, so two quick taps do not lose one). */
export async function saveOne(c) {
  const list = tageszieleOf((await db.settings.get(TAGESZIELE_KEY))?.value);
  await putSetting(db, TAGESZIELE_KEY, tageszieleOf(putZiel(list, c)));
  await resync();
}
/** One goal removed. */
export async function removeOne(id) {
  const list = tageszieleOf((await db.settings.get(TAGESZIELE_KEY))?.value);
  const next = removeZiel(list, id);
  await putSetting(db, TAGESZIELE_KEY, next.length ? next : null);
  await resync();
}

/** «End the challenge»: ended by hand, the days stay saved (Undo in the message). */
export async function stopOne(c) {
  await saveOne({ ...c, stopped: true });
  toast(t('Challenge ended. The days stay saved.'), () => saveOne(c));
}
/** Delete asks first in the app's own window and offers Undo. */
export async function removeWithUndo(c) {
  const a = await askDelete({ title: t('Delete the challenge «{name}»?', { name: c.name }), text: t('All amounts you added are deleted with it.'), label: t('Delete') });
  if (a !== 'delete') return;
  await deleteWithUndo({ run: async () => (await removeOne(c.id), c), undo: (b) => saveOne(b), text: t('Challenge «{name}» deleted.', { name: c.name }), name: c.name });
}
