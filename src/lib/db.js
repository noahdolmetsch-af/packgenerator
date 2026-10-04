import Dexie from 'dexie';

/**
 * The app's database. It lives in IndexedDB, inside the browser on this device.
 *
 * Every table holds one kind of record. The string after each table name lists
 * the primary key first (the field that identifies a record), then the fields
 * we want to search or sort by quickly (indexes). Other fields are stored too,
 * they just are not indexed.
 *
 * The model is domain-neutral: `domains` on items and `domain` on trips and kits
 * say which area they belong to ("bikepacking" now, "ski", "travel" … later).
 */

/** Bump this when the stored shape changes, and add a Dexie upgrade step below. */
export const SCHEMA_VERSION = 1;

/** Tables that belong to the user's data and go into every backup file. */
export const DATA_TABLES = [
  'items', // gear inventory and wishlist
  'kits', // named setups, e.g. "Training ride"
  'trips', // a packing list for one tour
  'debriefs', // what happened on a trip (one per trip)
  'learnings', // rules learned from past trips
  'events', // past and planned events from the logbook
  'maintenance', // bike and preparation tasks
  'bikes',
  'weightChecks', // where a disputed weight came from
  'settings', // key/value, e.g. rider weight
];

/**
 * @typedef {Object} Item
 * @property {string} id            Short ID from the Excel, e.g. "EL01"
 * @property {string} name          English name
 * @property {string} [nameDe]      Original German name from the Excel
 * @property {string} [brand]
 * @property {string} category      e.g. "elec", "onbike", "sleep"
 * @property {number|null} weightG  Weight of one piece in grams; null = still to weigh
 * @property {number} qty
 * @property {'logbook'|'online'|'missing'|'conflict'} weightStatus
 * @property {'body'|'bike'|'luggage'} carry
 * @property {string|null} defaultBag
 * @property {'owned'|'to-buy'|'wishlist'|'unclear'} ownership
 * @property {string|null} role     "worn" | "optional" | "standard" | null (every ride)
 * @property {string[]} sets        overnight sets: "base", "warm", "sleep", "cook"
 * @property {string[]} kits        kit codes, e.g. ["U", "O"]
 * @property {string[]} domains
 */

/**
 * @param {string} [name] database name; tests use their own name
 */
export function createDb(name = 'pack-generator') {
  const db = new Dexie(name);
  db.version(SCHEMA_VERSION).stores({
    items: 'id, category, ownership, weightStatus, *domains',
    kits: 'id, domain',
    trips: 'id, domain, status, startDate',
    debriefs: 'tripId',
    learnings: 'id, topic',
    events: 'id, sortDate',
    maintenance: 'id, subject, status',
    bikes: 'id',
    weightChecks: 'id',
    settings: 'key',
    meta: 'key', // app-internal (e.g. backup folder); never exported
  });
  return db;
}

/** The one database the app uses. */
export const db = createDb();
