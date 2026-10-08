/**
 * v0.27.0 (Noah 1a, AP23 PF02/PF04/PF05/PF10): why a row is on the packing list, in one short line.
 *
 * Pack shows it under the item name, small and muted. It only speaks for what the app put there:
 *   - a layer row (layers.js layerSuggest): "Below 6 °C", "Rain", "Daily ride"
 *   - an amount by the hour: "1 per 3 h · 2 per day × 2 days = 4", and when the maximum (or a hand-set
 *     amount) differs from the need: "Need 6, you carry 3 (maximum)"
 *   - an entry that a building block or the overnight stay brought (src 'set' / 'context'): "from Sleep, Light"
 *   - v0.28.0 (AP25): a first aid item the night brought: "First aid from 1 night"
 * An item Noah added himself without any rule gets no line (no clutter).
 * Pure functions (no database), tested in tests/reasons.test.js.
 */
import { layerSuggest } from './layers.js';
import { contextSets } from './context.js';
import { allSets } from './sets.js';
import { t, num } from './i18n.svelte.js';

/** Riding hours per day and days of a trip. */
const span = (trip) => ({ hours: Number(trip?.hours) || 0, days: Math.max(1, Number(trip?.days) || 1) });

/**
 * The amount rule of one item on a trip, or null when there is nothing to explain (no amount by
 * the hour, no hours, or 1 piece on a one-day trip).
 * → { need (uncapped, whole trip), qty (on the list), capped (need above maxQty), text }
 */
export function amountReason(item, trip, qty = 1) {
  const { hours, days } = span(trip);
  if (!item?.perHours || !hours) return null;
  const need = Math.max(1, Math.ceil((hours * days) / item.perHours));
  if (need <= 1 && days <= 1 && qty <= 1) return null;
  const capped = !!item.maxQty && need > item.maxQty;
  const same = qty === need;
  let calc;
  if (days <= 1) calc = `${num(hours)} h`;
  else {
    const perDay = Math.max(1, Math.ceil(hours / item.perHours));
    calc = perDay * days === need ? t('{n} per day × {days} days', { n: perDay, days }) : t('{h} h per day × {days} days', { h: num(hours), days });
  }
  const parts = [t('1 per {n} h', { n: num(item.perHours) }), same ? `${calc} = ${need}` : calc];
  if (!same) parts.push(capped && qty >= item.maxQty ? t('Need {need}, you carry {qty} (maximum)', { need, qty }) : t('Need {need}, you carry {qty}', { need, qty }));
  return { need, qty, capped, text: parts.join(' · ') };
}

/** A block's label without the "Night: " prefix (as on the "+ block" chips). */
const blockLabel = (sets, key) => {
  const s = sets.find((x) => x.key === key);
  if (!s) return key;
  return s.builtIn ? s.name.replace(/^(Night|Nacht): /, '') : s.name;
};

/**
 * Per item on the trip: { line, amount, note, slot, alts }.
 *   line    the reason text ('' when there is none)
 *   amount  amountReason(…) or null
 *   note    the item's note when an amount rule is at work (the app does not read free text, so
 *           Noah sees both side by side), else ''
 *   slot    the layer slot the entry stands for (layerPick key), alts the other items it can be swapped for
 * setsValue: the settings record "sets" (own blocks and renamed built-in blocks).
 */
export function rowReasons(trip, items, setsValue = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  // Skipped rows ("none") are not why anything is here; picked alternatives are.
  const rows = layerSuggest({ ...trip, layerPick: Object.fromEntries(Object.entries(trip?.layerPick ?? {}).filter(([, v]) => v && v !== 'none')) }, items);
  const rowOf = new Map(rows.map((r) => [r.id, r]));
  const sets = allSets(setsValue);
  const night = contextSets(trip);
  const out = {};
  for (const e of trip?.entries ?? []) {
    const item = byId.get(e.itemId);
    if (!item) continue;
    const parts = [];
    const row = rowOf.get(e.itemId);
    // The amount branch of layerSuggest only says "1 per n h": amountReason says it better.
    const amountOnly = item.perHours && !item.ride && typeof item.coldBelow !== 'number' && !item.rain;
    if (row && !amountOnly) parts.push(row.why);
    const amount = amountReason(item, trip, e.qty || 1);
    if (amount) parts.push(amount.text);
    if (e.src === 'context' || e.src === 'set') {
      const keys = (item.sets ?? []).filter((k) => (e.src === 'context' ? night.includes(k) : true));
      // v0.28.0 (AP25): first aid comes with the night, and the line says so.
      const aid = e.src === 'context' && keys.includes('firstaid');
      const rest = aid ? keys.filter((k) => k !== 'firstaid') : keys;
      if (aid) parts.push(t('First aid from 1 night'));
      if (rest.length) parts.push(t('from {blocks}', { blocks: rest.map((k) => blockLabel(sets, k)).join(', ') }));
    }
    out[e.itemId] = {
      line: parts.join(' · '),
      amount,
      note: amount && item.note ? item.note : '',
      slot: row?.slot ?? null,
      alts: row ? row.alts.filter((id) => id !== e.itemId && byId.has(id)) : [],
    };
  }
  return out;
}

/**
 * Rows the review cannot leave out although nothing is left to choose (PF04): an amount by the hour
 * that is capped by the maximum, or that has a material note next to its rule. → [{ id, amount, note }]
 */
export function amountChecks(trip, items, skip = new Set()) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return (trip?.entries ?? [])
    .filter((e) => !skip.has(e.itemId))
    .map((e) => ({ e, item: byId.get(e.itemId) }))
    .map(({ e, item }) => ({ id: e.itemId, item, amount: amountReason(item, trip, e.qty || 1) }))
    .filter((r) => r.amount && (r.amount.capped || r.item.note))
    .map((r) => ({ id: r.id, amount: r.amount, note: r.item.note ?? '' }));
}

/**
 * v0.27.0 (Noah 1a, PF03): what a change of the trip did to the list, for the line next to Undo.
 * → { amounts: [{ id, from, to }], added: [id], removed: [id] }
 */
export function listDiff(before = [], after = []) {
  const was = new Map(before.map((e) => [e.itemId, e]));
  const now = new Map(after.map((e) => [e.itemId, e]));
  const amounts = [];
  for (const [id, e] of now) {
    const old = was.get(id);
    if (old && (old.qty || 1) !== (e.qty || 1)) amounts.push({ id, from: old.qty || 1, to: e.qty || 1 });
  }
  return { amounts, added: [...now.keys()].filter((id) => !was.has(id)), removed: [...was.keys()].filter((id) => !now.has(id)) };
}
