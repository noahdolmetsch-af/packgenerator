/**
 * v0.105.0 Design-Refresh P8 «Aktiv» (A1–A14c, Noah 12.10.2026): the small pure rules of the new Aktiv
 * pages. Nothing new is stored; they read what is there (rides, the flow log, the milestones, the
 * meditation sessions). Tested in tests/aktiv.test.js.
 */
import { monthKm } from '../home/bausteine.js';
import { halfOf, halfEnds, halfSince, addDays } from '../flow.js';

const dayOf = (x) => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x) ? x.slice(0, 10) : null);

/**
 * A1 «Velo diesen Monat»: the km ridden this month up to today, the change against the same days of
 * last month (%, null without), and the km per week of the month (days 1–7, 8–14, 15–21, 22–end);
 * the weeks after today are null. → { km, pct, weeks: [km | null] }
 */
export function monthWeeks(rides = [], today) {
  const { km, pct } = monthKm(rides, today);
  const m = today.slice(0, 7);
  const dd = Number(today.slice(8, 10));
  const weeks = [0, 1, 2, 3].map((w) => {
    const from = w * 7 + 1;
    if (from > dd) return null;
    const to = w === 3 ? 31 : from + 6;
    return Math.round(
      rides
        .filter((r) => {
          const d = dayOf(r?.date);
          if (!d || d.slice(0, 7) !== m) return false;
          const n = Number(d.slice(8, 10));
          return n >= from && n <= to && n <= dd;
        })
        .reduce((s, r) => s + (Number(r.km) || 0), 0),
    );
  });
  return { km, pct, weeks };
}

/**
 * A1 «Saison»: the half of the year of the first activity with a season: { half: 'summer' | 'winter',
 * since, next } (next: the first day of the other half), or null when no activity has a season.
 */
export function seasonNow(acts = [], today) {
  const a = acts.find((x) => x?.season && !x.paused);
  if (!a) return null;
  const end = halfEnds(a, today);
  return { half: halfOf(a, today), since: halfSince(a, today), next: end ? addDays(end, 1) : null };
}

/**
 * B22 «Ziel-Pfad»: the stations of a milestone around where you are: up to five thresholds (the ones
 * reached last and the next ones), the value now and how far to the target. r: flowms evaluate().
 * → { stations: [{ at, reached }], value, target, left, next: stations still to come } | null
 */
export function goalPath(r) {
  if (!r || !r.steps?.length) return null;
  const steps = r.steps;
  const nextI = r.next ? r.next - 1 : steps.length - 1;
  const from = Math.max(0, Math.min(nextI - 2, steps.length - 4));
  const shown = steps.slice(from, from + 4);
  const stations = [{ at: from ? steps[from - 1] : 0, reached: true }, ...shown.map((at, i) => ({ at, reached: from + i < nextI || (!r.next && from + i === nextI) }))];
  const target = steps.at(-1) > shown.at(-1) ? shown.at(-1) : steps.at(-1);
  const value = Math.max(0, Number(r.value) || 0);
  return { stations, value, target, left: Math.max(0, Math.round((target - value) * 10) / 10), next: stations.filter((s) => !s.reached).length };
}

/**
 * A14 «Letzte 7 Tage»: minutes per day for the last 7 days of one activity's log entries (today last).
 * → [{ day, min, any }]
 */
export function lastSeven(log = [], actId, today) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const list = log.filter((e) => e.actId === actId && e.day === day);
    return { day, min: list.reduce((s, e) => s + (Number(e.min) || 0), 0), any: list.length > 0 };
  });
}

/**
 * A14 «Oktober bisher»: this month up to today against last month up to the same day, for one
 * activity: minutes, days with a session and the mean depth (only sessions with a depth).
 * rows: flowmed logRows. → { now: { min, days, of, depth }, before: { min, days, depth } }
 */
export function monthNumbers(rows = [], today) {
  const [y, m, dd] = today.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const pLast = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const cut = Math.min(dd, pLast);
  const part = (month, last) => {
    const list = rows.filter((r) => r.day && r.day.slice(0, 7) === month && Number(r.day.slice(8, 10)) <= last);
    const deep = list.filter((r) => r.depth);
    return {
      min: list.reduce((s, r) => s + (Number(r.min) || 0), 0),
      days: new Set(list.map((r) => r.day)).size,
      depth: deep.length ? Math.round((deep.reduce((s, r) => s + r.depth, 0) / deep.length) * 10) / 10 : null,
    };
  };
  return { now: { ...part(today.slice(0, 7), dd), of: dd }, before: part(prev, cut) };
}

/**
 * A14c «Was geholfen hat»: per thing noted under «Was hat geholfen?», how often and the mean depth of
 * those sessions. Observation only. → [{ id, n, depth | null }] most often first.
 */
export function helpedStats(rows = []) {
  const by = new Map();
  for (const r of rows) for (const h of r.helped ?? []) by.set(h, [...(by.get(h) ?? []), r]);
  return [...by.entries()]
    .map(([id, list]) => {
      const deep = list.filter((r) => r.depth);
      return { id, n: list.length, depth: deep.length ? Math.round((deep.reduce((s, r) => s + r.depth, 0) / deep.length) * 10) / 10 : null };
    })
    .sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
}

/**
 * A14c «Rekorde»: the longest session, the most minutes in one week (Monday–Sunday) and the deepest
 * session (the newest of the deepest). rows: flowmed logRows. → { longest, week, deepest } (each or null)
 */
export function medRecords(rows = []) {
  const past = rows.filter((r) => r.day);
  const longest = past.filter((r) => Number(r.min) > 0).sort((a, b) => b.min - a.min || b.day.localeCompare(a.day))[0] ?? null;
  const deepest = past.filter((r) => r.depth).sort((a, b) => b.depth - a.depth || b.day.localeCompare(a.day))[0] ?? null;
  const weeks = new Map();
  for (const r of past) {
    const d = new Date(`${r.day}T00:00:00Z`);
    const mon = addDays(r.day, -((d.getUTCDay() + 6) % 7));
    weeks.set(mon, (weeks.get(mon) ?? 0) + (Number(r.min) || 0));
  }
  const best = [...weeks.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0];
  return { longest, deepest, week: best ? { monday: best[0], min: best[1] } : null };
}

/** The ISO week number of a day (for «Woche 40»). */
export function isoWeek(day) {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - first) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}

/**
 * A14c «Wann es am tiefsten geht»: per hour of the day (Zurich) the sessions and their mean depth (only
 * sessions with a depth count for it). rows: flowmed logRows. → [{ h, n, depth | null }] for 0–23.
 */
export function hourDepth(rows = []) {
  return Array.from({ length: 24 }, (_, h) => {
    const list = rows.filter((r) => r.hour === h);
    const deep = list.filter((r) => r.depth);
    return { h, n: list.length, depth: deep.length ? Math.round((deep.reduce((s, r) => s + r.depth, 0) / deep.length) * 10) / 10 : null };
  });
}

/** A14 «meist um»: the hour of the day with the most sessions (the earlier one on a tie), or null. */
export function usualHour(rows = []) {
  let best = null;
  for (const x of hourDepth(rows)) if (x.n && (!best || x.n > best.n)) best = x;
  return best ? best.h : null;
}
