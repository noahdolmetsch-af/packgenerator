/**
 * Paket C «Ruhig und persönlich»: reading and writing its settings records (each one travels in every
 * backup and in the automatic sync, like every other settings record).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';

const plain = (x) => JSON.parse(JSON.stringify(x ?? null));
/** One settings record's value, live (undefined while reading, null when there is none). */
export const settingQ = (key) => liveQuery(async () => (await db.settings.get(key))?.value ?? null);
export const saveSetting = (key, value) => db.settings.put({ key, value: plain(value) });
export const readSetting = async (key) => (await db.settings.get(key))?.value ?? null;

/** The calm view ends: one line goes into the little history, the view is cleared (one place for every «Done»). */
export async function endCalm(calm) {
  const { CALM_LOG_KEY, logOf, logAdd, lineFor } = await import('./calmlog.js');
  const log = logOf(await readSetting(CALM_LOG_KEY));
  await db.transaction('rw', db.settings, async () => {
    await saveSetting(CALM_LOG_KEY, logAdd(log, lineFor(calm)));
    await saveSetting('ruhig.calm', null);
  });
  resyncPhone();
}
/** Held reminders go back to their own time (or are held anew): the phone list is sent again; quietly, only when phone reminders are on. */
export const resyncPhone = () => import('../push/client.js').then((m) => m.syncNow({ force: true })).catch(() => {});
