/**
 * The page «Tour» (Noah 19.10.2026 «1a»): everything one finished tour holds, read in one go so the page
 * follows every change (liveQuery). The same rows as «Abgeschlossene Touren» (aktivitaeten.js tourRows),
 * the same trips and states as Touren › Packmodus (rueckblick.js tripFacts, state.js factStates).
 */
import { loadReview } from '../review/load.js';
import { loadActs } from '../review/actdata.js';
import { tripFacts } from '../review/rueckblick.js';
import { factStates } from '../review/state.js';
import { homeTrips } from '../home/heute.js';
import { tourRows, actRow, bikeMap } from './aktivitaeten.js';
import { activitiesForTrip, ftpEstimate } from '../training.js';
import { parseKey, rowWithOwn, groupOf, TOUR_GROUPS_KEY } from './tour.js';
import { tripStateInfo } from '../tripstate.js';

/**
 * → { missing } or { key, kind, id, row, acts, trip, fact, debrief, group, groups, rides, bikes, items, state, partOf }
 *   state: 'plan' | 'done' | 'rated' ('plan' only for a trip still ahead or under way); partOf: { href, name } the bigger tour an activity is a part of, or null.
 */
export async function loadTour(db, key, { today, bounds = null } = {}) {
  const k = parseKey(key);
  if (!k) return { missing: true };
  const [review, acts, kmBook, groupsRec] = await Promise.all([loadReview(db), loadActs(db), db.kmBook.toArray(), db.settings.get(TOUR_GROUPS_KEY)]);
  const groups = Array.isArray(groupsRec?.value) ? groupsRec.value : [];
  const facts = tripFacts({ ...review, trips: homeTrips(review.trips), today });
  const states = factStates(facts, { debriefs: review.debriefs, rides: review.rides, today });
  const packed = facts.filter((r) => r.kind === 'trip' && r.trip && (states[r.id]?.state === 'done' || states[r.id]?.state === 'rated')).map((r) => ({ trip: r.trip, state: states[r.id].state }));
  const ftp = ftpEstimate(acts, today);
  const rows = tourRows(acts, { packed, kmBook, bounds, ftp, groups, showHidden: true });
  const base = { key, kind: k.kind, id: k.id, groups, bikes: review.bikes, items: review.items, trip: null, fact: null, debrief: null, group: null, rides: [], partOf: null };

  if (k.kind === 'a') {
    const a = acts.find((x) => String(x.id) === k.id);
    if (!a) return { missing: true };
    const row = actRow(a, { bounds, ftp, bikeOf: bikeMap(kmBook) });
    const big = rows.find((r) => r.actIds.includes(a.id) && (r.pm || r.grp));
    const partOf = big?.pm ? { href: `#/tour/${encodeURIComponent(`t:${big.pm.tripId}`)}`, name: big.pm.title } : big?.grp ? { href: big.href, name: big.name } : null;
    return { ...base, row, acts: [a], state: a.own?.rating ? 'rated' : 'done', partOf };
  }
  if (k.kind === 'g') {
    const group = groups.find((g) => g.id === k.id);
    const row = rows.find((r) => r.id === key);
    if (!group || !row) return { missing: true };
    const list = group.acts.map((id) => acts.find((a) => String(a.id) === String(id))).filter(Boolean).sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
    return { ...base, row, acts: list, group, state: group.rating ? 'rated' : 'done' };
  }
  // 't': a trip of the Packmodus
  const trip = review.trips.find((x) => x.id === k.id);
  if (!trip) return { missing: true };
  const fact = facts.find((r) => r.kind === 'trip' && r.trip?.id === trip.id) ?? null;
  const list = activitiesForTrip(trip, acts, kmBook);
  let row = rows.find((r) => r.pm?.tripId === trip.id) ?? null;
  if (!row) {
    // a trip without a Strava activity: its own values (uploaded ride, the planned route)
    row = rowWithOwn(
      {
        id: key,
        actIds: [],
        name: trip.title ?? '',
        day: fact?.start ?? trip.startDate,
        endDay: fact?.end ?? trip.startDate,
        time: '',
        type: '',
        kind: 'bike',
        n: 0,
        bikeId: trip.bikeId ?? null,
        km: fact?.km ?? null,
        hm: fact?.gainM ?? null,
        dauer: null,
        verstr: null,
        hf: null,
        hfmax: null,
        kmh: null,
        w: null,
        tss: null,
        zones: null,
        changed: [],
        strava: {},
      },
      trip.own,
    );
  }
  const debrief = review.debriefs.find((d) => d.tripId === trip.id) ?? null;
  const st = fact ? states[fact.id]?.state : null;
  const rides = review.rides.filter((r) => r.tripId === trip.id);
  // UI-Test 26.10.2026 T1: a trip still ahead or under way is «Geplant» here too, not «Abgeschlossen»
  const state = tripStateInfo(trip, { debrief, rides, today }).state === 'plan' ? 'plan' : st === 'rated' ? 'rated' : 'done';
  return { ...base, row: { ...row, name: trip.own?.name || trip.title || row.name }, acts: list, trip, fact, debrief, rides, state };
}

/** Is this activity part of a joined tour? (for the page of one activity) */
export const joinedOf = (groups, actId) => groupOf(groups, actId);
