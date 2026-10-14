/**
 * TR6/TR6b «Gewicht» (Noah 13.10.2026 «a», 14.10.2026 «TR5–TR7 freigegeben»): your weight under
 * Ich › Meine Daten, voluntary, only for watts per kg. Kept in db.settings on this device (and in the
 * backup file you make yourself); never sent to Strava or a server. Observation only: no goal, no rating.
 *
 * Stored under WEIGHT_KEY: { entries: [{ day: 'YYYY-MM-DD', kg }] }, one entry per day.
 */
export const WEIGHT_KEY = 'me.weight';
export const KG_MIN = 30;
export const KG_MAX = 250;

/** A weight in kg with one decimal, or null when it is none. */
export function cleanKg(v) {
  const kg = Math.round(Number(String(v ?? '').replace(',', '.')) * 10) / 10;
  return kg >= KG_MIN && kg <= KG_MAX ? kg : null;
}

/** The entries, cleaned, oldest first, one per day (the last one of a day counts). */
export function entriesOf(v) {
  const by = new Map();
  for (const e of Array.isArray(v?.entries) ? v.entries : []) {
    const kg = cleanKg(e?.kg);
    if (kg != null && /^\d{4}-\d{2}-\d{2}$/.test(String(e?.day ?? ''))) by.set(e.day, kg);
  }
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([day, kg]) => ({ day, kg }));
}

/** The weight that applied on a day: the newest entry on or before it (else the oldest one), or null. */
export function kgOn(entries, day) {
  if (!entries.length) return null;
  let kg = entries[0].kg;
  for (const e of entries) if (e.day <= day) kg = e.kg;
  return kg;
}

/** The newest entry, or null. */
export const latestOf = (entries) => entries.at(-1) ?? null;

/** One entry for a day (replaces that day's), or removes the day's entry when kg is null. */
export function withEntry(entries, day, kg) {
  const rest = entries.filter((e) => e.day !== day);
  return entriesOf({ entries: kg == null ? rest : [...rest, { day, kg }] });
}
