/**
 * «Dein Vorschlag» (Warteliste 4, Baustein 1; Noah 22.11.2026 «1b», «5a»): the page `#/pack/vorschlag` shows a trip's list as an
 * offer to look at: pieces and weight, step by step, what was left out, what is missing, and «Like last time?» with a comparison.
 * Nothing new is stored and nothing is guessed by an AI: everything is computed from the trip, your gear and your earlier trips.
 * Pure; PackVorschlag.svelte draws it. Tested in tests/pack-vorschlag.test.js.
 */
import { orderedSteps, stepOfCategory } from './schritte.js';

const byIdOf = (items) => new Map(items.map((i) => [i.id, i]));
const qtyOf = (e) => Number(e?.qty) || 1;

/**
 * The offer: { n (pieces), g (grams of the pieces with a weight), unknown (pieces without a weight), steps }, each step
 * { key, name, n, g, ids (the first three item ids, heaviest first) } in the person's order; a step with nothing in it is left out.
 */
export function offerOf(trip, items = [], order = []) {
  const byId = byIdOf(items);
  const entries = (trip?.entries ?? []).filter((e) => byId.has(e.itemId));
  const steps = orderedSteps(order)
    .map((s) => {
      const mine = entries.filter((e) => stepOfCategory(byId.get(e.itemId).category) === s.key);
      const g = mine.reduce((a, e) => a + (byId.get(e.itemId).weightG ?? 0) * qtyOf(e), 0);
      const heavy = [...mine].sort((a, b) => (byId.get(b.itemId).weightG ?? 0) - (byId.get(a.itemId).weightG ?? 0) || a.itemId.localeCompare(b.itemId));
      return { key: s.key, name: s.name, n: mine.length, g, ids: heavy.slice(0, 3).map((e) => e.itemId) };
    })
    .filter((s) => s.n);
  return {
    n: entries.length,
    g: steps.reduce((a, s) => a + s.g, 0),
    unknown: entries.filter((e) => byId.get(e.itemId).weightG == null).length,
    steps,
  };
}

/** What was left out of the list and is still in your gear, newest first, at most n: [{ item, at }]. */
export function leftOutRows(trip, items = [], n = 6) {
  const byId = byIdOf(items);
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const seen = new Set();
  const out = [];
  for (const x of [...(Array.isArray(trip?.leftOut) ? trip.leftOut : [])].reverse()) {
    const item = byId.get(x?.itemId);
    if (!item || on.has(item.id) || seen.has(item.id) || item.ownership === 'gone') continue;
    seen.add(item.id);
    out.push({ item, at: x.at ?? null });
  }
  return out.slice(0, n);
}

/**
 * The gaps the onion check found (onionCheck of wardrobe.js, passed in): [{ key, name, fix (an item of yours that would close it, or null), rain }].
 * Only rows that are not ok.
 */
export function gapRows(check) {
  return (check?.rows ?? []).filter((r) => !r.ok).map((r) => ({ key: r.key, name: r.name, fix: r.fix ?? null, rain: !!r.rain }));
}

const idSet = (trip) => new Set((trip?.entries ?? []).map((e) => e.itemId).filter(Boolean));

/**
 * «Like last time?»: the earlier trip whose list is most like this one: same area, not this trip, not a test trip, started before this
 * one (or without a start day), at least 30 % of the pieces the same (shared ÷ all). → { trip, share (0–100) } or null. Ties: the newer one.
 */
export function likeLast(trip, trips = []) {
  const mine = idSet(trip);
  if (!trip || !mine.size) return null;
  let best = null;
  for (const o of trips) {
    if (!o || o.id === trip.id || o.testTrip === true || o.idea) continue;
    if ((o.domain ?? 'bikepacking') !== (trip.domain ?? 'bikepacking')) continue;
    if (o.startDate && trip.startDate && o.startDate >= trip.startDate) continue;
    const theirs = idSet(o);
    if (!theirs.size) continue;
    const shared = [...mine].filter((id) => theirs.has(id)).length;
    const share = shared / (mine.size + theirs.size - shared);
    if (share < 0.3) continue;
    if (!best || share > best.share + 1e-9 || (Math.abs(share - best.share) < 1e-9 && String(o.startDate ?? '') > String(best.trip.startDate ?? ''))) best = { trip: o, share };
  }
  return best ? { trip: best.trip, share: Math.round(best.share * 100) } : null;
}

/** The comparison: { now: items only on this list, before: items only on the other, same: number of pieces on both }, each sorted by name. */
export function compareLists(trip, other, items = []) {
  const byId = byIdOf(items);
  const a = idSet(trip);
  const b = idSet(other);
  const pick = (ids) => [...ids].map((id) => byId.get(id)).filter(Boolean).sort((x, y) => x.name.localeCompare(y.name));
  return { now: pick([...a].filter((id) => !b.has(id))), before: pick([...b].filter((id) => !a.has(id))), same: [...a].filter((id) => b.has(id)).length };
}

/** The trip the page is about: the one open in Pack (its id), else the nearest one that starts today or later. */
export function tripForOffer(trips = [], currentId = null, today = '') {
  const own = trips.find((t) => t.id === currentId);
  if (own) return own;
  return trips.filter((t) => t.startDate && t.startDate >= today && !t.idea && !t.skipped && !t.finished && t.testTrip !== true).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}
