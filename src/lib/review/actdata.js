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
import { standardZones, tempoRides, paceGrid } from './werte.js';
import { ZONES_KEY as STRAVA_ZONES_KEY, OWN_ZONES_KEY, ownOf, boundsOfStrava, validBounds as trainingBounds } from '../training.js';

/**
 * The older settings key of your own zone bounds { bounds: [Z1–Z4 upper bpm], at }. Still read; saving now goes
 * to Training's key (training.js OWN_ZONES_KEY), so Rückblick, Tempo and Training show one set of zones.
 */
export const ZONES_KEY = 'hrZones';

/** The three zone settings in one go: { own (Training), strava (fetched), legacy ('hrZones') }. */
export async function zoneValues(db) {
  const [own, strava, legacy] = await Promise.all([db.settings.get(OWN_ZONES_KEY), db.settings.get(STRAVA_ZONES_KEY), db.settings.get(ZONES_KEY)]);
  return { own: own?.value ?? null, strava: strava?.value ?? null, legacy: legacy?.value ?? null };
}

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
 * The zone bounds to draw with (top of Z1–Z4): { bounds, source: 'own' | 'strava' | 'standard', max } or null
 * (no heart rate known). zv: zoneValues(), or an older 'hrZones' value { bounds }. Own zones (from Training or
 * from here) come first, then Strava's, then the standard from the highest heart rate. Training keeps the first
 * beat of the next zone, so its bounds are one beat lower here.
 */
export function zonesOf(zv, entries = [], acts = []) {
  const v = zv && 'bounds' in zv ? { legacy: zv } : (zv ?? {});
  const own = ownOf(v.own, v.legacy);
  if (own) return { bounds: own.own.map((b) => b - 1), source: 'own', max: null };
  const s = boundsOfStrava(v.strava);
  if (s) return { bounds: s.map((b) => b - 1), source: 'strava', max: null };
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
    zoneValues(db),
    db.bikes.toArray(),
    db.trips.toArray(),
    db.settings.get(TEMPLATES_KEY),
  ]);
  const zs = zonesOf(zones, entries, acts);
  const rides = tempoRides({ acts, entries, paceRides: pace?.value?.rides ?? [], trips });
  return { acts, entries, pace: pace?.value ?? null, zoneSetting: zones, zones: zs, bikes, trips, rides, grid: paceGrid(rides, bikes), templates: templates?.value ?? [] };
}

/**
 * Your own zones (top of Z1–Z4) saved for the whole app, or null: back to Strava's or the standard. Saved as
 * Training's bounds (one beat more); false when they do not fit there (whole numbers, 59–229).
 */
export async function saveZones(db, bounds) {
  if (!bounds) {
    await Promise.all([db.settings.delete(OWN_ZONES_KEY), db.settings.delete(ZONES_KEY)]);
    return true;
  }
  const own = bounds.map((b) => Number(b) + 1);
  if (!trainingBounds(own)) return false;
  await db.settings.put({ key: OWN_ZONES_KEY, value: { own } });
  await db.settings.delete(ZONES_KEY);
  return true;
}

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
 * SN4+ «Kommentar laden»: fetch these activities once from Strava (Training's loadDetail brings the comment with
 * the details). true when at least one came; false without the table, without ids or when Strava is not
 * reachable (not connected, offline): the row then keeps «Kommentar laden». load: for tests.
 */
export async function loadComments(db, ids = [], { load } = {}) {
  if (!hasActivities(db) || !ids.length) return false;
  const fn = load ?? (await import('../strava/client.svelte.js')).loadDetail;
  let ok = false;
  for (const id of ids) {
    try {
      await fn(db, id);
      ok = true;
    } catch {
      /* stays «Kommentar laden» */
    }
  }
  return ok;
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
    zoneValues(db),
    db.settings.get(TEMPLATES_KEY),
    db.settings.get(SETS_KEY),
    db.settings.get(WEIGHT_KEY),
    db.flowChecks.toArray().catch(() => []),
  ]);
  return { acts, entries, zones: zonesOf(zs, entries, acts), templates: tpl?.value ?? [], sets: sets?.value ?? [], kg: kgOf(w?.value), checks };
}
