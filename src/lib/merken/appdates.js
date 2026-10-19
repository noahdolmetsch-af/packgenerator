/**
 * Kalender › Merken (PL3, decision 11.10 «2a+b»): what the app already knows, small under the own
 * to-dos, per source deselectable. Built now: Touren (pack two days before) and Velo-Pflege (due now).
 * rows: [{ key, source, text, day, href }] sorted by day.
 */
import { addDays } from '../merken.js';
import { bikeCare } from '../readiness.js';
import { withVisits } from '../workshop.js';
import { bikesHash } from '../bikes.js';

export const SOURCES = [
  { key: 'trips', label: 'Trips|place' },
  { key: 'care', label: 'Bike care' },
];
export const SOURCES_KEY = 'merken.sources';
export const PACK_BEFORE = 2;

export function appDates({ trips = [], bikes = [], visits = [], tasks = [], today, off = [], texts }) {
  const rows = [];
  const until = addDays(today, 183); // decision 11.10: the agenda reaches 6 months ahead
  if (!off.includes('trips')) {
    for (const tr of trips) {
      if (tr.skipped || tr.finished || !tr.startDate || tr.startDate < today || tr.startDate > until || String(tr.id).startsWith('demo')) continue;
      const pack = addDays(tr.startDate, -PACK_BEFORE);
      rows.push({ key: `trip:${tr.id}`, source: 'trips', text: texts.pack(tr.title || ''), sub: texts.tripSub, day: pack < today ? today : pack, tripId: tr.id });
    }
  }
  if (!off.includes('care')) {
    for (const b of bikes) {
      const care = bikeCare(withVisits(b, visits), { tasks, visits, today });
      for (const r of care?.rows ?? []) rows.push({ key: `care:${b.id}:${r.key}`, source: 'care', text: texts.care(b.name, r.name), sub: texts.careSub, day: today, href: bikesHash({ tab: 'care', bike: b.id }) });
    }
  }
  return rows.sort((a, b) => a.day.localeCompare(b.day) || a.text.localeCompare(b.text));
}
