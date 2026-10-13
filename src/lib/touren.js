/**
 * v0.102.0 Design-Refresh P4 «Touren» (T1, approved 12.10.2026 «Touren T1–T6 freigegeben»): small pure
 * helpers of the new Touren page: the count line under the title and the «Wetter-Fenster» (the next
 * seven days at home with the best days for a ride). Tested in tests/touren.test.js.
 */
import { toWx } from './weather.js';

/**
 * The numbers of the line under «Touren»: v0.126.0 TZ-1 (mockup TZ1) by the three trip states
 * (tripstate.js): planned, completed, rated; all for the chip «All».
 */
export function overviewCounts(view) {
  if (!view || view.empty) return null;
  const c = view.counts ?? {};
  return { plan: c.plan ?? 0, done: c.done ?? 0, rated: c.rated ?? 0, all: c.all ?? 0 };
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

/**
 * T3 «Gewicht»: the gear of a trip by place (each bag, the bike, on me), without food and water, the
 * heaviest place first; plus the heaviest single item. stats: trips.js tripStats; itemsById: id → item.
 * → { rows: [{ key, g, missing }], total, missing, heaviest: { item, g } | null, food }
 */
export function weightByPlace(stats, itemsById, eats = () => false) {
  const rows = [];
  let heaviest = null;
  for (const z of stats?.zones ?? []) {
    let g = 0;
    let missing = 0;
    for (const e of z.entries) {
      const it = itemsById[e.itemId];
      if (!it || eats(it)) continue;
      if (it.weightG == null) {
        missing++;
        continue;
      }
      const w = it.weightG * (e.qty || 1);
      g += w;
      if (!heaviest || it.weightG > heaviest.g) heaviest = { item: it, g: it.weightG };
    }
    if (g > 0 || missing) rows.push({ key: z.key, g, missing });
  }
  rows.sort((a, b) => b.g - a.g);
  return { rows, total: rows.reduce((s, r) => s + r.g, 0), missing: rows.reduce((s, r) => s + r.missing, 0), heaviest, food: stats?.consumablesG ?? 0 };
}
