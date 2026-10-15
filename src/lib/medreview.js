/**
 * «Meditation» › Rückblick (mockup ME3, Noah 13.10.2026, approved «ME1-ME3 und Z1-Z5 freigeben»): all
 * sessions on one page, by week, month or year. Pure functions on the meditation log (flowLog) and the
 * session records (flowSessions); «Was dir hilft» is observation only, never advice.
 */
import { addDays } from './flow.js';
import { zurichParts } from './timer.js';

export const RANGES = ['week', 'month', 'year'];

/** One row per session: { id, day, at, min, art, tplId, depth, note, gong (sounds between start and end) }. */
export function reviewRows(log = [], sessions = [], actId = 'meditation') {
  const det = new Map(sessions.map((s) => [s.id, s]));
  return log
    .filter((e) => e.actId === actId && e.day && Number(e.min) > 0)
    .map((e) => {
      const s = det.get(e.id) ?? {};
      const d = Math.round(Number(s.depth));
      const b = s.bowl ?? {};
      return {
        id: e.id,
        day: e.day,
        at: e.at ?? s.at ?? null,
        min: Number(e.min) || 0,
        art: s.art ?? null,
        tplId: s.tplId ?? null,
        depth: d >= 1 && d <= 5 ? d : null,
        note: typeof s.note === 'string' ? s.note.trim() : '',
        gong: b.mode === 'every' || b.mode === 'random' || (b.mode === 'marks' && (b.marks ?? []).length > 0),
      };
    })
    .sort((a, b) => (b.day + (b.at ?? '')).localeCompare(a.day + (a.at ?? '')));
}

/** Only one kind and/or one template (null = all). */
export const filterReview = (rows, { art = null, tpl = null } = {}) => rows.filter((r) => (!art || r.art === art) && (!tpl || r.tplId === tpl));

const mondayOf = (day) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));
const monthEnd = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return addDays(`${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, '0')}-01`, -1);
};

/** The period: range 'week' | 'month' | 'year', `back` periods before the one of today. → { range, from, to, key } */
export function periodOf(range, today, back = 0) {
  if (range === 'week') {
    const from = addDays(mondayOf(today), -7 * back);
    return { range, from, to: addDays(from, 6), key: from };
  }
  if (range === 'year') {
    const y = Number(today.slice(0, 4)) - back;
    return { range, from: `${y}-01-01`, to: `${y}-12-31`, key: String(y) };
  }
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7)) - back;
  while (m < 1) (m += 12), y--;
  const ym = `${y}-${String(m).padStart(2, '0')}`;
  return { range: 'month', from: `${ym}-01`, to: monthEnd(ym), key: ym };
}

/** Days in a period up to today (a period in the future has 0). */
export function daysSoFar(p, today) {
  const to = p.to < today ? p.to : today;
  if (to < p.from) return 0;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${p.from}T00:00:00Z`)) / 864e5) + 1;
}

/** The numbers of a period: { days (with a session), of (days so far), min, longest, n }. */
export function periodStats(rows, p, today) {
  const list = rows.filter((r) => r.day >= p.from && r.day <= p.to);
  return {
    days: new Set(list.map((r) => r.day)).size,
    of: daysSoFar(p, today),
    min: Math.round(list.reduce((a, r) => a + r.min, 0)),
    longest: Math.round(list.reduce((a, r) => Math.max(a, r.min), 0)),
    n: list.length,
  };
}

/** Minutes per week (Monday on) for the `n` weeks up to the one of `today`, oldest first: [{ week, min }]. */
export function weekBars(rows, today, n = 8) {
  const w0 = mondayOf(today);
  const weeks = Array.from({ length: n }, (_, i) => addDays(w0, -7 * (n - 1 - i)));
  const by = new Map(weeks.map((w) => [w, 0]));
  for (const r of rows) {
    const w = mondayOf(r.day);
    if (by.has(w)) by.set(w, by.get(w) + r.min);
  }
  return weeks.map((week) => ({ week, min: Math.round(by.get(week)) }));
}

/** Minutes and days per month of a year: 12 × { month: 'YYYY-MM', min, days }. */
export function monthBars(rows, year) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`;
    const list = rows.filter((r) => r.day.startsWith(month));
    return { month, min: Math.round(list.reduce((a, r) => a + r.min, 0)), days: new Set(list.map((r) => r.day)).size };
  });
}

/** The days of a period with their minutes and a level 0–3 (for the calendar), Monday first: [{ day, min, level, future } | null]. */
export function periodDays(rows, p, today) {
  const by = new Map();
  for (const r of rows) by.set(r.day, (by.get(r.day) ?? 0) + r.min);
  const lead = (new Date(`${p.from}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: lead }, () => null);
  for (let d = p.from; d <= p.to; d = addDays(d, 1)) {
    const min = Math.round(by.get(d) ?? 0);
    cells.push({ day: d, min, level: !min ? 0 : min < 15 ? 1 : min < 30 ? 2 : 3, future: d > today });
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** The weekly goal in minutes: the goal's sessions per week × the usual minutes, or null without a goal. */
export function weekGoalMin(goals = [], minutes = 0) {
  const g = goals.find((q) => q.count > 0 && q.days > 0);
  if (!g || !(minutes > 0)) return null;
  return Math.round(Math.min(7, (g.count * 7) / g.days) * minutes);
}

const avg = (xs) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null);
const one = (x) => Math.round(x * 10) / 10;

/**
 * «Was dir hilft» (nur Beobachtung): up to three things the rows show, each with at least two sessions on
 * both sides: [{ id: 'morning' | 'gong' | 'kind', key, vars }]. kindName(id) gives the name of a kind.
 */
export function helps(rows, kindName = (x) => x) {
  const out = [];
  const hour = (r) => (r.at ? zurichParts(Date.parse(r.at)).h : null);
  const morning = rows.filter((r) => r.depth && hour(r) != null && hour(r) < 8).map((r) => r.depth);
  const evening = rows.filter((r) => r.depth && hour(r) != null && hour(r) >= 17).map((r) => r.depth);
  if (morning.length >= 2 && evening.length >= 2 && Math.abs(avg(morning) - avg(evening)) >= 0.5) {
    const deeper = avg(morning) > avg(evening);
    out.push({ id: 'morning', key: deeper ? 'Deeper in the morning' : 'Deeper in the evening', sub: 'before 08:00 avg. depth {a} · evenings {b}', vars: { a: one(avg(morning)), b: one(avg(evening)) } });
  }
  const withG = rows.filter((r) => r.gong).map((r) => r.min);
  const without = rows.filter((r) => !r.gong).map((r) => r.min);
  if (withG.length >= 2 && without.length >= 2 && Math.abs(avg(withG) - avg(without)) >= 3) {
    out.push({ id: 'gong', key: avg(withG) > avg(without) ? 'Longer with the singing bowl' : 'Longer without the singing bowl', sub: 'avg. {a} min with, {b} min without', vars: { a: Math.round(avg(withG)), b: Math.round(avg(without)) } });
  }
  const count = new Map();
  for (const r of rows) if (r.art) count.set(r.art, (count.get(r.art) ?? 0) + 1);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) out.push({ id: 'kind', key: 'Favourite kind', sub: '{name} · {n} times', vars: { name: kindName(top[0]), n: top[1] } });
  return out;
}
