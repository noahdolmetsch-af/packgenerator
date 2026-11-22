/**
 * «Cardio-Belastung» Idee C (Noah 07.11.2026 «alle A–F»): a value that adds up (cardio load, minutes) has no
 * «typical range» box, but the chart can show the band where your days, or your weeks when the bars are weeks, usually
 * lie: the middle half of the last 3 months. Pure; null under 7 values.
 */
import { bucketsOf, typicalOf } from './detail.js';

/** days: the days of the last 3 months (oldest first); get: the value of a day; perWeek: weekly totals instead of days. */
export function sumBand(days, get, perWeek = false) {
  return typicalOf(bucketsOf(days, get, true, perWeek ? 0 : Number.MAX_SAFE_INTEGER), (p) => p.v);
}
