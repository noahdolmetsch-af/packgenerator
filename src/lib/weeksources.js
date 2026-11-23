/**
 * What the shared week calculation (weekcalc.js) reads besides the activities, the ticks and the Aktiv list: the rides of
 * the files and the ledger, the usual durations, the Strava table choice, the ignored Strava bikes and the Fitbit days.
 * One place, so the card on Heute, the review and the comparisons all read the same (Noah 22.11.2026 «1a-5a», Schritt B).
 * Only reading; `db` is passed in like in kmbook.js, so this stays free of Svelte.
 */
import { USUAL_KEY, usualMap } from './flow/usualmin.js';
import { HANDLED_KEY } from './flow/fitbittraining.js';
import { TICKS_KEY, prefsOf } from './stravaticks.js';
import { shiftDay } from './training.js';

/** The Strava prefs key (strava/client.svelte.js PREFS_KEY, as in kmbook.js). */
const STRAVA_PREFS = 'strava';
/** The Fitbit days read: a workout older than this is no suggestion any more (fitbittraining.js WINDOW_DAYS). */
const HEALTH_DAYS = 100;

/** → { rides, book, usual, map, ignore, health, handled } for weekCalc / weekSums. */
export async function weekSources(db, today) {
  const from = shiftDay(today, -HEALTH_DAYS);
  const [rides, book, usual, ticks, prefs, health, handled] = await Promise.all([
    db.rides.toArray(),
    db.kmBook.toArray(),
    db.settings.get(USUAL_KEY),
    db.settings.get(TICKS_KEY),
    db.settings.get(STRAVA_PREFS),
    db.healthDays ? db.healthDays.where('date').aboveOrEqual(from).toArray() : [],
    db.settings.get(HANDLED_KEY),
  ]);
  return {
    rides,
    book,
    usual: usualMap(usual?.value),
    map: prefsOf(ticks?.value).map,
    ignore: Array.isArray(prefs?.value?.ignore) ? prefs.value.ignore : [],
    health,
    handled: Array.isArray(handled?.value) ? handled.value : [],
  };
}
