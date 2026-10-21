/**
 * «Körperwerte» on Heute (Noah 21.10.2026 06:49 «Körperwerte und countdown ok»): the most important Fitbit
 * values of today in one row, each a way into its tab of the page Körperwerte (#/flow/stats/<tab>).
 * A value that today does not have yet shows its last day within 7 days, with that day; nothing is
 * estimated. Reads the Fitbit days (healthDays, health.js) only. Pure functions, tested in tests/vitals.test.js.
 */
import { addDays } from '../health.js';

/** The values in their order: key, label (English, for t()), the tab of Körperwerte, unit. */
export const VITALS = [
  { key: 'rhr', label: 'Resting pulse', tab: 'hr', unit: '/min' },
  { key: 'hrv', label: 'HRV', tab: 'hrv', unit: 'ms' },
  { key: 'sleep', label: 'Sleep|body', tab: 'sleep', unit: 'h' },
  { key: 'steps', label: 'Steps', tab: 'steps', unit: '' },
  { key: 'azm', label: 'Active zone minutes|metric', tab: 'azm', unit: 'min' },
  { key: 'kcal', label: 'Calories', tab: 'kcal', unit: 'kcal' },
];

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** One value of a Fitbit day row, or null. */
export function vitalOf(row, key) {
  if (!row) return null;
  if (key === 'rhr') return fin(row.restingHr) != null && row.restingHr > 0 ? Math.round(row.restingHr) : null;
  if (key === 'hrv') return fin(row.hrvMs) != null && row.hrvMs > 0 ? Math.round(row.hrvMs) : null;
  if (key === 'sleep') return fin(row.sleep?.asleepMin) > 0 ? Math.round((row.sleep.asleepMin / 60) * 10) / 10 : null;
  if (key === 'steps') return fin(row.steps) != null ? Math.round(row.steps) : null;
  if (key === 'azm') return fin(row.azm) != null ? Math.round(row.azm) : null;
  if (key === 'kcal') return fin(row.kcal) != null ? Math.round(row.kcal) : null;
  return null;
}

/**
 * The values for the tile: today's, else the last day within 7 days that has it.
 * → { rows: [{ ...VITALS[i], v, day }], any }
 */
export function vitalsToday(health = [], today) {
  const by = new Map((health ?? []).filter((r) => r?.date && r.date <= today).map((r) => [r.date, r]));
  const rows = VITALS.map((x) => {
    for (let i = 0; i < 7; i++) {
      const day = addDays(today, -i);
      const v = vitalOf(by.get(day), x.key);
      if (v != null) return { ...x, v, day };
    }
    return { ...x, v: null, day: null };
  });
  return { rows, any: rows.some((r) => r.v != null) };
}
