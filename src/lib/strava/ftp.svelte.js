/**
 * The FTP settings (ftpstate.svelte.js): read live from the settings, saved from Training › FTP, and the FTP of
 * the Strava profile kept when the bikes are fetched.
 *   settings 'training.ftp' = { own: watts } (typed in) · 'strava.ftp' = { w: watts, at } (from Strava)
 *   An FTP typed in the data pages of the live map ('live-pages'.ftp) counts as own too, when Training has none.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { ftpFixed } from './ftpstate.svelte.js';
import { PAGES_KEY } from '../live/datapages.js';

export const OWN_FTP_KEY = 'training.ftp';
export const STRAVA_FTP_KEY = 'strava.ftp';
export const FTP_MIN = 50;
export const FTP_MAX = 700;

/** A whole number of watts within FTP_MIN–FTP_MAX, or null. */
export const cleanFtp = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= FTP_MIN && n <= FTP_MAX ? n : null;
};

/** Takes the values into the live state (also used by the tests). pages: the live map's data pages setting. */
export function applyFtp(own, strava, pages = null) {
  ftpFixed.own = cleanFtp(own?.own) ?? cleanFtp(pages?.ftp);
  ftpFixed.strava = cleanFtp(strava?.w);
}

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  const get = async (k) => (await appDb.settings.get(k))?.value ?? null;
  liveQuery(() => Promise.all([get(OWN_FTP_KEY), get(STRAVA_FTP_KEY), get(PAGES_KEY)])).subscribe({ next: ([own, strava, pages]) => applyFtp(own, strava, pages), error: () => {} });
}

/** Saves an own FTP (watts), or null: back to Strava's or the estimate. false when the number does not fit. */
export async function saveOwnFtp(w, db = appDb) {
  if (w == null || w === '') return db.settings.delete(OWN_FTP_KEY).then(() => true);
  const v = cleanFtp(w);
  if (!v) return false;
  await db.settings.put({ key: OWN_FTP_KEY, value: { own: v } });
  return true;
}

/** Keeps the FTP of the Strava profile (from step=gear); nothing when Strava sends none. */
export async function keepStravaFtp(db, w, now = new Date()) {
  const v = cleanFtp(w);
  const cur = (await db.settings.get(STRAVA_FTP_KEY))?.value ?? null;
  if (!v) return;
  if (cur?.w === v) return;
  await db.settings.put({ key: STRAVA_FTP_KEY, value: { w: v, at: now.toISOString() } });
}
