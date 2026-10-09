/**
 * v0.28.0 (AP25, Noah 8.10.2026): which trips may teach the app something about an item.
 * Shared by the template hints (debrief.js templateHints) and the ballast card and badges
 * (packhints.js), so all three count the same way. Pure functions, tested in tests/learn.test.js.
 *
 * - Tools and spare tube always (Noah: "werkzeug und ersatzschlauch immer"): an item "On every
 *   trip" or of the category Tools & repair is never ballast and never "take out of the template".
 * - Weather (2a): an item that is only for some weather (category Rain & cold, a rain rule or a
 *   cold limit) only counts on trips where that weather was there. A trip without weather is
 *   unknown and does not count either. Such a trip is skipped: it neither counts as "not used"
 *   nor ends a streak.
 */
import { t, tn } from './i18n.svelte.js';
import { isWorn } from './blocks2026.js';
import { nightName } from './context.js';

/**
 * Noah: tools and the spare tube always come along; the app never calls them ballast.
 * v0.33.0 (Noah 8.10.2026, answer a): items in Standard CAN be ballast (unused Standard items are
 * the ballast he wants to see); only tools, and what is worn ("Am Körper"), never are.
 */
export const alwaysKeep = (item) => !!item && (item.category === 'tools' || isWorn(item));

const isRainItem = (item) => item?.category === 'rain' || !!item?.rain;
const isColdItem = (item) => typeof item?.coldBelow === 'number';

/** Is the item only for some weather (rain or cold)? */
export const weatherItem = (item) => isRainItem(item) || isColdItem(item);

const wetKnown = (wx) => wx?.rain != null && wx.rain !== '';
const wasWet = (wx) => wx?.rain === true || wx?.rain === 'rain' || wx?.rain === 'showers';

/**
 * Does this trip count for the item (2a)? Always true for an item that does not depend on the
 * weather. A rain item counts when rain or showers were expected, a cold item when the coldest
 * temperature was below its limit; an item for both counts when either was there. Unknown weather
 * (no trip.wx, no rain answer, no minimum) does not count.
 */
export function weatherCounts(item, trip) {
  if (!weatherItem(item)) return true;
  const wx = trip?.wx;
  if (!wx) return false;
  if (isRainItem(item) && wetKnown(wx) && wasWet(wx)) return true;
  if (isColdItem(item) && typeof wx.min === 'number' && wx.min < item.coldBelow) return true;
  return false;
}

/** The short context of a trip for the source of a hint: "2 days · Lodging · 6–12 °C, rain". */
export function tripContext(trip) {
  const parts = [tn(Math.max(1, Number(trip?.days) || 1), '{n} day', '{n} days')];
  if (trip?.overnight === 'none') parts.push(t('No night'));
  else if (trip?.overnight === 'lodging' || trip?.overnight === 'outdoor') parts.push(t(nightName(trip))); // v0.64.0: Hotel/hut, Bivouac (+ tent)
  const wx = trip?.wx;
  const temps = typeof wx?.min === 'number' && typeof wx?.max === 'number' ? `${wx.min}–${wx.max} °C` : null;
  if (!temps && !wetKnown(wx)) parts.push(t('weather unknown'));
  else {
    const temp = temps ?? t('temperature unknown');
    parts.push(wasWet(wx) ? (wx.rain === 'showers' ? t('{weather}, showers', { weather: temp }) : t('{weather}, rain', { weather: temp })) : temp);
  }
  return parts.join(' · ');
}

/** A trip as the source of a hint: { id, title, startDate, ctx }. */
export const tripSource = (trip) => ({ id: trip.id, title: trip.title ?? '', startDate: trip.startDate ?? null, ctx: tripContext(trip) });
