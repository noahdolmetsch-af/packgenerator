/**
 * Paket Q #74 «Kachel-Wand Teil 2» (Noah 19.10.2026 «4a und als Kachel in der Spielwiese»):
 * - weekTip: one tip of «Good to know» per week (Monday to Sunday the same), ones you have not used first;
 * - byTime: Today's wall follows the time of day: in the morning the morning tiles move to the front,
 *   in the evening the evening tiles. Nothing is removed; the switch WALL_TIME_KEY turns it off.
 * Pure, tested in tests/tipweek.test.js.
 */
export const WALL_TIME_KEY = 'wallByTime';

/** Week number since 2020-01-06 (a Monday) of a 'YYYY-MM-DD' day. */
export const weekIndex = (day) => Math.floor((Date.UTC(...day.split('-').map((n, i) => (i === 1 ? n - 1 : +n))) - Date.UTC(2020, 0, 6)) / (7 * 864e5));

/** The tip of this week: only tips that lead to a page (go.href); the unused ones first. */
export function weekTip(tips = [], day, used = new Set()) {
  const pool = tips.filter((x) => x.go?.href);
  if (!pool.length) return null;
  const fresh = pool.filter((x) => !used.has(x.id));
  const list = fresh.length ? fresh : pool;
  return list[((weekIndex(day) % list.length) + list.length) % list.length];
}

/** Which part of the day an hour (0–23) is. */
export const partOf = (hour) => (hour >= 5 && hour < 11 ? 'morning' : hour >= 17 ? 'evening' : 'day');

/** Tiles that fit a part of the day, most fitting first. */
export const TIME_TILES = {
  morning: ['questions', 'suggest', 'tipweek'],
  evening: ['questions', 'trip', 'week'],
};

/** Tiles that stay on top when they lead the wall. */
export const KEEP_TOP = ['body', 'acts', 'meditation', 'daycard', 'important', 'routine', 'trip', 'flow']; // HN4: its head stays as it is; N2: «Your body today» and the Aktiv tiles

/** The wall for this hour: the fitting tiles that are on it move to the front, in this order. */
export function byTime(tiles = [], hour = 12, on = true) {
  const want = on ? (TIME_TILES[partOf(hour)] ?? []) : [];
  if (!want.length) return tiles;
  // the top of Today keeps its place (HN4: meditation, day card, «Important today», the routine, and the next
  // trip when it moved up; Im Flow right after); the fitting tiles move up right below it
  const head = [];
  for (const x of tiles) if (KEEP_TOP.includes(x.id) && head.length === tiles.indexOf(x)) head.push(x);
  const front = want.map((id) => tiles.find((x) => x.id === id)).filter((x) => x && !head.includes(x));
  return [...head, ...front, ...tiles.filter((x) => !front.includes(x) && !head.includes(x))];
}
