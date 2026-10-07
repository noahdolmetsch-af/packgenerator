/**
 * The forecast for the home place (v0.25.1, Noah 1a): the place is entered once (setting
 * "homePlace" = { name, lat, lon }, never nested or renamed: other parts of the app read it too).
 * The forecast is saved in "meta" (never exported) with its time, fetched at most every 3 hours;
 * offline or when the service fails, a saved forecast up to 12 hours old is used, else none.
 */
import { fetchForecast, toWx } from './weather.js';
import { HOME_PLACE, HOME_FORECAST, needsFetch, usable } from './know.js';

/**
 * The home forecast: { fetchedAt, place, days: [{ date, min, max, rainMm, rainPct, rain }] } or null
 * (no home place, or nothing fresh enough). rain: 'none' | 'showers' | 'rain' (as the trip weather).
 * Fetches only when the saved one is 3 hours old or for another place, and only when online.
 */
export async function homeForecast(db, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  const place = (await db.settings.get(HOME_PLACE))?.value ?? null;
  if (!place) return null;
  let saved = (await db.meta.get(HOME_FORECAST)) ?? null;
  if (online && needsFetch(place, saved, now)) {
    try {
      const fresh = await fetchForecast(place, fetcher, new Date(now));
      saved = { key: HOME_FORECAST, ...fresh };
      await db.meta.put(saved);
    } catch {
      /* offline or the service failed: the saved one, if it is fresh enough */
    }
  }
  if (!usable(place, saved, now)) return null;
  const { key, ...forecast } = saved;
  return { ...forecast, days: forecast.days.map((d) => ({ ...d, rain: toWx([d])?.rain ?? null })) };
}
