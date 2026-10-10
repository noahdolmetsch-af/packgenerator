/**
 * Hobby pages, package 1 (mockup A, Noah H14a, H15a): the six favourite tiles of Aktiv › Aktivität,
 * with a playful name (a suggestion, renamable) and one useful line instead of a date. Pure functions;
 * the fields live on the activity (flowActs, no index): nick / nickDe, fav, favOrder, tileLine, page.
 * Seed 2 (setting flow.seed2) gives existing and new users the names, the six favourites and a walk,
 * once, without overwriting anything of their own and without bringing back what they deleted.
 */
import { normAct, entriesFor, actState, addDays, lastDays } from './flow.js';
import { weekStart } from './flowms.js';

export const SEED2_KEY = 'flow.seed2';
export const MAX_FAVS = 6;
/** The kinds of line a tile can show (H15a). */
export const TILE_LINES = ['star', 'spark', 'week', 'nudge', 'streak', 'best'];
export const TILE_LINE_NAMES = { star: 'Milestone', spark: 'History', week: 'Week', nudge: 'Nudge', streak: 'Streak', best: 'Personal best' };

/** The six favourites of the seed with their playful names (suggestions) and the line that fits best. */
export const FAV_SEED = [
  { id: 'meditation', nick: 'Cushion time', nickDe: 'Kissenzeit', line: 'star' },
  { id: 'bike', nick: 'Pedal joy', nickDe: 'Pedal-Glück', line: 'spark' },
  { id: 'yoga', nick: 'Mat moment', nickDe: 'Matten-Moment', line: 'week' },
  { id: 'gym', nick: 'Iron hour', nickDe: 'Eisen-Stunde', line: 'nudge' },
  { id: 'tennis', nick: 'Felt ball', nickDe: 'Filzball', line: 'streak' },
  { id: 'pushups', nick: 'Floor kisses', nickDe: 'Boden-Küsse', line: 'best' },
];
/** More playful names for activities that are not favourites. */
export const MORE_NICKS = { sauna: { nick: 'Sweat break', nickDe: 'Schwitz-Pause' } };
/** The walk (H19a: Sauna and Spaziergang always there). */
export const WALK = { id: 'walk', name: 'Walk', nameDe: 'Spaziergang', icon: 'walk', ring: 'rest', goals: [{ id: 'g', count: 1, days: 7 }] };

/**
 * The activities seed 2 changes or adds (to put), given the activities now. Nothing of the user's own
 * is overwritten: a nick, a favourite choice or a line set before stays; a deleted seed activity
 * stays deleted (only the walk is new).
 */
export function seed2Plan(acts = []) {
  const list = acts.map(normAct);
  const byId = new Map(list.map((a) => [a.id, a]));
  const anyFav = list.some((a) => a.fav != null);
  const out = new Map();
  const put = (a, patch) => out.set(a.id, { ...(out.get(a.id) ?? a), ...patch });
  FAV_SEED.forEach((f, i) => {
    const a = byId.get(f.id);
    if (!a) return;
    if (a.nick == null && a.nickDe == null) put(a, { nick: f.nick, nickDe: f.nickDe });
    if (!anyFav) put(a, { fav: true, favOrder: i });
    if (!a.tileLine) put(a, { tileLine: f.line });
  });
  for (const [id, n] of Object.entries(MORE_NICKS)) {
    const a = byId.get(id);
    if (a && a.nick == null && a.nickDe == null) put(a, n);
  }
  const med = byId.get('meditation');
  if (med && !med.page) put(med, { page: 'meditation' });
  if (!byId.has(WALK.id)) {
    const order = list.reduce((m, a) => Math.max(m, a.order), -1) + 1;
    out.set(WALK.id, normAct({ ...WALK, order }));
  }
  return [...out.values()];
}

/** The favourites in their tile order (at most six). */
export const favActs = (acts = []) =>
  acts
    .map(normAct)
    .filter((a) => a.fav)
    .sort((a, b) => (a.favOrder ?? 99) - (b.favOrder ?? 99) || a.order - b.order)
    .slice(0, MAX_FAVS);

