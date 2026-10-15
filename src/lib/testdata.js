/**
 * v0.88.0 «Aufräumen und Ausprobieren» (Noah 11.10.2026, App einfach 1a, 0.88 «alle a», mockup F):
 * test data out of the way in one go. Ich › «Testdaten aufräumen» finds what has «test» in its name,
 * shows it grouped (each group and each entry can be unticked) and archives it:
 * - a trip: archived as on Today (home/heute.js archiveChanges: archivedAt, skipped), so no page shows
 *   it any more, and its debrief gets the status 'archived', so nothing learns from it (every page
 *   that learns reads only debriefs with status 'done');
 * - an item: ownership 'gone' (the same archive as one row on the Gear page; past trips keep it);
 * - a template: archivedAt (as «Archive» on the template page);
 * - a learning (0.161.0, Bugfixes 0.132.2 B3): archivedAt, so no trip shows it again. Found are the
 *   learnings a debrief wrote with «test» in its text or source, and every learning of a chosen trip
 *   (an old test note no longer turns up in a new trip).
 * Nothing is deleted. Each archived record keeps what it was before (tidyBefore) and the moment
 * (tidiedAt), so «Undo» puts everything back as it was. Pure functions, tested in tests/testdata.test.js.
 */
import { isTestTrip, isTestName, archiveChanges } from './home/heute.js';

/** «test» at the start of a word: «Testtour», «test3», «Test Schloss»; not «Contest» or «latest» (home/heute.js). */
export { isTestName };

/** The groups in their order (English keys for t()). */
export const GROUPS = ['trips', 'items', 'templates', 'learnings'];

/** The key of a learning in the chosen set (learning ids are numbers, the others strings). */
export const learningKey = (l) => `learning:${l.id}`;
/** A learning the app wrote (a debrief or the helper), not one from an import. */
const written = (l) => !!l.createdAt && !l.importedAt && l.source !== 'import';
/** The learnings of a trip: linked by id, or (older ones) written by its debrief under its title. */
const ofTrip = (l, tr) => l.tripId === tr.id || (!l.tripId && written(l) && !!tr.title && l.source === tr.title);

/**
 * What can be tidied: { trips: [{ id, name, debrief }], items: [{ id, name }], templates: [{ id, name }], n }.
 * debrief: the trip has a debrief (it is archived with the trip). Already archived things are left out.
 */
export function findTestData({ trips = [], debriefs = [], items = [], templates = [], learnings = [] } = {}) {
  const withDebrief = new Set(debriefs.filter((d) => d.status !== 'archived').map((d) => d.tripId));
  const out = {
    trips: trips.filter((x) => !x.archivedAt && isTestTrip(x)).map((x) => ({ id: x.id, name: x.title ?? '', debrief: withDebrief.has(x.id) })),
    items: items.filter((i) => i.ownership !== 'gone' && isTestName(i.name)).map((i) => ({ id: i.id, name: i.name ?? '' })),
    templates: templates.filter((x) => !x.archivedAt && isTestName(x.name)).map((x) => ({ id: x.id, name: x.name ?? '' })),
    learnings: learnings.filter((l) => !l.archivedAt && written(l) && (isTestName(l.rule) || isTestName(l.source))).map((l) => ({ id: learningKey(l), name: l.rule ?? '' })),
  };
  return { ...out, n: out.trips.length + out.items.length + out.templates.length + out.learnings.length };
}

/** How many debriefs go with the chosen trips. */
export const debriefCount = (found, chosen) => found.trips.filter((x) => x.debrief && chosen.has(x.id)).length;

/**
 * The writes for the chosen ids (a Set): { trips: [{ id, changes }], debriefs: [{ tripId, changes }],
 * items: [{ id, changes }], templates: the new templates list }. Pure: the caller writes them.
 */
export function tidyWrites({ trips = [], debriefs = [], items = [], templates = [], learnings = [] }, chosen, now = new Date().toISOString()) {
  const tr = trips.filter((x) => chosen.has(x.id) && !x.archivedAt);
  const ids = new Set(tr.map((x) => x.id));
  return {
    learnings: learnings
      .filter((l) => !l.archivedAt && (chosen.has(learningKey(l)) || tr.some((x) => ofTrip(l, x))))
      .map((l) => ({ id: l.id, changes: { archivedAt: now, tidiedAt: now } })),
    trips: tr.map((x) => ({ id: x.id, changes: { ...archiveChanges(now), tidiedAt: now, tidyBefore: { archivedAt: x.archivedAt ?? null, skipped: x.skipped ?? false } } })),
    debriefs: debriefs
      .filter((d) => ids.has(d.tripId) && d.status !== 'archived')
      .map((d) => ({ tripId: d.tripId, changes: { status: 'archived', tidiedAt: now, tidyBefore: { status: d.status ?? 'draft' }, updatedAt: now } })),
    items: items
      .filter((i) => chosen.has(i.id) && i.ownership !== 'gone')
      .map((i) => ({ id: i.id, changes: { ownership: 'gone', archivedFrom: i.ownership ?? 'owned', archivedAt: now, archivedBy: 'tidy', tidiedAt: now, updatedAt: now } })),
    templates: templates.map((x) => (chosen.has(x.id) && !x.archivedAt ? { ...x, archivedAt: now, tidiedAt: now } : x)),
  };
}

/** How many things were tidied (and can come back with «Undo»). */
export function tidiedCount({ trips = [], items = [], templates = [], learnings = [] } = {}) {
  return trips.filter((x) => x.tidiedAt).length + items.filter((i) => i.tidiedAt && i.ownership === 'gone').length + templates.filter((x) => x.tidiedAt).length + learnings.filter((l) => l.tidiedAt).length;
}

/** The writes of «Undo»: everything tidied comes back as it was before. Same shape as tidyWrites. */
export function undoWrites({ trips = [], debriefs = [], items = [], templates = [], learnings = [] }, now = new Date().toISOString()) {
  return {
    learnings: learnings.filter((l) => l.tidiedAt).map((l) => ({ id: l.id, changes: { archivedAt: null, tidiedAt: null } })),
    trips: trips.filter((x) => x.tidiedAt).map((x) => ({ id: x.id, changes: { archivedAt: x.tidyBefore?.archivedAt ?? null, skipped: x.tidyBefore?.skipped ?? false, tidiedAt: null, tidyBefore: null, updatedAt: now } })),
    debriefs: debriefs.filter((d) => d.tidiedAt).map((d) => ({ tripId: d.tripId, changes: { status: d.tidyBefore?.status ?? 'draft', tidiedAt: null, tidyBefore: null, updatedAt: now } })),
    items: items
      .filter((i) => i.tidiedAt && i.ownership === 'gone')
      .map((i) => ({ id: i.id, changes: { ownership: i.archivedFrom ?? 'owned', archivedFrom: null, archivedAt: null, archivedBy: null, tidiedAt: null, updatedAt: now } })),
    templates: templates.map((x) => (x.tidiedAt ? { ...x, archivedAt: null, tidiedAt: null } : x)),
  };
}
