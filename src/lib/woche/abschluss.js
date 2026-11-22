/**
 * «Wochen-Abschluss am Sonntag» (Noah 05.11.2026 «Planen 2b»): three lines about the shown week and one tip.
 *   done      what is ticked: sessions and tasks (your to-dos and bike jobs)
 *   open      what stayed open: sessions of days up to today, tasks
 *   move      your own open to-dos and bike jobs of the week: they can slide to next Monday («Move to Monday»)
 * Pure rules, no database, no clock: weekClose gets the days of buildWeek (lib/woche.js). Everything is a suggestion;
 * moveItems changes only the day of the items you leave ticked, and the page offers Undo.
 */
import { shiftDay } from '../training.js';

/** Sunday? (calendar day YYYY-MM-DD, no clock) */
export const isSunday = (day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 0;

const TASKS = ['todo', 'bike'];

/** The counts of one list of entries: { sessions, tasks, n }. */
const count = (list) => {
  const sessions = list.filter((e) => e.kind === 'sport').length;
  const tasks = list.filter((e) => TASKS.includes(e.kind)).length;
  return { sessions, tasks, n: sessions + tasks };
};

/**
 * days: the days of buildWeek ({ day, entries: [{ id, kind, title, done, own }] }); monday and today: YYYY-MM-DD.
 * trips: how many trips stand in the week (week.sums.trips; Noah 08.11.2026 «1-5 a»: a week with a trip is not «nothing planned»).
 * → { done: { sessions, tasks, n }, open: { sessions, tasks, n }, move: [{ id, title, day, kind }], trips, next: next Monday }
 */
export function weekClose(days = [], monday, today, trips = 0) {
  const all = days.flatMap((d) => (d.entries ?? []).map((e) => ({ ...e, day: d.day })));
  const mine = all.filter((e) => e.kind === 'sport' || TASKS.includes(e.kind));
  const done = mine.filter((e) => e.done);
  const open = mine.filter((e) => !e.done && (e.kind !== 'sport' || e.day <= today));
  const move = all.filter((e) => e.own && TASKS.includes(e.kind) && !e.done).map((e) => ({ id: e.id, title: e.title, day: e.day, kind: e.kind }));
  return { done: count(done), open: count(open), move, trips, next: shiftDay(monday, 7) };
}

/** The items with the chosen ids put on a day (the time stays); the others are left as they are. */
export const moveItems = (items = [], ids = [], day) => {
  const set = new Set(ids);
  return items.map((x) => (set.has(x.id) ? { ...x, day } : x));
};
