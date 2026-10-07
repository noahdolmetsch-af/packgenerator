/** Draft-only decisions. No writes occur until the caller accepts the returned patch. */
import { layerSuggest, layerDone, applyLayers } from './layers.js';
import { slotFor } from './trips.js';
import { CATEGORIES } from './gear.js';

export function reviewRows(trip, items, choices = {}) {
  // Include previously skipped rows so the user can reconsider them.
  const rules = layerSuggest({ ...trip, layerPick: Object.fromEntries(Object.entries(trip.layerPick ?? {}).filter(([, v]) => v !== 'none')) }, items);
  return rules.filter(r => !layerDone(r, trip) || trip.layerPick?.[r.slot] === 'none').map(r => {
    const choice = choices[r.slot] ?? {};
    const id = choice.id === r.slot || r.alts.includes(choice.id) ? choice.id : r.id;
    const it = items.find(i => i.id === id);
    const rawQty = Number(choice.qty ?? r.qty);
    const qty = Math.max(1, Math.min(20, it?.maxQty || 20, Number.isFinite(rawQty) ? Math.round(rawQty) : r.qty));
    return { ...r, id, qty, replaces: r.place === 'wear' ? it?.replaces ?? null : null,
      selected: choice.selected ?? (trip.layerPick?.[r.slot] !== 'none' && !r.optional && (!r.alts.length || !!trip.layerPick?.[r.slot])) };
  });
}

export function acceptReview(trip, items, choices = {}) {
  const rows = reviewRows(trip, items, choices);
  const selected = rows.filter(r => r.selected);
  let entries = applyLayers(trip.entries, selected, id => slotFor(items.find(i => i.id === id)?.defaultBag, trip.setup));
  entries = entries.map(e => {
    const row = selected.find(r => r.id === e.itemId);
    if (!row) return e;
    const old = trip.entries.find(x => x.itemId === e.itemId);
    return { ...e, qty: row.qty, packed: old && old.slot === e.slot && (old.qty || 1) === row.qty ? !!old.packed : false };
  });
  return { entries, layerPick: { ...(trip.layerPick ?? {}), ...Object.fromEntries(rows.map(r => [r.slot, r.selected ? (r.id === r.slot ? null : r.id) : 'none'])) } };
}

export function planningGroups(stats, items, mode = 'bags') {
  if (mode === 'bags') return stats.zones;
  const byId = Object.fromEntries(items.map(i => [i.id, i]));
  const entries = stats.zones.flatMap(z => z.entries);
  return [...CATEGORIES, { key: 'other', name: 'Other' }].map(c => ({
    key: c.key, zone: { name: c.name },
    entries: entries.filter(e => (CATEGORIES.some(c => c.key === byId[e.itemId]?.category) ? byId[e.itemId].category : 'other') === c.key),
  })).filter(g => g.entries.length);
}
