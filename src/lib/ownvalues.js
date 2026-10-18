/**
 * «Mehr selbst einstellen» (Noah 15.10.2026, ideas IS 254–256, 258): the numbers that were fixed in
 * the code and are now yours to change, on Ich › Eigene Werte (#/me/werte). One settings record
 * OWN_KEY = { packDays, backupDays, checkKm, coldC, newDays }; a missing field is the standard (today's
 * number), so old data and old backups stay valid. Every value is a suggestion and can go back.
 *
 *   packDays    packing starts N days before a trip (Today, the trip's step, «In Arbeit»)   standard 2
 *   backupDays  the backup reminder after N days                                          standard 14
 *   checkKm     the km check every N km, for a bike without its own number (care.js)       standard 1000
 *   coldC       «only below N °C»: the temperature rule the app suggests for clothing     standard 10
 *   newDays     the «New» mark on a tile for N days                                        standard 14
 *
 * Pure functions only (tested in tests/ownvalues.test.js); the live value for the app is in
 * ownlive.svelte.js.
 */
export const OWN_KEY = 'ownValues';

/** The fields in the order of the page: section, standard, sane range, step, unit (English keys for t()). */
export const OWN_FIELDS = [
  { key: 'packDays', area: 'pack', std: 2, min: 0, max: 14, step: 1, unit: 'days', name: 'Packing starts', why: 'Today and the trip switch from «Plan» to «Pack» this many days before the start.' },
  { key: 'coldC', area: 'pack', std: 10, min: -10, max: 25, step: 1, unit: '°C', name: 'Cold from', why: 'Clothing you did not need on a warm trip gets the rule «only below this temperature».' },
  { key: 'checkKm', area: 'bike', std: 1000, min: 100, max: 5000, step: 100, unit: 'km', name: 'Km check every', why: 'Brakes, chain, tyres, bolts: for every bike without its own number.' },
  { key: 'newDays', area: 'today', std: 14, min: 0, max: 60, step: 1, unit: 'days', name: '«New» mark on tiles', why: 'A new tile keeps its dot for this many days. 0: no dot.' },
  { key: 'backupDays', area: 'data', std: 14, min: 1, max: 90, step: 1, unit: 'days', name: 'Backup reminder after', why: 'Everything is only on this device. The app reminds you when the last backup is older.' },
];
export const OWN_FIELD = Object.fromEntries(OWN_FIELDS.map((f) => [f.key, f]));
/** The standard of every field: today's numbers. */
export const OWN_DEFAULTS = Object.freeze(Object.fromEntries(OWN_FIELDS.map((f) => [f.key, f.std])));

/** A typed value made safe: a whole number (or a step of 100 km) inside its range; null when it is not a number. */
export function clampOwn(key, value) {
  const f = OWN_FIELD[key];
  if (!f) return null;
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim().replace(',', '.').replace(/[−–]/, '-'));
  if (value === '' || value == null || !Number.isFinite(n)) return null;
  const r = Math.round(n / f.step) * f.step;
  return Math.min(f.max, Math.max(f.min, r));
}

/** The stored record made whole: every field a safe number, missing or broken ones the standard. */
export function normOwn(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const f of OWN_FIELDS) out[f.key] = clampOwn(f.key, o[f.key]) ?? f.std;
  return out;
}

/** The record to store after a change: only the fields that differ from the standard (empty: {}). */
export function setOwn(raw, key, value) {
  const cur = normOwn(raw);
  const v = value == null ? OWN_FIELD[key]?.std : (clampOwn(key, value) ?? cur[key]);
  if (OWN_FIELD[key]) cur[key] = v;
  return Object.fromEntries(Object.entries(cur).filter(([k, x]) => x !== OWN_FIELD[k].std));
}

/** Is a field changed from its standard? */
export const isOwnChanged = (raw, key) => normOwn(raw)[key] !== OWN_FIELD[key]?.std;
