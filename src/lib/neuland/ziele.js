/**
 * «Herausforderungen mit Ende» (Träume und Neuland N5, Noah 27.10.2026 «1-5 a»): a goal you set yourself for
 * New ground, with an end day, e.g. «5 new municipalities by the end of November» or «All lakes in canton
 * Zurich by the end of the year». The app counts by itself from Neuland (routes, rides, own ticks).
 *
 * Two kinds:
 *   count: `times` items of a collection reached for the first time between `from` and `until`;
 *   all:   every item of a collection in canton `kt` (built-in items carry their canton), reached any time up to `until`.
 * State: db.settings GOALS_KEY (in the backup) = [{ id, cid, mode, times, kt, from, until, name, doneOn }].
 * name: an own name ('' = the app writes the line). doneOn: the day the app saw it reached (stays).
 * Pure functions, tested in tests/ziele.test.js.
 */
import { CANTON_IDS } from './neuland.js';

export const GOALS_KEY = 'neuland.goals';
export const MODES = ['count', 'all'];

const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const clean = (s) => String(s ?? '').trim().slice(0, 60);

/** The last day of the month and of the year of a day. */
export function monthEnd(today) {
  const [y, m] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export const yearEnd = (today) => `${today.slice(0, 4)}-12-31`;

/** The stored goals made safe (broken ones left out). */
export function goalsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((g) => g && g.id && g.cid && isDay(g.from) && isDay(g.until))
    .map((g) => {
      const mode = MODES.includes(g.mode) ? g.mode : 'count';
      return {
        id: String(g.id),
        cid: String(g.cid),
        mode,
        times: Math.max(1, Math.min(999, Math.round(Number(g.times) || 1))),
        kt: mode === 'all' && CANTON_IDS.includes(g.kt) ? g.kt : null,
        from: g.from,
        until: g.until,
        name: clean(g.name),
        doneOn: isDay(g.doneOn) ? g.doneOn : null,
      };
    });
}

/** A new goal from the window's fields (from today; an end before today becomes the end of the month). */
export function newGoal({ cid, mode = 'count', times = 5, kt = null, until, name = '', today, id = `ng-${today}-${Math.random().toString(36).slice(2, 7)}` }) {
  return goalsOf([{ id, cid, mode, times, kt, from: today, until: until && until >= today ? until : monthEnd(today), name, doneOn: null }])[0] ?? null;
}

/**
 * Change a goal. Counting starts anew (from today) only when the collection or the kind changes; a reached
 * goal keeps its day unless what it asks for changes (collection, kind, number, canton).
 */
export function editGoal(list, id, fields, today) {
  return list.map((g) => {
    if (g.id !== id) return g;
    const f = { ...g, ...fields };
    const fresh = f.cid !== g.cid || f.mode !== g.mode;
    const asks = fresh || Number(f.times) !== g.times || (f.kt ?? null) !== g.kt;
    return goalsOf([{ ...f, id: g.id, from: fresh ? today : g.from, doneOn: asks ? null : g.doneOn }])[0] ?? g;
  });
}

/** The canton of a built-in item: municipalities carry `kt`, passes, huts, peaks and small lakes `region`. */
export const cantonOf = (it) => it?.kt ?? (CANTON_IDS.includes(it?.region) ? it.region : null);

/**
 * How far a goal is. items: the collection's items; visited: Map id → { day } (Neuland visitedOf).
 * → { have, need, left, done, ids } — ids: the items that count.
 */
export function progressOf(g, items = [], visited = new Map()) {
  if (g.mode === 'all') {
    const pool = items.filter((it) => !g.kt || cantonOf(it) === g.kt);
    const ids = pool.filter((it) => {
      const v = visited.get(it.id);
      return v?.day && v.day <= g.until;
    }).map((it) => it.id);
    const need = pool.length;
    return { have: ids.length, need, left: Math.max(0, need - ids.length), done: need > 0 && ids.length >= need, ids };
  }
  const ids = items.filter((it) => {
    const v = visited.get(it.id);
    return v?.day && v.day >= g.from && v.day <= g.until;
  }).map((it) => it.id);
  return { have: ids.length, need: g.times, left: Math.max(0, g.times - ids.length), done: ids.length >= g.times, ids };
}

/** 'done' (reached), 'over' (the end passed, not reached) or 'running'. */
export function goalState(g, prog, today) {
  if (g.doneOn || prog?.done) return 'done';
  return g.until < today ? 'over' : 'running';
}

/** Mark goals that are reached now with today (they stay reached). progs: Map id → progress. → { list, reached } */
export function stepGoals(list, progs, today) {
  const reached = [];
  const out = list.map((g) => {
    if (g.doneOn || !progs.get(g.id)?.done) return g;
    const d = { ...g, doneOn: today };
    reached.push(d);
    return d;
  });
  return { list: out, reached };
}

/** Days left until the end (0 on the last day, negative after it). */
export const daysLeft = (g, today) => Math.round((Date.parse(`${g.until}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);

/**
 * Three ready goals to tap (every number changeable in the window): new municipalities this month, all lakes
 * in your home canton this year, new passes this year. → [{ key, cid, mode, times, kt, until }]
 */
export function presets(today, homeKt = 'ZH') {
  const kt = CANTON_IDS.includes(homeKt) ? homeKt : 'ZH';
  return [
    { key: 'muni', cid: 'municipalities', mode: 'count', times: 5, kt: null, until: monthEnd(today) },
    { key: 'lakes', cid: 'lakes', mode: 'all', times: 1, kt, until: yearEnd(today) },
    { key: 'passes', cid: 'passes', mode: 'count', times: 3, kt: null, until: yearEnd(today) },
  ];
}

/** Running first (nearest end first), then reached (newest first), then the ones that ran out. */
export function sortGoals(list, states) {
  const rank = { running: 0, done: 1, over: 2 };
  return [...list].sort((a, b) => {
    const sa = states.get(a.id) ?? 'running';
    const sb = states.get(b.id) ?? 'running';
    if (sa !== sb) return rank[sa] - rank[sb];
    if (sa === 'done') return (b.doneOn ?? b.until) < (a.doneOn ?? a.until) ? -1 : 1;
    return a.until < b.until ? -1 : a.until > b.until ? 1 : 0;
  });
}
