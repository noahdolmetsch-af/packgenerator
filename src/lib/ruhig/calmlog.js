/**
 * Ruhige Ansicht › little history (Noah 02.11.2026 «bauen alles», step 4): when a calm view ends, one line
 * is kept: what, from, to. «This week: 3× clean the bike, 2 h». Only the last 100 lines are kept; each can be
 * deleted. A settings record (CALM_LOG_KEY), so it travels in every backup like the rest. Pure, tested.
 */
import { clean, addDays } from './base.js';
import { localDay } from '../localday.js';

export const CALM_LOG_KEY = 'ruhig.calmLog';
export const LOG_MAX = 100;
const MAX_MIN = 12 * 60; // a forgotten calm view counts at most 12 hours

export function logOf(value) {
  return (Array.isArray(value) ? value : [])
    .map((e) => ({ id: String(e?.id ?? ''), what: clean(e?.what, 80), from: String(e?.from ?? ''), to: String(e?.to ?? '') }))
    .filter((e) => e.id && e.what && Date.parse(e.from) <= Date.parse(e.to));
}
/** Minutes of one line (at least 1, at most MAX_MIN). */
export const minutesOf = (e) => Math.min(MAX_MIN, Math.max(1, Math.round((Date.parse(e.to) - Date.parse(e.from)) / 60000)));
/** A calm view {what, since, until} ends at `nowMs`: the line to keep (an end by time counts to that end). */
export function lineFor(calm, nowMs = Date.now()) {
  const from = Date.parse(calm?.since);
  if (!calm?.what || !Number.isFinite(from)) return null;
  const end = calm.until && nowMs > calm.until ? calm.until : nowMs;
  return { id: `c-${nowMs.toString(36)}`, what: calm.what, from: new Date(from).toISOString(), to: new Date(Math.max(from, end)).toISOString() };
}
export const logAdd = (log, line) => (line ? [line, ...log].slice(0, LOG_MAX) : log);
export const logDrop = (log, id) => log.filter((e) => e.id !== id);
/** The last 7 days (today included): same words counted together → [{ what, times, minutes }], most time first. */
export function weekSummary(log, today = localDay()) {
  const from = addDays(today, -6);
  const by = new Map();
  for (const e of log) {
    const day = localDay(new Date(e.to));
    if (day < from || day > today) continue;
    const k = e.what.trim().toLowerCase();
    const cur = by.get(k) ?? { what: e.what, times: 0, minutes: 0 };
    cur.times += 1;
    cur.minutes += minutesOf(e);
    by.set(k, cur);
  }
  return [...by.values()].sort((a, b) => b.minutes - a.minutes);
}
/** «2 h 5 min», «45 min» (the unit words are the caller's: they go through t()). */
export const hm = (minutes) => ({ h: Math.floor(minutes / 60), m: minutes % 60 });
