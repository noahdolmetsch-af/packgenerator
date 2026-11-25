/**
 * «Aktivitäten-Zusammenfassung» (Noah 25.11.2026 «a», thread «App doppelt so schnell machen»).
 *
 * Why: a Strava activity in `activities` weighs about 25 KB, and 90 % of that are the raw curves of ONE ride (heart rate, power,
 * height, splits …) that only the page of that ride draws. With Noah's 1'447 activities (36 MB) eight places read the whole table
 * at every start of Heute, and every change of page again: 8 s until Heute stood (computer), 25 s on the phone (4× slower).
 *
 * What: `activitiesLite` (db.js, schema 22) holds the same rows WITHOUT the raw curves (HEAVY_KEYS, about 2 MB for 1'447 rows).
 * It is derived: a Dexie middleware (maintainLite) writes it in the same step as every save, delete or clear of `activities`, it
 * is never in a backup and never synced (sync/geraet.js), and buildLite makes it again from `activities` whenever it is not
 * ready (first start after the update, or when the two counts differ). Nothing in `activities` changes: the rows keep all fields.
 *
 * Reading: a list that needs only the small fields reads `await liteTable(db)` instead of `db.activities` (same API, same
 * indexes). Until the lite table is ready `liteTable` gives `db.activities`, so the answer is always right, only slow once.
 * A reader that draws the curves of a ride, or that WRITES a row back, reads `db.activities` (the full table).
 *
 * Safety: a lite row carries `_lite: true`; the middleware refuses to put such a row into `activities`, so a reader that wrongly
 * wrote a slim row back could never wipe the curves of a ride (it throws instead). tests/actlite.test.js checks all of this.
 */

/**
 * The raw curves of ONE ride (training.js KEEP, the big ones: about 32 of the 36 MB with Noah's 1'447 activities). They are not in a lite row.
 * The small summaries stay (hist, pHist, cHist = time per zone; pCurve, hCurve, best, p25 = best values; halves, pauses): the lists of
 * weeks, zones and power read them. A reader of a ride's page (curves, laps, segments, climbs, photos) reads the full table.
 */
import Dexie from 'dexie';
export const HEAVY_KEYS = ['ser', 'sprof', 'prof', 'segs', 'dprof', 'splits', 'hw', 'curve', 'climbs', 'secs5', 'laps', 'photos'];
const HEAVY = new Set(HEAVY_KEYS);

/** The table of the summary (db.js schema 22). */
export const LITE = 'activitiesLite';
/** meta key: the summary was built completely ({ v, at, n }). Not exported, not synced. */
export const LITE_KEY = 'actlite';
/** Bump when HEAVY_KEYS changes: every device builds the summary again once. */
export const LITE_V = 1;
/** The mark on every lite row. */
export const MARK = '_lite';

/** One activity row → its lite row (a shallow copy without the raw curves, with the mark). */
export function liteOf(row) {
  const out = { [MARK]: true };
  for (const k of Object.keys(row)) if (!HEAVY.has(k)) out[k] = row[k];
  return out;
}

/** Is this row a lite row (slim)? */
export const isLite = (row) => !!row && row[MARK] === true;

/**
 * The middleware: every writing step that touches `activities` also writes `activitiesLite`, in the same transaction.
 * Call once on the database before it opens (db.js createDb does).
 */
export function maintainLite(db) {
  db.use({
    stack: 'dbcore',
    name: 'pg-activities-lite',
    create(down) {
      return {
        ...down,
        transaction(stores, mode, options) {
          // while the database is being opened for the first time after the update, the table does not exist yet: nothing to add then
          const add = mode === 'readwrite' && stores.includes('activities') && !stores.includes(LITE) && down.schema.tables.some((t) => t.name === LITE);
          return down.transaction(add ? [...stores, LITE] : stores, mode, options);
        },
        table(name) {
          const table = down.table(name);
          if (name !== 'activities') return table;
          return {
            ...table,
            async mutate(req) {
              if ((req.type === 'add' || req.type === 'put') && req.values.some(isLite)) {
                throw new Error('A slim row of the activity summary must never be saved into activities (it would delete the curves of the ride).');
              }
              const res = await table.mutate(req);
              // (not yet there while the first opening after the update writes: nothing to keep in step, buildLite makes it)
              if (!down.schema.tables.some((t) => t.name === LITE)) return res;
              const lite = down.table(LITE);
              if (req.type === 'add' || req.type === 'put') {
                const ok = req.values.filter((_, i) => !(res.failures && res.failures[i] !== undefined));
                if (ok.length) await lite.mutate({ type: 'put', trans: req.trans, values: ok.map(liteOf) });
              } else if (req.type === 'delete') {
                await lite.mutate({ type: 'delete', trans: req.trans, keys: req.keys });
              } else if (req.type === 'deleteRange') {
                await lite.mutate({ type: 'deleteRange', trans: req.trans, range: req.range });
              }
              return res;
            },
          };
        },
      };
    },
  });
}

