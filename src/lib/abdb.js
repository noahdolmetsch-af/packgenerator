/**
 * AB «Deine Abfragen»: reading and writing (the rules are in abfragen.js). The settings live in two
 * records of `settings` (AB_KEY, AB_SNOOZE_KEY), the answers in the table abAnswers (schema version 9),
 * the old daily checks stay in flowChecks and are read alongside (mergeHistory). Everything goes into
 * the backup like every other table and setting.
 */
import { liveQuery } from 'dexie';
import { db } from './db.js';
import { DATA_KEY, ACT_DAYS } from './datenfragen.js';
import { HOME_PLACE, HOME_FORECAST, usable } from './know.js';
import { AB_KEY, AB_SNOOZE_KEY, MIRROR, configOf, mergeHistory, stampOf } from './abfragen.js';
import { QUESTIONS_KEY, poolOf, checkOf } from './flowcheck.js';
import { WEIGHT_KEY } from './review/actdata.js';
import { loadPastActs } from './review/actdata.js';
import { WEIGHT_KEY as ENTRIES_KEY, entriesOf, withEntry, cleanKg } from './weight.js';

const plain = (x) => JSON.parse(JSON.stringify(x));

/** The settings, the snooze record, the answers and daily checks of the last 40 days, the body weight, live. */
export function abQuery(today) {
  return liveQuery(async () => {
    const from = new Date(`${today}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - 40);
    const near = new Date(`${today}T00:00:00Z`);
    near.setUTCDate(near.getUTCDate() - 31); // 03.11.2026: the 30 days before today give the usual resting pulse (datenfragen.js)
    const actFrom = new Date(`${today}T00:00:00Z`);
    actFrom.setUTCDate(actFrom.getUTCDate() - ACT_DAYS);
    const calFrom = new Date(`${today}T00:00:00Z`);
    calFrom.setUTCDate(calFrom.getUTCDate() - 7);
    const calTo = new Date(`${today}T00:00:00Z`);
    calTo.setUTCDate(calTo.getUTCDate() + 1);
    const [cfg, snooze, answers, weight, checks, health, dataCfg, acts, sport, place, saved, gEvents, gTasks] = await Promise.all([
      db.settings.get(AB_KEY),
      db.settings.get(AB_SNOOZE_KEY),
      db.abAnswers.where('day').aboveOrEqual(from.toISOString().slice(0, 10)).toArray(),
      db.settings.get(WEIGHT_KEY),
      db.flowChecks.where('day').aboveOrEqual(from.toISOString().slice(0, 10)).toArray(),
      // 0.171: the Fitbit days of the last days, so the window fills in what Fitbit measured (fitbitFill)
      db.healthDays ? db.healthDays.where('date').aboveOrEqual(near.toISOString().slice(0, 10)).toArray().catch(() => []) : [],
      db.settings.get(DATA_KEY),
      // step 2: the Strava activities and the tennis entries of the last 40 days (rules «Long day yesterday» and «A pause from training»)
      db.activities ? db.activities.where('day').aboveOrEqual(actFrom.toISOString().slice(0, 10)).toArray().catch(() => []) : [],
      db.sportItems ? db.sportItems.where('day').aboveOrEqual(actFrom.toISOString().slice(0, 10)).toArray().catch(() => []) : [],
      // step 2: the saved home forecast and the calendar copy on this device (rules «Grey day» and «Fine weather»); nothing is fetched here
      db.settings.get(HOME_PLACE),
      db.meta ? db.meta.get(HOME_FORECAST).catch(() => null) : null,
      db.gEvents ? db.gEvents.where('day').between(calFrom.toISOString().slice(0, 10), calTo.toISOString().slice(0, 10), true, true).toArray().catch(() => []) : [],
      // step 3: the copy of the Google tasks on this device (rule «A to-do that is stuck»); nothing is fetched here
      db.gTasks ? db.gTasks.toArray().catch(() => []) : [],
    ]);
    const wx = usable(place?.value ?? null, saved, Date.now()) ? (saved.days ?? []).find((d) => d.date === today) ?? null : null;
    return { wx, cal: { used: gEvents.length > 0, events: gEvents }, tasks: { used: gTasks.length > 0, open: gTasks.filter((x) => !x.done && !x.parent && x.due) }, cfg: cfg?.value ?? null, stored: !!cfg, snooze: snooze?.value ?? {}, answers, weightG: weight?.value ?? null, checks, health, acts, sport, dataCfg: dataCfg?.value ?? null };
  });
}

/**
 * The first start of «Deine Abfragen»: the record with the time it began, so the questions ask from
 * their next time on (no pile of «missed» questions on the first day). Once.
 */
export async function ensureConfig(now = stampOf()) {
  await db.transaction('rw', db.settings, async () => {
    if (await db.settings.get(AB_KEY)) return;
    await db.settings.put({ key: AB_KEY, value: { since: now, q: {}, own: [] } });
  });
}
export const saveConfig = (cfg) => db.settings.put({ key: AB_KEY, value: plain(configOf(cfg)) });
export const saveDataCfg = (value) => db.settings.put({ key: DATA_KEY, value: plain(value ?? {}) });
export const saveSnooze = (snooze) => db.settings.put({ key: AB_SNOOZE_KEY, value: plain(snooze ?? {}) });

/**
 * Save answers (AB3): the rows into abAnswers; sleep, energy and mood also into the day's daily check
 * (the rings, the Rückblick «aus deinem Tagescheck» read it); the weight also as the body weight under
 * Ich › Meine Daten (W/kg reads it), the same value in both places.
 */
export async function saveAnswers(rows = []) {
  const list = rows.filter(Boolean);
  if (!list.length) return;
  await db.transaction('rw', db.abAnswers, db.flowChecks, db.settings, async () => {
    await db.abAnswers.bulkPut(plain(list));
    for (const r of list) {
      const field = MIRROR[r.qid];
      if (field && typeof r.value === 'number') {
        const c = await db.flowChecks.get(r.day);
        await db.flowChecks.put(plain({ ...checkOf(c, r.day), [field]: r.value }));
      }
      if (r.qid === 'koerper.waage' && typeof r.value === 'number' && r.value > 0) {
        await db.settings.put({ key: WEIGHT_KEY, value: Math.round(r.value * 1000) });
        // TR6: the same weight as that day's entry under Ich › Gewicht (the curve and W/kg)
        const kg = cleanKg(r.value);
        if (kg != null) await db.settings.put({ key: ENTRIES_KEY, value: { entries: withEntry(entriesOf((await db.settings.get(ENTRIES_KEY))?.value), r.day, kg) } });
      }
    }
  });
}
export const putAnswer = (row) => saveAnswers([row]);
export const deleteAnswer = (id) => db.abAnswers.delete(id);

/** The whole history (AB4): the answers, the old daily checks and the rides from Strava, newest first. */
async function historyRows() {
  const [answers, checks, pool, cfg, acts] = await Promise.all([
    db.abAnswers.toArray(),
    db.flowChecks.toArray(),
    db.settings.get(QUESTIONS_KEY),
    db.settings.get(AB_KEY),
    loadPastActs(db).catch(() => []),
  ]);
  const rides = acts
    .filter((a) => a.day)
    .map((a) => ({ id: `strava-${a.id}`, qid: 'tour', area: 'sport', day: a.day, at: a.startAt ? stampOf(new Date(a.startAt)) : null, kind: 'ride', value: a.km, note: null, unit: 'km', src: 'strava', ride: a }));
  return { rows: mergeHistory([...answers, ...rides], checks, poolOf(pool?.value)), cfg: cfg?.value ?? null };
}
export function historyQuery() {
  return liveQuery(historyRows);
}
/**
 * What the guess to test needs (the same data as the page «Erkenntnisse»): the history, the Fitbit days, the meditation,
 * the kept weather and appointments, and the switched-off own questions. Read only, nothing is fetched.
 */
export function hintQuery() {
  return liveQuery(async () => {
    // loaded on first use: the start stays small (the check window only needs this when the rule is on)
    const [{ loadDayData }, { OWN_OFF_KEY }] = await Promise.all([import('./daydata.js'), import('./erkenntnisse.js')]);
    const [hist, health, log, days, off] = await Promise.all([
      historyRows(),
      db.healthDays ? db.healthDays.toArray().catch(() => []) : [],
      db.flowLog ? db.flowLog.where('actId').equals('meditation').toArray().catch(() => []) : [],
      loadDayData(db).catch(() => ({ weather: {}, events: {} })),
      db.settings.get(OWN_OFF_KEY),
    ]);
    return { ...hist, health, log, weather: days.weather, events: days.events, ownOff: off?.value ?? [] };
  });
}
