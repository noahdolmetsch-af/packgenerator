/**
 * «Gemeinsame Einheiten» (Noah 21.11.2026 «1a dann b 2b», Thread «Sportjahr», S2): every session from the ticks
 * of Aktiv (flowLog) and the Strava activities (db.activities) in ONE list with the same fields, so the evaluations
 * (Sportjahr, review per sport) read both together. Only reading: nothing new is saved, nothing is written into a tick.
 *
 * A unit: { id, day, at, actId | null, sport, ring, name?, min | null, minQuelle: 'gemessen' | 'ca.' | null,
 *           quelle: 'strava' | 'timer' | 'hand' | 'plan' | 'weg' | 'tp', km?, hm?, hr?, stravaId?, feel? }
 *
 * - A Strava tick (via 'strava', stravaId) and its Strava activity are ONE unit (never counted twice); the numbers
 *   (km, hm, heart rate, time) come from the activity.
 * - A Strava activity without a tick of its own (a second ride on a day, a sport with no activity yet like Hike or
 *   Swim) is a unit as well. When a hand tick of the same activity and day waits without Strava data, the Strava
 *   activity belongs to it (the same session: it gives its numbers, the tick keeps its source «hand»).
 * - minQuelle 'gemessen': the minutes come from Strava, the timer or the person. 'ca.': none known, the usual
 *   duration of the sport (usualmin.js, standard 60) is used; calculated here only, never stored. null: nothing to
 *   estimate (counted amounts like push-ups, the ride to work).
 */
import { normAct } from '../flow.js';
import { actFor, sportKey, SPORTS } from '../stravaticks.js';
import { usualFor } from './usualmin.js';

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
const mins = (s) => (num(s) ? Math.max(1, Math.round(Number(s) / 60)) : null);

/** The source of a tick: 'strava' | 'timer' | 'weg' (the ride to work) | 'plan' | 'tp' (TrainingPeaks) | 'hand'. */
export const quelleOf = (e) => {
  if (e?.src === 'tp') return 'tp';
  if (e?.via === 'strava' || e?.via === 'timer' || e?.via === 'plan') return e.via;
  if (e?.via === 'commute') return 'weg';
  return 'hand';
};

/** The key of a sport that has no activity (yet): the Strava type's first name, «strava:Hike». */
const looseId = (a) => `strava:${sportKey(a.type, !!a.trainer)}`;

/**
 * activities: db.activities; acts: flowActs; log: flowLog; usual: the setting sport.usualMin; map: the choice of
 * the Strava table (strava.ticks.map). → units, oldest first.
 */
export function einheiten({ log = [], activities = [], acts = [], usual = {}, map = {} } = {}) {
  const actOf = new Map(acts.map((a) => [a.id, normAct(a)]));
  const stravaById = new Map(activities.map((a) => [String(a.id), a]));
  const used = new Set();
  const units = [];

  const fromStrava = (a) => ({ km: num(a.km), hm: num(a.hm), hr: num(a.hrAvg), movingMin: mins(a.movingS), name: a.name || undefined });
  const make = (e, a) => {
    const act = actOf.get(e.actId);
    const q = quelleOf(e);
    const s = a ? fromStrava(a) : {};
    let min = num(e.min) ?? s.movingMin ?? null;
    let minQuelle = min ? 'gemessen' : null;
    // counted amounts (push-ups) and the ride to work have no time to estimate
    const estimable = act && !(act.perTap > 1) && q !== 'weg';
    if (!min && estimable) {
      min = usualFor(usual, e.actId).min;
      minQuelle = 'ca.';
    }
    const u = { id: e.id, day: e.day, at: e.at ?? `${e.day}T12:00:00.000Z`, actId: e.actId, sport: e.actId, ring: act?.ring ?? 'move', min, minQuelle, quelle: q };
    if (s.name) u.name = s.name;
    if (s.km) u.km = s.km;
    if (s.hm) u.hm = s.hm;
    if (s.hr) u.hr = s.hr;
    if (e.stravaId) u.stravaId = String(e.stravaId);
    if (e.feel) u.feel = e.feel; // the feeling arrives with «Training erfassen»; only passed on
    return u;
  };

  // 1. every tick; a Strava tick takes the numbers of its activity
  const handFree = new Map(); // `${actId}|${day}` → the hand tick units that still wait for Strava data
  for (const e of log) {
    if (!e?.actId || !e.day) continue;
    const a = e.stravaId ? stravaById.get(String(e.stravaId)) : null;
    if (e.stravaId) used.add(String(e.stravaId));
    const u = make(e, a);
    units.push(u);
    if (!e.stravaId && ['hand', 'timer', 'plan'].includes(u.quelle)) {
      const k = `${e.actId}|${e.day}`;
      if (!handFree.has(k)) handFree.set(k, []);
      handFree.get(k).push({ u, e });
    }
  }

  // 2. Strava activities without a tick of their own
  for (const a of [...activities].sort((x, y) => String(x.start ?? x.day).localeCompare(String(y.start ?? y.day)))) {
    const id = String(a.id);
    if (!a.day || used.has(id)) continue;
    const actId = actFor(a, acts, map);
    const free = actId ? handFree.get(`${actId}|${a.day}`) : null;
    if (free?.length) {
      // the same session as a hand tick of that day: the tick gets the numbers and the measured time
      const { u } = free.shift();
      const s = fromStrava(a);
      if (s.movingMin && u.minQuelle !== 'gemessen') {
        u.min = s.movingMin;
        u.minQuelle = 'gemessen';
      }
      if (s.km) u.km = s.km;
      if (s.hm) u.hm = s.hm;
      if (s.hr) u.hr = s.hr;
      if (s.name) u.name = s.name;
      u.stravaId = id;
      continue;
    }
    const act = actId ? actOf.get(actId) : null;
    const s = fromStrava(a);
    const sport = act ? act.id : looseId(a);
    let min = s.movingMin;
    let minQuelle = min ? 'gemessen' : null;
    if (!min) {
      min = usualFor(usual, sport).min;
      minQuelle = 'ca.';
    }
    const u = { id: `strava-${id}`, day: a.day, at: a.start ?? `${a.day}T12:00:00.000Z`, actId: act ? act.id : null, sport, ring: act?.ring ?? 'move', min, minQuelle, quelle: 'strava', stravaId: id };
    if (!act) u.stravaType = sportKey(a.type, !!a.trainer);
    if (s.name) u.name = s.name;
    if (s.km) u.km = s.km;
    if (s.hm) u.hm = s.hm;
    if (s.hr) u.hr = s.hr;
    units.push(u);
  }
  return units.sort((x, y) => x.day.localeCompare(y.day) || x.at.localeCompare(y.at) || x.id.localeCompare(y.id));
}

/** The label (English key for t()) of a Strava sport without an activity, from the list of stravaticks.js. */
export const looseLabel = (stravaType) => SPORTS.find((s) => s.types[0] === stravaType)?.label ?? stravaType;

/** Minutes of a unit list, measured and estimated apart: { gemessen, ca, n, nCa }. */
export function summe(units = []) {
  const o = { gemessen: 0, ca: 0, n: units.length, nCa: 0, nOhne: 0 };
  for (const u of units) {
    if (u.minQuelle === 'gemessen') o.gemessen += u.min;
    else if (u.minQuelle === 'ca.') {
      o.ca += u.min;
      o.nCa += 1;
    } else o.nOhne += 1;
  }
  return o;
}

/** Units without a measured time (the list for «Dauer nachtragen»), newest first. */
export const ohneMessung = (units = []) => units.filter((u) => u.minQuelle !== 'gemessen' && u.quelle !== 'weg').sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at));
