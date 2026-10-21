/**
 * v0.97.0 «Skitouren»: what the ski pages read and write. The rules are pure in lib/ski.js; this
 * file only talks to the database (trips, items, learnings, the settings records 'ski.care',
 * 'ski.careTasks' and 'ski.strava').
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { touched } from '../trips.js';
import { CARE_KEY, CARE_TASKS_KEY, togglePacked, withStartChecks, afterLearnings, careEntry, mergeStrava } from '../ski.js';
import { GOAL_KEY, WISHES_KEY, LVS_KEY, COURSES_KEY } from '../skiplan.js';

export const STRAVA_KEY = 'ski.strava';

/** Everything the ski pages show, live. */
export const skiQuery = () =>
  liveQuery(async () => {
    const [trips, items, learnings, care, tasks, strava, goal, wishes, lvs, courses] = await Promise.all([
      db.trips.where('domain').equals('ski').toArray(),
      db.items.toArray(),
      db.learnings.toArray(),
      db.settings.get(CARE_KEY),
      db.settings.get(CARE_TASKS_KEY),
      db.settings.get(STRAVA_KEY),
      db.settings.get(GOAL_KEY),
      db.settings.get(WISHES_KEY),
      db.settings.get(LVS_KEY),
      db.settings.get(COURSES_KEY),
    ]);
    return {
      trips,
      items,
      learnings,
      care: care?.value ?? [],
      tasks: tasks?.value ?? null,
      strava: strava?.value ?? [],
      // Paket P2: the season goal, wish tours, transceiver practice and courses (lib/skiplan.js)
      goal: goal?.value ?? {},
      wishes: wishes?.value ?? [],
      lvs: lvs?.value ?? [],
      courses: courses?.value ?? [],
    };
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

/** Merge fields into trip.ski; fields may be a function of the stored trip.ski (so quick taps never lose one). */
export async function setSki(tripId, fields) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return;
    const ski = trip.ski ?? {};
    await db.trips.update(tripId, touched({ ski: { ...ski, ...(typeof fields === 'function' ? fields(ski) : fields) } }));
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

/** Paket J: merge fields into the trip itself (the saved snow and freezing level, trip.snow). */
export async function setTripFields(tripId, fields) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    if (trip) await db.trips.update(tripId, fields);
  });
}

/**
 * Paket P2: change one of the ski settings ('ski.goal', 'ski.wishes', 'ski.lvs', 'ski.courses');
 * fn gets the stored value (or `empty`) and returns the new one. Returns the value before (for Undo).
 */
export async function updSkiSetting(key, fn, empty = []) {
  let before = empty;
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(key);
    before = rec?.value ?? empty;
    await db.settings.put({ key, value: fn(before) });
  });
  return before;
}

/** Paket P2: merge fields into trip.ski.plan (the planning page). */
export const setPlan = (tripId, fields) => setSki(tripId, (ski) => ({ plan: { ...(ski.plan ?? {}), ...fields } }));
