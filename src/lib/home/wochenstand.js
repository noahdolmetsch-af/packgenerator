/**
 * «Wochenstand» on the week card of Heute (Noah 24.11.2026 «1-3», idea 3): one quiet line for the finished week,
 * «Outdoors on 5 of 7 days, meditation on 3 days», only to look at, never a grade. Pure; tested in tests/wochenstand.test.js.
 *
 *   weekStand({ rec, acts, log, medIds, monday, sunday }) → { outdoor: { days, of } | null, med: { days } | null }
 *
 * rec: the challenge record `outdoor` (outdoorOf); acts: the Strava activities of the week; log: flowLog entries;
 * medIds: the ids of the meditation activities; monday, sunday: the week. outdoor is null when no challenge ran in that week;
 * `of` counts only the days of the week the challenge covered. med is null with no session in the week.
 */
import { dayOf } from '../outdoor.js';

const dayList = (from, to) => {
  const out = [];
  for (let d = new Date(`${from}T12:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
};

export function weekStand({ rec = null, acts = [], log = [], medIds = [], monday, sunday } = {}) {
  if (!monday || !sunday) return { outdoor: null, med: null };
  const days = dayList(monday, sunday);
  let outdoor = null;
  if (rec?.from && !rec.stopped) {
    const covered = days.filter((d) => d >= rec.from && d <= rec.until);
    if (covered.length) outdoor = { days: covered.filter((d) => dayOf(rec, acts, d).done).length, of: covered.length };
  }
  const ids = new Set(medIds);
  const medDays = new Set(log.filter((e) => ids.has(e.actId) && e.day && e.day >= monday && e.day <= sunday).map((e) => e.day));
  return { outdoor, med: medDays.size ? { days: medDays.size } : null };
}
