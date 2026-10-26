/**
 * Idee 53 «Check aus einer echten Panne» (Touren b, 996 Ideen): after a breakdown (Rückblick › «Für das nächste
 * Mal» › Panne) the app suggests a short check in your words, e.g. «Reifen und Dichtmilch prüfen». You change the
 * words; it goes into the evening-before check of this trip type (Ich › Checks), so it comes before every
 * next tour of the type. The breakdown keeps the check's id (breakdown.checkId).
 * Pure functions, tested in tests/touren-b.test.js. Labels are English keys for t().
 */
import { suggested } from '../checks.js';

/** The check each kind of breakdown suggests (English key for t()). */
export const BREAK_CHECKS = {
  flat: 'Check the tyres and the sealant',
  chain: 'Check and oil the chain',
  brake: 'Check the brake pads',
  spoke: 'Check the spokes and spin the wheels',
  gears: 'Check the gears and the derailleur hanger',
  other: 'Check what broke last time',
};

/** The suggestion for a breakdown: the check of its kind, with the part when one is given. tr: t(). */
export function breakCheckText(kind, part = '', tr = (s) => s) {
  const base = tr(BREAK_CHECKS[kind] ?? BREAK_CHECKS.other);
  const p = String(part ?? '').trim();
  return p ? `${base}: ${p}` : base;
}

/**
 * The evening-before standard of a trip type with one more row (the saved one, else the suggestion, kept as
 * English keys like asStandard does). A row with the same words is not added twice. → { list, id } (id of the row, new or found)
 */
export function withBreakCheck(standard, domain, label, { now = Date.now() } = {}) {
  const words = String(label ?? '').trim();
  const base = Array.isArray(standard) && standard.length ? standard.map((r) => ({ id: r.id, label: r.label })) : suggested('eve', domain).map((r) => ({ id: r.id, label: r.label }));
  if (!words) return { list: base, id: null };
  const same = base.find((r) => String(r.label).trim().toLowerCase() === words.toLowerCase());
  if (same) return { list: base, id: same.id };
  const id = `std-break-${now.toString(36)}`;
  return { list: [...base, { id, label: words }], id };
}
