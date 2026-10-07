/**
 * Open to-dos on the start page (v0.21.0, gap 6 of the analysis on 7.10.2026): what still makes
 * weights and times guesses, each with the one place that fixes it. A row disappears once done.
 */
import { isInventory } from './gear.js';

/** A bike weight is a guess when it is missing or still the Strava estimate. */
export const bikeGuessed = (b) => b.weightG == null || /estimate/i.test(b.weightNote ?? '');

/**
 * rows: [{ key, n, href | action }]; the page writes the words.
 * pace: paceOf(...) result (pace.mine = learnt from GPX rides).
 */
export function openTodos({ bikes = [], items = [], pace = null, debriefs = [], trips = [] } = {}) {
  const rows = [];
  const weigh = bikes.filter(bikeGuessed).length;
  if (weigh) rows.push({ key: 'bikes', n: weigh, href: '#/bikes' });
  if (!pace?.mine) rows.push({ key: 'pace', n: 0, href: '#/debrief/pace' });
  const inv = items.filter(isInventory);
  const check = inv.filter((i) => !i.reviewedAt).length;
  if (check) rows.push({ key: 'check', n: check, href: '#/gear?tab=check' });
  if (inv.length && !inv.some((i) => i.favorite)) rows.push({ key: 'favourites', n: 0, action: 'data' });
  // A real trip: not a demo trip, debrief saved.
  const real = new Set(trips.filter((t) => !String(t.id).startsWith('demo')).map((t) => t.id));
  if (!debriefs.some((d) => d.status === 'done' && real.has(d.tripId))) rows.push({ key: 'trip', n: 0, action: 'newlist' });
  return rows;
}

/** A backup is due after a saved debrief that is newer than the last backup (answer 4a: the phone leads). */
export const backupAfterTrip = (lastBackupIso, debriefs = []) => {
  const last = debriefs.filter((d) => d.status === 'done' && d.doneAt).map((d) => d.doneAt).sort().at(-1);
  return !!last && (!lastBackupIso || last > lastBackupIso);
};
