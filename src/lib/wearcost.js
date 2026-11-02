/**
 * «Was kostet das nächste Jahr?» (idea C1 of «App denkt mit», Noah 02.11.2026 «3b»): from the wear rows of a
 * bike (wear.js wearRows) the parts that run out in the next months, what the last change of each cost
 * (a priced «replace» job in the part's history), the sum, and the names for the shopping list.
 * Pure functions, tested in tests/wearcost.test.js. Nothing is stored; a price is never made up.
 */
import { localDay } from './localday.js';

/** The months the card can look ahead; the first one is the start value. */
export const HORIZONS = [12, 6, 3];

const DAY = 864e5;
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** What the last priced change of this part cost (CHF), or null. */
export function lastPrice(part) {
  const priced = (part?.history ?? []).filter((h) => h.action === 'replace' && typeof h.chf === 'number' && h.chf > 0 && h.date);
  return priced.length ? priced.sort((a, b) => a.date.localeCompare(b.date)).at(-1).chf : null;
}

/** The text for the shopping list: «Chain» or «Chain · Brand X» (what is mounted now). */
export const shopText = (row) => (row.model ? `${row.name} · ${row.model}` : row.name);

/**
 * The parts due within `months` months (or already due): oldest day first.
 * rows: wearRows(bike); bike: the same bike (for the price history).
 * → { items: [{ key, name, model, state, due, chf, shop }], total, unpriced }
 * due: the day at the pace of the last weeks, or null ("soon"/"now" without a pace).
 */
export function wearCosts(rows = [], bike = null, { months = 12, today = localDay() } = {}) {
  const until = addDays(today, Math.round(months * 30.4));
  const items = [];
  for (const r of rows) {
    const day = r.state === 'due' ? today : r.due;
    const inside = r.state === 'due' || (day != null && day <= until) || (r.state === 'soon' && day == null);
    if (!inside) continue;
    const part = (bike?.parts ?? []).find((p) => p.key === r.key);
    items.push({ key: r.key, name: r.name, model: r.model || '', state: r.state, due: day, chf: lastPrice(part), shop: shopText(r) });
  }
  items.sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.name.localeCompare(b.name));
  const total = items.reduce((s, x) => s + (x.chf ?? 0), 0);
  return { items, total: Math.round(total), unpriced: items.filter((x) => x.chf == null).length };
}
