/**
 * Velo-Idee 73 «Setup zurückbauen» (996 Ideen, Noah 25.10.2026): when a change goes into the setup log,
 * the bike's measures as they are now (saddle height, pressures, bar width …, bikespecs.js FIT) are kept
 * with the entry, plus up to three photos. Later «Back to these measures» writes them onto the bike
 * again (Undo for 4 s). Stored on the log entry (bike.setupLog[].saved), so every backup carries it.
 * Pure functions, tested in tests/veloideen.test.js.
 */
import { FIT, fitValue, setFit } from '../bikespecs.js';

/** At most this many photos per entry. */
export const MAX_PHOTOS = 3;

/** The measures of a bike now: { key: value } with every FIT key (null = not set). */
export const fitSnapshot = (bike) => Object.fromEntries(FIT.map((f) => [f.key, fitValue(bike, f.key)]));

/** How many measures a snapshot holds. */
export const savedCount = (fit) => Object.values(fit ?? {}).filter((v) => v != null && v !== '').length;

/** What «saved» keeps on a log entry: { fit, photos, at } or null when there is nothing to keep. */
export function makeSaved(bike, photos = [], at = new Date().toISOString().slice(0, 10)) {
  const fit = fitSnapshot(bike);
  const pics = (photos ?? []).filter(Boolean).slice(0, MAX_PHOTOS);
  return savedCount(fit) || pics.length ? { fit, photos: pics, at } : null;
}

/** The measures that differ between the bike now and a snapshot: [{ key, name, unit, now, then }]. */
export function savedDiff(bike, fit) {
  return FIT.filter((f) => Object.hasOwn(fit ?? {}, f.key))
    .map((f) => ({ key: f.key, name: f.name, unit: f.unit, now: fitValue(bike, f.key), then: fit[f.key] }))
    .filter((r) => `${r.now ?? ''}` !== `${r.then ?? ''}`);
}

/** The bike's changes that bring the measures of a snapshot back (one update for all of them). */
export function restoreChanges(bike, fit) {
  let b = bike;
  const out = {};
  for (const r of savedDiff(bike, fit)) {
    const patch = setFit(b, r.key, r.then);
    b = { ...b, ...patch };
    Object.assign(out, patch);
  }
  return out;
}
