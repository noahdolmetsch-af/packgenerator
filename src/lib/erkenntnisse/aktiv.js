/**
 * The activities of Aktiv the way Analyse counts them (Noah 23.11.2026 «ja», Thread «Zusammenhänge nützlicher machen»): the ticks of
 * flowLog plus the Strava sports without a tick (lib/analyse/alle.js withStrava), so the insights and Analyse see the same days.
 * Only reading. → { acts, log }
 */
import { normAct } from '../flow.js';
import { withStrava } from '../analyse/alle.js';
import { USUAL_KEY, usualMap } from '../flow/usualmin.js';
import { TICKS_KEY, prefsOf } from '../stravaticks.js';
import { readLite } from '../actlite.js';

export async function countedActs(db) {
  const [acts, log, activities, usual, ticks] = await Promise.all([
    db.flowActs.toArray(),
    db.flowLog.toArray(),
    db.activities ? readLite(db, (T) => T.toArray()) : [],
    db.settings.get(USUAL_KEY),
    db.settings.get(TICKS_KEY),
  ]);
  const own = acts.map(normAct).sort((a, b) => a.order - b.order);
  return withStrava({ acts: own, log, activities, usual: usualMap(usual?.value), map: prefsOf(ticks?.value).map });
}
