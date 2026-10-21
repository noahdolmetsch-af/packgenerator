/**
 * P8 «Automatischer Abgleich»: when a round runs by itself (only while the sync is switched on):
 * a moment after the app opens, when it comes back to the front, when the network is back,
 * 20 s after a change on this device, and every 5 minutes while it is open. One round at a time.
 *
 * sync.state is what the panel and the question window show.
 */
import { liveQuery } from 'dexie';
import { syncNow, readCfg, ASK, settleAsks } from './engine.js';

export const AFTER_CHANGE_MS = 20_000;
export const EVERY_MS = 5 * 60_000;

/**
 * The question window: open, and how many questions «Later» already put aside.
 * first: the panel asks one question for all after pairing; the window waits meanwhile.
 */
export const syncUi = $state({ open: false, seen: 0, first: false, quietUntil: readQuiet() });

/*
 * Noah 21.10.2026 («kommt immer wieder beim Navigieren», «Später» hilft nicht): «Later» keeps the window
 * shut for an hour (rule 8: «Später» = 1 h), also over a reload and when new questions arrive meanwhile.
 * The questions stay in Ich › Daten und Backup; «Decide» there opens the window at once.
 */
export const QUIET_LS = 'pg.sync.later';
export const QUIET_MS = 60 * 60_000;
function readQuiet() {
  try {
    return Number(globalThis.localStorage?.getItem(QUIET_LS)) || 0;
  } catch {
    return 0;
  }
}
export function quietLater(now = Date.now()) {
  syncUi.quietUntil = now + QUIET_MS;
  try {
    globalThis.localStorage?.setItem(QUIET_LS, String(syncUi.quietUntil));
  } catch {
    /* a private window: quiet until the next reload */
  }
}

export const sync = $state({ running: false, asks: 0, last: null, error: null, on: false, big: 0, autoOpen: true, asList: false });

/**
 * Noah 18.10.2026 «1b und a kann eingestellt werden 2a oder umschalten auf b»: how the questions come.
 * settings 'syncAsk' { auto: open the window by itself (default; false = only a hint), list: all at once (default: one by one) }.
 * Noah 18.10.2026 20:07 «1a 2a 3a» (newest): the window opens by itself; the hint stays as a setting.
 */
export const ASK_PREFS = 'syncAsk';
export async function setAskPrefs(db, patch) {
  const cur = (await db.settings.get(ASK_PREFS))?.value ?? {};
  await db.settings.put({ key: ASK_PREFS, value: { ...cur, ...patch } });
}

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
  // questions a rule answers (Strava activities fetched on both devices): gone at once, before any round
  // and even without the internet, so the window does not open for them (Noah 20.10.2026 «Schon wieder»)
  settleAsks(db).catch(() => {});
  liveQuery(async () => ({ cfg: await readCfg(db), asks: await db.meta.where('key').startsWith(ASK).count(), prefs: (await db.settings.get(ASK_PREFS))?.value ?? {} })).subscribe({
    next: ({ cfg, asks, prefs }) => {
      sync.autoOpen = prefs.auto !== false; // Noah 18.10.2026 20:07 «1a»: by itself unless switched off
      sync.asList = !!prefs.list;
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
