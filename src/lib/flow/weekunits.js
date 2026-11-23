/**
 * «Eine Zahl für die Woche» (V3, Noah «3a» of the Vereinfachen order): the head of Aktiv, «Tick off today» and the week card
 * all show the same number «k of n units» (Monday to Sunday). This file reads the fixed and planned dates once and counts.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { FIXED_KEY, PLAN_KEY, fixedList, weekPlan, weekUnits } from '../flowweek.js';

/** The fixed dates and the planned days (readable store; use as $weekSets). */
export const weekSets = liveQuery(async () => {
  const [f, p] = await Promise.all([db.settings.get(FIXED_KEY), db.settings.get(PLAN_KEY)]);
  return { fixed: fixedList(f?.value), plans: Array.isArray(p?.value) ? p.value : [] };
});

/** { done, total } of the week Monday to Sunday, or null (nothing ticked or planned yet). */
export function unitsOfWeek({ acts = [], states = [], log = [], today, sets }) {
  const s = sets ?? { fixed: [], plans: [] };
  return weekUnits(weekPlan({ acts, states, log, today, fixed: s.fixed, plans: s.plans, no: [], forecast: null }).days);
}
