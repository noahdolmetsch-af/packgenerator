/**
 * «Traum der Woche» (Träume und Neuland, Noah 07.11.2026 «1a … 3a»): one dream on Heute that fits right now.
 *
 * - A dream with a fixed date (raceDate + days, e.g. a race) shows a countdown from 90 days before. Once its days
 *   are inside the forecast (16 days) the tile shows the weather for exactly those days.
 * - A dream without a date fits when the month is right and the days it needs are dry in a row. Without such a
 *   window the tile stays away.
 * - A dream that rides through the night (`night`) also needs a night above 5 °C and little wind on every day.
 * Pure parts tested in tests/wochentraum.test.js. The forecast is the one Touren › Träume keeps (wetterfenster.js).
 */
import { storeOf, dreamList, nextWindow, daysUntil } from '../dreams.js';
import { isDry, placeOf, placeKey, needDays } from './wetterfenster.js';

/** A night counts as good from this temperature (°C) and with at most this wind (km/h). */
export const NIGHT = { minTemp: 5, maxWind: 30 };
/** A dream with a date shows from this many days before. */
export const SHOW_AHEAD = 90;

/** Why a day is not good: ['rain'], ['cold'], ['wind'] … (empty: good). Unknown values never count against it. */
export function badReasons(d, night = false) {
  if (!d) return [];
  const out = [];
  if (!isDry(d)) out.push('rain');
  if (night) {
    if (d.min != null && Number(d.min) < NIGHT.minTemp) out.push('cold');
    if (d.wind != null && Number(d.wind) > NIGHT.maxWind) out.push('wind');
  }
  return out;
}
export const dayGood = (d, night = false) => !!d && badReasons(d, night).length === 0;

const addDay = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The dates of a dream with a fixed date: [first, …] over its days (at least 1, at most 60). */
export function datesOf(dream) {
  if (!dream?.raceDate) return [];
  const n = Math.max(1, Math.min(60, Math.round(Number(dream.days) || 1)));
  return Array.from({ length: n }, (_, i) => addDay(dream.raceDate, i));
}

/** The first run of `need` good days from today on: { from, to, n } or null. days: [{ date, rainMm, rainPct, min?, wind? }]. */
export function goodWindow(days = [], today, need = 2, night = false) {
  const list = days.filter((d) => d?.date && d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  let run = [];
  for (const d of list) {
    if (!dayGood(d, night)) {
      run = [];
      continue;
    }
    run = run.length && addDay(run.at(-1).date, 1) === d.date ? [...run, d] : [d];
    if (run.length >= need) {
      let end = run.at(-1);
      for (const e of list) if (e.date > end.date && e.date === addDay(end.date, 1) && dayGood(e, night)) end = e;
      return { from: run[0].date, to: end.date, n: Math.round((Date.parse(`${end.date}T12:00:00Z`) - Date.parse(`${run[0].date}T12:00:00Z`)) / 864e5) + 1 };
    }
  }
  return null;
}

const forecastOf = (dream, home, kept) => {
  const p = placeOf(dream, home);
  return p ? kept?.places?.[placeKey(p)]?.days ?? [] : [];
};

/**
 * The dream of the week, or null.
 * value: the DREAMS_KEY setting; home: { lat, lon } or null; kept: the DREAM_WX value; today: the local day.
 * → { dream, dated, night, start, end, until, days: [{ date, wx|null, good|null, why: [] }], known, good, window, wait }
 *   dated: it has a fixed date; until: days to the first day (0 or less: it runs); known: all its days are in the
 *   forecast; good: all its days are good (null when not known); window: the dry window of a dream without a date;
 *   wait: for a dated dream, the days until its first day enters the forecast (0 when it is in).
 */
export function wochentraum(value, home, kept, today, forecastDays = 16) {
  const s = storeOf(value);
  const open = dreamList(s.dreams).filter((d) => !d.tripId);
  const dated = open
    .filter((d) => d.raceDate)
    .map((d) => ({ d, dates: datesOf(d) }))
    .filter((x) => x.dates.at(-1) >= today && daysUntil(x.dates[0], today) <= SHOW_AHEAD)
    .sort((a, b) => a.dates[0].localeCompare(b.dates[0]));
  const asDated = ({ d, dates }) => {
    const fc = forecastOf(d, home, kept);
    const days = dates.map((date) => {
      const wx = fc.find((x) => x.date === date) ?? null;
      return { date, wx, good: wx ? dayGood(wx, !!d.night) : null, why: wx ? badReasons(wx, !!d.night) : [] };
    });
    const known = days.every((x) => x.wx);
    const until = daysUntil(dates[0], today);
    return { dream: d, dated: true, night: !!d.night, start: dates[0], end: dates.at(-1), until, days, known, good: known ? days.every((x) => x.good) : null, window: null, wait: Math.max(0, until - (forecastDays - 1)) };
  };
  // a dated dream whose days are in the forecast (or running) leads, the nearest first
  const soon = dated.find((x) => daysUntil(x.dates[0], today) <= forecastDays - 1);
  if (soon) return asDated(soon);
  // a dream without a date that fits this month with a good window
  for (const d of open.filter((x) => !x.raceDate)) {
    if (!nextWindow(d, today, s.kinds)?.now) continue;
    const w = goodWindow(forecastOf(d, home, kept), today, needDays(d), !!d.night);
    if (w) return { dream: d, dated: false, night: !!d.night, start: w.from, end: w.to, until: daysUntil(w.from, today), days: [], known: true, good: true, window: w, wait: 0 };
  }
  // a dated dream further away: the countdown only
  return dated[0] ? asDated(dated[0]) : null;
}

/** The dreams whose forecast is worth fetching for the tile: open ones with a date soon, and open ones that fit this month. */
export function candidates(value, today) {
  const s = storeOf(value);
  return dreamList(s.dreams)
    .filter((d) => !d.tripId)
    .filter((d) => (d.raceDate ? (datesOf(d).at(-1) ?? '') >= today && daysUntil(d.raceDate, today) <= SHOW_AHEAD : !!nextWindow(d, today, s.kinds)?.now))
    .slice(0, 4);
}
