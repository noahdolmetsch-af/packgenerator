/**
 * «Meilensteine aktiver machen» PR 1 (Noah 01.11.2026 «1a», «alle vier Stellen»): the stars that are closest,
 * for Heute («Deine nächsten Sterne» in the tile «Aktiv heute») and for the top of a sport page.
 * Plain module (no runes). Reads only what the milestones of the sports need (no Strava, no Fitbit).
 */
import { msContext, TUNE_KEY } from '../flowms.js';
import { actList } from '../flow/starcheck.js';
import { CHALLENGES_KEY, challengesOf } from '../challenge.js';
import { WEEK_KEY } from './weekstars.js';

export const HIDE_KEY = 'homeNextStars';
/** How many rows Heute shows. */
export const SHOWN = 3;

/** The closest open star in the evaluated milestones of one sport: { r, left } or null (nothing started yet). */
export function nextOf(list) {
  const open = list.filter((r) => !r.off && r.next && r.value > 0 && r.progress < 1);
  if (!open.length) return null;
  const r = [...open].sort((a, b) => b.progress - a.progress || a.target - b.target)[0];
  return { r, left: Math.max(0, Math.round((r.target - r.value) * 10) / 10) };
}
/**
 * The closest open star of each sport (its milestone with the highest progress that has started), the
 * closest sport first. A sport without a started milestone, a paused sport and a hidden milestone drop out.
 * → [{ actId, act, r (the evaluated milestone), left (to the next star, 1 decimal) }]
 */
export function nextStars(acts, ctx, stored, tune = {}, n = SHOWN) {
  const out = [];
  for (const act of acts) {
    if (act.paused) continue;
    const one = nextOf(actList(ctx, act, stored, tune));
    if (one) out.push({ actId: act.id, act, ...one });
  }
  return out.sort((a, b) => b.r.progress - a.r.progress || a.left - b.left).slice(0, n);
}

/** What the live query reads from the database. */
export async function readNextStars(db, today) {
  const [acts, log, sessions, rows, sets] = await Promise.all([
    db.flowActs.toArray(),
    db.flowLog.toArray(),
    db.flowSessions.toArray(),
    db.flowStars.toArray(),
    db.settings.where('key').anyOf([TUNE_KEY, CHALLENGES_KEY, HIDE_KEY, WEEK_KEY]).toArray(),
  ]);
  const set = Object.fromEntries(sets.map((s) => [s.key, s.value]));
  const live = acts;
  const ctx = msContext({ acts: live, log, sessions, today, challenges: challengesOf(set[CHALLENGES_KEY]) });
  const stored = new Map(rows.map((s) => [s.id, s.day]));
  return { acts: live, ctx, stored, tune: set[TUNE_KEY] ?? {}, hidden: !!set[HIDE_KEY]?.off, weekDone: set[WEEK_KEY]?.done ?? null };
}
