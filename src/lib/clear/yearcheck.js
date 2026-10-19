/**
 * Paket Q #137 «Stimmt das noch?» (Noah 19.10.2026 «5a»): once a year one window asks about the
 * values that grow old: your weight, your home place, your name for the greeting and papers that
 * run out (Dokumente with «valid until»). Each one: «Still right» or «Change» (it leads there).
 * The first window comes a year after the first start; Ich › Daten › «Stimmt das noch?» opens it any time.
 * Pure, tested in tests/yearcheck.test.js.
 */
import { localDay } from '../localday.js';

/** meta key (this device): { at (last check or first start), until (snoozed till) }. */
export const YEAR_KEY = 'yearCheck';
export const OPEN_HASH = '#/me/data?yearcheck';

/** Start: a missing record starts the year now. Returns the record to store, or null when unchanged. */
export const startYear = (rec, now = new Date()) => (rec?.at ? null : { at: now.toISOString(), until: null });

/** Is the window due (a year after the last check, and not snoozed)? */
export function yearDue(rec, now = new Date()) {
  if (!rec?.at) return false;
  if (rec.until && new Date(rec.until) > now) return false;
  const next = new Date(rec.at);
  next.setFullYear(next.getFullYear() + 1);
  return next <= now;
}

/**
 * The values to ask about, only the ones that exist. input: { riderG, home ({ name }), name, docs
 * ([{ id, title, until 'YYYY-MM' }]) }. Each: { key, label, value, vars, href }. Papers: those that ran
 * out or run out within 3 months.
 */
export function yearValues({ riderG = null, home = null, name = '', docs = [] }, today = localDay()) {
  const out = [];
  if (riderG) out.push({ key: 'rider', label: 'Your weight', value: '{kg} kg', vars: { kg: Math.round(riderG / 100) / 10 }, href: '#/bikes?tab=setup' });
  if (home?.name) out.push({ key: 'home', label: 'Your home place', value: '{v}', vars: { v: home.name }, href: '#/me' });
  if (name) out.push({ key: 'name', label: 'Your name for the greeting', value: '{v}', vars: { v: name }, href: '#/me/look' });
  const [y, m] = today.split('-').map(Number);
  const limit = y * 12 + m + 3;
  for (const d of docs) {
    if (typeof d?.until !== 'string' || !/^\d{4}-\d{2}$/.test(d.until)) continue;
    const [dy, dm] = d.until.split('-').map(Number);
    if (dy * 12 + dm <= limit) out.push({ key: `doc-${d.id}`, label: '{v}', labelVars: { v: d.title || d.name || '' }, value: 'valid until {v}', vars: { v: d.until }, href: '#/me/docs' });
  }
  return out;
}
