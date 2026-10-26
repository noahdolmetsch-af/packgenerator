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

/**
 * Einzelidee Heute 8 (UC-327-I1 «Lebensänderung statt Jahresroutine», Noah 25.10.2026): a move or a new
 * sport starts a check of just the values it touches, any time, without asking everything again. The same
 * window («Stimmt das noch?») has «Etwas hat sich geändert» with these changes; each lists its places with
 * «Stimmt» or «Ändern». English keys for t(); the hrefs are the app's own pages.
 */
export const CHANGES = [
  {
    key: 'move',
    name: 'I moved',
    checks: [
      { key: 'home', label: 'Your home place', hint: 'weather, rain at home and the ice warning come from it', href: '#/wetter' },
      { key: 'spot', label: 'Your spot notes on the weather page', hint: 'they belong to the old home; delete them there', href: '#/wetter' },
      { key: 'plants', label: 'Plants and their place', hint: 'other light, other watering', href: '#/me/reminders' },
      { key: 'shop', label: 'Your workshop', hint: 'one near the new home', href: '#/bikes?tab=shop' },
      { key: 'buy', label: 'Shopping list groups', hint: 'other shops, other order', href: '#/me/alltag/einkauf' },
      { key: 'sos', label: 'Emergency details', hint: 'address and contacts', href: '#/mountain/sos' },
    ],
  },
  {
    key: 'sport',
    name: 'A new sport',
    checks: [
      { key: 'sports', label: 'Your sports and their pages', hint: 'add the new one, hide one you stopped', href: '#/flow/sports' },
      { key: 'questions', label: 'Your check questions', hint: 'questions that fit the new sport', href: '#/me/abfragen' },
      { key: 'cats', label: 'Gear categories', hint: 'a category for the new gear', href: '#/me/lists?categories' },
      { key: 'start', label: 'Start list by sport', hint: 'what always comes along', href: '#/pack' },
      { key: 'push', label: 'Reminders on the phone', hint: 'switch on what helps, off what is old', href: '#/me/push' },
    ],
  },
];
export const changeOf = (key) => CHANGES.find((c) => c.key === key) ?? null;
