/**
 * v0.144.0 RE «Eine Tagesuhr» (Noah 14.10.2026 «4a»): one clock for the whole app.
 * Morgen 06:00–10:59, Tag 11:00–17:59, Abend 18:00–21:59, Nacht 22:00–05:59 (device time).
 * The greeting, the night quiet, the weather line «morgen», the evening rows and reminders, the evening
 * on a trip and the fixed rounds of «Wi gaht's?» all read these hours. The evening round at 20:30 stays
 * (it is a time to ask, not a part of the day). No imports on purpose (hallo.js and quiet.js read it).
 */
export const DAY_CLOCK = { morning: 6, day: 11, evening: 18, night: 22 };
/** The parts in the order of the day. */
export const DAY_PARTS = ['morning', 'day', 'evening', 'night'];

/** The part of the day of an hour (0–23): 'morning' | 'day' | 'evening' | 'night'. */
export function partOfDay(hour) {
  const h = Number(hour);
  if (h >= DAY_CLOCK.night || h < DAY_CLOCK.morning) return 'night';
  if (h < DAY_CLOCK.day) return 'morning';
  if (h < DAY_CLOCK.evening) return 'day';
  return 'evening';
}
/** From the evening on (evening or the night after it, not the early morning). */
export const isEveningOn = (hour) => Number(hour) >= DAY_CLOCK.evening;
/** «HH:00» of the start of a part, for the rounds of «Wi gaht's?». */
export const clockOf = (part) => `${String(DAY_CLOCK[part]).padStart(2, '0')}:00`;
