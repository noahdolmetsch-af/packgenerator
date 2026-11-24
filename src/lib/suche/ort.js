/**
 * «Suche am Ort» (Warteliste 1, V2; Noah 22.11.2026 «2a», «3b»): its own search field on top of Ich, Touren and Auswerten.
 * No sentence is taken apart (3b): a word field, and on Touren four filter buttons (year, bike, kind, distance) with the sum.
 * Pure rules; SearchHere.svelte reads the tables (loadMore of mehrload.js, trips) and draws.
 */
import { FEATURES, findFeatures } from '../features.js';
import { fold } from '../search.js';
import { placeOf, pageOf } from '../nav.js';

/** The pages that have the field: the exact address of the page, no sub-page. */
const OF = { '#/me': 'me', '#/trips': 'trips', '#/auswerten': 'auswerten' };
export const hereKind = (hash = '') => OF[String(hash).split('?')[0].replace(/\/$/, '')] ?? null;

/** The place of a function (by its address). */
const placeOfFeature = (f) => placeOf(pageOf(String(f.href ?? '').split('?')[0]), f.href ?? '');
const IN_PLACE = { me: 'me', auswerten: 'analysis' };

/** The functions that belong to Ich or to Auswerten (their number is the «Searches n functions»). */
export const featuresOf = (kind) => FEATURES.filter((f) => f.href && !f.run && placeOfFeature(f) === IN_PLACE[kind]);

/** The functions of the place that fit the words: rows [{ id (feature id), title, sub }]. */
export function placeRows(q, kind, tr = (s) => s) {
  const own = new Set(featuresOf(kind).map((f) => f.id));
  return findFeatures(q, tr).filter((r) => own.has(r.featureId));
}

/** A test for the words: every word of the question is in one of the fields. */
export function hitOf(q) {
  const words = fold(q).trim().split(/\s+/).filter(Boolean);
  return (...fields) => {
    if (!words.length) return true;
    const hay = fold(fields.filter((x) => x != null).join(' '));
    return words.every((w) => hay.includes(w));
  };
}

/** The distance filter: key → [from, to) in km. */
export const DIST = { short: [0, 30], mid: [30, 80], long: [80, Infinity] };

/** The tours and rides as one list of rows { id, title, day, year, km, bike, art, href, tripId }, newest first. */
export function tripRows({ rides = [], trips = [] } = {}) {
  const out = [];
  for (const r of rides) {
    const art = r.src === 'Strava' ? 'strava' : r.src === 'file' ? 'file' : 'hand';
    out.push({ id: `r-${r.id}`, title: r.name || '', day: r.day ?? '', year: String(r.day ?? '').slice(0, 4), km: Number(r.km) > 0 ? Number(r.km) : null, bike: r.bike ?? '', art, href: '#/trips/rides' });
  }
  for (const tr of trips) {
    out.push({ id: `t-${tr.id}`, title: tr.title ?? '', day: tr.startDate ?? '', year: String(tr.startDate ?? '').slice(0, 4), km: null, bike: tr.bike ?? '', art: 'trip', href: '#/pack', tripId: tr.id });
  }
  return out.sort((a, b) => String(b.day).localeCompare(String(a.day)));
}

/** The rows that fit the words and the filters { year, bike, art, dist } (a filter left out or null does not narrow). */
export function filterRows(rows, q = '', f = {}) {
  const hit = hitOf(q);
  return rows.filter((r) => hit(r.title, r.bike, r.day) && (!f.year || r.year === f.year) && (!f.bike || r.bike === f.bike) && (!f.art || r.art === f.art) && (!f.dist || (r.km != null && r.km >= DIST[f.dist][0] && r.km < DIST[f.dist][1])));
}

/** The sum under the field: how many rows and how many kilometres (rows without a distance add nothing). */
export function sumOf(rows) {
  return { n: rows.length, km: Math.round(rows.reduce((s, r) => s + (r.km ?? 0), 0)) };
}

/** The choices of a filter, from the rows: years (newest first), bikes and kinds in the order they come. */
export function choicesOf(rows) {
  const uniq = (xs) => [...new Set(xs.filter(Boolean))];
  return { year: uniq(rows.map((r) => r.year)).sort().reverse(), bike: uniq(rows.map((r) => r.bike)).sort(), art: uniq(rows.map((r) => r.art)) };
}
