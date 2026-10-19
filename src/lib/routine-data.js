/**
 * Routine «Das tut mir gut»: the record and what Im Flow knows, read live (Dexie). Shared by the tile on
 * Heute (home/RoutineTile.svelte) and the page #/routine (pages/Routine.svelte).
 *   auto.meditation: the days with a meditation in Im Flow; medMin: today's minutes of meditation.
 */
import { liveQuery } from 'dexie';
import { db } from './db.js';
import { putSetting } from './flowdb.js';
import { isMedAct } from './flow/hobby/medstart.js';
import { ROUTINE_KEY, routineOf, recordOf, addDays } from './routine.js';

export function routineQuery(today) {
  return liveQuery(async () => {
    const [rec, acts, log] = await Promise.all([db.settings.get(ROUTINE_KEY), db.flowActs.toArray(), db.flowLog.where('day').aboveOrEqual(addDays(today, -800)).toArray()]);
    const med = new Set(acts.filter(isMedAct).map((a) => a.id));
    const medLog = log.filter((e) => med.has(e.actId));
    const medMin = medLog.filter((e) => e.day === today).reduce((n, e) => n + (Number(e.min) || 0), 0);
    return { routine: routineOf(rec?.value), auto: { meditation: new Set(medLog.map((e) => e.day)) }, medMin, stored: !!rec };
  });
}

/** Save the record (plain, no proxies). */
export const saveRoutine = (routine) => putSetting(db, ROUTINE_KEY, recordOf(routine));
/** Read the saved record (a tap decides from what is saved, never from a view that lags behind). */
export const readRoutine = async () => routineOf((await db.settings.get(ROUTINE_KEY))?.value);
