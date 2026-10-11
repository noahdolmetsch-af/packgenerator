/**
 * v0.83.0 «Ausstattung» (Noah 11.10.2026, A1–A5 a, Canyon «Alle Komponenten» as the model):
 * every part of one bike in groups (frame set, drivetrain, brakes, wheels, cockpit, accessories),
 * one row per part with its category, name, details, weight and price. Parts without a name fold
 * into one line per group (A2a); each group sums its weight and price, the bike its weight per area
 * and its most expensive parts (A3a, A4a). Pure functions, easy to test.
 */
import { PART, AREAS, ensureParts, areaOf, partName, attrsOf } from './care.js';

const filled = (v) => v != null && String(v).trim() !== '';
const isSpecPart = (p) => !!PART[p.key]?.spec || p.key.startsWith('own-');

/** The details line of a part: its attributes with units, the material, the notes. */
export function partDetails(p) {
  const out = [];
  for (const a of attrsOf(p.key)) {
    const v = p.attrs?.[a.key];
    if (filled(v)) out.push(a.unit && typeof v === 'number' ? `${v} ${a.unit}` : String(v));
  }
  if (filled(p.material)) out.push(String(p.material));
  if (filled(p.notes)) out.push(String(p.notes));
  return out.join(' · ');
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * The groups of one bike: [{ area, name, rows, empty, weightG, priceChf, count }].
 * rows: the parts with a name { key, cat, model, details, weightG, priceChf };
 * empty: the parts without a name (folded into one line). Groups with no part at all are left out.
 */
export function equipmentGroups(bike) {
  const parts = ensureParts(bike).filter(isSpecPart);
  const groups = [];
  for (const a of AREAS.filter((x) => x.key !== 'checks')) {
    const list = parts.filter((p) => areaOf(p) === a.key);
    if (!list.length) continue;
    const row = (p) => ({ key: p.key, cat: partName(p), model: filled(p.model) ? String(p.model) : '', details: partDetails(p), weightG: num(p.weightG), priceChf: num(p.priceChf) });
    const rows = list.filter((p) => filled(p.model)).map(row);
    const empty = list.filter((p) => !filled(p.model)).map(row);
    const sum = (k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0);
    groups.push({ area: a.key, name: a.name, rows, empty, count: rows.length, weightG: sum('weightG'), priceChf: sum('priceChf') });
  }
  return groups;
}

/** The totals of one bike: parts with a name, weight and price sums, missing prices, the top 3 by price. */
export function equipmentTotals(groups) {
  const rows = groups.flatMap((g) => g.rows);
  return {
    count: rows.length,
    weightG: rows.reduce((s, r) => s + (r.weightG ?? 0), 0),
    priceChf: rows.reduce((s, r) => s + (r.priceChf ?? 0), 0),
    noPrice: rows.filter((r) => r.priceChf == null).length,
    noWeight: rows.filter((r) => r.weightG == null).length,
    top: rows.filter((r) => r.priceChf != null).sort((a, b) => b.priceChf - a.priceChf).slice(0, 3),
  };
}

/** The changes for one part: name, weight (g) and price (CHF); an empty value clears it. */
export function setPartBasics(bike, key, { model, weightG, priceChf }) {
  const parts = ensureParts(bike).map((p) => {
    if (p.key !== key) return p;
    const next = { ...p, model: filled(model) ? String(model).trim() : '' };
    for (const [k, v] of [['weightG', weightG], ['priceChf', priceChf]]) {
      if (num(v) == null) delete next[k];
      else next[k] = v;
    }
    return next;
  });
  return { parts };
}
