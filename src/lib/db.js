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
export const SCHEMA_VERSION = 2; // 2: bags (containers) table, bike setups

/** Tables that belong to the user's data and go into every backup file. */
export const DATA_TABLES = [
  'items', // gear inventory and wishlist
  'kits', // named setups, e.g. "Training ride"
  'trips', // a packing list for one tour
  'debriefs', // what happened on a trip (one per trip)
  'learnings', // rules learned from past trips
  'events', // past and planned events from the logbook
  'maintenance', // bike and preparation tasks
  'bikes', // bike setups: weight, which mounts it has, which bag sits where
  'containers', // bags and cages that can go on a bike (own list, linked to a gear item for the weight)
  'weightChecks', // where a disputed weight came from
  'settings', // key/value, e.g. rider weight
];

/**
 * @typedef {Object} Item
 * @property {string} id            Short ID from the Excel, e.g. "EL01"
 * @property {string} name          English name
 * @property {string} [nameDe]      Original German name from the Excel
 * @property {string} [brand]     Maker only, e.g. "Garmin"
 * @property {string} [model]     Model, colour or variant, e.g. "Edge 1040 Solar"
 * @property {string} category      e.g. "elec", "onbike", "sleep"
 * @property {number|null} weightG  Weight of one piece in grams; null = still to weigh
 * @property {number} qty
 * @property {'logbook'|'online'|'measured'|'missing'|'conflict'} weightStatus  measured = weighed in the app
 * @property {'body'|'bike'|'luggage'} carry
 * @property {string|null} defaultBag
 * @property {'owned'|'to-buy'|'wishlist'|'unclear'} ownership
 * @property {string|null} role     "worn" | "optional" | "standard" | null (every ride)
 * @property {string[]} sets        overnight sets: "base", "warm", "sleep", "cook"
 * @property {string[]} kits        kit codes, e.g. ["U", "O"]
 * @property {string[]} domains
 */

/**
 * @typedef {Object} Container      A bag or cage that goes on a bike slot
 * @property {string} id            e.g. "bag-TA02"
 * @property {string} name
 * @property {string} slot          where it fits on the bike, e.g. "seat" (see SLOTS in bikes.js)
 * @property {number|null} volumeL
 * @property {string|null} itemId   gear item that holds its weight, e.g. "TA02"
 * @property {number} pieces        how many pieces of that item this bag is (side bags = 2)
 * @property {string} [note]
 *
 * @typedef {Object} Bike
 * @property {string} id
 * @property {string} name
 * @property {number|null} weightG
 * @property {string[]} slots       slots this bike has mounts for
 * @property {Object<string, string|null>} setup  slot → container id that sits there by default
 * @property {string[]} [fixtures]  gear items always mounted on this bike (e.g. Garmin mount); counted in the bike weight
 * @property {string} [weightNote]
 */

/**
 * @param {string} [name] database name; tests use their own name
 */
export function createDb(name = 'pack-generator') {
  const db = new Dexie(name);
  db.version(1).stores({
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
  // Version 2 only adds a table, so existing data stays as it is.
  db.version(2).stores({
    containers: 'id, slot',
  });
  return db;
}

/** The one database the app uses. */
export const db = createDb();
