/**
 * Paket B «Packen nach Bedürfnis» (Noah 24.10.2026, 996 Ideen «1b»): instead of picking things, you say
 * what you need — sleep warm, cook yourself, stay dry … — and the app fills each need from your own gear
 * (the building blocks it belongs to). Amounts follow days and people: shared things (tent, stove, tools)
 * once, personal things per person, food per day. Three variants with their trade-off in grams:
 *   light — the lightest thing of each kind; comfort — the heaviest (mostly the warmer or bigger one);
 *   easy — what you took most often on earlier trips (nothing new to try).
 * Pure, tested in tests/bedarf.test.js. Labels are English keys for t().
 */
import { isInventory } from '../gear.js';

export const NEEDS = [
  { key: 'sleepwarm', name: 'Sleep warm', sub: 'Sleeping bag, mat, warm layer for the evening', blocks: ['bivy', 'sleepwell', 'coldEvening'], share: false },
  { key: 'shelter', name: 'A roof over your head', sub: 'Tent or tarp', blocks: ['tent'], share: true },
  { key: 'cook', name: 'Cook yourself', sub: 'Stove, pot, fuel', blocks: ['cook', 'cookWarm'], share: true },
  { key: 'eat', name: 'Enough to eat', sub: 'Bars, gels, food for the day', blocks: ['food'], share: false, perDay: true },
  { key: 'dry', name: 'Stay dry', sub: 'Rain gear, dry bags', blocks: ['rain', 'drybag'], share: false },
  { key: 'power', name: 'Power every day', sub: 'Cables, charger, power bank', blocks: ['charge', 'chargeLong'], share: false },
  { key: 'fix', name: 'Fix it yourself', sub: 'Tube, pump, tools', blocks: ['repair'], share: true },
  { key: 'see', name: 'See and be seen', sub: 'Lights', blocks: ['lights'], share: false },
  { key: 'aid', name: 'First aid', sub: 'The first aid kit', blocks: ['firstaid', 'aidWinter'], share: true },
  { key: 'clean', name: 'Stay clean', sub: 'Toothbrush, soap, towel', blocks: ['hygiene', 'hygieneCare'], share: false },
];
export const VARIANTS = [
  { key: 'light', name: 'Light', sub: 'The lightest thing of each kind' },
  { key: 'comfort', name: 'Comfortable', sub: 'The bigger, mostly warmer thing of each kind' },
  { key: 'easy', name: 'Little effort', sub: 'What you took most often' },
];

/** Clothes you wash on the way: one for every two days. */
const WASHABLE = /\b(socke|socken|sock|socks|unterhose|underwear|boxer|trikot|jersey|shirt)\b/i;

/** Your own gear that fills a need: [item]. */
export function itemsFor(need, items) {
  return items.filter((i) => isInventory(i) && !i.archived && (i.sets ?? []).some((k) => need.blocks.includes(k)));
}

/** How often each item was on earlier trips: { [itemId]: n }. */
export function usedCount(trips = [], exceptTripId = null) {
  const n = {};
  for (const tr of trips) {
    if (!tr || tr.id === exceptTripId) continue;
    for (const id of new Set((tr.entries ?? []).map((e) => e.itemId))) n[id] = (n[id] ?? 0) + 1;
  }
  return n;
}

const kindOf = (i) => i.category || 'other';

/**
 * The things of one need in a variant: per kind (category) one thing. Kinds with one thing only take it.
 * → [item]
 */
export function pickVariant(list, variant, used = {}) {
  const byKind = new Map();
  for (const i of list) byKind.set(kindOf(i), [...(byKind.get(kindOf(i)) ?? []), i]);
  const out = [];
  for (const group of byKind.values()) {
    const w = (i) => (i.weightG == null ? null : i.weightG);
    let best = group[0];
    for (const i of group.slice(1)) {
      if (variant === 'light' && w(i) != null && (w(best) == null || w(i) < w(best))) best = i;
      else if (variant === 'comfort' && w(i) != null && (w(best) == null || w(i) > w(best))) best = i;
      else if (variant === 'easy' && (used[i.id] ?? 0) > (used[best.id] ?? 0)) best = i;
    }
    out.push(best);
  }
  return out;
}

/** The amount of one thing: per day (food), every two days (clothes you wash), per person or once (shared). */
export function amountOf(item, need, { days = 1, people = 1 } = {}) {
  const d = Math.max(1, Number(days) || 1);
  const p = Math.max(1, Number(people) || 1);
  if (need.share) return 1;
  if (need.perDay) return d * p;
  if (WASHABLE.test(`${item.name ?? ''} ${item.nameDe ?? ''}`)) return Math.ceil(d / 2) * p;
  return p;
}

/**
 * The plan for the chosen needs: per need its things with amounts, the grams, and the needs you have
 * nothing for yet. → { rows: [{ need, items: [{ item, qty }], g, unknown }], empty: [need], g }
 */
export function planNeeds(keys, items, { variant = 'light', days = 1, people = 1, used = {} } = {}) {
  const rows = [];
  const empty = [];
  let g = 0;
  for (const need of NEEDS.filter((n) => keys.includes(n.key))) {
    const all = itemsFor(need, items);
    if (!all.length) {
      empty.push(need);
      continue;
    }
    const picked = pickVariant(all, variant, used).map((item) => ({ item, qty: amountOf(item, need, { days, people }) }));
    let rg = 0;
    let unknown = 0;
    for (const x of picked) {
      if (x.item.weightG == null) unknown += 1;
      else rg += x.item.weightG * x.qty;
    }
    g += rg;
    rows.push({ need, items: picked, g: rg, unknown });
  }
  return { rows, empty, g };
}

/** The grams of every variant, to show the trade-off: { light, comfort, easy }. */
export function variantGrams(keys, items, opts = {}) {
  return Object.fromEntries(VARIANTS.map((v) => [v.key, planNeeds(keys, items, { ...opts, variant: v.key }).g]));
}

/**
 * The trip's entries after taking a plan: new things into their bag (slotOf), a thing already on the trip
 * gets the planned amount when that is more. → entries
 */
export function applyPlan(entries = [], plan, slotOf = () => 'body') {
  const out = entries.map((e) => ({ ...e }));
  for (const row of plan.rows) {
    for (const { item, qty } of row.items) {
      const e = out.find((x) => x.itemId === item.id);
      if (e) {
        if ((Number(e.qty) || 1) < qty) e.qty = qty;
      } else out.push({ itemId: item.id, slot: slotOf(item), qty, packed: false, src: 'set' });
    }
  }
  return out;
}
