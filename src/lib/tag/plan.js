/**
 * «Plan mir den Tag» (Noah 23.11.2026 «ja», Mein Tag step 4; 23.11. 21:13 «immer möglich»): a proposal for the entries of a day
 * that have no time yet: own dates and to-dos, but also sessions, calendar dates and tasks (they get a time as a layer, `week.times`).
 * Rules, no AI: each entry goes into the first free gap, with a buffer after the other blocks (the way between),
 * and never over lunch. What does not fit on the day moves to tomorrow (only own entries can change their day).
 * «Lighter» places only half and leaves more air, «Harder» places all with little air and a longer day.
 * Everything is a suggestion: the page lets the user untick a line and nothing is stored before «Take over».
 * Pure rules, no page. The page part is src/lib/tag/PlanSheet.svelte.
 */
import { layoutDay, lengthOf } from './timeline.js';

export const PLAN_MODES = ['lighter', 'normal', 'harder'];
/** Per mode: minutes of air around the other blocks, when the day ends, how many of the open entries are placed. */
export const PLAN_CFG = {
  lighter: { buffer: 30, end: 19 * 60, share: 0.5 },
  normal: { buffer: 15, end: 20 * 60, share: 1 },
  harder: { buffer: 5, end: 21 * 60, share: 1 },
};
export const PLAN_START = 8 * 60;
export const LUNCH = [12 * 60, 13 * 60];
export const BUSY_MINS = 6 * 60; // more than this booked: a hint

const up = (m) => Math.ceil(m / 15) * 15;
const pad = (n) => String(n).padStart(2, '0');
const clock = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** The first start (minutes) from `from` where `len` fits between the walls with the buffer, or null. */
function slot(walls, len, from, cfg) {
  for (let s = from; s + len <= cfg.end; s += 15) {
    const clash = walls.find((w) => s < w.b + (w.title ? cfg.buffer : 0) && s + len + (w.title ? cfg.buffer : 0) > w.a);
    if (!clash) return s;
  }
  return null;
}
const wallsOf = (lay) => [...lay.blocks.map((b) => ({ a: b.start, b: b.end, title: b.e.title })), { a: LUNCH[0], b: LUNCH[1], title: '' }];
const whyOf = (walls, at, cfg) => {
  const before = walls.filter((w) => w.title && w.b <= at).sort((x, y) => y.b - x.b)[0];
  return before && at - before.b <= cfg.buffer + 15 ? { code: 'after', other: before.title } : { code: 'free' };
};

/**
 * entries: the entries of the day (buildWeek). day, today: YYYY-MM-DD. now: minutes of the day (only used for today).
 * next: { day, entries } of the following day, to move what does not fit there (omit: nothing moves).
 * → { moves: [{ id, title, day, time: 'HH:MM', mins, own, soft, why: { code: 'after', other } | { code: 'free' } | { code: 'tomorrow' } }],
 *     left: [{ id, title, code: 'full' | 'later' }], hints: [{ code: 'rain' | 'busy' | 'late', title? }] }
 * soft: a calendar date without a time (often all day), the page does not preselect it.
 */
export function planDay(entries = [], { day = '', today = '', now = 0, wet = false, mode = 'normal', next = null } = {}) {
  const cfg = PLAN_CFG[mode] ?? PLAN_CFG.normal;
  const out = { moves: [], left: [], hints: [] };
  if (day && today && day < today) return out;
  const lay = layoutDay(entries);
  const open = lay.untimed.filter((e) => !e.done && (e.kind === 'todo' || e.kind === 'date' || e.kind === 'sport'));
  const walls = wallsOf(lay);
  const total = lay.blocks.reduce((n, b) => n + (b.end - b.start), 0);
  if (total > BUSY_MINS) out.hints.push({ code: 'busy' });
  if (wet) for (const b of lay.blocks) if (b.e.kind === 'sport') out.hints.push({ code: 'rain', title: b.e.title });
  if (!open.length) return out;

  const from = day === today ? Math.max(PLAN_START, up(now)) : PLAN_START;
  if (day === today && from > cfg.end - 30) out.hints.push({ code: 'late' });
  const nextLay = next?.entries ? layoutDay(next.entries) : null;
  const nextWalls = nextLay ? wallsOf(nextLay) : null;
  const take = Math.min(open.length, Math.ceil(open.length * cfg.share));
  open.forEach((e, i) => {
    const own = !!e.own;
    const soft = e.kind === 'date' && !own;
    const len = Math.max(15, lengthOf(e).mins);
    const item = { id: e.id, title: e.title, own, soft, mins: len };
    if (i >= take) return out.left.push({ id: e.id, title: e.title, code: 'later' });
    const at = slot(walls, len, from, cfg);
    if (at != null) {
      out.moves.push({ ...item, day, time: clock(at), why: whyOf(walls, at, cfg) });
      walls.push({ a: at, b: at + len, title: e.title });
      return;
    }
    // does not fit on this day: an own entry can move to the next one (the others keep their day)
    const to = own && nextWalls ? slot(nextWalls, len, PLAN_START, cfg) : null;
    if (to == null) return out.left.push({ id: e.id, title: e.title, code: 'full' });
    out.moves.push({ ...item, day: next.day, time: clock(to), why: { code: 'tomorrow' } });
    nextWalls.push({ a: to, b: to + len, title: e.title });
  });
  return out;
}
