/**
 * «Zahl mit Weg» on Aktiv (Noah 07.11.2026 «5a»): where a tap on a ring or on a week goal leads. Pure: no page, no database.
 * ringHref: a ring with exactly one sport leads to that sport's value in Analyse (last 7 days); a ring with several sports (or
 * none) leads to «Haken ausgewertet», where all of them are evaluated.
 * goalHref: a week goal on a sport leads to that sport's value, a kilometre goal to the bike kilometres; both for the week. A goal whose
 * sport is gone leads nowhere (null).
 */
import { numHref } from '../analyse/zahlweg.js';

export const TICKS_HREF = '#/flow/auswertung';

/** { move, mind, rest } → href. states: the flow states of the page (flowStates). */
export function ringHrefs(states = []) {
  const out = {};
  for (const ring of ['move', 'mind', 'rest']) {
    const mine = states.filter((s) => s.act.ring === ring && !s.paused && !s.act.paused);
    out[ring] = mine.length === 1 ? numHref({ key: `act:${mine[0].act.id}`, range: 'w' }) : TICKS_HREF;
  }
  return out;
}

/** The href of one week goal stand ({ goal, missing }), or null when it points nowhere. */
export function goalHref(stand) {
  if (!stand || stand.missing) return null;
  const g = stand.goal;
  return g.kind === 'km' ? numHref({ key: 'km:bike', range: 'w' }) : g.actId ? numHref({ key: `act:${g.actId}`, range: 'w' }) : null;
}
