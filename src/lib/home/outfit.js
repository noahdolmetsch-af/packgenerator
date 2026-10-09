/**
 * v0.45.0 "Kleiderschrank 2" (Noah, decision 9): "What do I wear today?" on Today and the same
 * suggestion in the wardrobe (a kit from it, decision 5). Joins the home place and its saved
 * forecast (know.js, home-weather.js), the day ride's hours (dayride.js) and the onion
 * (wardrobe.js outfitFor). Pure: the components read the database.
 */
import { usable } from '../know.js';
import { daySource, LATE_HOUR, DAY_HOURS } from '../dayride.js';
import { outfitFor, rideWindow, layerKey, zoneGroup, isClothing } from '../wardrobe.js';
import { isInventory } from '../gear.js';

/**
 * → { state, place, win, outfit }. state: 'none' (no sorted owned clothing: no card at all),
 * 'noplace' (no home place), 'noforecast' (no usable forecast for that day), 'ok'.
 * place: the setting homePlace; forecast: the saved home forecast (meta); now: a Date.
 */
export function todayOutfit({ place = null, forecast = null, items = [], trips = [], offset = 0, now = new Date() } = {}) {
  if (!items.some((i) => isInventory(i) && isClothing(i) && (layerKey(i.layer) || zoneGroup(i.zone)))) return { state: 'none', place, win: null, outfit: null };
  if (!place) return { state: 'noplace', place, win: null, outfit: null };
  const win = rideWindow(now, { late: LATE_HOUR, hours: daySource(trips)?.hours ?? DAY_HOURS });
  const outfit = forecast && usable(place, forecast, now.getTime()) ? outfitFor(forecast, items, { ...win, offset }) : null;
  return { state: outfit ? 'ok' : 'noforecast', place, win, outfit };
}
