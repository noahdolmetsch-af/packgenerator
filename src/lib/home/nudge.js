/**
 * «Meilensteine aktiver machen» PR 2 (Noah 01.11.2026 «2a und b»): «Schon lange nicht». A sport that has not been
 * ticked for longer than its rhythm gets one friendly card on Heute. The span comes by itself from the weekly goal
 * (twice the usual gap, at least 7 days; 2a) and can be set per sport or switched off (2b). «Später» waits 3
 * days, «Pause» pauses the sport (with Undo). No notification: it shows only when the app is open (Noah «4a»).
 * Plain module; the settings record `sportNudge` = { [actId]: { days?, off?, until? } }.
 */
import { entriesFor, addDays, flowStates } from '../flow.js';
import { weekTarget } from '../flowms.js';

export const NUDGE_KEY = 'sportNudge';
export const MIN_DAYS = 7;
export const MAX_DAYS = 120;
export const SNOOZE_DAYS = 3;
/** How many cards Heute shows at most. */
export const MAX_CARDS = 2;

export const nudgesOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const dayDiff = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 864e5);

/** After how many days without a tick a sport counts as «lange nicht»: its own number, else twice its rhythm, at least 7. */
export function limitFor(act, nudges = {}) {
  const own = Number(nudges?.[act.id]?.days);
  if (Number.isFinite(own) && own >= 1) return Math.min(MAX_DAYS, Math.round(own));
  const gap = 7 / weekTarget(act);
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.ceil(2 * gap)));
}

/** Days since the last tick up to today, or null when the sport was never ticked. */
export function daysSince(act, log, today) {
  const last = entriesFor(act, log).filter((e) => e.day <= today).reduce((m, e) => (e.day > m ? e.day : m), '');
  return last ? dayDiff(today, last) : null;
}

/**
 * The sports that wait too long, the longest overdue first, at most MAX_CARDS.
 * Only sports that were ticked at least twice (so a rhythm exists), are not paused, not resting (off season) and
 * not switched off or snoozed. → [{ act, days, limit }]
 */
export function lapsed(acts, log, today, nudges = {}, n = MAX_CARDS) {
  const states = flowStates(acts, log, today);
  const out = [];
  for (const s of states) {
    const a = s.act;
    if (s.resting || a.paused) continue;
    const set = nudges?.[a.id];
    if (set?.off || (set?.until && set.until > today)) continue;
    if (entriesFor(a, log).filter((e) => e.day <= today).length < 2) continue;
    const days = daysSince(a, log, today);
    const limit = limitFor(a, nudges);
    if (days != null && days >= limit) out.push({ act: a, days, limit });
  }
  return out.sort((x, y) => y.days / y.limit - x.days / x.limit).slice(0, n);
}

/** Later: the card comes back after SNOOZE_DAYS. → the new record */
export const snooze = (nudges, actId, today) => ({ ...nudgesOf(nudges), [actId]: { ...nudgesOf(nudges)[actId], until: addDays(today, SNOOZE_DAYS) } });
/** The sport's own setting: days (a number) and/or off. An empty setting is removed. */
export function setNudge(nudges, actId, patch) {
  const all = { ...nudgesOf(nudges) };
  const next = { ...all[actId], ...patch };
  if (next.days == null) delete next.days;
  if (!next.off) delete next.off;
  if (!next.until) delete next.until;
  if (Object.keys(next).length) all[actId] = next;
  else delete all[actId];
  return all;
}
