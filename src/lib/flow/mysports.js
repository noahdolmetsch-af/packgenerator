/**
 * «Meine Sportarten» (Noah 22.10.2026, spec «Aktiv-Bereich: Beschreibung»): where a sport of Aktiv opens.
 * Every activity has its own page (#/flow/sport/act:<id>, Sport.svelte); Meditation keeps its page with the
 * timer, the Rückblick and the patterns (#/flow/act/<id>, Runde 3 «1b»: «wird eine Sportart … mit Timer auf
 * ihrer Seite»). Pure, tested in tests/aktiv-bereich.test.js.
 */
import { isMedAct } from './hobby/medstart.js';
import { BIKE_ACT } from '../sportsbase.js';

/** The address of a sport's page. */
export function sportHref(act) {
  if (!act?.id) return '#/flow/sports';
  if (isMedAct(act)) return `#/flow/act/${encodeURIComponent(act.id)}`;
  return `#/flow/sport/${encodeURIComponent(`act:${act.id}`)}`;
}

/**
 * The sport of an activity for its page, also for the bike activity, which the list of sports leaves out
 * (it stands there as the sport of trips «Velo»): its page shows the bike, its gear and the ticks.
 */
export function actSport(act) {
  if (!act?.id) return null;
  return { id: `act:${act.id}`, kind: 'act', key: act.id, name: act.name, raw: true, icon: act.icon ?? 'heart', ring: act.ring ?? 'move', bike: act.id === BIKE_ACT, act };
}
