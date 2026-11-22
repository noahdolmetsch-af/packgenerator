/**
 * «Meine Datenquellen» (Entwurf «Tour von A bis Z und Datencenter», Noah 07.11.2026 «1a», Schritt 0, PR B): the rows of the page
 * #/auswerten/quellen: where the numbers of the app come from, how fresh they are and where there are gaps. Pure: the page
 * brings what the database holds (counts, last days), this file decides the state of each source. No texts: the page puts the
 * words in; so a limit of the data (Wetter: only a day value at the home place) stands here as a key, not as a sentence.
 * Only shows. Switching a source off for the evaluations is a later step (the analysis pages are being rebuilt).
 *
 * quellenRows(snap, today) → [{ key, href, state, n, last, gap, limit }] in the order of the page:
 *   state: 'ok' (data and no gap) | 'gap' (days without values, gap = { n, of }) | 'old' (no new data for a while, gap = { days })
 *          | 'off' (not connected, and no data held) | 'empty' (a place of the app that holds nothing yet) | 'limit' (a limit of the data, no numbers)
 *   n: the amount held (days, rides, answers, tours …) or null; last: the last day (YYYY-MM-DD) or moment (ISO) or null
 *   limit: a key of LIMITS, or null
 * snap: { fitbit: { on, days: [dates of the last 15 days], count, last }, strava: { on, lastSync, count },
 *         check: { count, last, days: [days of the last 15 days] }, trips: { trips, debriefs }, bikes: { bikes, maintenance } }
 */
import { gapOf } from '../ichideen/depends.js';
import { sourceLink } from '../analyse/zahlweg.js';

/** The limits of the data the page names (keys for the page's texts). */
export const LIMITS = ['wetter', 'kosten'];

const DAY = 864e5;
const dayMs = (d) => Date.parse(`${d}T12:00:00Z`);
const addDays = (d, n) => new Date(dayMs(d) + n * DAY).toISOString().slice(0, 10);

/** Days of the last `of` days (not today) without a value: { n, of } or null. */
export function missingDays(days = [], today, of = 14) {
  const have = new Set(days);
  let n = 0;
  for (let i = 1; i <= of; i++) if (!have.has(addDays(today, -i))) n++;
  return n ? { n, of } : null;
}

const hrefOf = (src, fallback) => sourceLink(src)?.href ?? fallback;

/** The rows, see the head of the file. */
export function quellenRows(snap = {}, today) {
  const f = snap.fitbit ?? {};
  const s = snap.strava ?? {};
  const c = snap.check ?? {};
  const tr = snap.trips ?? {};
  const b = snap.bikes ?? {};
  const rows = [];

  const fg = gapOf('fitbit', { on: !!f.on, days: f.days ?? [], today });
  rows.push({ key: 'fitbit', href: hrefOf('fitbit', '#/me/fitbit'), state: !f.on && !f.count ? 'off' : fg ? 'gap' : 'ok', n: f.count || null, last: f.last ?? null, gap: fg, limit: null });

  const sg = gapOf('strava', { on: !!s.on, last: s.lastSync ?? null, today });
  rows.push({ key: 'strava', href: hrefOf('strava', '#/me/connections'), state: !s.on && !s.count ? 'off' : sg ? 'old' : 'ok', n: s.count || null, last: s.lastSync ?? null, gap: sg, limit: null });

  const cg = c.count ? missingDays(c.days ?? [], today) : null;
  rows.push({ key: 'check', href: hrefOf('check', '#/me/abfragen'), state: !c.count ? 'empty' : cg ? 'gap' : 'ok', n: c.count || null, last: c.last ?? null, gap: cg, limit: null });

  rows.push({ key: 'touren', href: '#/trips', state: tr.trips ? 'ok' : 'empty', n: tr.trips || null, last: null, gap: tr.trips ? { debriefs: tr.debriefs ?? 0, without: Math.max(0, tr.trips - (tr.debriefs ?? 0)) } : null, limit: null });

  rows.push({ key: 'velos', href: '#/bikes', state: b.bikes ? 'ok' : 'empty', n: b.bikes || null, last: null, gap: b.bikes ? { maintenance: b.maintenance ?? 0 } : null, limit: null });

  for (const key of LIMITS) rows.push({ key, href: null, state: 'limit', n: null, last: null, gap: null, limit: key });
  return rows;
}

/** Nothing held and nothing connected: the page then offers to connect something. */
export const allEmpty = (rows) => rows.every((r) => r.state === 'off' || r.state === 'empty' || r.state === 'limit');
