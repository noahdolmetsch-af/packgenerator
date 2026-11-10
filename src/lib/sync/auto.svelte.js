/**
 * P8 «Automatischer Abgleich»: when a round runs by itself (only while the sync is switched on):
 * a moment after the app opens, when it comes back to the front, when the network is back,
 * 2 s after a change on this device, when the app is hidden with unsent changes, and every 20 s while it is
 * open and in front (every 60 s once nothing happened for a while; Noah 10.11.2026 «sofort», cost: one small
 * question to the server each time). One round at a time.
 *
 * sync is what the panel shows. Noah 24.10.2026: nothing about the sync ever shows outside Ich › Daten
 * und Backup: a change on both devices settles by itself (engine.js settle), an error waits for the next
 * round, which runs by itself.
 */
import { liveQuery } from 'dexie';
import { syncNow, readCfg, settleAsks } from './engine.js';

export const AFTER_CHANGE_MS = 2_000;
/** While the app is open and in front it asks the server for news this often; after QUIET_AFTER rounds without news every QUIET_MS. */
export const POLL_MS = 20_000;
export const QUIET_MS = 60_000;
export const QUIET_AFTER = 10;
export const nextPollDelay = (quiet) => (quiet >= QUIET_AFTER ? QUIET_MS : POLL_MS);
/** Noah 10.11.2026: a round on the phone hung for minutes and everything waited behind it. A round is asked to stop
 *  at its next checkpoint after ROUND_MAX_MS; when it still does not end, the next one may start FREE_AFTER_MS later. */
export const ROUND_MAX_MS = 3 * 60_000;
export const FREE_AFTER_MS = 30_000;
/** A round that stopped early (its pull ran out of time) is followed by the next one after this. */
export const CONTINUE_MS = 1_000;

export const sync = $state({ running: false, last: null, error: null, on: false, big: 0, since: 0, phase: '', n: 0 });

const device = () => (globalThis.matchMedia?.('(pointer: coarse)').matches ? 'phone' : 'computer');

let running = null;
let current = null; // the round that runs: { stop, freed, release }
let queued = null; // the round asked for while one runs: it starts right after that one
let dbRef = null;
let quiet = 0; // rounds in a row that brought and sent nothing
/** Something happened (a change here, the app came to the front, the person pulled): ask often again. */
export const wake = () => (quiet = 0);

/**
 * Run one round now, or once more right after the one running. The promise is always for a round that
 * starts after this call: pairing while a round already runs waits for its own round, so the panel says
 * «Gekoppelt» or the error of that round, not the result of the older one.
 */
export function runSync(db = dbRef) {
  if (!db) return Promise.resolve(null);
  if (running) {
    // the running round ends, or is freed after ROUND_MAX_MS + FREE_AFTER_MS (it hangs): then this one starts
    queued ??= Promise.race([running, current.freed]).then(() => {
      queued = null;
      return runSync(db);
    });
    return queued;
  }
  const me = { stop: false };
  me.freed = new Promise((release) => (me.release = release));
  current = me;
  const asked = setTimeout(() => (me.stop = true), ROUND_MAX_MS);
  const freeing = setTimeout(() => {
    if (current !== me) return;
    // still running although it was asked to stop: it hangs. Let the next round start; this one stops at its next step.
    current = null;
    running = null;
    sync.running = false;
    sync.phase = '';
    me.release();
  }, ROUND_MAX_MS + FREE_AFTER_MS);
  const round = (async () => {
    sync.running = true;
    sync.since = Date.now();
    sync.phase = '';
    sync.n = 0;
    try {
      const r = await syncNow(db, { dev: device(), shouldStop: () => me.stop, onProgress: (p) => { sync.phase = p.phase; sync.n = p.n; } });
      quiet = r && (r.taken || r.sent || r.more) ? 0 : quiet + 1;
      // Einzelidee 34: a reminder ticked off on the other device no longer comes to this phone
      import('../push/client.js').then((p) => p.afterSync()).catch(() => {});
      // the pull stopped early: go on where it stopped (Noah 10.11.2026), the sent changes are already away
      if (r?.more && !me.stop) setTimeout(() => runSync(db), CONTINUE_MS);
      return r;
    } catch {
      return null; // the error is in syncCfg, the panel shows it
    } finally {
      clearTimeout(asked);
      clearTimeout(freeing);
      if (current === me) {
        sync.running = false;
        sync.phase = '';
        running = null;
        current = null;
      }
      me.release();
    }
  })();
  running = round;
  return round;
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
  // a change of a data record: its note in the meta table. (The query is 0 while the sync is off, so n > 0 means on.)
  let lastDirty = -1;
  liveQuery(async () => ((await readCfg(db))?.on ? db.meta.where('key').startsWith('sync|').filter((x) => x.dirty === 1).count() : 0)).subscribe({
    next: (n) => {
      if (n > 0 && n !== lastDirty) {
        wake();
        clearTimeout(changeTimer);
        changeTimer = setTimeout(() => runSync(db), AFTER_CHANGE_MS);
      }
      lastDirty = n;
    },
    error: () => {},
  });
  setTimeout(() => runSync(db), 3000);
  // while the app is in front: ask for news every 20 s (60 s when it is quiet); hidden: no timer at all
  let pollTimer = null;
  const poll = () => {
    clearTimeout(pollTimer);
    if (win.document?.visibilityState === 'hidden') return;
    pollTimer = setTimeout(async () => {
      if (sync.on) await runSync(db);
      poll();
    }, nextPollDelay(quiet));
  };
  win.document?.addEventListener?.('visibilitychange', () => {
    if (win.document.visibilityState === 'visible') {
      wake();
      runSync(db);
      poll();
    } else if (win.document.visibilityState === 'hidden') {
      clearTimeout(pollTimer);
      // Noah 10.11.2026: a phone that is locked or swiped away may stop its timers: what changed goes out now, not in 2 s
      if (sync.on && lastDirty > 0) {
        clearTimeout(changeTimer);
        runSync(db);
      }
    }
  });
  win.addEventListener?.('online', () => {
    wake();
    runSync(db);
  });
  poll();
}
