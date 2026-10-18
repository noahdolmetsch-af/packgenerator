/**
 * P8 «Automatischer Abgleich»: when a round runs by itself (only while the sync is switched on):
 * a moment after the app opens, when it comes back to the front, when the network is back,
 * 20 s after a change on this device, and every 5 minutes while it is open. One round at a time.
 *
 * sync.state is what the panel and the question window show.
 */
import { liveQuery } from 'dexie';
import { syncNow, readCfg, ASK } from './engine.js';

export const AFTER_CHANGE_MS = 20_000;
export const EVERY_MS = 5 * 60_000;

/** The question window: open, and how many questions «Later» already put aside. */
export const syncUi = $state({ open: false, seen: 0 });

export const sync = $state({ running: false, asks: 0, last: null, error: null, on: false, big: 0 });

const device = () => (globalThis.matchMedia?.('(pointer: coarse)').matches ? 'phone' : 'computer');

let running = null;
let again = false;
let dbRef = null;

/** Run one round now (or once more right after the one running). */
export function runSync(db = dbRef) {
  if (!db) return Promise.resolve(null);
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    sync.running = true;
    try {
      return await syncNow(db, { dev: device() });
    } catch {
      return null; // the error is in syncCfg, the panel shows it
    } finally {
      sync.running = false;
      running = null;
      if (again) {
        again = false;
        runSync(db);
      }
    }
  })();
  return running;
}

let changeTimer = null;
/** Start watching (main.js). Safe to call once. */
export function watchSync(db, win = globalThis) {
  if (dbRef) return;
  dbRef = db;
  liveQuery(async () => ({ cfg: await readCfg(db), asks: await db.meta.where('key').startsWith(ASK).count() })).subscribe({
    next: ({ cfg, asks }) => {
      sync.on = !!cfg?.on;
      sync.last = cfg?.lastAt ?? null;
      sync.error = cfg?.error ?? null;
      sync.big = cfg?.big ?? 0;
      sync.asks = asks;
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
