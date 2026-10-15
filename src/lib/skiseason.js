/**
 * v0.162.0 Saisonstart-Check (Noah 15.10.2026 «5a», brainstorm «Skitour mehr Inhalt» SKB14): five things
 * to do before the first ski tour of the winter, shown on the page of a ski tour in October and November.
 * Everything is a suggestion: nothing must be ticked, the card can be hidden for the season.
 *   settings 'skiSeasonStart' = { season: '2026/27', done: { <id>: 'YYYY-MM-DD' }, hidden: false }
 * A new season starts empty (the old ticks stay in the row until it is written again).
 */
export const SKI_SEASON_KEY = 'skiSeasonStart';

/** The five suggested things (English keys for t()). */
export const SKI_SEASON_ITEMS = [
  { id: 'service', label: 'Skis to the service: base and edges' },
  { id: 'lvs', label: 'Test the transceiver and put in a new battery' },
  { id: 'skins', label: 'Check the skins and their glue' },
  { id: 'binding', label: 'Check the binding setting' },
  { id: 'contact', label: 'Emergency contact up to date' },
];

/** The months the card shows (October and November). */
export const SKI_SEASON_MONTHS = [10, 11];

/** The winter a day belongs to: from July on the coming winter, e.g. '2026-10-15' → '2026/27'. */
export function skiSeasonOf(day) {
  const y = Number(day.slice(0, 4));
  const from = Number(day.slice(5, 7)) >= 7 ? y : y - 1;
  return `${from}/${String((from + 1) % 100).padStart(2, '0')}`;
}

/** The state of this season: the saved row when it is of this season, else an empty one. */
export function skiSeasonState(value, day) {
  const season = skiSeasonOf(day);
  if (value?.season === season) return { season, done: { ...(value.done ?? {}) }, hidden: !!value.hidden };
  return { season, done: {}, hidden: false };
}

/** Whether the card shows on a ski tour's page today. */
export function showSkiSeason(value, day) {
  return SKI_SEASON_MONTHS.includes(Number(day.slice(5, 7))) && !skiSeasonState(value, day).hidden;
}

/** How many of the five are done. */
export function skiSeasonCount(state) {
  return { done: SKI_SEASON_ITEMS.filter((r) => state.done[r.id]).length, total: SKI_SEASON_ITEMS.length };
}

/** Tick or untick one thing; the date of the tick is kept. */
export function toggleSkiSeason(state, id, day) {
  const done = { ...state.done };
  if (done[id]) delete done[id];
  else done[id] = day;
  return { ...state, done };
}
