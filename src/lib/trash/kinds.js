/**
 * «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): what kind of thing a trash entry is and what comes back with it. Pure.
 * One word per thing (docs/namen.md): Velo, Tour, Material, Dokument, Notiz, Fahrt.
 */

/** The kinds the list can be filtered by, in the order of the filter chips: { key, label (English key for t()) }. */
export const KINDS = [
  { key: 'bike', label: 'Bikes|place' },
  { key: 'trip', label: 'Tours' },
  { key: 'gear', label: 'Gear' },
  { key: 'doc', label: 'Documents' },
  { key: 'note', label: 'Notes' },
  { key: 'ride', label: 'Rides' },
  { key: 'todo', label: 'To-dos' },
  { key: 'plan', label: 'My day' },
  { key: 'other', label: 'Other|trash' },
];

/** The table that names an entry: the first of these found among the deleted rows. */
const MAIN_ORDER = ['bikes', 'trips', 'items', 'containers', 'kits', 'docs', 'rides', 'tracks', 'kmBook', 'activities', 'flowActs', 'visits', 'maintenance', 'inspections', 'frei', 'sportItems', 'events', 'learnings', 'debriefs'];
const KIND_OF_TABLE = { bikes: 'bike', trips: 'trip', items: 'gear', containers: 'gear', kits: 'gear', docs: 'doc', notes: 'note', rides: 'ride', tracks: 'ride', kmBook: 'ride', activities: 'ride' };
export const kindOfTable = (t) => KIND_OF_TABLE[t] ?? 'other';

/** The main table of a set of deleted rows [{ t }]. */
export function mainTable(rows = []) {
  const have = new Set(rows.map((r) => r.t));
  return MAIN_ORDER.find((t) => have.has(t)) ?? rows[0]?.t ?? '';
}

/** How many rows of each table: { trips: 14, maintenance: 3 }. */
export function countsOf(rows = []) {
  const out = {};
  for (const r of rows) out[r.t] = (out[r.t] ?? 0) + 1;
  return out;
}

/** What goes along besides the main row itself: { table: n } without the empty ones. */
export function alongOf(counts = {}, main = '') {
  const out = {};
  for (const [t, n] of Object.entries(counts)) {
    const rest = t === main ? n - 1 : n;
    if (rest > 0) out[t] = rest;
  }
  return out;
}

/**
 * The words of one table: [one, many] as English keys with {n}. Tables without words fall under «other».
 * German: see src/lib/i18n/de/geloescht.js.
 */
export const TABLE_WORDS = {
  trips: ['{n} tour|trash', '{n} tours|trash'],
  rides: ['{n} ride|trash', '{n} rides|trash'],
  tracks: ['{n} recording|trash', '{n} recordings|trash'],
  maintenance: ['{n} care entry|trash', '{n} care entries|trash'],
  visits: ['{n} workshop visit|trash', '{n} workshop visits|trash'],
  inspections: ['{n} inspection|trash', '{n} inspections|trash'],
  kmBook: ['{n} km entry|trash', '{n} km entries|trash'],
  photos: ['{n} photo|trash', '{n} photos|trash'],
  containers: ['{n} bag|trash', '{n} bags|trash'],
  items: ['{n} gear item|trash', '{n} gear items|trash'],
  docs: ['{n} document|trash', '{n} documents|trash'],
  debriefs: ['{n} debrief|trash', '{n} debriefs|trash'],
  weightChecks: ['{n} weight check|trash', '{n} weight checks|trash'],
  flowLog: ['{n} tick|trash', '{n} ticks|trash'],
  bikes: ['{n} bike|trash', '{n} bikes|trash'],
};

/** «14 Fahrten, 3 Pflegeeinträge» for the rows that come along; '' when nothing does. tn is the app's one-or-many function. */
export function alongLine(along = {}, tn) {
  const parts = [];
  let other = 0;
  for (const [t, n] of Object.entries(along)) {
    const w = TABLE_WORDS[t];
    if (w) parts.push(tn(n, w[0], w[1]));
    else other += n;
  }
  if (other) parts.push(tn(other, '{n} more entry|trash', '{n} more entries|trash'));
  return parts.join(', ');
}

export const TRASH_DAYS = 30;
const DAY = 864e5;

/** Days left in the trash (0 once the 30 days are over). */
export const daysLeft = (at, now = Date.now()) => Math.max(0, Math.ceil((Date.parse(at) + TRASH_DAYS * DAY - now) / DAY));
/** Older than 30 days: the app asks once whether to empty it for good, nothing goes by itself. */
export const isOld = (at, now = Date.now()) => Date.parse(at) + TRASH_DAYS * DAY <= now;
