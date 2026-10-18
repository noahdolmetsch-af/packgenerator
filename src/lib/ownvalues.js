/**
 * «Mehr selbst einstellen» (Noah 15.10.2026, ideas IS 254–256 and 258; content approved 18.10.2026
 * 19:36): the numbers that were fixed in the code and are now yours to change, on Ich › Einstellungen ›
 * Eigene Werte (#/me/werte). One settings record OWN_KEY (it travels in every backup); a missing field
 * is the standard (today's number), so old data and old backups stay valid. Every value can go back.
 *
 *   packDays      the step «Packen» from N days before a trip (Today, the trip, «In Arbeit»)  2     1–7
 *   coldC         «cold» from N °C: the temperature rule the app suggests for clothing       10    0–20
 *   checkKm       the km check every N km, for a bike without its own number (care.js)      1000  300–3000
 *   waxKm         wax the chain every N km (part chain)                                       150   50–1000
 *   sealantDays   top up the sealant every N days (part tyres, tubeless)                      90    30–365
 *   forkDays      fork service every N days (part fork)                                       365   90–730
 *   workshopDays  what the workshop still has to do, from N days before a trip               14    3–30
 *   backupDays    the backup reminder after N days                                            14    7–60
 * The care intervals are the standard of every bike; a bike's own number («Pflege für …») still wins.
 *
 * Pure functions only (tested in tests/ownvalues.test.js); the live value for the app is in
 * ownlive.svelte.js.
 */
export const OWN_KEY = 'ownValues';

/**
 * The fields in the order of the page: section, standard, sane range, step, unit, name and the one
 * sentence of what it is for (English keys for t()). part/prop: the care interval it sets (care.js).
 */
export const OWN_FIELDS = [
  { key: 'packDays', area: 'pack', std: 2, min: 1, max: 7, step: 1, unit: 'days', name: 'Packing step from', why: 'Today and the trip switch from «Plan» to «Pack» this many days before the start.' },
  { key: 'coldC', area: 'pack', std: 10, min: 0, max: 20, step: 1, unit: '°C', name: '«Cold» from', why: 'Clothing you did not need on a warm trip gets the rule «only below this temperature».' },
  { key: 'checkKm', area: 'bike', std: 1000, min: 300, max: 3000, step: 100, unit: 'km', name: 'Bike check every', why: 'Brakes, chain, tyres, bolts: looked at again after this many km.' },
  { key: 'waxKm', area: 'bike', std: 150, min: 50, max: 1000, step: 10, unit: 'km', part: 'chain', prop: 'everyKm', name: 'Wax the chain every', why: 'The chain reminder comes after this many km.' },
  { key: 'sealantDays', area: 'bike', std: 90, min: 30, max: 365, step: 1, unit: 'days', part: 'tyres', prop: 'everyDays', name: 'Top up sealant every', why: 'Only for tubeless tyres: the sealant dries out over time.' },
  { key: 'forkDays', area: 'bike', std: 365, min: 90, max: 730, step: 1, unit: 'days', part: 'fork', prop: 'everyDays', name: 'Fork service every', why: 'Suspension forks only: the service reminder by time.' },
  { key: 'workshopDays', area: 'bike', std: 14, min: 3, max: 30, step: 1, unit: 'days', name: 'Workshop lead before a trip', why: 'From this many days before a trip, Bike care lists what the workshop still has to do.' },
  { key: 'backupDays', area: 'data', std: 14, min: 7, max: 60, step: 1, unit: 'days', name: 'Backup reminder every', why: 'Everything is only on this device. The app reminds you when the last backup is older.' },
];
/** The care intervals set here, by part: { chain: { everyKm: 'waxKm' }, … }. */
export const OWN_PARTS = OWN_FIELDS.filter((f) => f.part).reduce((m, f) => ((m[f.part] = { ...(m[f.part] ?? {}), [f.prop]: f.key }), m), {});
/** The standard of a part from the own values: { everyKm: 120 } for the chain; {} for a part not set here. */
export const partStdOf = (vals, key) => Object.fromEntries(Object.entries(OWN_PARTS[key] ?? {}).map(([prop, k]) => [prop, vals[k]]));
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
