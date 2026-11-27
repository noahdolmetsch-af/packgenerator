/**
 * «Wertliste» (Warteliste 7, Noah 22.11.2026 «1-5 a»): all your bikes and your gear with their price on one page, for the insurance.
 * Velos with frame number, purchase day and price; Material with price. Everything is chosen at first and can be un-chosen and filtered;
 * a missing price or day is typed in the row (it is saved in the gear or the bike's warranty sheet). A price is the price paid, no
 * depreciation: the PDF says so. Pure; WertListe.svelte draws it and pdf.js writes the PDF. Tested in tests/wertliste.test.js.
 */
import { isInventory, CONSUMABLE_CATEGORIES } from '../gear.js';

/** «Only above CHF 50» (the filter button). */
export const SMALL_CHF = 50;
const day = (v) => (v ? String(v).slice(0, 10) : null);
const price = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null);

/** The rows: velos first (by name), then gear (by name). A row: { key, kind: 'bike' | 'gear', id, name, ref (frame number), bought, price, receipt }. */
export function rowsOf({ bikes = [], items = [], visits = [] } = {}) {
  const bikeRows = bikes
    .filter((b) => b && !b.archivedAt && !b.sold)
    .map((b) => ({
      key: `bike:${b.id}`,
      kind: 'bike',
      id: b.id,
      name: String(b.name ?? ''),
      ref: String(b.sheets?.theft?.frameNo ?? '').trim() || null,
      bought: day(b.bought),
      price: price(b.sheets?.warranty?.price),
      receipt: !!b.bought && visits.some((v) => v.bikeId === b.id && day(v.date) === day(b.bought)),
    }));
  const gearRows = items
    .filter((i) => i && isInventory(i) && !CONSUMABLE_CATEGORIES.includes(i.category))
    .map((i) => ({ key: `gear:${i.id}`, kind: 'gear', id: i.id, name: String(i.name ?? ''), ref: null, bought: day(i.boughtAt), price: price(i.priceChf), receipt: false, group: i.category ?? null, qty: Number(i.qty) || 1 }));
  const byName = (a, b) => a.name.localeCompare(b.name);
  return [...bikeRows.sort(byName), ...gearRows.sort(byName)];
}

/**
 * Which rows show: opts { bikes, gear, big (only above SMALL_CHF; a row without a price stays), noPrice (only rows without a price) }.
 * A filter that is off shows everything of its kind.
 */
export function filterRows(rows, { bikes = true, gear = true, big = false, noPrice = false } = {}) {
  return rows.filter((r) => (r.kind === 'bike' ? bikes : gear) && (!big || r.price == null || r.price * (r.qty || 1) > SMALL_CHF) && (!noPrice || r.price == null));
}

/** The line total of a row: price × pieces (a pair of bags = 2), or null. */
export const lineOf = (r) => (r.price == null ? null : Math.round(r.price * (r.qty || 1) * 100) / 100);

/** The totals of the chosen rows: { n, bikes, gear, sum, missing (rows without a price), noDay (rows without a purchase day), receipts }. */
export function totalsOf(rows, chosen) {
  const on = rows.filter((r) => chosen.has(r.key));
  return {
    n: on.length,
    bikes: on.filter((r) => r.kind === 'bike').length,
    gear: on.filter((r) => r.kind === 'gear').length,
    sum: Math.round(on.reduce((s, r) => s + (lineOf(r) ?? 0), 0) * 100) / 100,
    missing: on.filter((r) => r.price == null).length,
    noDay: on.filter((r) => !r.bought).length,
    receipts: on.filter((r) => r.receipt).length,
  };
}

/** A price typed in a row: «1’250,50» → 1250.5; null for nothing or nonsense (nothing is saved then). */
export function priceOf(text) {
  const n = Number(String(text ?? '').trim().replace(/['’\s]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 1e7 ? Math.round(n * 100) / 100 : null;
}

/** The patch to save for a typed price or purchase day, for one row: { table: 'items' | 'bikes', id, patch } or null. */
export function savePlan(row, field, value) {
  if (field === 'price') {
    const p = priceOf(value);
    if (p == null) return null;
    return row.kind === 'bike' ? { table: 'bikes', id: row.id, nested: { path: ['sheets', 'warranty', 'price'], value: p } } : { table: 'items', id: row.id, patch: { priceChf: p } };
  }
  if (field === 'bought') {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? '')) ? String(value) : null;
    if (!d) return null;
    return row.kind === 'bike' ? { table: 'bikes', id: row.id, patch: { bought: d } } : { table: 'items', id: row.id, patch: { boughtAt: d } };
  }
  return null;
}

/** Applies a save plan to a record (a copy), for the bike's nested price. */
export function applyPlan(record, plan) {
  if (!plan) return record;
  if (plan.patch) return { ...record, ...plan.patch };
  const [a, b, c] = plan.nested.path;
  return { ...record, [a]: { ...(record[a] ?? {}), [b]: { ...(record[a]?.[b] ?? {}), [c]: plan.nested.value } } };
}
