/**
 * v0.97.0 «Skitouren»: what the ski pages read and write. The rules are pure in lib/ski.js; this
 * file only talks to the database (trips, items, learnings, the settings records 'ski.care',
 * 'ski.careTasks' and 'ski.strava').
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { touched } from '../trips.js';
import { CARE_KEY, CARE_TASKS_KEY, togglePacked, withStartChecks, afterLearnings, careEntry, mergeStrava } from '../ski.js';

export const STRAVA_KEY = 'ski.strava';

/** Everything the ski pages show, live. */
export const skiQuery = () =>
  liveQuery(async () => {
    const [trips, items, learnings, care, tasks, strava] = await Promise.all([
      db.trips.where('domain').equals('ski').toArray(),
      db.items.toArray(),
      db.learnings.toArray(),
      db.settings.get(CARE_KEY),
      db.settings.get(CARE_TASKS_KEY),
      db.settings.get(STRAVA_KEY),
    ]);
    return { trips, items, learnings, care: care?.value ?? [], tasks: tasks?.value ?? null, strava: strava?.value ?? [] };
  });

/** Tap in the backpack check: packed or not (the same field Pack uses). */
export async function togglePack(tripId, itemId, slot) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    if (trip) await db.trips.update(tripId, touched({ entries: togglePacked(trip.entries, itemId, slot) }));
  });
}

/** The start check opens: the missing checks are added to trip.ready (none is taken away). */
export async function ensureStartChecks(tripId) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    const ready = trip ? withStartChecks(trip.ready) : null;
    if (ready) await db.trips.update(tripId, { ready });
  });
}

/** Tick or untick one check of trip.ready; done: true / false (or omitted: toggle). */
export async function setCheck(tripId, id, done) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return;
    const ready = (trip.ready ?? []).map((r) => (r.id === id ? { ...r, done: done ?? !r.done } : r));
    await db.trips.update(tripId, touched({ ready }));
  });
}

/** Merge fields into trip.ski. */
export async function setSki(tripId, fields) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    if (trip) await db.trips.update(tripId, touched({ ski: { ...(trip.ski ?? {}), ...fields } }));
  });
}

/** «Speichern» after the tour: trip.ski and the learnings it makes (the ones of an earlier save replaced). */
export async function saveAfter(tripId, ski, tr) {
  const now = new Date().toISOString();
  await db.transaction('rw', db.trips, db.learnings, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return;
    const next = { ...(trip.ski ?? {}), ...ski, savedAt: now };
    const { add, drop } = afterLearnings(trip, next, await db.learnings.toArray(), { now, tr });
    if (drop.length) await db.learnings.bulkDelete(drop);
    if (add.length) await db.learnings.bulkPut(add);
    await db.trips.update(tripId, touched({ ski: next }, now));
  });
}

/** «Erledigt» in the season care: a new entry; returns it (for Undo). */
export async function careDone(task, today, hm) {
  const entry = careEntry(task, today, hm);
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(CARE_KEY);
    await db.settings.put({ key: CARE_KEY, value: [...(rec?.value ?? []), entry] });
  });
  return entry;
}

/** Take care entries away (untick, or Undo); returns the ones taken (for Undo). */
export async function careDrop(ids) {
  const gone = [];
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(CARE_KEY);
    const keep = (rec?.value ?? []).filter((e) => (ids.includes(e.id) ? (gone.push(e), false) : true));
    await db.settings.put({ key: CARE_KEY, value: keep });
  });
  return gone;
}

/** Put care entries back (Undo of an untick). */
export async function careRestore(entries) {
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(CARE_KEY);
    const have = new Set((rec?.value ?? []).map((e) => e.id));
    await db.settings.put({ key: CARE_KEY, value: [...(rec?.value ?? []), ...entries.filter((e) => !have.has(e.id))] });
  });
}

/** Your own care tasks: { own: [{ id, phase, task }], hidden: [ids] }. */
export async function saveCareTasks(value) {
  await db.settings.put({ key: CARE_TASKS_KEY, value });
}

/** v0.97.0: the ski activities of a Strava export, kept for «Nach der Tour» (merged, never doubled). */
export async function keepStrava(list) {
  if (!list?.length) return;
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(STRAVA_KEY);
    await db.settings.put({ key: STRAVA_KEY, value: mergeStrava(rec?.value ?? [], list) });
  });
}
