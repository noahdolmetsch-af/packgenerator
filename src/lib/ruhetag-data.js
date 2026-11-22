/**
 * «Ruhetag-Hinweis» (Noah 05.11.2026, Aktiv 4a): the load per day of the last 90 days, read from the activities of
 * Strava (the FTP needs 90 days), and the line itself. The rules are in ruhetag.js (pure, tested).
 */
import { liveQuery } from 'dexie';
import { db } from './db.js';
import { addDays } from './health.js';
import { notIgnored } from './kmbook.js';
import { dayLoads } from './form.js';
import { ftpEstimate, FTP_DAYS } from './training.js';
import { maxOf } from './form-data.js';
import { ruhetagHint, RUHETAG_NO_KEY } from './ruhetag.js';

/** The hint for today from the database, or null. */
export async function loadRuhetag(today, d = db) {
  if (!d.activities) return null;
  const [rows, prefs, no] = await Promise.all([
    d.activities.where('day').aboveOrEqual(addDays(today, -FTP_DAYS)).toArray(),
    d.settings.get('strava'),
    d.settings.get(RUHETAG_NO_KEY),
  ]);
  const acts = notIgnored(rows, prefs?.value?.ignore);
  if (!acts.length) return null;
  const loads = dayLoads(acts, { ftp: ftpEstimate(acts, today), max: maxOf(acts, today) });
  return ruhetagHint({ loads, today, hiddenOn: no?.value ?? null });
}
/** A Svelte store: the hint of today, again after every change of the activities or of «Nicht heute». */
export const ruhetagQuery = (today) => liveQuery(() => loadRuhetag(today));
