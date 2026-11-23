/**
 * «Touren-Liste aufräumen» (Noah 23.11.2026 «was fällt dir hier auf», «ja»): three quiet helps for the list of
 * Touren › Übersicht, all pure (tests/touren-aufraeumen.test.js):
 *
 *   - Beispiele: the two made-up trips of the first start («Jura-Runde (Beispiel)», «Seerunde (Beispiel)») stay
 *     out of the list as soon as there is a real trip; a quiet line shows them again.
 *   - Doppelte: trips with the same name, the same first day, the same length and the same bike are suggested
 *     for joining. Nothing is joined by itself. Joining archives the extra ones (as «Testdaten aufräumen» does:
 *     archivedAt, skipped, their debrief gets the status 'archived' so nothing learns twice from one ride) and
 *     keeps the one that has the most: a Rückblick first, then the most packed things. Every extra remembers what
 *     it was before (`dupBefore`) and which trip it joined (`dupOf`), so «Wieder trennen» puts it back as it was.
 *   - Kurze Zeiten: «9 h 58 min» instead of «00:09:58:34».
 */
import { homeTrips, archiveChanges } from '../home/heute.js';

/** The ids of the made-up trips of the first start (firststart.js). */
export const EXAMPLE_IDS = ['ex-trip', 'ex-past'];
export const isExample = (trip) => EXAMPLE_IDS.includes(trip?.id);

/** The trips the list works with: no archived, no test trips, and no examples once there is a real trip. */
export function listTrips(trips = [], { showExamples = false } = {}) {
  const base = homeTrips(trips);
  const real = base.filter((x) => !isExample(x));
  return showExamples || !real.length ? base : real;
}

/** How many made-up trips are kept out of the list (0 when none, or when the list has only them). */
export function hiddenExamples(trips = []) {
  const base = homeTrips(trips);
  const n = base.filter(isExample).length;
  return base.length > n ? n : 0;
}

/* ---------- Doppelte ---------- */

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const keyOf = (x) => [norm(x.title), x.startDate ?? '', Math.max(1, Number(x.days) || 1), x.bikeId ?? norm(x.bike)].join('|');
const packedN = (x) => (x.entries ?? []).filter((e) => e.packed).length;

/** The one to keep: a finished Rückblick first, then the most packed, then the most things in the list, then the oldest. */
export function bestOf(members) {
  const rank = (m) => [m.rated ? 1 : 0, m.packed, m.entries];
  return [...members].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return rb[i] - ra[i];
    return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')) || String(a.id).localeCompare(String(b.id));
  })[0];
}

/**
 * The groups that look like one trip made twice or more: [{ key, title, start, bike, members, keep }].
 * members: [{ id, title, rated, packed, entries, createdAt }]; keep: the id suggested to stay.
 * Only trips that count on the list (no archived, test or example trips). Newest first.
 */
export function findDoubles(trips = [], debriefs = []) {
  const done = new Set((debriefs ?? []).filter((d) => d.status === 'done').map((d) => d.tripId));
  const by = new Map();
  for (const x of homeTrips(trips)) {
    if (isExample(x) || !x.startDate || !String(x.title ?? '').trim()) continue;
    const k = keyOf(x);
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(x);
  }
  const out = [];
  for (const [key, list] of by) {
    if (list.length < 2) continue;
    const members = list.map((x) => ({ id: x.id, title: x.title, rated: done.has(x.id), packed: packedN(x), entries: (x.entries ?? []).length, createdAt: x.createdAt ?? '' }));
    members.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)));
    out.push({ key, title: list[0].title, start: list[0].startDate, days: Math.max(1, Number(list[0].days) || 1), bike: list[0].bike ?? null, members, keep: bestOf(members).id });
  }
  return out.sort((a, b) => b.start.localeCompare(a.start) || a.title.localeCompare(b.title));
}

/** How many trips the suggestions would take off the list. */
export const extraCount = (groups = []) => groups.reduce((s, g) => s + g.members.length - 1, 0);

