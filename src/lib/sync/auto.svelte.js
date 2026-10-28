/**
 * P8 «Automatischer Abgleich»: when a round runs by itself (only while the sync is switched on):
 * a moment after the app opens, when it comes back to the front, when the network is back,
 * 20 s after a change on this device, and every 5 minutes while it is open. One round at a time.
 *
 * sync is what the panel shows. Noah 24.10.2026: nothing about the sync ever shows outside Ich › Daten
 * und Backup: a change on both devices settles by itself (engine.js settle), an error waits for the next
 * round, which runs by itself.
 */
import { liveQuery } from 'dexie';
import { syncNow, readCfg, settleAsks } from './engine.js';

export const AFTER_CHANGE_MS = 20_000;
export const EVERY_MS = 5 * 60_000;

export const sync = $state({ running: false, last: null, error: null, on: false, big: 0 });

const device = () => (globalThis.matchMedia?.('(pointer: coarse)').matches ? 'phone' : 'computer');

let running = null;
let queued = null; // the round asked for while one runs: it starts right after that one
let dbRef = null;

/**
 * Run one round now, or once more right after the one running. The promise is always for a round that
 * starts after this call: pairing while a round already runs waits for its own round, so the panel says
 * «Gekoppelt» or the error of that round, not the result of the older one.
 */
export function runSync(db = dbRef) {
  if (!db) return Promise.resolve(null);
  if (running) {
    queued ??= running.then(() => {
      queued = null;
      return runSync(db);
    });
    return queued;
  }
  running = (async () => {
    sync.running = true;
    try {
      const r = await syncNow(db, { dev: device() });
      // Einzelidee 34: a reminder ticked off on the other device no longer comes to this phone
      import('../push/client.js').then((p) => p.afterSync()).catch(() => {});
      return r;
    } catch {
      return null; // the error is in syncCfg, the panel shows it
    } finally {
      sync.running = false;
      running = null;
    }
  })();
  return running;
}

let changeTimer = null;
/** Start watching (main.js). Safe to call once. */
export function watchSync(db, win = globalThis) {
  if (dbRef) return;
  dbRef = db;
  // questions left from before 24.10.2026: they settle at once, before any round and even offline
  settleAsks(db).catch(() => {});
  liveQuery(() => readCfg(db)).subscribe({
    next: (cfg) => {
      sync.on = !!cfg?.on;
      sync.last = cfg?.lastAt ?? null;
      sync.error = cfg?.error ?? null;
      sync.big = cfg?.big ?? 0;
    },
    error: () => {},
  });
  // a change of a data record: its note in the meta table
  let lastDirty = -1;
  liveQuery(async () => ((await readCfg(db))?.on ? db.meta.where('key').startsWith('sync|').filter((x) => x.dirty === 1).count() : 0)).subscribe({
    next: (n) => {
      if (n > 0 && n !== lastDirty && sync.on) {
        clearTimeout(changeTimer);
        changeTimer = setTimeout(() => runSync(db), AFTER_CHANGE_MS);
      }
      lastDirty = n;
    },
    error: () => {},
  });
  setTimeout(() => runSync(db), 3000);
  win.document?.addEventListener?.('visibilitychange', () => {
    if (win.document.visibilityState === 'visible') runSync(db);
  });
  win.addEventListener?.('online', () => runSync(db));
  setInterval(() => {
    if (win.document?.visibilityState !== 'hidden') runSync(db);
  }, EVERY_MS);
}
