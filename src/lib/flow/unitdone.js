/**
 * «Plan zuerst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T4; Noah 21.11.2026 «a»): «Done» on a unit of the
 * weekly plan opens a short sheet (the duration preselected from the plan, the feeling optional, «Save») and then «Geschafft».
 * The unit counts as a normal tick: besides the tick in the weekly plan (training.weeklog) the sheet writes one entry in the
 * history (flowLog) on the sport the unit belongs to. That entry carries `via: 'plan'`, the new field `unit` (the stable id of the
 * unit, e.g. `tennis@1`) and, if chosen, `min` and `feel`. The sport of a unit kind is asked once and kept in the new setting
 * training.unitacts (goes into the backup like every setting, no schema change).
 * Pure functions plus two small database helpers; the sheet is src/lib/flow/UnitDoneSheet.svelte, tests in tests/unitdone.test.js.
 */
import { WEEKLOG_KEY, QUIET, logOf, setDone } from '../training/wochenlog.js';
import { mondayOf } from '../training.js';
import { MIN_CHIPS } from './feel.js';

export const UNITACTS_KEY = 'training.unitacts';

/** Unit kinds that tick at once, without the sheet: the small daily habits and the rest day. */
export const NO_SHEET = [...QUIET, 'rest'];
/** Whether a tick of this unit kind opens the sheet. */
export const needsSheet = (type) => !NO_SHEET.includes(type);

/** Words in the name of a sport that fit a kind of unit (lower case, as part of the name). Only a suggestion. */
export const UNIT_WORDS = {
  hockey: ['hockey'],
  tennis: ['tennis'],
  yoga: ['yoga'],
  gym: ['kraft', 'gym', 'strength', 'fitness', 'weights'],
  sauna: ['sauna'],
  bikeOut: ['velo', 'bike', 'rad', 'cycl', 'ride'],
  bikeIn: ['velo', 'bike', 'rad', 'cycl', 'ride'],
  runOut: ['lauf', 'run', 'jog'],
  runIn: ['lauf', 'run', 'jog'],
  mini: ['mobil', 'kraft', 'strength', 'stretch', 'dehn'],
};

const str = (v, n) => String(v ?? '').slice(0, n);

/** The stored setting, cleaned: { v: 1, map: { [unitType]: actId } }. */
export function unitActsOf(raw) {
  const map = {};
  for (const [type, id] of Object.entries(raw?.map && typeof raw.map === 'object' ? raw.map : {})) if (typeof id === 'string' && id) map[str(type, 20)] = str(id, 60);
  return { v: 1, map };
}

/** The setting with the sport of one unit kind set (actId null takes the answer away). Never changes the one given. */
export function withUnitAct(raw, type, actId) {
  const cur = unitActsOf(raw);
  const map = { ...cur.map };
  if (actId) map[type] = actId;
  else delete map[type];
  return { v: 1, map };
}

/** The sports that can take a unit: not paused, not hidden by the seasons. */
export const takers = (acts = []) => acts.filter((a) => a && !a.paused).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** A sport whose name fits the unit kind (the first in the order of the list), or null. nameOf(a) gives the name shown. */
export function suggestAct(type, acts = [], nameOf = (a) => a.name) {
  const words = UNIT_WORDS[type];
  if (!words) return null;
  return takers(acts).find((a) => {
    const names = [nameOf(a), a.name, a.nameDe].map((n) => String(n ?? '').toLowerCase());
    return words.some((w) => names.some((n) => n.includes(w)));
  }) ?? null;
}

/**
 * The sport a unit counts on: the remembered one when it still exists, else the suggestion.
 * → { act, remembered } (act null when nothing fits: the person chooses or counts it only in the plan).
 */
export function actForUnit(type, acts = [], raw = null, nameOf) {
  const list = takers(acts);
  const id = unitActsOf(raw).map[type];
  const kept = id ? list.find((a) => a.id === id) : null;
  if (kept) return { act: kept, remembered: true };
  return { act: suggestAct(type, list, nameOf), remembered: false };
}

/** The duration chips: the minutes of the unit first (it is the preselected one), then the usual ones, no double, ascending. */
export function minuteChips(planMins) {
  const m = Math.round(Number(planMins));
  const list = Number.isFinite(m) && m >= 1 && m <= 1440 ? [...new Set([...MIN_CHIPS, m])] : [...MIN_CHIPS];
  return list.sort((a, b) => a - b);
}

/** The Monday of the week a unit tick belongs to (the day of the entry). */
export const weekOfEntry = (e) => mondayOf(e.day);

/** Whether a log entry is the tick of a unit of the weekly plan. */
export const isUnitEntry = (e) => !!e && e.via === 'plan' && typeof e.unit === 'string' && e.unit !== '';

/**
 * The tick of a unit in the weekly plan, on or off (training.weeklog). The same function as the weekly plan page uses, so the
 * week is stored as it was seen. A past week is not changed. → true when something was written.
 */
export async function setUnitTick(db, { monday, id, on, today, units = [], hours = 0 }) {
  const cur = logOf((await db.settings.get(WEEKLOG_KEY))?.value);
  const next = setDone(cur, monday, id, on, today, units, hours);
  if (next === cur) return false;
  await db.settings.put({ key: WEEKLOG_KEY, value: next });
  return true;
}

/** The entries of the history that belong to a unit in a week (usually one). */
export async function unitEntries(db, monday, id) {
  const all = await db.flowLog.toArray();
  return all.filter((e) => isUnitEntry(e) && e.unit === id && weekOfEntry(e) === monday);
}

/** Take the history entries of a unit away (the tick in the plan was taken back). → the entries removed, to put them back. */
export async function removeUnitEntries(db, monday, id) {
  const list = await unitEntries(db, monday, id);
  if (list.length) await db.flowLog.bulkDelete(list.map((e) => e.id));
  return list;
}
