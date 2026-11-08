/**
 * «Zahl mit Weg» on Aktiv (Noah 07.11.2026 «5a»): where a tap on a ring or on a week goal leads. Pure: no page, no database.
 * ringHrefs: a ring with exactly one sport leads to that sport's value in Analyse (last 7 days); a ring with several sports (or
 * none) leads to «Haken ausgewertet», where all of them are evaluated.
 * goalHref: a week goal on a sport leads to that sport's value, a kilometre goal to the bike kilometres; both for the week. A goal whose
 * sport is gone leads nowhere (null).
 */
import { numHref } from '../analyse/zahlweg.js';

export const TICKS_HREF = '#/flow/auswertung';

const RINGS = ['move', 'mind', 'rest'];
// the sports a ring counts: Mindful counts every sport of the ring, Move and Recovery only those that do not rest
const countsFor = (s, ring) => s.act.ring === ring && !s.paused && !s.act.paused && (ring === 'mind' || !s.resting);

/**
 * { move, mind, rest } → the sports of that ring, each { act, href, n, of, met }, for the row that folds open (Noah 07.11.2026 «2a»).
 * states: the flow states of the page (flowStates). n and of are the sport's own stand («2 of 4»).
 */
export function ringParts(states = []) {
  const out = {};
  for (const ring of RINGS) {
    out[ring] = states.filter((s) => countsFor(s, ring)).map((s) => ({ act: s.act, href: numHref({ key: `act:${s.act.id}`, range: 'w' }), n: s.stand?.n ?? 0, of: s.stand?.of ?? 0, met: !!s.met }));
  }
  return out;
}

/** { move, mind, rest } → href of the row: exactly one sport leads to its value, otherwise «Haken ausgewertet» (several are listed under the row). */
export function ringHrefs(states = []) {
  const parts = ringParts(states);
  const out = {};
  for (const ring of RINGS) out[ring] = parts[ring].length === 1 ? parts[ring][0].href : TICKS_HREF;
  return out;
}

/** The href of one week goal stand ({ goal, missing }), or null when it points nowhere. */
export function goalHref(stand) {
  if (!stand || stand.missing) return null;
  const g = stand.goal;
  return g.kind === 'km' ? numHref({ key: 'km:bike', range: 'w' }) : g.actId ? numHref({ key: `act:${g.actId}`, range: 'w' }) : null;
}