/**
 * The writes of joining one group, keeping `keepId` (a member's id): { trips, debriefs } as in testdata.js.
 * Nothing is deleted. A debrief that is already archived is left as it is; the rides of an extra move to the kept trip.
 */
export function joinWrites({ trips = [], debriefs = [], rides = [] }, group, keepId, now = new Date().toISOString()) {
  const drop = new Set(group.members.map((m) => m.id).filter((id) => id !== keepId));
  const tr = trips.filter((x) => drop.has(x.id) && !x.archivedAt);
  const ids = new Set(tr.map((x) => x.id));
  return {
    trips: tr.map((x) => ({ id: x.id, changes: { ...archiveChanges(now), dupAt: now, dupOf: keepId, dupBefore: { archivedAt: x.archivedAt ?? null, skipped: x.skipped ?? false } } })),
    debriefs: (debriefs ?? [])
      .filter((d) => ids.has(d.tripId) && d.status !== 'archived')
      .map((d) => ({ tripId: d.tripId, changes: { status: 'archived', dupAt: now, dupBefore: { status: d.status ?? 'draft' }, updatedAt: now } })),
    // an uploaded ride of an extra moves to the kept trip, so it does not turn into a ride of its own on the list
    rides: (rides ?? []).filter((r) => ids.has(r.tripId)).map((r) => ({ id: r.id, changes: { tripId: keepId, dupFrom: r.tripId } })),
  };
}

/** The groups already joined: [{ keepId, title, ids }] (the extras that remember `dupOf`), newest first. */
export function joinedGroups(trips = []) {
  const by = new Map();
  for (const x of trips ?? []) {
    if (!x.dupAt || !x.dupOf) continue;
    if (!by.has(x.dupOf)) by.set(x.dupOf, []);
    by.get(x.dupOf).push(x);
  }
  const keep = new Map((trips ?? []).map((x) => [x.id, x]));
  return [...by].map(([keepId, list]) => ({ keepId, title: keep.get(keepId)?.title ?? list[0].title, start: list[0].startDate, ids: list.map((x) => x.id), at: list[0].dupAt })).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/** The writes of «Wieder trennen» for the extras of the given ids: everything comes back as it was. */
export function splitWrites({ trips = [], debriefs = [], rides = [] }, ids, now = new Date().toISOString()) {
  const want = new Set(ids);
  const tr = trips.filter((x) => want.has(x.id) && x.dupAt);
  return {
    trips: tr.map((x) => ({ id: x.id, changes: { archivedAt: x.dupBefore?.archivedAt ?? null, skipped: x.dupBefore?.skipped ?? false, dupAt: null, dupOf: null, dupBefore: null, updatedAt: now } })),
    debriefs: (debriefs ?? []).filter((d) => want.has(d.tripId) && d.dupAt).map((d) => ({ tripId: d.tripId, changes: { status: d.dupBefore?.status ?? 'draft', dupAt: null, dupBefore: null, updatedAt: now } })),
    rides: (rides ?? []).filter((r) => r.dupFrom && want.has(r.dupFrom)).map((r) => ({ id: r.id, changes: { tripId: r.dupFrom, dupFrom: null } })),
  };
}

/* ---------- Zeiten ---------- */

const known = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
/**
 * A time in seconds in short words, the same for the riding and the elapsed time: «45 s», «15 min», «1 h 28 min»,
 * «9 h 58 min»; from a day on «1 d 2 h». '' without a value (the caller leaves the value out).
 */
export function shortTimeS(s) {
  if (!known(s)) return '';
  const v = Math.round(s);
  const d = Math.floor(v / 86400);
  const h = Math.floor((v % 86400) / 3600);
  const m = Math.floor((v % 3600) / 60);
  if (d) return h ? `${d} d ${h} h` : `${d} d`;
  if (h) return m ? `${h} h ${m} min` : `${h} h`;
  if (m) return `${m} min`;
  return `${v} s`;
}
