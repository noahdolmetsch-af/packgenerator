import Dexie from 'dexie';
import { trackSync } from './sync/track.js';

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
export const SCHEMA_VERSION = 19; // 2: bags (containers) table, bike setups. 3: workshop visits, photos. 4: quick notes. 5: rides. 6: Im Flow. 7: ride ledger. 8: hobby pages. 9: AB «Deine Abfragen». 10: Strava activities («Training»). 11: timer log. 12: documents (Ich › Dokumente). 13: Fitbit daily values. 15: Google calendar and tasks (14 left out: DP needs none). 16: Reise-Spur (own recordings and «Hier bin ich» places). 17: Paket O «Sportarten» (sportItems). 18: «Velo-Inspektion» (inspections). 19: Paket T «Freie Zeit» (frei)

/** Tables that belong to the user's data and go into every backup file. */
/** Tables on the device that never go into a backup: GA's copy of Google's events and tasks (Google keeps the truth). */
export const NOT_IN_BACKUP = ['gEvents', 'gTasks'];
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
  'flowSessions', // hobby pages: the details of a timed session (id = its flowLog entry)
  'flowTemplates', // hobby pages: timer templates
  'flowStars', // hobby pages: milestone stars reached (id = `${msId}:${star}`), kept forever (flowms.js)
  'abAnswers', // AB «Deine Abfragen»: one row per answer, the history under Ich › Daten › Verlauf (abfragen.js)
  'timerLog', // «Timer» (Z5): every timer that ran, with its kind, length and an optional note (timer.js)
  'activities', // «Training»: every Strava activity with its heart rate per zone (training.js)
  'docs', // P3b «Daten sicher»: Ich › Dokumente, PDFs and photos of papers as data URLs (docs.js)
  'healthDays', // Fitbit via Google Health: one row per day (health.js), observation only
  'tracks', // Paket S «Reise-Spur»: the app's own recordings (kind «rec») and «Hier bin ich» places (kind «place»), spur/spur.js
  'sportItems', // Paket O «Sportarten»: measures and values, notes, lessons, matches, loops, plans per sport (sportsdb.js)
  'inspections', // «Velo-Inspektion»: one row per inspection of a bike, with the result, value, note and photos of every point (inspect/)
  'frei', // Paket T «Freie Zeit»: collection entries with photos, «In this phase …», travel wishes, marks (freidb.js)
];

/**
 * v0.45.1 (G015a) / v0.77.0: settings records that are the app's own memory on this device, not the
 * user's data (tips shown, the Helfer-Code). They never go into a backup (backup.js) and the automatic
 * sync (P8, sync/track.js) never sends them.
 */
export const DEVICE_SETTINGS = ['tips', 'helper', 'offline-strips', 'webcams']; // offline-strips: the map strips kept on this device (U3), their tiles exist only here; webcams: Meine Webcams (Paket Y), private addresses stay here

/**
 * P8 «Automatischer Abgleich»: rows that stay on this device and never sync: the device rows above and
 * the marks of the one-time data updates ('update.…'; every device runs its own, with its own time).
 */
export const syncLocal = (table, key) => table === 'settings' && (DEVICE_SETTINGS.includes(key) || String(key).startsWith('update.'));
/*
 * Paket B (Noah 19.10.2026 «1b»): the Fitbit days (healthDays) and the Fitbit and calendar connection
 * (settings 'health' and 'agenda') sync like everything else. Both devices fetch the same data from Google,
 * so the sync engine settles those copies by itself and never asks about them (sync/engine.js autoPick).
 */

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
 * @property {string} id            e.g. "shop-1234"
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
  // Version 8 (hobby pages, package 1) only adds tables, so existing data stays as it is: the details of a
  // timed session (one per flowLog entry, which stays and keeps counting), timer templates and the
  // milestone stars reached (they never get lost, even when a streak breaks).
  db.version(8).stores({
    flowSessions: 'id, actId, day, tplId',
    flowTemplates: 'id, actId, usedAt',
    flowStars: 'id, msId, day',
  });
  // Version 9 (AB «Deine Abfragen») only adds the answers, so existing data stays as it is: the daily
  // checks stay in flowChecks and the history reads both (abfragen.js mergeHistory).
  db.version(9).stores({
    abAnswers: 'id, qid, day, at',
  });
  // Version 10 («Training», TR1–TR4) only adds every Strava activity (rides, runs, hikes …) with its
  // heart rate per zone; only the rides count for the bikes (kmBook). Existing data stays as it is.
  db.version(10).stores({
    activities: 'id, day, kind',
  });
  // Version 11 («Timer», mockups Z1–Z5) only adds the timer log, so existing data stays as it is.
  db.version(11).stores({
    timerLog: 'id, day, mode',
  });
  // Version 12 (P3b «Daten sicher», Ich › Dokumente) only adds the documents, so existing data stays as it is.
  db.version(12).stores({
    docs: 'id, kind, group, createdAt',
  });
  // Version 13 (Fitbit über Google Health) only adds the daily values, so existing data stays as it is.
  db.version(13).stores({
    healthDays: 'date',
  });
  // Version 15 (Google Kalender und Aufgaben, GA): a copy of Google's events and tasks on this device (NOT_IN_BACKUP).
  // Not in DATA_TABLES: Google keeps the truth, a backup would only carry an old copy. 14 is a gap
  // (Dokumente-PDF needs no version of its own, A's 12 has the documents); Dexie allows it.
  db.version(15).stores({
    gEvents: 'id, day, cal',
    gTasks: 'id, list, due, done',
  });
  // Version 16 (Paket S «Reise-Spur») only adds the app's own recordings and «Hier bin ich» places, so
  // existing data stays as it is. The Strava line sits on the activity (activities.line), the GPX line on the ride.
  db.version(16).stores({
    tracks: 'id, tripId, day, kind',
  });
  // Version 17 (Paket O «Sportarten») only adds the entries of the sport pages, so existing data stays as it is:
  // own measures and their values, «Fürs nächste Mal», lessons, matches, loops, plans (sportsdb.js).
  db.version(17).stores({
    sportItems: 'id, sport, kind, day',
  });
  // Version 18 («Velo-Inspektion», Noah 19.10.2026) only adds the inspections, so existing data stays as it is.
  db.version(18).stores({
    inspections: 'id, bikeId, date',
  });
  // Version 19 (Paket T «Freie Zeit») only adds the table «frei» (collection entries, travel wishes, marks),
  // so existing data stays as it is.
  db.version(19).stores({
    frei: 'id, kind, coll, day',
  });
  // P8 «Automatischer Abgleich»: every save of a data record notes when it changed (and a delete leaves
  // a «tombstone»), in the meta table, in the same step as the save (sync/track.js). No schema change.
  trackSync(db, { tables: DATA_TABLES, skip: syncLocal });
  return db;
}

/** The one database the app uses. */
export const db = createDb();
