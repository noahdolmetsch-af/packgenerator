/**
 * «Alles, was du angelegt hast» (Noah 23.11.2026 «bei den analysen sollen immer alle angelegten dinge ausgewertet werden», Thread
 * «Analyse-Seite viel besser machen»): the week review lists EVERY activity of Aktiv with its times of the week, also the daily
 * habits (push-ups, teeth, stretching), the sports without a goal (ice hockey, climbing) and the ones with 0 times, plus the Strava
 * sports that have no activity in Aktiv. The five numbers of the week (hours, km, sessions …) stay as they are: this list only
 * adds, it takes nothing away and changes no sum. The units come from the shared list (einheiten.js), so a Strava session with a
 * tick counts once. A session of Strava without a tick of its own is shown, marked «not counted yet» (it counts for no goal).
 * Only reading, nothing is saved. Pure: no database, no clock.
 */
import { normAct } from '../flow.js';
import { einheiten, looseLabel } from './einheiten.js';
import { goalPerWeek, rituale } from './rituale.js';
import { shiftDay } from '../training.js';

const fromStravaOnly = (u) => String(u.id).startsWith('strava-');

/** One row of an activity: { id, n, days, measuredMin, goal, waiting } (waiting: sessions only from Strava, no tick). */
function rowOf(act, units, from, to) {
  const goal = goalPerWeek(act, to);
  const own = units.filter((u) => u.quelle !== 'weg' && u.actId === act.id && u.day >= from && u.day <= to);
  return {
    id: act.id,
    n: own.length,
    days: new Set(own.map((u) => u.day)).size,
    measuredMin: own.reduce((s, u) => s + (u.minQuelle === 'gemessen' ? Number(u.min) || 0 : 0), 0),
    goal: goal == null ? null : act.perTap > 1 ? Math.round((goal / act.perTap) * 10) / 10 : goal, // a counted amount (push-ups) is a goal in amounts: one tap = perTap
    waiting: own.filter(fromStravaOnly).length,
  };
}

/**
 * data: as in WeekReview (log, flowActs, acts = activities, usual, map); monday and upto as in ritualeWeek.
 * → { from, to, move: rows, rest: rows (rings mind and rest), loose: [{ key, label, n, days, measuredMin }] }
 * Each of move and rest: rows with a time or a goal first (most times first), then { quiet: rows with 0 and no goal }.
 */
export function alleWeek(data, monday, upto = shiftDay(monday, 6)) {
  const { log = [], flowActs = [], acts: activities = [], usual = {}, map = {} } = data ?? {};
  const end = shiftDay(monday, 6) < upto ? shiftDay(monday, 6) : upto;
  const units = einheiten({ log: log.filter((e) => e.via !== 'trip'), activities, acts: flowActs, usual, map });
  const acts = flowActs.map(normAct).filter((a) => !a.paused);
  const byOrder = new Map(acts.map((a, i) => [a.id, i]));
  const split = (rows) => {
    const sort = (x, y) => y.n - x.n || byOrder.get(x.id) - byOrder.get(y.id);
    return { shown: rows.filter((r) => r.n > 0 || r.goal != null).sort(sort), quiet: rows.filter((r) => r.n === 0 && r.goal == null).sort(sort) };
  };
  const move = split(acts.filter((a) => a.ring === 'move').map((a) => rowOf(a, units, monday, end)));
  const restAll = rituale(units, flowActs, monday, end, { all: true });
  const rest = split(restAll.map((r) => ({ ...r, waiting: units.filter((u) => u.actId === r.id && fromStravaOnly(u) && u.day >= monday && u.day <= end).length })));
  const loose = new Map();
  for (const u of units) {
    if (u.actId || !u.stravaType || u.day < monday || u.day > end) continue;
    const r = loose.get(u.stravaType) ?? { key: u.stravaType, label: looseLabel(u.stravaType), n: 0, days: new Set(), measuredMin: 0 };
    r.n += 1;
    r.days.add(u.day);
    if (u.minQuelle === 'gemessen') r.measuredMin += Number(u.min) || 0;
    loose.set(u.stravaType, r);
  }
  return {
    from: monday,
    to: end,
    move,
    rest,
    loose: [...loose.values()].map((r) => ({ ...r, days: r.days.size })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label)),
  };
}
