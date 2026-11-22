/**
 * «Dauer nachtragen» for tour days (Noah 21.11.2026 22:47, Sportjahr S12): a day of a trip (cycling, ski touring, hiking) with no Strava activity and no
 * tick with minutes has no time and gets NO estimate (0 hours until you say). It is listed as «Tour on …, how long?»; one tap (an hour count or an own
 * number) writes a tick of the sport of that trip for that day with the minutes, source «tour», and from then on it counts as measured.
 * Not offered for an activity that counts trip days by itself («Cycling outdoors»: every trip day already counts there, a second tick would count twice),
 * nor when there is no activity for that sport. Pure functions plus two small writers. Tested in tests/tourtage.test.js.
 */
import { actFor } from '../stravaticks.js';
import { normAct, newEntry, addDays } from '../flow.js';
import { parseMinutes } from './feel.js';

export const VIA = 'tour';
/** The trip areas that are sports, and the Strava type that finds their activity. */
export const AREA_TYPE = { bikepacking: 'Ride', ski: 'BackcountrySki', hiking: 'Hike' };
/** The buttons next to the own number: tour days are long. */
export const TOUR_CHIPS = [60, 120, 180, 240];
/** The id of the tick of a tour day: so one day is never written twice. */
export const idOf = (tripId, day) => `fl-tour-${tripId}-${day}`;

/**
 * trips: db.trips; acts: flowActs; log: flowLog; activities: db.activities (Strava); map: the Strava table choice; today.
 * → [{ id, tripId, title, day, actId }] newest first: only past days.
 */
export function tourRows({ trips = [], acts = [], log = [], activities = [], map = {}, today }) {
  const live = acts.map(normAct);
  const byId = new Map(live.map((a) => [a.id, a]));
  const stravaDays = new Set(activities.map((a) => a?.day).filter(Boolean));
  const withMin = new Set(log.filter((e) => e.min && e.via !== 'commute').map((e) => `${e.actId}|${e.day}`));
  const have = new Set(log.map((e) => e.id));
  const out = [];
  for (const tr of trips) {
    const type = AREA_TYPE[tr?.domain ?? 'bikepacking'];
    if (!type || !tr?.startDate || tr.skipped || tr.idea || tr.archivedAt) continue;
    const actId = actFor({ type }, live, map);
    const act = actId ? byId.get(actId) : null;
    if (!act || act.paused || act.counts.includes('trip')) continue;
    const start = tr.startDate.slice(0, 10);
    const n = Math.max(1, Math.min(60, Number(tr.days) || 1));
    for (let i = 0; i < n; i++) {
      const day = addDays(start, i);
      if (day >= today) break;
      if (stravaDays.has(day) || withMin.has(`${act.id}|${day}`) || have.has(idOf(tr.id, day))) continue;
      out.push({ id: idOf(tr.id, day), tripId: tr.id, title: String(tr.title ?? ''), day, actId: act.id });
    }
  }
  return out.sort((a, b) => b.day.localeCompare(a.day) || a.tripId.localeCompare(b.tripId));
}

/** Write the tick of one tour day with its minutes. → the new tick, or null when the minutes are not valid. */
export async function writeTourDay(db, row, minutes) {
  const min = parseMinutes(minutes);
  const act = await db.flowActs.get(row.actId);
  if (min == null || !act) return null;
  const e = { ...newEntry(normAct(act), { day: row.day, at: `${row.day}T12:00:00.000Z`, n: 1, min, via: VIA }), id: row.id };
  await db.flowLog.put(e);
  return e;
}

/** «Undo»: the tick goes again. */
export const removeTourDay = (db, id) => db.flowLog.delete(id);
