/**
 * v0.102.0 Design-Refresh P4 «Touren» (T1, approved 12.10.2026 «Touren T1–T6 freigegeben»): small pure
 * helpers of the new Touren page: the count line under the title and the «Wetter-Fenster» (the next
 * seven days at home with the best days for a ride). Tested in tests/touren.test.js.
 */
import { toWx } from './weather.js';

/** The numbers of the line under «Touren»: in planning (soon on the way too), debrief open, ridden. */
export function overviewCounts(view) {
  if (!view || view.empty) return null;
  return { planning: (view.planning?.length ?? 0) + (view.soon?.length ?? 0), debrief: view.debrief?.length ?? 0, ridden: view.riddenTotal ?? 0 };
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * The weather window: the next `n` days from today out of a saved forecast ({ days: [{ date, min, max,
 * rainMm, rainPct }] }), each { date, max, min, rain: 'none' | 'showers' | 'rain', best }. The best days
 * are dry and at most 2 °C cooler than the warmest dry day (three at most, the warmest first).
 * → { days, best: [dates] } or null without a forecast for today.
 */
export function weatherWindow(forecast, today, n = 7) {
  const want = Array.from({ length: n }, (_, i) => addDays(today, i));
  const days = want
    .map((date) => forecast?.days?.find((d) => d.date === date))
    .filter((d) => d && d.max != null)
    .map((d) => ({ date: d.date, max: Math.round(d.max), min: d.min == null ? null : Math.round(d.min), rain: toWx([d])?.rain ?? 'none', best: false }));
  if (!days.length) return null;
  const dry = days.filter((d) => d.rain === 'none');
  const top = dry.length ? Math.max(...dry.map((d) => d.max)) : null;
  const best = dry
    .filter((d) => d.max >= top - 2)
    .sort((a, b) => b.max - a.max || a.date.localeCompare(b.date))
    .slice(0, 3)
    .map((d) => d.date)
    .sort();
  for (const d of days) d.best = best.includes(d.date);
  return { days, best };
}

/** Days from today to a date (calendar days, both «YYYY-MM-DD»); null without a date. */
export function daysTo(iso, today) {
  if (!iso || !today) return null;
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);
}
