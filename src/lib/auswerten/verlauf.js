/**
 * «Auswerten neu» Teil 3, Reiter «Verlauf» (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf C «Cockpit»): HRV, resting pulse and sleep over time
 * with your own usual range behind them, your normal year by year, and the two patterns of the data (bedtime, ride).
 * Pure over the day table (messwerte.js dayTable); the page is src/pages/AuswertenVerlauf.svelte. Observation only, never a cause.
 */
import { addDays } from '../health.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const median = (vals) => {
  const s = vals.filter((v) => fin(v) != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The ranges of the switch: key, days, and the grain of the line (a day each, or the middle of a week each). */
export const SPANS = [
  { key: 'w4', days: 28, name: '4 wk|verlauf', grain: 'day' },
  { key: 'w12', days: 84, name: '12 wk|verlauf', grain: 'day' },
  { key: 'm6', days: 182, name: '6 mo|verlauf', grain: 'week' },
  { key: 'y2', days: 730, name: '2 yr|verlauf', grain: 'week' },
];
export const SPAN_DEFAULT = 'w12';

/**
 * The line of one value over `days` days up to today: { cols: [{ key, from, to }], v: [number|null] }.
 * grain 'day': one point per day; 'week': the middle of each block of 7 days (a block needs 2 values), so two years stay readable.
 */
export function seriesOf(table, key, today, days, grain = 'day') {
  const from = addDays(today, -(days - 1));
  const size = grain === 'week' ? 7 : 1;
  const cols = [];
  const v = [];
  for (let i = 0; i < days; i += size) {
    const a = addDays(from, i);
    const b = addDays(from, Math.min(days - 1, i + size - 1));
    const vals = [];
    for (let d = a; d <= b; d = addDays(d, 1)) vals.push(fin(table.get(d)?.[key]));
    const ok = vals.filter((x) => x != null);
    cols.push({ key: a, from: a, to: b });
    v.push(size === 1 ? (ok[0] ?? null) : ok.length >= 2 ? median(ok) : null);
  }
  return { cols, v };
}

/** The hours of a night in minutes → hours, for the axis of the sleep line (HRV and pulse stay as they are). */
export const axisValue = (key, v) => (v == null ? null : key === 'sleep' ? v / 60 : v);
