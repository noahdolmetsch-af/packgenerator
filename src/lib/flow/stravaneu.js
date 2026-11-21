/**
 * «Aktivität anlegen?» (Noah 21.11.2026 «4a», Thread «Sportjahr», S7): Strava knows sports (hiking, swimming, ski
 * touring …) for which the person has no activity in Aktiv. Those units are never ticked and so never counted by the
 * goals. Pure helpers for the card in «Meine Sportarten»; the writing is src/lib/flow/StravaNeu.svelte, which uses
 * setSport() of stravaticks.js (it ticks the old activities too).
 */
import { seenSports, SPORTS } from '../stravaticks.js';
import { normAct } from '../flow.js';

/** The symbol of a new activity per Strava sport (a symbol of Aktiv, else the heart). */
export const ICON_OF = { Hike: 'walk', BackcountrySki: 'ski', AlpineSki: 'ski', Snowshoe: 'walk', Swim: 'swim', RockClimbing: 'climb', IceSkate: 'hockey', Tennis: 'tennis', Yoga: 'yoga', WeightTraining: 'gym', Run: 'run', Ride: 'bike', VirtualRide: 'spin' };

/** Strava sports seen in the activities that no activity of Aktiv takes and the person did not say «no» to. */
export const openSports = ({ activities = [], acts = [], map = {} } = {}) => seenSports(activities, acts, map).filter((r) => !r.actId && !r.own);

/** How many Strava activities wait in total. */
export const waiting = (rows = []) => rows.reduce((n, r) => n + r.count, 0);

/**
 * The activity to make for one open sport: its usual id when it is free (so the default match finds it), else
 * `<id>-2` …; movement ring, no goal (nothing is demanded), no minimum duration. name: already translated.
 */
export function newActFor(row, acts = [], name) {
  const s = SPORTS.find((x) => x.types[0] === row.key);
  const base = s?.ids[0] ?? `strava-${String(row.key).toLowerCase()}`;
  let id = base;
  for (let n = 2; acts.some((a) => a.id === id); n++) id = `${base}-${n}`;
  const order = acts.reduce((m, a) => Math.max(m, Number(a.order) || 0), -1) + 1;
  return normAct({ id, name, icon: ICON_OF[row.key] ?? 'heart', ring: 'move', order, goals: [], minMin: 0 });
}
