/**
 * Windows on Heute (Noah 19.10.2026 «1a 3a», after «Tagescheck und Abendcheck als eigene Maske»): a few
 * moments come as their own window instead of only a line on Heute. Each window has «Später» (back in one
 * hour) and «Heute nicht» (away until tomorrow); its main button leads to the page. Only one at a time.
 *   - eve:  the evening before a trip, from 17:00, while not everything is packed («Packen»)
 *   - week: Sunday from 18:00, the Wochenrückblick
 * Pure rules: no database, no clock (stamps 'YYYY-MM-DDTHH:MM', local time).
 */
import { soonTrips, packedOf } from './heute.js';

/** The settings record: { [id]: { later?: stamp, off?: day, done?: day } }. */
export const WINDOWS_KEY = 'homeWindows';
export const EVE_FROM = '17:00';
export const WEEK_FROM = '18:00';

const p2 = (n) => String(n).padStart(2, '0');
const hmOf = (stamp) => String(stamp ?? '').slice(11, 16);
export const dayOfStamp = (stamp) => String(stamp ?? '').slice(0, 10);
const addDay = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** One hour after a stamp (over midnight and month ends too). */
export function hourLater(stamp) {
  const [d, hm] = String(stamp).split('T');
  const [y, m, dd] = d.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  const x = new Date(y, m - 1, dd, h + 1, mi);
  return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}T${p2(x.getHours())}:${p2(x.getMinutes())}`;
}

/** Whether a window may show now: not put away today, not waiting for «Später», not done today. */
export function mayShow(rec, id, now) {
  const r = rec?.[id] ?? {};
  const today = dayOfStamp(now);
  if (r.off === today || r.done === today) return false;
  return !(r.later && now < r.later);
}

/** The record after «Später», «Heute nicht» or the main button. */
export const later = (rec, id, now) => ({ ...(rec ?? {}), [id]: { ...(rec?.[id] ?? {}), later: hourLater(now) } });
export const notToday = (rec, id, now) => ({ ...(rec ?? {}), [id]: { ...(rec?.[id] ?? {}), off: dayOfStamp(now) } });
export const done = (rec, id, now) => ({ ...(rec ?? {}), [id]: { ...(rec?.[id] ?? {}), done: dayOfStamp(now) } });

/**
 * The evening before a trip: from 17:00, a trip that starts tomorrow and is not fully packed (no list yet
 * counts as not packed). Returns { trip, packed } or null.
 */
export function eveBefore(trips = [], now, itemsById = {}, name) {
  if (hmOf(now) < EVE_FROM) return null;
  const tomorrow = addDay(dayOfStamp(now), 1);
  const trip = soonTrips(trips, dayOfStamp(now)).find((x) => x.startDate === tomorrow);
  if (!trip) return null;
  const packed = packedOf(trip, itemsById, name);
  if (packed && packed.packed >= packed.of) return null;
  return { trip, packed };
}

/** Sunday from 18:00: the week is nearly over. */
export const weekDue = (now) => new Date(`${dayOfStamp(now)}T12:00:00Z`).getUTCDay() === 0 && hmOf(now) >= WEEK_FROM;

/** The one window to show now (the trip first), or null. */
export function windowNow({ rec, now, trips = [], itemsById = {}, name }) {
  const eve = eveBefore(trips, now, itemsById, name);
  if (eve && mayShow(rec, 'eve', now)) return { id: 'eve', ...eve };
  if (weekDue(now) && mayShow(rec, 'week', now)) return { id: 'week' };
  return null;
}
