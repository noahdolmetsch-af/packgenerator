/**
 * SN1b–SN1d «Tour aus komoot» (Noah 13.10.2026 «freigabe», answers 1a 2b 3b 4a). komoot has no open
 * interface: the app only links out (komoot's suggestions near you) and takes a GPX file back (shared
 * from komoot to the app). Nothing is embedded, no interface is called, nothing goes back to komoot.
 *
 * - The location is asked for only when «Tour aus komoot» is tapped; it goes only into the link
 *   (rounded to about 1 km) and is never stored.
 * - A shared GPX without times is a planned route: the sheet «Tour aus komoot übernehmen» (SN1c).
 *   A GPX (or TCX) with times stays a ride («Fahrt hochladen», as before). public/share-target.js
 *   makes the same decision in the service worker (the rule is kept the same there, tested in
 *   tests/komoot.test.js).
 * - The route numbers come from route.js, as for «GPX-Route hinzufügen». New is one field on the
 *   route: route.komoot, the komoot link (only an http(s) link on a komoot address).
 * Pure functions, tested in tests/komoot.test.js.
 */
import { t } from './i18n.svelte.js';
import { ridePoints, rideKind } from './gpx.js';
import { onTripDay, dayIndex } from './ride.js';
import { newTrip } from './trips.js';
import { freeTitle } from './dayride.js';
import { ridingHours, SPEED_KMH, CLIMB_MH } from './route.js';
import { localDay } from './localday.js';

/** The header the service worker writes the shared text into (title, text and link, one per line). */
export const SHARE_TEXT = 'X-Share-Text';

/* ---------- which kind of shared file ---------- */

/** Does the file carry a time on at least two points (a recorded ride)? A TCX always does. */
export function hasTimes(text) {
  try {
    return ridePoints(String(text ?? '')).filter((p) => p.t != null).length >= 2;
  } catch {
    return false;
  }
}

/**
 * A shared file: 'route' (a GPX without times: a planned tour, e.g. from komoot) or 'ride' (with
 * times, a TCX, or anything the ride upload should explain, like an empty or a wrong file).
 */
export const sharedKind = (text) => (rideKind(String(text ?? '')) === 'gpx' && !hasTimes(text) ? 'route' : 'ride');

/* ---------- the komoot link ---------- */

const KOMOOT_HOST = /^(?:[\w-]+\.)*komoot\.[a-z]{2,}$/i;

/** A komoot address as a safe link, or null (only http and https on komoot's own addresses). */
export function komootLink(text) {
  let s = String(text ?? '').trim();
  if (!s || /\s/.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
    s = `https://${s}`;
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.username || u.password || !KOMOOT_HOST.test(u.hostname)) return null;
  return u.href;
}

