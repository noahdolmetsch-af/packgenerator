/**
 * The page «Tour» (Noah 19.10.2026 «1a 3b 5a»): what a person changes on a finished tour. Every write goes
 * to the one place the tour lives (an activity, a joined tour in TOUR_GROUPS_KEY, a trip) and returns what
 * Undo needs. Deleting asks first on the page (askDelete) and offers Undo (deleteWithUndo).
 */
import { TOUR_GROUPS_KEY, STRAVA_GONE_KEY, cleanOwn, joinActs, patchGroup, dropGroup, leaveGroup } from './tour.js';

const now = () => new Date().toISOString();
const groupsOf = async (db) => {
  const rec = await db.settings.get(TOUR_GROUPS_KEY);
  return Array.isArray(rec?.value) ? rec.value : [];
};
const putGroups = (db, list) => db.settings.put({ key: TOUR_GROUPS_KEY, value: list });

/** Rename the tour. An empty name brings back Strava's name (activity) or is refused (trip, joined tour). */
export async function renameTour(db, d, name) {
  const v = String(name ?? '').trim();
  if (d.kind === 'a') {
    const a = await db.activities.get(d.id);
    const own = { ...(a?.own ?? {}) };
    if (v && v !== a?.name) own.name = v;
    else delete own.name;
    return db.activities.update(d.id, { own });
  }
  if (!v) return false;
  if (d.kind === 'g') return putGroups(db, patchGroup(await groupsOf(db), d.id, { name: v }));
  return db.trips.update(d.id, { title: v, updatedAt: now() });
}

/** 3b: the corrected values { km, hm, movingS } (null = Strava's again), the kind of sport { kind }. */
export async function saveOwn(db, d, patch) {
  if (d.kind === 'a') {
    const a = await db.activities.get(d.id);
    const own = cleanOwn({ ...(a?.own ?? {}), ...patch }, a ?? {});
    return db.activities.update(d.id, { own });
  }
  if (d.kind === 'g') {
    const list = await groupsOf(db);
    const g = list.find((x) => x.id === d.id);
    return putGroups(db, patchGroup(list, d.id, { own: cleanOwn({ ...(g?.own ?? {}), ...patch }) }));
  }
  const trip = await db.trips.get(d.id);
  return db.trips.update(d.id, { own: cleanOwn({ ...(trip?.own ?? {}), ...patch }), updatedAt: now() });
}

/** Hide or show again (an activity or a joined tour); a hidden one stays, the filter «Ausgeblendete» shows it. */
export async function setHidden(db, d, hidden) {
  if (d.kind === 'a') return db.activities.update(d.id, { hidden: !!hidden });
  if (d.kind === 'g') return putGroups(db, patchGroup(await groupsOf(db), d.id, { hidden: !!hidden }));
  return null;
}

/** The person's own words and rating of an activity or a joined tour: { diary, rating, good, next }. */
export async function saveNotes(db, d, patch) {
  if (d.kind === 'a') {
    const a = await db.activities.get(d.id);
    const { diary, ...rest } = patch;
    const own = cleanOwn({ ...(a?.own ?? {}), ...rest }, a ?? {});
    for (const k of Object.keys(rest)) if (rest[k] == null || rest[k] === '') delete own[k];
    // the diary of one activity is its note (the same text as Aktiv › Training)
    return db.activities.update(d.id, { own, ...(diary !== undefined ? { note: String(diary) } : {}) });
  }
  if (d.kind === 'g') return putGroups(db, patchGroup(await groupsOf(db), d.id, patch));
  // a trip: its own rating (a trip made from a ride, Gepäck nachtragen 1a) in trip.own
  const { diary: _d, ...rest } = patch;
  if (Object.keys(rest).length) {
    const trip = await db.trips.get(d.id);
    const own = { ...(trip?.own ?? {}), ...rest };
    for (const k of Object.keys(rest)) if (rest[k] == null || rest[k] === '') delete own[k];
    await db.trips.update(d.id, { own, updatedAt: now() });
  }
  // a trip: the diary of its Rückblick (Paket M «Tour-Tagebuch»)
  if (patch.diary !== undefined) {
    const deb = await db.debriefs.get(d.id);
    if (deb) return db.debriefs.update(d.id, { diary: { ...(deb.diary ?? {}), text: String(patch.diary), edited: true, at: deb.diary?.at ?? now() }, updatedAt: now() });
  }
  return null;
}

/** Delete the tour. → what undoDelete needs. An activity: gone from the app, not fetched again. */
export async function deleteTour(db, d) {
  if (d.kind === 'a') {
    const rec = await db.activities.get(d.id);
    const gone = (await db.settings.get(STRAVA_GONE_KEY))?.value ?? [];
    const groups = await groupsOf(db);
    await db.activities.delete(d.id);
    await db.settings.put({ key: STRAVA_GONE_KEY, value: [...new Set([...gone, String(d.id)])] });
    const g = groups.find((x) => x.acts.includes(String(d.id)));
    if (g) await putGroups(db, leaveGroup(groups, g.id, d.id));
    return { kind: 'a', rec, groups };
  }
  if (d.kind === 'g') {
    const groups = await groupsOf(db);
    await putGroups(db, dropGroup(groups, d.id));
    return { kind: 'g', groups };
  }
  const rec = await db.trips.get(d.id);
  await db.trips.delete(d.id);
  return { kind: 't', rec };
}

/** Undo of deleteTour. */
export async function undoDelete(db, saved) {
  if (!saved) return;
  if (saved.kind === 'a') {
    if (saved.rec) await db.activities.put(saved.rec);
    const gone = (await db.settings.get(STRAVA_GONE_KEY))?.value ?? [];
    await db.settings.put({ key: STRAVA_GONE_KEY, value: gone.filter((x) => x !== String(saved.rec?.id)) });
    await putGroups(db, saved.groups);
    return;
  }
  if (saved.kind === 'g') return putGroups(db, saved.groups);
  if (saved.rec) await db.trips.put(saved.rec);
}

/** 5a: join activities into one tour. → { id, before } (before: the joined tours for Undo). */
export async function joinTour(db, ids, name) {
  const before = await groupsOf(db);
  const { groups, id } = joinActs(before, ids, name);
  await putGroups(db, groups);
  return { id, before };
}

/** Take one activity out of its joined tour. → the joined tours before (for Undo). */
export async function leaveTour(db, groupId, actId) {
  const before = await groupsOf(db);
  await putGroups(db, leaveGroup(before, groupId, actId));
  return before;
}

/** Put the joined tours back as they were (Undo). */
export const restoreGroups = (db, list) => putGroups(db, list);
