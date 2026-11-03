/**
 * «Meine Sportarten» (Noah 02.11.2026 «5a»): a goal suggestion from the person's own data. Looks at the last 4 weeks of
 * a sport with one goal over 7 days; when the real weekly average is a different whole number than the goal, the editor
 * offers it. Never changes anything by itself. Pure, tested in tests/goalhint.test.js.
 */
import { entriesFor, addDays, normAct } from '../flow.js';

export const HINT_WEEKS = 4;
export const HINT_MIN_ENTRIES = 4;

/** → { count (suggested per 7 days), total (entries in 4 weeks), now (current goal count) } or null. */
export function goalHint(act, log = [], today, tripDays = []) {
  act = act ? normAct(act) : act;
  const goals = act?.goals ?? [];
  if (act?.season || goals.length !== 1 || goals[0].days !== 7 || !goals[0].count) return null;
  const from = addDays(today, -HINT_WEEKS * 7);
  const list = entriesFor(act, log, tripDays).filter((e) => e.day <= today && e.day > from);
  const total = list.reduce((s, e) => s + (Number(e.n) || 1), 0);
  if (total < HINT_MIN_ENTRIES) return null;
  const count = Math.max(1, Math.round(total / HINT_WEEKS));
  return count === goals[0].count ? null : { count, total, now: goals[0].count };
}
