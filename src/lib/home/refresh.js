// «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026 «b», Paket D, Idee 10): the pure part of PullRefresh.svelte.
// Pulling Today down loads the weather and the Strava rides fresh; a small bike wheel turns meanwhile.
import { HOME_PLACE } from '../know.js';

/** Pulled this far (px, after the resistance) and let go: it refreshes. */
export const THRESHOLD = 64;
/** While it loads, the page rests this far down so the wheel and its line have room. */
export const BUSY_PULL = 72;
/** The most the wheel follows the finger. */
export const MAX_PULL = 96;
/** Event on window when the fresh data is in: weather cards on Today reload from it. */
export const REFRESHED = 'pg-refreshed';
/** The wheel stays at least this long (ms), so a fast answer is still seen. */
export const MIN_SHOW = 700;

/** The finger's distance (px) → how far the wheel comes down: it resists (half the way), never more than MAX_PULL. */
export const pullOf = (dy) => Math.max(0, Math.min(MAX_PULL, Math.round(Number(dy) * 0.5) || 0));

/** Does a pull of this size refresh when the finger lets go? */
export const arms = (pull) => pull >= THRESHOLD;

/** Only the top of Heute, with no window open, counts as a start. hash like '#/' or ''. */
export const isHeute = (hash = '') => /^#?\/?$/.test(String(hash));

const safe = async (f) => {
  try {
    await f();
  } catch {
    /* offline or the service failed: the kept answer stays */
  }
};

/**
 * Loads fresh: the home weather (force, writes the kept answer every weather card reads) and the Strava rides
 * (only with a key on this device). Never throws. → { weather: boolean, strava: boolean } = what was asked for.
 * Everything is injected (db, loadCore, fetchNow, hasStrava) so it is testable without a network.
 */
export async function refreshToday({ db, loadCore, fetchNow, hasStrava = false }) {
  const done = { weather: false, strava: false };
  const jobs = [];
  const home = (await db.settings.get(HOME_PLACE).catch(() => null))?.value;
  if (home && Number.isFinite(Number(home.lat)) && Number.isFinite(Number(home.lon))) {
    done.weather = true;
    jobs.push(safe(() => loadCore(db, home, { force: true })));
  }
  if (hasStrava) {
    done.strava = true;
    jobs.push(safe(() => fetchNow()));
  }
  await Promise.all(jobs);
  return done;
}
