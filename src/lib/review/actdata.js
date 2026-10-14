/**
 * SN2+ «SN2 plus»: the one adapter between the pages of SN2e–SN2i and the Strava activities.
 * The activities table (zone times, power, sport type, moving time) comes with the Training PR; until
 * then this reads db.activities only when the table exists and otherwise gives [] (the heart rate then
 * comes from the ride ledger, kmBook hrAvg / hrMax). The zones: your own (settings 'hrZones'), else the
 * standard five zones from the highest heart rate the ledger has seen.
 */
import { PACE_KEY } from '../pace.js';
import { TEMPLATES_KEY } from '../templates.js';
import { SETS_KEY } from '../sets.js';
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

/* ---------- SN4+ «SN4 plus»: the columns of «Vergangene Touren» ---------- */

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

/**
 * SN4+: one activity in the shape «Vergangene Touren» reads: { id, day, startAt, km, movingS, elapsedS,
 * desc, hist, hrAvg, hrMax } (SN4g: plus type, wAvg, wMax, wNorm, wDevice, spdAvg, tempAvg). desc undefined: the comment is not loaded from Strava yet («Kommentar laden»);
 * '' or null: loaded and empty («–»).
 */
// SN4+: wire to training.js when the Training PR lands (its activity fields: movingS, elapsedS, desc, hist)
export function actOf(a) {
  return {
    id: a?.id ?? null,
    day: a?.day ?? a?.date ?? null,
    startAt: a?.startAt ?? a?.start ?? null,
    km: pos(a?.km),
    movingS: pos(a?.movingS) ?? (pos(a?.movingH) ? a.movingH * 3600 : null),
    elapsedS: pos(a?.elapsedS) ?? (pos(a?.elapsedH) ? a.elapsedH * 3600 : null),
    desc: a && 'desc' in a ? a.desc ?? '' : undefined,
    hist: a?.hist ?? null,
    hrAvg: a?.hrAvg ?? null,
    hrMax: a?.hrMax ?? null,
    // SN4g: the values of «Abgeschlossene Touren» on Touren › Übersicht (Training PR fields; NP only with a power meter)
    // SN4g: wire to training.js when the Training PR lands
    type: a?.type ?? null,
    wAvg: pos(a?.wAvg),
    wMax: pos(a?.wMax),
    wNorm: pos(a?.wNorm),
    wDevice: a?.wDevice ?? null,
    spdAvg: pos(a?.spdAvg),
    tempAvg: typeof a?.tempAvg === 'number' && Number.isFinite(a.tempAvg) ? a.tempAvg : null,
  };
}

/** SN4+: the activities in the shape of actOf, or [] without the table. */
export const loadPastActs = async (db) => (await loadActs(db)).map(actOf);

/**
 * SN4+ «Kommentar laden»: fetch the comment of these activities once from Strava. Until the Training PR
 * lands there is nothing to fetch it with: it gives false and the row keeps «Kommentar laden».
 */
// SN4+: wire to training.js when the Training PR lands (loadDetail(db, id) for each id)
export async function loadComments(db, ids = []) {
  if (!hasActivities(db) || !ids.length) return false;
  return false;
}

/* ---------- SN2x «SN2 extra»: the whole Rückblick of one trip ---------- */

/**
 * SN2x: the settings key of the body weight (grams), the one Packen already reads for the rider.
 * SN2x: wire to training.js when the Training PR lands (TR6 adds the weight under Ich › Meine Daten).
 */
export const WEIGHT_KEY = 'riderWeightG';
/** The weight in kg from the setting's value (grams; a value under 400 is taken as kg), or null. */
export function kgOf(value) {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v < 400 ? v : Math.round(v / 100) / 10;
}

/**
 * SN2x: everything the whole Rückblick reads besides the page's own data, in one go (for a liveQuery):
 * { acts, entries, zones, templates, sets, kg, checks }. checks: the daily checks (Stimmung und Energie).
 */
// SN2x: wire to training.js when the Training PR lands (the activities with loadDetail(db, id): pHist, pCurve, pauses, segs, best)
export async function loadGanz(db) {
  const [acts, entries, zs, tpl, sets, w, checks] = await Promise.all([
    loadActs(db),
    db.kmBook.toArray(),
    db.settings.get(ZONES_KEY),
    db.settings.get(TEMPLATES_KEY),
    db.settings.get(SETS_KEY),
    db.settings.get(WEIGHT_KEY),
    db.flowChecks.toArray().catch(() => []),
  ]);
  return { acts, entries, zones: zonesOf(zs?.value ?? null, entries, acts), templates: tpl?.value ?? [], sets: sets?.value ?? [], kg: kgOf(w?.value), checks };
}
