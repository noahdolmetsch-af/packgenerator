/**
 * Jump targets of «Analyse» for other pages (Noah 27.10.2026, tap on a diagram anywhere in the app):
 * valueHref(key, range) opens the page of one value (M6), on wish with its period; dayHref(day) opens the
 * sheet «Ein Tag, alle Werte» (D6) on Analyse. Plain links, so every page can use them (an <a href> or
 * location.hash = …). The readers below are used by Analyse itself.
 */
import { RANGES } from './detail.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const BASE = '#/auswerten/analyse';

/** The page of one value; range: a key of RANGES ('d', 'w', 'm', 'm3', 'y', 'all'), left out = as last time. */
export function valueHref(key, range = null) {
  const q = range && RANGES.some((r) => r.key === range) ? `?zeit=${range}` : '';
  return `${BASE}/${encodeURIComponent(key)}${q}`;
}

/** The sheet of one day ('YYYY-MM-DD') with all its values. */
export const dayHref = (day) => (DAY.test(day ?? '') ? `${BASE}?tag=${day}` : BASE);

const param = (hash, name) => {
  const q = (hash ?? '').split('?')[1];
  return q ? new URLSearchParams(q).get(name) : null;
};

/** The part «Velos» of Analyse (km per bike), opened from a bike's number (UI-Prüfung 07.11.2026, V1); with a bike id only that bike,
 *  and then for the whole year (a bike's km is a lifetime number; 30 days would show an empty page). */
export const velosHref = (bikeId = null) => `${BASE}?tab=velos${bikeId ? `&bike=${encodeURIComponent(bikeId)}&zeit=y` : ''}`;

/** The bike asked for in the hash (velosHref), or null. */
export const bikeOfHash = (hash) => param(hash, 'bike') || null;

/** The part (tab) asked for in the hash, if it is one of `tabs`, else null. */
export const tabOfHash = (hash, tabs = []) => {
  const x = param(hash, 'tab');
  return x && tabs.includes(x) ? x : null;
};

/** The day asked for in the hash, or null. */
export const dayOfHash = (hash) => {
  const d = param(hash, 'tag');
  return d && DAY.test(d) ? d : null;
};

/** The period asked for in the hash (a key of RANGES), or null. */
export const rangeOfHash = (hash) => {
  const r = param(hash, 'zeit');
  return r && RANGES.some((x) => x.key === r) ? r : null;
};
