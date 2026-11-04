/**
 * «Velos-Pflege einbauen» (Noah 03.11.2026 «2a» and «Eine Saison-Regel für alles»): one rule for what fits the
 * time of year. A rule has an area, the months it fits and the place it leads to. Velos has three (put the bike away
 * in November, spring in February, the year in review in December); a later area (skiing season end, training
 * winter) adds its rules to SEASON_RULES and shows them the same way (care/SeasonNow.svelte). Pure: the day is a
 * calendar day (localDay(), Europe/Zurich), no clock is read here.
 */
import { seasonOf, ticksOf } from './griff.js';

/** The rules: id, area, months (1–12), kind ('winter'/'spring' = a checklist that can be done), text and place. */
export const SEASON_RULES = [
  { id: 'bike-winter', area: 'velo', months: [11], kind: 'winter', label: 'Put the bike away for the winter', href: '#/bikes?tab=care&view=season' },
  { id: 'bike-year', area: 'velo', months: [12], kind: null, label: 'Look back on the bike year', href: '#/bikes?tab=care&view=year' },
  { id: 'bike-spring', area: 'velo', months: [2], kind: 'spring', label: 'Get the bike ready for spring', href: '#/bikes?tab=care&view=season' },
];

export const monthOf = (day) => Number(String(day).slice(5, 7));

/** The season a tick belongs to: winter 2026 runs from October 2026 to the spring of 2027. */
export const seasonYear = (kind, today) => {
  const y = Number(String(today).slice(0, 4));
  return String(kind === 'winter' && monthOf(today) <= 3 ? y - 1 : y);
};

/** True when every point of the list is ticked on every bike (false without a bike or without points). */
export function seasonDone(kind, bikes, season, today) {
  const rec = seasonOf(season)[kind];
  const ids = rec.items.map((x) => x.id);
  if (!bikes.length || !ids.length) return false;
  return bikes.every((b) => {
    const ticks = ticksOf(rec, b.id, seasonYear(kind, today));
    return ids.every((id) => ticks.includes(id));
  });
}

/**
 * The rules that fit this day: { id, label, href }[]. `area` narrows to one area; `bikes` are the active bikes and
 * `season` the stored setting «griff.season» (for the ticks). A checklist rule goes away once it is done.
 */
export function seasonNow(today, { area = null, bikes = [], season = null } = {}) {
  const m = monthOf(today);
  return SEASON_RULES.filter((r) => (!area || r.area === area) && r.months.includes(m))
    .filter((r) => (r.area !== 'velo' || bikes.length > 0) && !(r.kind && seasonDone(r.kind, bikes, season, today)));
}