const states = new WeakMap(); // db → { ready, readyP, building }
const stateOf = (db) => {
  let s = states.get(db);
  if (!s) states.set(db, (s = { ready: false, readyP: null, building: null }));
  return s;
};

/** Is the summary complete? Built once (marker) and the same number of rows as `activities`. */
export async function checkLite(db) {
  const [a, b] = await Promise.all([db.activities.count(), db.table(LITE).count()]);
  // no activities and an empty summary (a new app, a test): both are the same by definition, nothing to build and nothing to write
  if (a === 0 && b === 0) return true;
  const mark = await db.meta.get(LITE_KEY);
  if (mark?.v !== LITE_V) return false;
  return a === b;
}

/**
 * Makes the summary from `activities`, 25 rows per step (read and write in ONE transaction, so a save in between is never overwritten
 * by an older read), with a breath between the steps. Sets the marker at the end.
 */
export async function buildLite(db, { chunk = 25, breath = () => new Promise((r) => setTimeout(r, 0)) } = {}) {
  const s = stateOf(db);
  if (s.building) return s.building;
  s.building = (async () => {
    const ids = await db.activities.toCollection().primaryKeys();
    await db.table(LITE).clear();
    for (let i = 0; i < ids.length; i += chunk) {
      const part = ids.slice(i, i + chunk);
      await db.transaction('rw', db.activities, db.table(LITE), async () => {
        const rows = (await db.activities.bulkGet(part)).filter(Boolean);
        if (rows.length) await db.table(LITE).bulkPut(rows.map(liteOf));
      });
      await breath();
    }
    await db.meta.put({ key: LITE_KEY, v: LITE_V, at: new Date().toISOString(), n: ids.length });
    s.ready = await checkLite(db);
    return s.ready;
  })()
    .catch(() => false)
    .finally(() => {
      s.building = null;
    });
  return s.building;
}

/**
 * Starts the check (once per database) and, when the summary is not ready, builds it after `delay` ms so the first picture of Heute
 * is not slowed down. Call at the start of the app (main.js) before anything reads. Never throws.
 */
export function startLite(db, { delay = 4000 } = {}) {
  const s = stateOf(db);
  if (!s.readyP) {
    s.readyP = (async () => {
      try {
        s.ready = !!db.table(LITE) && (await checkLite(db));
      } catch {
        s.ready = false;
      }
      if (!s.ready) setTimeout(() => buildLite(db).catch(() => {}), delay);
      return s.ready;
    })();
  }
  return s.readyP;
}

/** The table a list should read: the summary when it is ready, else the full `activities`. A database without the summary gives `activities`. */
export async function liteTable(db) {
  if (!db?.activitiesLite) return db.activities;
  const s = stateOf(db);
  // Dexie.Promise, not the plain promise of startLite: a liveQuery loses track of the tables it reads when it awaits a promise that
  // began outside of it (the card would never see a later save)
  await Dexie.Promise.resolve(startLite(db));
  if (!s.ready) return db.activities;
  // one cheap count of each table (no rows are read): a row that came into `activities` past the app (an older tab, a test writing straight
  // into IndexedDB) shows as a different count; then the full table answers and the summary is made again
  const [a, b] = await Dexie.Promise.all([db.activities.count(), db.activitiesLite.count()]).catch(() => [0, -1]);
  if (a === b) return db.activitiesLite;
  s.ready = false;
  setTimeout(() => buildLite(db).catch(() => {}), 1000);
  return db.activities;
}

/** `fn(table)` on the table a list should read: db.activitiesLite when ready, else db.activities (a one-line reader). */
export const readLite = async (db, fn) => fn(await liteTable(db));

/** For tests: forget what is known about a database. */
export function resetLite(db) {
  states.delete(db);
}
