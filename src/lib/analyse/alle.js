/**
 * «Alle Sportarten» auch in Analyse (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung»; Hinweis des
 * Wochenrückblicks 23.11.2026): Analyse counts the same sessions as Heute › Diese Woche. The ticks of Aktiv stay as they are;
 * the Strava sports without a tick (running, hiking, swimming …; rides are counted by their ticks and the rides list) come
 * on top as one entry each, under the activity the Strava table maps them to, or under a sport of their own («strava:run»).
 * Only reading: nothing is saved. Pure.
 *
 * data: { log (flowLog), activities (db.activities), acts (flowActs, normalised), usual, map } → { acts, log }
 */
import { stravaOthers } from '../flow/tickfokus.js';
import { normAct } from '../flow.js';
import { sportName } from '../flow/garmin/words.js';

/** The id of a Strava sport that has no activity in Aktiv. */
export const looseId = (kind) => `strava:${kind}`;

export function withStrava(data = {}) {
  const { log = [], acts = [] } = data;
  const others = stravaOthers(data);
  if (!others.length) return { acts, log };
  const known = new Set(acts.map((a) => a.id));
  const extraLog = [];
  const extraActs = new Map();
  others.forEach((o, i) => {
    const id = o.actId && known.has(o.actId) ? o.actId : looseId(o.kind);
    if (!known.has(id) && !extraActs.has(id)) extraActs.set(id, normAct({ id, name: sportName(o.kind), ring: 'move', order: 1000 + extraActs.size }));
    extraLog.push({ id: `strava-only-${o.day}-${i}`, actId: id, day: o.day, via: 'strava-only' });
  });
  return { acts: [...acts, ...extraActs.values()], log: [...log, ...extraLog] };
}