/** The first komoot link in what was shared with the file («Schau dir diese Tour an: https://…»). */
export function komootLinkIn(text) {
  for (const m of String(text ?? '').matchAll(/(?<![\w.@/-])(?:https?:\/\/)?(?:[\w-]+\.)*komoot\.[a-z]{2,}\/[^\s<>"']*/gi)) {
    const link = komootLink(m[0].replace(/[.,;:!?)\]»”'"]+$/, ''));
    if (link) return link;
  }
  return null;
}

/* ---------- komoot's suggestions near you ---------- */

/**
 * The kind of tour to look for in komoot, from the trip's area and the bike's type: { key, name }
 * (key: komoot's sport word in the link; name: English, shown with t()), or null (no filter).
 */
export function komootSport(domain = 'bikepacking', bikeType = '') {
  if (domain === 'hiking') return { key: 'hike', name: 'Hiking' };
  if (domain && domain !== 'bikepacking' && domain !== 'velo') return null;
  const s = String(bikeType ?? '').trim();
  if (/gravel/i.test(s)) return { key: 'mtb_easy', name: 'Gravel' };
  if (/^(mtb|mountain ?bike|full|fully|full[ -]?suspension|hard[ -]?tail)$/i.test(s)) return { key: 'mtb', name: 'MTB' };
  if (/^(road|road ?bike|racer)$/i.test(s)) return { key: 'racebike', name: 'Road bike' };
  return { key: 'touringbicycle', name: 'Cycling|sport' };
}

/** A position rounded to two places (about 1 km): enough for «near you», no more. */
const near = (p) => (p && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? { lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100 } : null);

/**
 * komoot's tour suggestions around a place, for a sport. The place is only in this link: the app
 * keeps nothing. Without a place: komoot's suggestions page, where komoot asks itself.
 */
export function komootFindUrl(pos = null, sport = null) {
  const p = near(pos);
  const q = sport?.key ? `?sport=${encodeURIComponent(sport.key)}` : '';
  return p ? `https://www.komoot.com/discover/Location/@${p.lat},${p.lon}/tours${q}` : `https://www.komoot.com/discover${q}`;
}

/* ---------- the sheet «Tour aus komoot übernehmen» ---------- */

/** The day chosen at first (answer 2b): today on the device's own clock, not in UTC. */
export const defaultDay = (now = new Date()) => localDay(now);

/**
 * A trip that is on that day already (running or planned), or null: { trip, day, days }.
 * day 1: the trip starts that day; later: you are still on it. Both may stand (the sheet only says so).
 */
export function clashOn(trips = [], date) {
  // a trip you are still on (started before that day) first, else one that starts that day
  const on = trips.filter((x) => x && !x.skipped && x.status !== 'done' && !x.finished && onTripDay(x, date)).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))[0];
  if (!on) return null;
  return { trip: on, day: dayIndex(on, date) + 1, days: Math.max(1, Number(on.days) || 1) };
}

/** Riding time of the whole route in minutes, rounded to 10 (the sheet's «etwa 5 h 20»). */
export function routeMinutes(route, pace = null) {
  if (!route?.km) return null;
  const h = route.km / (pace?.kmh || SPEED_KMH) + (route.gainM ?? 0) / (pace?.climbMh || CLIMB_MH);
  return Math.max(10, Math.round((h * 60) / 10) * 10);
}

/** «5 h 20» (or «45 min»). */
export function hoursText(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? t('{h} h {m}', { h, m: String(m).padStart(2, '0') }) : t('{h} h|duration', { h })) : t('{m} min', { m });
}

/**
 * The planned trip from a komoot route (SN1c → SN1d). choice: { title, startDate, bike (or null),
 * days, start ('HH:MM' or ''), link (komoot link or null), list: 'suggest' (the list of the last trip
 * on this bike, else the standard set, as «Neue Tour» does) or 'empty' }. The route keeps its numbers
 * and the link; its start becomes the weather place. Nothing is ticked off.
 */
export function tripFromKomoot(route, choice, trips = [], items = [], pace = null, now = Date.now()) {
  const days = Math.max(1, Math.min(60, Number(choice.days) || 1));
  const title = freeTitle(String(choice.title ?? '').trim() || route.name || t('Tour from komoot'), trips);
  const bike = choice.bike ?? null;
  const base = bike
    ? newTrip({ title, startDate: choice.startDate, days, bike }, trips, items, now)
    : { id: `trip-${now.toString(36)}`, domain: 'bikepacking', title, startDate: choice.startDate, days, bikeId: null, bike: null, setup: {}, entries: [], ready: [], status: 'planned', createdAt: new Date(now).toISOString() };
  const link = komootLink(choice.link);
  return {
    ...base,
    ...(choice.list === 'empty' ? { entries: [], copiedFrom: null } : {}),
    route: { ...route, komoot: link },
    place: route.start ? { name: route.name ? t('Start of {name}', { name: route.name }) : t('Route start'), ...route.start } : null,
    hours: ridingHours(route, days, pace),
    ...(/^\d\d:\d\d$/.test(choice.start ?? '') ? { rideStart: { 0: choice.start } } : {}),
    fromKomoot: true,
  };
}
