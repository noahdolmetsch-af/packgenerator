/**
 * «Haken und Rhythmus» (S5, Noah 22.11.2026 «a, aber sicherstellen, dass keine vergangenen daten verloren gehen»):
 * the list of entries that the tick analyses (flow/auswertung.js) read at the bottom of the Sports year. It is exactly
 * what the retired page «Haken ausgewertet» read (all: every tick of an activity that exists; one activity: what counts
 * for it, also the trips and «zählt auch»), PLUS every Strava unit without a tick of its own. Nothing of the old list
 * is left out; tests/rhythmus.test.js proves that with a copy of a backup.
 */
import { normAct, entriesFor } from '../flow.js';

/** A Strava unit without a tick of its own (einheiten.js gives it the id «strava-<id>»). */
export const isStravaOnly = (u) => String(u?.id ?? '').startsWith('strava-');

/** It reads like a tick: the analyses know day, at, actId, n and min. */
export const asTick = (u) => ({ id: u.id, day: u.day, at: u.at, actId: u.sport, n: 1, min: u.minQuelle === 'gemessen' ? u.min : 0 });

/** The sports of Strava units that belong to no activity of Aktiv yet: [{ id: 'strava:Hike', type: 'Hike' }]. */
export function looseSports(units = [], acts = []) {
  const ids = new Set(acts.map((a) => a.id));
  const out = new Map();
  for (const u of units) if (isStravaOnly(u) && !ids.has(u.sport) && !out.has(u.sport)) out.set(u.sport, u.stravaType ?? String(u.sport).replace(/^strava:/, ''));
  return [...out].map(([id, type]) => ({ id, type }));
}

/**
 * units: all units (einheiten()); log: flowLog; acts: flowActs; days: tripDays(); pick: '' (all) | an activity id | a loose sport.
 */
export function rhythmList({ units = [], log = [], acts = [], days = [], pick = '' } = {}) {
  const nacts = acts.map(normAct);
  const act = nacts.find((a) => a.id === pick) ?? null;
  const only = units.filter(isStravaOnly);
  if (act) return [...entriesFor(act, log, days), ...only.filter((u) => u.sport === act.id).map(asTick)];
  if (pick) return only.filter((u) => u.sport === pick).map(asTick);
  const ids = new Set(nacts.map((a) => a.id));
  return [...log.filter((e) => ids.has(e.actId)), ...only.map(asTick)];
}
