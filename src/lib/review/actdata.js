/**
 * SN2+ «SN2 plus»: the one adapter between the pages of SN2e–SN2i and the Strava activities.
 * The activities table (zone times, power, sport type, moving time) comes with the Training PR; until
 * then this reads db.activities only when the table exists and otherwise gives [] (the heart rate then
 * comes from the ride ledger, kmBook hrAvg / hrMax). The zones: your own (settings 'hrZones'), else the
 * standard five zones from the highest heart rate the ledger has seen.
 */
import { PACE_KEY } from '../pace.js';
import { TEMPLATES_KEY } from '../templates.js';
import { standardZones, validBounds, tempoRides, paceGrid } from './werte.js';

/** settings key: your own zone bounds { bounds: [Z1–Z4 upper bpm], at } (exported with the backup). */
// SN2+: wire to training.js when the Training PR lands (zones from src/lib/strava/zones.svelte.js)
export const ZONES_KEY = 'hrZones';

/** Does this database have the activities table yet? */
export const hasActivities = (db) => db.tables.some((t) => t.name === 'activities');

/** All activities, or [] without the table. */
// SN2+: wire to training.js when the Training PR lands
export async function loadActs(db) {
  if (!hasActivities(db)) return [];
  try {
    return await db.table('activities').toArray();
  } catch {
    return [];
  }
}

/** The highest heart rate in the ledger's rides (and activities), or null. */
export function maxHeart(entries = [], acts = []) {
  const all = [...entries.filter((e) => e.state !== 'removed').map((e) => Number(e.hrMax) || 0), ...acts.map((a) => Number(a.hrMax) || 0)];
  return all.length ? Math.max(...all) || null : null;
}

/**
 * The zone bounds to draw with: { bounds, source: 'own' | 'standard', max } or null (no heart rate known).
 * setting: the 'hrZones' value.
 */
// SN2+: wire to training.js when the Training PR lands (zones from Strava come first)
export function zonesOf(setting, entries = [], acts = []) {
  if (validBounds(setting?.bounds)) return { bounds: setting.bounds, source: 'own', max: null };
  const max = maxHeart(entries, acts);
  const bounds = standardZones(max);
  return bounds ? { bounds, source: 'standard', max } : null;
}

/** Everything the Rückblick card and the Tempo page read, in one go (for a liveQuery). */
export async function loadWerte(db) {
  const [acts, entries, pace, zones, bikes, trips, templates] = await Promise.all([
    loadActs(db),
    db.kmBook.toArray(),
    db.settings.get(PACE_KEY),
    db.settings.get(ZONES_KEY),
    db.bikes.toArray(),
    db.trips.toArray(),
    db.settings.get(TEMPLATES_KEY),
  ]);
  const zs = zonesOf(zones?.value ?? null, entries, acts);
  const rides = tempoRides({ acts, entries, paceRides: pace?.value?.rides ?? [], trips });
  return { acts, entries, pace: pace?.value ?? null, zoneSetting: zones?.value ?? null, zones: zs, bikes, trips, rides, grid: paceGrid(rides, bikes), templates: templates?.value ?? [] };
}

/** Your own zones saved, or back to the standard (null). */
export const saveZones = (db, bounds) => (bounds ? db.settings.put({ key: ZONES_KEY, value: { bounds: bounds.map(Number), at: new Date().toISOString() } }) : db.settings.delete(ZONES_KEY));
