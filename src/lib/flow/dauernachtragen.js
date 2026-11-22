/**
 * «Dauer nachtragen» (Noah 21.11.2026, Sportjahr S12): the ticks that have no measured time and count with the usual duration («ca.») are
 * listed, newest first; one tap on a row (15, 30, 45, 60 or an own number) writes the real minutes into that tick, and from then on the
 * time counts as measured. Only ticks you made by hand or with the timer can take minutes (a Strava tick has its time from Strava, the ride
 * to work has none). Pure functions plus two small writers. Tested in tests/dauer-nachtragen.test.js.
 */
import { canSetMinutes, setMinutes, parseMinutes } from './feel.js';
import { ohneMessung } from './einheiten.js';

/** The buttons next to the own number. */
export const NACHTRAG_CHIPS = [15, 30, 45, 60];

/**
 * The rows to fill in: [{ id, day, actId, ca }] newest first. units: from einheiten(); log: the flowLog entries (a row is only offered when
 * its tick can take minutes). ca is the minutes counted until now («ca.»).
 */
export function dueRows(units = [], log = []) {
  const byId = new Map(log.map((e) => [e.id, e]));
  return ohneMessung(units)
    .filter((u) => u.minQuelle === 'ca.' && canSetMinutes(byId.get(u.id)) && !byId.get(u.id)?.stravaId)
    .map((u) => ({ id: u.id, day: u.day, actId: u.actId, ca: u.min }));
}

/** Write the minutes into one tick. → the tick as it was before (for «Undo»), or null when nothing was written. */
export async function writeDuration(db, id, minutes) {
  const e = await db.flowLog.get(id);
  if (!e || !canSetMinutes(e) || parseMinutes(minutes) == null) return null;
  await db.flowLog.put(setMinutes(e, minutes));
  return e;
}

/** «Undo»: the tick as it was. */
export async function restoreTick(db, before) {
  if (before?.id) await db.flowLog.put(before);
}
