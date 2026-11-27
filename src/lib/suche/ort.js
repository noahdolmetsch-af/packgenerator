/**
 * «Suche am Ort» (Warteliste 1, V2; Noah 22.11.2026 «2a», «3b»): its own search field on top of Ich and Auswerten.
 * No sentence is taken apart (3b): a word field that finds the functions of the place. Touren has its own bar since 26.11.2026
 * (a field and four buttons that filter the list itself, `src/lib/touren/tourbar.js`).
 * Pure rules; SearchHere.svelte draws.
 */
import { FEATURES, findFeatures } from '../features.js';
import { placeOf, pageOf } from '../nav.js';

/** The pages that have the field: the exact address of the page, no sub-page. */
const OF = { '#/me': 'me', '#/auswerten': 'auswerten' };
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
