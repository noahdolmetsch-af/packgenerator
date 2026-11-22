/**
 * «Kosten-Schätzung» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt E): what a replacement is likely to cost, taken
 * from the last price paid for that part on this bike (a replacement with a price, own or in a workshop visit).
 * No price list, no guessing: without a recorded price there is no estimate and the app says so.
 * Pure functions, tested in tests/estimate.test.js.
 */

/** The last price paid for a part: { chf, day, km } of its newest replacement with a price, or null. bike: withVisits view. */
export function lastPrice(bike, key) {
  const part = (bike?.parts ?? []).find((p) => p.key === key);
  const list = (part?.history ?? []).filter((h) => h.action === 'replace' && h.result !== 'needed' && typeof h.chf === 'number' && h.chf > 0 && h.date);
  if (!list.length) return null;
  const last = list.reduce((a, b) => (String(b.date).localeCompare(String(a.date)) >= 0 ? b : a));
  return { chf: last.chf, day: last.date, km: typeof last.km === 'number' ? last.km : null };
}

/**
 * The estimate for several parts at once: { total, items: [{ key, chf, day }], missing: [key] }.
 * A part twice in the list counts once. missing: parts with no recorded price.
 */
export function estimateFor(bike, keys = []) {
  const items = [];
  const missing = [];
  for (const key of [...new Set(keys.filter(Boolean))]) {
    const p = lastPrice(bike, key);
    if (p) items.push({ key, chf: p.chf, day: p.day });
    else missing.push(key);
  }
  return { total: Math.round(items.reduce((s, x) => s + x.chf, 0) * 100) / 100, items, missing };
}
