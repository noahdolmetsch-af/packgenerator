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
export const SCHEMA_VERSION = 7; // 2: bags (containers) table, bike setups. 3: workshop visits, photos. 4: quick notes. 5: rides. 6: Im Flow. 7: ride ledger

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
  'visits', // workshop visits: date, shop, invoice, cost, the jobs done and the receipt photos
  'photos', // setup photos of a bike, shown in a gallery and pale behind the bags in Pack
  'notes', // quick notes from any page, sorted later on the Inbox page
  'rides', // v0.41.0: uploaded rides (GPX): moving time, pauses, planned vs real (gpx.js)
  'flowActs', // v0.51.0 «Im Flow»: activities with their rolling goals and seasons (flow.js)
  'flowLog', // v0.51.0: one row per tick (activity, day, amount, place, minutes)
  'flowChecks', // v0.51.0: the daily check, one row per day (flowcheck.js)
  'kmBook', // v0.68.0 «Q1 Jeder km zählt»: the ride ledger, one row per km change of a bike (kmbook.js)
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
 *
 * @typedef {Object} Visit          One workshop visit (Noah, 4.10.2026, answer 7a)
 * @property {string} id            e.g. "biketech-R6439"
 * @property {string} bikeId
 * @property {string} date          YYYY-MM-DD
 * @property {string} shop
 * @property {string} [invoice]
 * @property {number|null} totalChf
 * @property {number|null} km       bike km at the visit, when known
 * @property {{part: string, action: 'check'|'service'|'replace', model?: string, what?: string, chf?: number, setup?: Object}[]} parts
 * @property {string[]} [photos]    receipt pages as small JPEG data URLs
 *
 * @typedef {Object} Photo          A setup photo of a bike (answers 1a, 4a)
 * @property {string} id
 * @property {string} bikeId
 * @property {string} name          e.g. "Hope 2026"
 * @property {string|null} tripId   shown in Pack for this trip
 * @property {boolean} main         shown in Pack when the trip has no own photo
 * @property {string} data          JPEG data URL
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
  // Version 3 only adds tables (workshop visits, photos), so existing data stays as it is.
  db.version(3).stores({
    visits: 'id, bikeId, date',
    photos: 'id, bikeId, tripId',
  });
  // Version 4 only adds the quick notes table, so existing data stays as it is.
  db.version(4).stores({
    notes: 'id, status, at',
  });
  // Version 5 (v0.41.0) only adds the uploaded rides, so existing data stays as it is.
  db.version(5).stores({
    rides: 'id, date, tripId',
  });
  // Version 6 (v0.51.0 «Im Flow») only adds tables, so existing data stays as it is.
  db.version(6).stores({
    flowActs: 'id, order',
    flowLog: 'id, actId, day',
    flowChecks: 'day',
  });
  // Version 7 (v0.68.0 «Q1 Jeder km zählt») only adds the ride ledger. The km counters stay; the
  // first start writes each counter as the ledger's opening entry (kmbookdb.js ensureKmBook).
  db.version(7).stores({
    kmBook: 'id, bikeId, date, state, importId',
  });
  return db;
}

/** The one database the app uses. */
export const db = createDb();
