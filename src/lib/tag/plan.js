/**
 * «Plan mir den Tag» (Noah 23.11.2026 «ja», Mein Tag step 4): a proposal for the entries of a day that have no time yet.
 * Rules, no AI: each own entry without a time goes into the first free gap, with a buffer after the other blocks
 * (the way between), and never over lunch. «Lighter» places only half and leaves more air, «Harder» places all
 * with little air and a longer day. Everything is a suggestion: the page lets the user untick a line and nothing is stored before «Take over».
 * Pure rules, no page. The page part is src/lib/tag/PlanSheet.svelte.
 */
import { layoutDay, lengthOf, toMin } from './timeline.js';

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

/**
 * entries: the entries of the day (buildWeek). day, today: YYYY-MM-DD. now: minutes of the day (only used for today).
 * → { moves: [{ id, title, time: 'HH:MM', mins, why: { code: 'after', other } | { code: 'free' } }],
 *     left: [{ id, title, code: 'full' | 'later' }], hints: [{ code: 'rain' | 'busy' | 'late', title? }] }
 */
export function planDay(entries = [], { day = '', today = '', now = 0, wet = false, mode = 'normal' } = {}) {
  const cfg = PLAN_CFG[mode] ?? PLAN_CFG.normal;
  const out = { moves: [], left: [], hints: [] };
  if (day && today && day < today) return out;
  const lay = layoutDay(entries);
  const open = lay.untimed.filter((e) => e.own && !e.done && (e.kind === 'todo' || e.kind === 'date'));
  const booked = lay.blocks.map((b) => ({ a: b.start, b: b.end, title: b.e.title }));
  const total = booked.reduce((n, x) => n + (x.b - x.a), 0);
  if (total > BUSY_MINS) out.hints.push({ code: 'busy' });
  if (wet) for (const b of lay.blocks) if (b.e.kind === 'sport') out.hints.push({ code: 'rain', title: b.e.title });
  if (!open.length) return out;

  const from = day === today ? Math.max(PLAN_START, up(now)) : PLAN_START;
  if (day === today && from > cfg.end - 30) out.hints.push({ code: 'late' });
  const walls = [...booked, { a: LUNCH[0], b: LUNCH[1], title: '' }];
  const take = Math.min(open.length, Math.ceil(open.length * cfg.share));
  open.forEach((e, i) => {
    if (i >= take) return out.left.push({ id: e.id, title: e.title, code: 'later' });
    const len = Math.max(15, lengthOf(e).mins);
    let found = null;
    for (let s = from; s + len <= cfg.end; s += 15) {
      const clash = walls.find((w) => s < w.b + (w.title ? cfg.buffer : 0) && s + len + (w.title ? cfg.buffer : 0) > w.a);
      if (!clash) {
        found = s;
        break;
      }
    }
    if (found == null) return out.left.push({ id: e.id, title: e.title, code: 'full' });
    const before = walls.filter((w) => w.title && w.b <= found).sort((x, y) => y.b - x.b)[0];
    const why = before && found - before.b <= cfg.buffer + 15 ? { code: 'after', other: before.title } : { code: 'free' };
    const pad = (n) => String(n).padStart(2, '0');
    out.moves.push({ id: e.id, title: e.title, time: `${pad(Math.floor(found / 60))}:${pad(found % 60)}`, mins: len, why });
    walls.push({ a: found, b: found + len, title: e.title });
  });
  return out;
}

export { toMin };
