/**
 * «Meilensteine als Belohnung» (Noah 22.10.2026 «4a»): right after a tick, does it bring a new star?
 * Reads the activity's whole log, its sessions, the stars kept so far, the user's own stages and the
 * challenges, evaluates only this activity's milestones (and its challenges), keeps every star reached
 * (flowStars, they never get lost) and returns the stars reached today that were not kept before.
 * Plain module (no runes): ui.svelte.js calls it after tickWith, tests call it with fake tables.
 */
import { msContext, actMilestones, challengeMilestones, evaluate, isOff, newStars, TUNE_KEY } from '../flowms.js';
import { CHALLENGES_KEY, challengesOf } from '../challenge.js';
import { saveStars } from '../flowdb.js';

/** The milestones of one activity in a context, evaluated: base set (with something to count), extras, challenges. */
export function actList(ctx, act, stored, tune = {}) {
  const defs = [...actMilestones(act, ctx.today).filter((m) => !m.needsMin || ctx.log.some((e) => e.actId === m.actId && Number(e.min) > 0)), ...challengeMilestones(ctx).filter((m) => m.actId === act.id)];
  return defs.map((m) => ({ ...evaluate(m, ctx, stored, tune), off: isOff(m, tune) }));
}

/**
 * → { fresh: [{ id, msId, star, day, r }] reached today and new, saved: the flowStars rows written }.
 * Older stars that were never kept (pages not opened for a while) are kept too, but not shown as new.
 */
export async function starsAfterTick(db, act, today) {
  const [log, sessions, rows, tune, chs] = await Promise.all([
    db.flowLog.where('actId').equals(act.id).toArray(),
    db.flowSessions.where('actId').equals(act.id).toArray(),
    db.flowStars.toArray(),
    db.settings.get(TUNE_KEY),
    db.settings.get(CHALLENGES_KEY),
  ]);
  const stored = new Map(rows.map((s) => [s.id, s.day]));
  const ctx = msContext({ acts: [act], log, sessions, today, challenges: challengesOf(chs?.value) });
  const list = actList(ctx, act, stored, tune?.value ?? {}).filter((r) => !r.off);
  const saved = newStars(list, stored);
  await saveStars(db, saved);
  const byId = new Map(list.map((r) => [r.id, r]));
  const fresh = saved.filter((s) => s.day === today).map((s) => ({ ...s, r: byId.get(s.msId) }));
  return { fresh, saved };
}
