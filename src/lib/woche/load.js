/**
 * «Woche planen»: everything the week reads, in one query (lib/woche.js builds the week from it).
 * The training plan, Aktiv's fixed dates, trips, bike care and the outside calendar stay where they
 * live; this only reads them. Google Kalender und Aufgaben (Paket B): db.gEvents and db.gTasks (Dexie 15) and
 * the agenda setting, turned into the week by googleWeek (lib/woche.js).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { ITEMS_KEY, AWAY_KEY, HIDE_KEY, NO_KEY, PLANNED_KEY, CAL_KEY, itemsOf, awayOf, calEntries } from '../woche.js';
import { PLAN_KEY as TRAIN_KEY, GOAL_KEY, planOf, goalOf } from '../training.js';
import { FIXED_KEY, PLAN_KEY as FLOW_PLAN_KEY, fixedList } from '../flowweek.js';
import { sortBikes } from '../bikes.js';
import { withVisits } from '../workshop.js';
import { bikeCare } from '../readiness.js';
import { AGENDA_KEY } from '../agenda.js';

const shiftBack = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

const KEYS = [AGENDA_KEY, ITEMS_KEY, AWAY_KEY, HIDE_KEY, NO_KEY, PLANNED_KEY, CAL_KEY, TRAIN_KEY, GOAL_KEY, FIXED_KEY, FLOW_PLAN_KEY];

/** The raw sources of the week (a liveQuery); today: YYYY-MM-DD for the bike care. */
export function weekQuery(today) {
  return liveQuery(async () => {
    const [sets, trips, acts, flowActs, bikes, tasks, visits, gEvents, gTasks, flowLog, book] = await Promise.all([
      db.settings.where('key').anyOf(KEYS).toArray(),
      db.trips.toArray(),
      db.activities.toArray(),
      db.flowActs.toArray(),
      db.bikes.toArray(),
      db.maintenance.toArray(),
      db.visits.toArray(),
      // Google's copy on this device (Paket B); a week back to two months ahead, so the whole table is small
      db.gEvents ? db.gEvents.toArray() : [],
      db.gTasks ? db.gTasks.toArray() : [],
      // Klick-Rundgang 22.10.2026 H22: what was ticked in Aktiv shows in the week (two weeks back to the end of next week)
      db.flowLog.where('day').between(shiftBack(today, 14), shiftBack(today, -14), true, true).toArray(),
      // rides by hand or from a file count in «last week» too (Klick-Rundgang: «keine» although 46 km were ridden)
      db.kmBook.where('date').between(shiftBack(today, 21), today, true, true).toArray(),
    ]);
    const s = Object.fromEntries(sets.map((x) => [x.key, x.value]));
    const care = sortBikes(bikes)
      .filter((b) => !b.archived && !b.sold)
      .flatMap((b) => (bikeCare(withVisits(b, visits), { tasks, visits, today })?.rows ?? []).map((r) => ({ bikeId: b.id, bikeName: b.name, key: r.key, part: r.part, name: r.name })));
    return {
      items: itemsOf(s[ITEMS_KEY]),
      rawItems: Array.isArray(s[ITEMS_KEY]) ? s[ITEMS_KEY] : [],
      away: awayOf(s[AWAY_KEY]),
      hide: Array.isArray(s[HIDE_KEY]) ? s[HIDE_KEY] : [],
      no: Array.isArray(s[NO_KEY]) ? s[NO_KEY] : [],
      planned: typeof s[PLANNED_KEY] === 'string' ? s[PLANNED_KEY] : null,
      cal: calEntries(s[CAL_KEY]),
      sessions: planOf(s[TRAIN_KEY]),
      goal: goalOf(s[GOAL_KEY]),
      fixed: fixedList(s[FIXED_KEY]),
      plans: Array.isArray(s[FLOW_PLAN_KEY]) ? s[FLOW_PLAN_KEY] : [],
      trips: trips.filter((tr) => tr.startDate && !tr.skipped).map((tr) => ({ id: tr.id, title: tr.title ?? tr.name ?? '', startDate: tr.startDate, days: tr.days })),
      acts,
      flowActs,
      flowLog,
      book,
      care,
      google: { events: gEvents, tasks: gTasks, prefs: s[AGENDA_KEY] },
    };
  });
}

/** Save one setting of the week. */
export const putWeek = (key, value) => db.settings.put({ key, value: JSON.parse(JSON.stringify(value)) });
