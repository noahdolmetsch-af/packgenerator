/**
 * «Meilensteine aktiver machen» PR 5 (Noah 01.11.2026 «5a», «alle vier Stellen»): on Monday (and Tuesday) a card
 * «Letzte Woche: N neue Sterne» in the tile «Aktiv heute». Plain module (no runes).
 * Setting `homeWeekStars` = { done: 'YYYY-MM-DD' } (the Monday whose card was closed).
 */
import { weekStart } from '../flowms.js';
import { addDays } from '../flow.js';
import { actList } from '../flow/starcheck.js';

export const WEEK_KEY = 'homeWeekStars';
/** The card shows on the Monday and the Tuesday of a week. */
export const SHOW_DAYS = 2;
export const SHOWN = 5;

/** Is the card on for this day? → the Monday of this week, or null. */
export function cardMonday(today) {
  const mon = weekStart(today);
  return today <= addDays(mon, SHOW_DAYS - 1) ? mon : null;
}

/**
 * The stars reached in the week before `monday`, newest first, from every sport that is not paused.
 * → [{ actId, act, r (the milestone), star, day }]
 */
export function weekStars(acts, ctx, stored, tune, monday) {
  const from = addDays(monday, -7);
  const to = addDays(monday, -1);
  const out = [];
  for (const act of acts) {
    if (act.paused) continue;
    for (const r of actList(ctx, act, stored, tune)) {
      if (r.off) continue;
      for (const s of r.reached) if (s.day >= from && s.day <= to) out.push({ actId: act.id, act, r, star: s.star, day: s.day });
    }
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : b.star - a.star));
}
