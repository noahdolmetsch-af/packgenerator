/**
 * Ride import, prepared for Garmin and Strava (Noah, 4.10.2026, answer 6a + "import bereits vorbereiten").
 * A direct connection needs a server with a login; this app has none and works offline.
 * So the rides come as files you export yourself:
 * - one ride as GPX or TCX (Garmin Connect: Export; Strava: Export GPX),
 * - many rides as the CSV list (Strava "Download your data" → activities.csv,
 *   Garmin Connect Activities → Export CSV).
 * The debrief uses the km of the rides on the trip's days.
 */
import { parseGpx, routeStats } from './route.js';
import { t } from './i18n.svelte.js';

/** One ride file (GPX or TCX). Returns { date, km, gainM, name }. */
export function parseRideFile(text, file = '') {
  if (/<TrainingCenterDatabase/i.test(text)) {
    const laps = [...text.matchAll(/<Lap\b[\s\S]*?<\/Lap>/gi)].map((m) => Number(m[0].match(/<DistanceMeters>\s*([\d.]+)\s*<\/DistanceMeters>/i)?.[1]) || 0);
    const meters = laps.reduce((t, m) => t + m, 0);
    const date = text.match(/<Id>\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? text.match(/<Time>\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
    return { date, km: Math.round(meters / 100) / 10, gainM: null, name: file.replace(/\.tcx$/i, '') };
  }
  const gpx = parseGpx(text);
  const r = routeStats(gpx, file);
  const date = text.match(/<time>\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
  return { date, km: r.km, gainM: r.gainM, name: r.name };
}

/** Split one CSV line (quotes allowed). */
function cells(line, sep) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') (cur += '"'), i++;
      else q = !q;
    } else if (c === sep && !q) out.push(cur), (cur = '');
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

/** Dates as Strava ("Oct 15, 2026, 7:12:33 AM"), Garmin ("2026-10-15 07:12:33") or "15.10.2026". */
export function toIsoDate(s) {
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}`;
  m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return null;
}

/** "1,234.5" or "45.2" → number (km in the Strava and Garmin exports). */
const toNum = (s) => {
  const t = String(s ?? '').replace(/[^\d.,-]/g, '');
  if (!t) return NaN;
  return Number(/,\d{3}(\.|$)/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.'));
};

/**
 * The CSV list of activities. Finds the date and distance columns by their names.
 * Strava has two "Distance" columns (km, then metres); the first one is used.
 * Returns [{ date, km, name, type }].
 */
export function parseActivitiesCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error(t('The file has no activities in it.'));
  const sep = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const head = cells(lines[0], sep).map((h) => h.toLowerCase());
  const col = (re) => head.findIndex((h) => re.test(h));
  const iDate = col(/^(activity date|date|datum|start time)$/);
  const iDist = col(/^(distance|distanz|strecke)( \(km\))?$/);
  const iName = col(/^(activity name|title|titel|name)$/);
  const iType = col(/^(activity type|type|aktivitätstyp)$/);
  if (iDate < 0 || iDist < 0) throw new Error(t('Date or distance column not found. Use the CSV export of Strava or Garmin Connect.'));
  const metres = /\(m\)|meter/.test(head[iDist]);
  return lines
    .slice(1)
    .map((l) => cells(l, sep))
    .map((c) => {
      const km = toNum(c[iDist]);
      return { date: toIsoDate(c[iDate] ?? ''), km: Number.isFinite(km) ? Math.round((metres ? km / 1000 : km) * 10) / 10 : null, name: iName >= 0 ? c[iName] : '', type: iType >= 0 ? c[iType] : '' };
    })
    .filter((a) => a.date && a.km != null);
}

const CYCLING = /ride|cycl|bike|velo|rad|gravel|mountain/i;

/** Rides on the trip's days (cycling only when the type is known) and their km. */
export function ridesOnTrip(activities, trip) {
  if (!trip?.startDate) return { rides: [], km: 0 };
  const days = Math.max(1, Number(trip.days) || 1);
  const end = new Date(`${trip.startDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days - 1);
  const last = end.toISOString().slice(0, 10);
  const rides = activities.filter((a) => a.date >= trip.startDate && a.date <= last && (!a.type || CYCLING.test(a.type)));
  return { rides, km: Math.round(rides.reduce((t, a) => t + a.km, 0)) };
}
