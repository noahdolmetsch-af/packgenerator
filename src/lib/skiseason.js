/**
 * v0.162.0 Saisonstart-Check (Noah 15.10.2026 «5a», brainstorm «Skitour mehr Inhalt» SKB14): the things
 * to do before the first ski tour of the winter, shown on the page of a ski tour in October and November.
 * Everything is a suggestion: nothing must be ticked, the card can be hidden for the season.
 * The ticks are the season care entries ('ski.care', ski.js); this row only keeps «hidden»:
 *   settings 'skiSeasonStart' = { season: '2026/27', hidden: false }
 */
import { careTasks, careState } from './ski.js';

export const SKI_SEASON_KEY = 'skiSeasonStart';

/** The months the card shows (October and November). */
export const SKI_SEASON_MONTHS = [10, 11];

/** The winter a day belongs to: from July on the coming winter, e.g. '2026-10-15' → '2026/27'. */
export function skiSeasonOf(day) {
  const y = Number(day.slice(0, 4));
  const from = Number(day.slice(5, 7)) >= 7 ? y : y - 1;
  return `${from}/${String((from + 1) % 100).padStart(2, '0')}`;
}

/** The state of this season: hidden or not (a row of an older season shows again). */
export function skiSeasonState(value, day) {
  const season = skiSeasonOf(day);
  return { season, hidden: value?.season === season && !!value.hidden };
}

/** Whether the card shows on a ski tour's page today. */
export function showSkiSeason(value, day) {
  return SKI_SEASON_MONTHS.includes(Number(day.slice(5, 7))) && !skiSeasonState(value, day).hidden;
}

/**
 * The things of the card: the start tasks of the Saison-Pflege (ski.js CARE_TASKS, your own ones too), so a
 * tick here is the same tick as on Touren › Skitouren › Saison-Pflege (one list, nothing twice).
 */
export const seasonStartTasks = (custom) => careTasks(custom).filter((x) => x.phase === 'start');

/** The care entry that ticks a task this season, or null. entries: settings 'ski.care'. */
export const seasonStartDone = (task, entries, day) => careState(task, entries, day, 0).done;

/** How many of the start tasks are done this season. */
export function seasonStartCount(tasks, entries, day) {
  return { done: tasks.filter((x) => seasonStartDone(x, entries, day)).length, total: tasks.length };
}
