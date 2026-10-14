/**
 * «Erholung» (mockup AK2, Noah 13.10.2026 «1-5a», 3a: starts with ticking, the Fitbit values join with
 * bundle B; «ich gebe hiermit alle mockups frei»): the recovery ring of the week (flow.js rings().rest),
 * a hint after 3 active days in a row, the recovery activities to tick and ideas to add, the last 14
 * days as a strip. Pure functions; the page is src/pages/flow/Rest.svelte.
 *
 * Setting (db.settings): flow.restHintNo = 'YYYY-MM-DD', the day «Nicht heute» hid the hint.
 */
import { addDays, lastDays, daysBetween } from './flow.js';
import { FUN_IDEAS } from './flowsugg.js';

export const HINT_NO_KEY = 'flow.restHintNo';
/** From this many active days in a row (no recovery between) the page suggests a pause. */
export const STREAK = 3;
/** Ideas for recovery that are not in FUN_IDEAS (fictional, all changeable once added). */
export const REST_EXTRA = [{ id: 'early', name: 'Early to bed', nameDe: 'Früh schlafen', icon: 'moon', ring: 'rest' }];

const ringOf = (acts) => new Map(acts.map((a) => [a.id, a.ring]));
/** The days (YYYY-MM-DD) with an entry of the ring. */
const daysOf = (log, ring, rings) => new Set(log.filter((e) => rings.get(e.actId) === ring).map((e) => e.day));

/**
 * Active days in a row up to today (or yesterday, when today has nothing yet): a day with a «move»
 * entry and no recovery entry. → { n, acts: [ids] } (acts: the move activities of those days).
 */
export function activeStreak(acts = [], log = [], today) {
  const rings = ringOf(acts);
  const move = daysOf(log, 'move', rings);
  const rest = daysOf(log, 'rest', rings);
  let d = move.has(today) || rest.has(today) ? today : addDays(today, -1);
  let n = 0;
  const ids = new Set();
  while (move.has(d) && !rest.has(d) && n < 60) {
    for (const e of log) if (e.day === d && rings.get(e.actId) === 'move') ids.add(e.actId);
    n++;
    d = addDays(d, -1);
  }
  return { n, acts: [...ids] };
}

/** The hint «3 aktive Tage in Folge»: null unless the streak is long enough and not hidden today. */
export function restHint({ acts = [], log = [], today, hiddenOn = null }) {
  if (hiddenOn === today) return null;
  const rings = ringOf(acts);
  if (log.some((e) => e.day === today && rings.get(e.actId) === 'rest')) return null;
  const s = activeStreak(acts, log, today);
  return s.n >= STREAK ? s : null;
}

/** The recovery activities (ring rest, not paused) with the last day done: [{ act, last, ago, today }]. */
export function restActs(acts = [], log = [], today) {
  return acts
    .filter((a) => a.ring === 'rest' && !a.paused)
    .map((a) => {
      const last = log.filter((e) => e.actId === a.id && e.day <= today).reduce((m, e) => (e.day > m ? e.day : m), '');
      return { act: a, last: last || null, ago: last ? daysBetween(last, today) : null, today: last === today };
    });
}

/** Recovery ideas not added yet (an activity with the same id exists = added). */
export const restIdeas = (acts = []) => [...REST_EXTRA, ...FUN_IDEAS.filter((i) => i.ring === 'rest')].filter((i) => !acts.some((a) => a.id === i.id));

/** The last 14 days, oldest first: [{ day, rest (a recovery entry), move (a move entry) }]. */
export function restStrip(acts = [], log = [], today, n = 14) {
  const rings = ringOf(acts);
  const rest = daysOf(log, 'rest', rings);
  const move = daysOf(log, 'move', rings);
  return lastDays(today, n).map((day) => ({ day, rest: rest.has(day), move: move.has(day) }));
}
