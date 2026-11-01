/**
 * «Heute als Begleiter» PR 5 (Noah 28.10.2026 «1a 2a 3a»): the card «Discover» on Today. At most one function a day that
 * you never opened and that fits the moment you are in. «Later» brings it back tomorrow, «Not for me» never again (with
 * Undo, the same list as «What the app can do»). Pure; the tile (DiscoverTile.svelte) reads the data. Tested in tests/discover.test.js.
 */
import { FEATURES, featureHref } from '../features.js';
import { momentOfFeature } from '../moment.js';

export const DISCOVER_KEY = 'home.discover';

/** The stored record: { off: boolean, later: { [feature id]: 'YYYY-MM-DD' (the day it was put off) } }. */
export function discoverOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const later = {};
  for (const [id, day] of Object.entries(v.later && typeof v.later === 'object' ? v.later : {})) if (id && typeof day === 'string') later[id] = day;
  return { off: v.off === true, later };
}
export const putOff = (rec, id, day) => ({ ...rec, later: { ...rec.later, [id]: day } });
export const bringBack = (rec, id) => ({ ...rec, later: Object.fromEntries(Object.entries(rec.later).filter(([k]) => k !== id)) });

/** A small number from a text, so a day picks the same function all day (no random). */
const hash = (s) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * The function for today: { feature, n, total } or null. Candidates: fits the moment, never used, not marked «Not for
 * me», not put off today. The pick is stable for the day; «Later» (put off today) moves on to the next candidate
 * tomorrow, so the same one is not shown twice in a row.
 */
export function pickDiscover({ moment, today, used = new Set(), notForMe = {}, rec = discoverOf(null) } = {}) {
  if (rec.off) return null;
  const all = FEATURES.filter((f) => momentOfFeature(f.id) === moment && !used.has(f.id) && !notForMe[f.id]);
  const open = all.filter((f) => !(rec.later[f.id] && rec.later[f.id] >= today));
  if (!open.length) return null;
  const f = open[hash(`${today}|${moment}`) % open.length];
  return { feature: f, n: open.indexOf(f) + 1, total: open.length, href: featureHref(f) };
}
