/**
 * «Anmelde-Wecker» of the Rennatlas (Noah 24.11.2026, idea 2): a race you have not registered for can get an alarm on
 * the phone. It rings on the day the registration opens, and 3 days and 1 day before it closes. Pure functions:
 * the push list (push/schedule.js) and the window of a race (AtlasDetail.svelte) both read the days from here.
 */
import { addDay } from './atlas-view.js';

/** Days before the registration closes with an alarm (like the registration of a trip). */
export const WAKE_BEFORE = [3, 1];

/** Can this race get an alarm? Not registered, and a day of the registration still lies ahead (or is today). */
export const wakeable = (row, today) => !row.registered && ((!!row.opens && row.opens >= today) || (!!row.closes && row.closes >= today));

/**
 * The days the alarm of one race rings, from today on: [{ day, kind: 'opens' | 'closes', back }] with `back` the
 * days before the registration closes (0 for the opening day). Several alarms on one day stay one (the opening wins).
 */
export function wakeDays(row, today) {
  if (!wakeable(row, today)) return [];
  const out = [];
  if (row.opens && row.opens >= today) out.push({ day: row.opens, kind: 'opens', back: 0 });
  if (row.closes && row.closes >= today)
    for (const back of WAKE_BEFORE) {
      const day = addDay(row.closes, -back);
      if (day >= today && !out.some((o) => o.day === day)) out.push({ day, kind: 'closes', back });
    }
  return out.sort((a, b) => a.day.localeCompare(b.day));
}

/** The races with an alarm that rings at least once from today on. */
export const wakeRows = (rows, today) => rows.filter((r) => r.wecker === true && wakeDays(r, today).length);
