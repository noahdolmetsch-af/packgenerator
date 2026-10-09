/**
 * What the debriefs say across trips (v0.19.2, "Auswerten", Noah 5a 6a 7a):
 * - usage per item: how often taken, used, not used, broken, missing;
 * - one row per debriefed trip for the comparison chart, and the trend;
 * - dead weight: taken at least twice and never used;
 * - why a wishlist item is there and how much it would help.
 * Pure functions, easy to test.
 */
import { isInventory } from './gear.js';
import { t, nameOf } from './i18n.svelte.js';

const g = (item, qty = 1) => (item?.weightG == null ? 0 : item.weightG * (qty || item.qty || 1));
const norm = (s) => String(s ?? '').trim().toLowerCase();

/** Finished debriefs with their trips, oldest first. */
export function debriefedTrips(trips, debriefs) {
  const byId = Object.fromEntries(trips.map((t) => [t.id, t]));
  return debriefs
    .filter((d) => d.status === 'done' && byId[d.tripId])
    .map((d) => ({ d, t: byId[d.tripId] }))
    .sort((a, b) => (a.t.startDate ?? '').localeCompare(b.t.startDate ?? ''));
}

/**
 * Usage per item over all finished debriefs: { [itemId]: { taken, used, unused, broken, missing, trips: [title] } }.
 * An item on the trip counts as used unless the debrief says "not used" (broken counts as used).
 */
export function itemUsage(trips, debriefs) {
  const out = {};
  const row = (id) => (out[id] ??= { taken: 0, used: 0, unused: 0, broken: 0, missing: 0, trips: [] });
  for (const { d, t } of debriefedTrips(trips, debriefs)) {
    for (const id of new Set((t.entries ?? []).map((e) => e.itemId))) {
      const r = row(id);
      const state = d.items?.[id];
      r.taken++;
      r.trips.push(t.title);
      if (state === 'unused') r.unused++;
      else r.used++;
      if (state === 'broken') r.broken++;
    }
    for (const m of d.missing ?? []) if (m.itemId) row(m.itemId).missing++;
  }
  return out;
}

/**
 * One row per debriefed trip, oldest first, for the comparison (Noah 5a):
 * { id, title, date, days, km, packedG, unusedG, unusedN, missingN, brokenN }.
 * packedG: gear on the trip with a known weight (food and water left out, like the gear weight).
 */
export function tripRows(trips, debriefs, items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  return debriefedTrips(trips, debriefs).map(({ d, t }) => {
    const entries = (t.entries ?? []).filter((e) => byId[e.itemId] && isInventory(byId[e.itemId]) && !CONSUMABLE.includes(byId[e.itemId].category));
    const unused = entries.filter((e) => d.items?.[e.itemId] === 'unused');
    return {
      id: t.id,
      title: t.title,
      date: t.startDate,
      days: Number(t.days) || 1,
      km: typeof d.km === 'number' && d.km > 0 ? d.km : t.route?.km ?? null,
      packedG: entries.reduce((s, e) => s + g(byId[e.itemId], e.qty), 0),
      unusedG: unused.reduce((s, e) => s + g(byId[e.itemId], e.qty), 0),
      unusedN: unused.length,
      // v0.22.0 (AP04): unknown is not zero: how many items each sum leaves out.
      packedMissing: entries.filter((e) => byId[e.itemId].weightG == null).length,
      unusedMissing: unused.filter((e) => byId[e.itemId].weightG == null).length,
      missingN: (d.missing ?? []).length,
      brokenN: entries.filter((e) => d.items?.[e.itemId] === 'broken').length,
    };
  });
}
const CONSUMABLE = ['food'];

/**
 * The trend in one sentence (Noah 5a): the last trip against the one before, and against the
 * average of all earlier ones. null with fewer than 2 trips.
 */
export function trend(rows) {
  if (rows.length < 2) return null;
  const last = rows.at(-1);
  const before = rows.slice(0, -1);
  const avg = (k) => before.reduce((s, r) => s + r[k], 0) / before.length;
  return {
    last: last.title,
    packedDiffG: Math.round(last.packedG - avg('packedG')),
    unusedDiffG: Math.round(last.unusedG - avg('unusedG')),
    unusedShare: last.packedG ? Math.round((last.unusedG / last.packedG) * 100) : 0,
    n: rows.length,
  };
}

/**
 * Dead weight (Noah 6a): owned items taken on at least 2 debriefed trips and never used, heaviest
 * first; then "rarely used": used on at most a third of 3 or more trips.
 * Returns { dead: [{ item, u, g }], rare: [{ item, u, g }], deadG }.
 */
export function deadWeight(items, usage) {
  const rows = items
    .filter((i) => isInventory(i) && usage[i.id])
    .map((item) => ({ item, u: usage[item.id], g: g(item) }));
  const dead = rows.filter((r) => r.u.taken >= 2 && r.u.used === 0).sort((a, b) => b.g - a.g || a.item.name.localeCompare(b.item.name));
  const rare = rows.filter((r) => r.u.taken >= 3 && r.u.used > 0 && r.u.used / r.u.taken <= 1 / 3).sort((a, b) => b.g - a.g);
  return { dead, rare, deadG: dead.reduce((s, r) => s + r.g, 0) };
}

/**
 * Why a wishlist item is there and what it brings (Noah 7a). Reasons from the debriefs (missing,
 * broke), from Bike care, the price and the weight against the item it replaces.
 * Returns { reasons: [text], score } — a higher score comes first in the list.
 */
export function wishReason(item, items, trips, debriefs) {
  const reasons = [];
  let score = 0;
  const missedOn = debriefedTrips(trips, debriefs)
    .filter(({ d }) => (d.missing ?? []).some((m) => norm(m.name) === norm(item.name)))
    .map(({ t }) => t.title);
  if (missedOn.length) {
    reasons.push(t('Missing {n}× ({trips})', { n: missedOn.length, trips: missedOn.join(', ') }));
    score += 10 * missedOn.length;
  }
  if (/^Broke on /.test(item.note ?? '')) {
    reasons.push(item.note.replace(/ \(debrief\): replace\.$/, ''));
    score += 8;
  }
  // v0.40.0: also a chain put there by its wear (from: 'care'), whatever language the note is in.
  if (item.from === 'care' || /^From Bike care/.test(item.note ?? '')) {
    reasons.push(t('Needed on the bike'));
    score += 9;
  }
  const old = item.replaces ? items.find((i) => i.id === item.replaces) : null;
  if (old?.weightG != null && item.weightG != null && old.weightG > item.weightG) {
    reasons.push(t('{g} g lighter than {name}', { g: old.weightG - item.weightG, name: nameOf(old) }));
    score += Math.min(5, (old.weightG - item.weightG) / 100);
  }
  if (typeof item.priceChf === 'number') reasons.push(`CHF ${item.priceChf.toFixed(2)}`);
  if (item.ownership === 'to-buy') score += 3;
  return { reasons, score };
}