/** A new order for the favourites (move one up or down): the activities to put. */
export function moveFav(favs = [], id, dir) {
  const list = [...favs];
  const i = list.findIndex((a) => a.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return [];
  [list[i], list[j]] = [list[j], list[i]];
  return list.map((a, favOrder) => ({ ...a, favOrder }));
}

/** The kind of line of a tile: its own choice, else a fitting default. */
export const lineOf = (a) => (TILE_LINES.includes(a?.tileLine) ? a.tileLine : FAV_SEED.find((f) => f.id === a?.id)?.line ?? 'week');

/**
 * The line of a tile as { kind, key, vars } for t() (or n for tn), or { kind: 'spark', points } for
 * the mini curve. ms: the evaluated milestones of this activity (flowms.js).
 */
export function tileLine(a, { log = [], today, tripDays = [], ms = [] } = {}) {
  const kind = lineOf(a);
  const entries = entriesFor(normAct(a), log, tripDays).filter((e) => e.day <= today);
  if (kind === 'star') {
    const open = ms.filter((r) => !r.off && r.next).sort((x, y) => y.progress - x.progress)[0];
    if (!open) return ms.length ? { kind, key: 'All stars reached' } : { kind, key: 'No milestone yet' };
    const left = Math.max(0, Math.round((open.target - open.value) * 10) / 10);
    return { kind, key: '{n} to star {k}', vars: { n: left, k: open.next } };
  }
  if (kind === 'spark') {
    const w0 = weekStart(today);
    const points = Array.from({ length: 8 }, (_, i) => {
      const from = addDays(w0, (i - 7) * 7);
      const to = addDays(from, 6);
      return entries.filter((e) => e.day >= from && e.day <= to).length;
    });
    return { kind, points, key: '{n} times in 8 weeks', vars: { n: points.reduce((s, v) => s + v, 0) } };
  }
  if (kind === 'week') {
    const s = actState(normAct(a), log, today, tripDays);
    if (s.resting) return { kind, key: 'rests until {date}', vars: { date: s.restUntil }, date: 'date' };
    return { kind, parts: s.goals.map((r) => ({ goal: r.goal, n: Math.min(r.done, r.goal.count), of: r.goal.count })) };
  }
  if (kind === 'nudge') {
    const s = actState(normAct(a), log, today, tripDays);
    if (s.resting && s.restUntil) return { kind, key: 'Back on {date} · bag ready?', vars: { date: s.restUntil }, date: 'date' };
    if (s.todayDone) return { kind, key: 'Done today. Well done.' };
    const last = entries.reduce((m, e) => (e.day > m ? e.day : m), '');
    if (!last) return { kind, key: 'Not done yet: maybe today?' };
    const n = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 864e5);
    return { kind, n, one: 'Last time {n} day ago', many: 'Last time {n} days ago' };
  }
  if (kind === 'streak') {
    const days = new Set(entries.map((e) => e.day));
    const daily = normAct(a).goals.some((q) => q.days === 1 && q.count > 0);
    if (daily) {
      let n = 0;
      let d = days.has(today) ? today : addDays(today, -1);
      while (days.has(d)) (n++, (d = addDays(d, -1)));
      return { kind, n, one: '{n} day in a row', many: '{n} days in a row' };
    }
    const weeks = new Set([...days].map(weekStart));
    let n = 0;
    let w = weeks.has(weekStart(today)) ? weekStart(today) : addDays(weekStart(today), -7);
    while (weeks.has(w)) (n++, (w = addDays(w, -7)));
    return { kind, n, one: '{n} week in a row', many: '{n} weeks in a row' };
  }
  // best: the most in one entry (amount, or minutes)
  const byN = entries.filter((e) => e.via !== 'trip').reduce((b, e) => ((Number(e.n) || 1) > (b ? Number(b.n) || 1 : 1) ? e : b), null);
  if (byN) return { kind, key: '{n} in one go ({month})', vars: { n: byN.n, month: byN.day }, date: 'month' };
  const byMin = entries.reduce((b, e) => (Number(e.min) > (b ? Number(b.min) : 0) ? e : b), null);
  if (byMin) return { kind, key: '{n} min longest ({month})', vars: { n: byMin.min, month: byMin.day }, date: 'month' };
  return { kind, key: 'No best yet' };
}

/** The three rings this week (Monday to Sunday): per day, the rings with an entry; future days empty. */
export function ringWeek(acts = [], log = [], today) {
  const ring = new Map(acts.map((a) => [a.id, normAct(a).ring]));
  const mon = weekStart(today);
  return lastDays(addDays(mon, 6), 7).map((day) => {
    const on = new Set(log.filter((e) => e.day === day).map((e) => ring.get(e.actId)).filter(Boolean));
    return { day, future: day > today, today: day === today, move: on.has('move'), mind: on.has('mind'), rest: on.has('rest') };
  });
}
