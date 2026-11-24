/**
 * «Auswerten neu», Reiter «Heute» (Noah 24.11.2026 «1b 2a 3b 4a 5a»): the three body values of today (HRV, resting pulse, sleep)
 * against the OWN normal of the last 12 months (never an age group), with the last 4 weeks as the second number.
 * Pure over the day table (messwerte.js dayTable); the page is src/pages/AuswertenHeute.svelte. Observation only.
 */
import { addDays } from '../health.js';
import { normalOf, normal28, placeIn, shareBelow, NORMAL_KEYS } from './normal.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** A watch value often comes in the morning: today's, else the last of the days before (up to `days` back). → { day, value, isToday } or null */
export function latestOf(table, key, today, days = 3) {
  for (let i = 0; i < days; i++) {
    const day = addDays(today, -i);
    const v = fin(table.get(day)?.[key]);
    if (v != null) return { day, value: v, isToday: i === 0 };
  }
  return null;
}

/**
 * One card per value that has a number or a usual range: { key, last, normal, normal28, place, share }.
 * place: 'below' | 'usual' | 'above' (the middle half of the 12 months is «usual»), share: of 100 days, how many were lower.
 */
export function valueCards(table, today) {
  return NORMAL_KEYS.map((key) => {
    const last = latestOf(table, key, today);
    const normal = normalOf(table, key, today);
    return {
      key,
      last,
      normal,
      normal28: normal28(table, key, today),
      place: last ? placeIn(normal, last.value) : null,
      share: last ? shareBelow(table, key, last.value, last.day) : null,
    };
  }).filter((c) => c.last || c.normal);
}
