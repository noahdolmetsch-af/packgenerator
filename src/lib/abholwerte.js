/**
 * «Werte messen» Teil 1 (Noah 15.10.2026, W1–W3 «freigeben», answers «1a 2b 3a 4a 5a»): what the
 * Pick-up check and the replaced parts tell the other sheets.
 *
 * - W1: a value saved in the Pick-up check is «checked at the pick-up» on the Bike pass, with the day.
 * - W2: the next Workshop order lists those values as «As it should be again».
 * - W3 (1a): a replaced part shows on the Theft sheet («Different from the factory»), on the Bike pass
 *   («new since», with the km of the one before), under Warranty & receipts (2 years from the day) and
 *   in the Repair kit (a new chain: does the quick link still fit?). The Service plan and the part's
 *   history had it before.
 *
 * Nothing new is stored for W3: everything comes from the parts' histories (with the workshop visits,
 * workshop.js withVisits), so a change in Care shows everywhere at once. Pure, tested in
 * tests/abholwerte.test.js.
 */
import { PART } from './care.js';
import { FIT_KEY, fitValue } from './bikespecs.js';
import { sheetsOf, withUnit, KEEP_DE } from './sheets.js';
import { t } from './i18n.svelte.js';

/* ---------- W1 / W2: the values of the last Pick-up check ---------- */

/**
 * The values saved in the bike's Pick-up check: { date, keys } (keys: the fit keys, e.g. 'seatHeight').
 * date: the day a value was saved there (pickup.checked), else the day it was taken into care; null
 * without a check or without a saved value.
 */
export function pickupChecked(bike) {
  const p = sheetsOf(bike).pickup;
  const keys = Object.entries(p?.ticks ?? {})
    .filter(([id, on]) => on && id.startsWith('val:') && FIT_KEY[id.slice(4)])
    .map(([id]) => id.slice(4));
  const date = p?.checked ?? p?.applied ?? null;
  return { date: keys.length ? date : null, keys: date ? keys : [] };
}

/**
 * W2: the values of the last Pick-up check, as they are now: [{ key, label, de, value }] (de: the name
 * in German for the text to the bike shop). Empty without a check; a value cleared since is left out.
 */
export function againValues(bike) {
  const { keys } = pickupChecked(bike);
  return keys
    .map((k) => ({ key: k, label: t(FIT_KEY[k].name), de: KEEP_DE[k] ?? t(FIT_KEY[k].name), value: withUnit(fitValue(bike, k), FIT_KEY[k].unit) }))
    .filter((r) => r.value != null);
}

/* ---------- W3: the replaced parts ---------- */

/**
 * Every replacement of a part since the purchase, newest first: [{ key, name, date, km, before, by }].
 * bike: the view with the workshop visits (withVisits). before: the km the part before it rode (from
 * the replacement before, or from 0 on a bike with a purchase date), null when not known.
 */
export function replacements(bike) {
  const bought = bike?.bought ?? null;
  const out = [];
  for (const p of bike?.parts ?? []) {
    const reps = (p.history ?? []).filter((h) => h.action === 'replace' && h.date && (!bought || h.date > bought));
    reps.forEach((h, n) => {
      const prev = reps[n - 1] ?? null;
      const from = prev ? prev.km : bought ? 0 : null;
      const before = typeof h.km === 'number' && typeof from === 'number' && h.km >= from ? h.km - from : null;
      out.push({ key: p.key, name: PART[p.key] ? t(PART[p.key].name) : p.key, date: h.date, km: typeof h.km === 'number' ? h.km : null, before, by: h.by ?? null });
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
}

/** The last replacement of one part, or null. */
export const lastReplacement = (bike, key) => replacements(bike).find((r) => r.key === key) ?? null;

/** W3 Theft sheet: one line per replaced part (its last time), «Chain replaced, 14.10.2026» (at most max, newest first). */
export function changeLines(bike, { max = 8, dateOf = (d) => d } = {}) {
  const seen = new Set();
  return replacements(bike)
    .filter((r) => !seen.has(r.key) && seen.add(r.key))
    .slice(0, max)
    .map((r) => t('{part} replaced, {date}', { part: r.name, date: dateOf(r.date) }));
}

/** The days from a to b (ISO days). */
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** W3 Repair kit: the chain was replaced in the last 60 days → its day, else null. */
export function newChain(bike, today) {
  const r = lastReplacement(bike, 'chain');
  return r && days(r.date, today) >= 0 && days(r.date, today) <= 60 ? r.date : null;
}
