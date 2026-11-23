/**
 * Abbiegepunkte für den Garmin (Noah 23.11.2026 «3a»): the turns of the Live-Karte (turnsOf, from the line)
 * as course points of a FIT course. The Edge 850 and 1040 show an arrow and the name («Links abbiegen»)
 * before each of them, with the phone off. Pure, tested in tests/garminturns.test.js.
 */
import { turnListText } from './turns.js';
import { COURSE_POINTS_MAX } from '../unterwegs/umwandeln.js';

/** The kinds of turns the Edge knows (COURSE_TYPE of umwandeln.js); a series of bends and a roundabout have none. */
const KIND = {
  left: 'left',
  right: 'right',
  'slight-left': 'slight_left',
  'slight-right': 'slight_right',
  'sharp-left': 'sharp_left',
  'sharp-right': 'sharp_right',
  'u-turn': 'u_turn',
};
/** All course points of one course (places and turns together): Garmin Connect's limit. */
export const COURSE_ALL_MAX = 250;

/**
 * The turns as places [{ lat, lon, kind, name, deg }] in km order; text(key, vars) gives the name
 * (t of the app). A series of bends ('bends') and anything without a FIT type is left out.
 */
export function turnPlaces(turns = [], text = (k) => k) {
  const out = [];
  for (const tn of turns ?? []) {
    const kind = KIND[tn?.dir];
    if (!kind || !Number.isFinite(tn.lat) || !Number.isFinite(tn.lon)) continue;
    const s = turnListText(tn);
    out.push({ lat: tn.lat, lon: tn.lon, kind, name: s ? text(s.key, s.vars) : kind, deg: tn.deg ?? 0, km: tn.km });
  }
  return out;
}

/**
 * Places and turns for one course: the places come first (at most COURSE_POINTS_MAX), the turns fill the rest of
 * COURSE_ALL_MAX; when there are too many turns the gentlest ones go first. Returns { places, turns, cut }:
 * the list to give toFit (with coursePointsMax: COURSE_ALL_MAX), how many turns are in it, how many were left out.
 */
export function withTurns(places = [], turnList = [], { max = COURSE_ALL_MAX } = {}) {
  const keep = (places ?? []).slice(0, COURSE_POINTS_MAX);
  const room = Math.max(0, max - keep.length);
  let used = turnList ?? [];
  if (used.length > room) used = [...used].sort((a, b) => b.deg - a.deg || a.km - b.km).slice(0, room);
  return { places: [...keep, ...used], turns: used.length, cut: (turnList?.length ?? 0) - used.length };
}
