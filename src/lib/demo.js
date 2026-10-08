/**
 * Demo mode (Noah, 4.10.2026: "als Demo-Touren in deiner App, die du später löschst").
 *
 * A demo file is a backup file with a "demo" field: { name, note, clock? }. Starting it
 * 1. keeps a full copy of your data (in the "meta" table, never exported),
 * 2. merges the demo trips into your data.
 * "End demo" puts that copy back exactly: everything done in the demo is gone, also the km or
 * learnings a demo debrief added. While the demo runs, the automatic folder backup and the backup
 * file are off, so no demo data ends up in a backup.
 *
 * Demo day: the app can act as if it were another day (to try the packing day, the ride days and
 * the debrief now). The offset is kept in localStorage and applied in main.js before the app starts.
 */
import { buildBackup, restoreBackup, validateBackup } from './backup.js';
import { blocksAfterImport } from './updates.js';
import { t } from './i18n.svelte.js';

export const DEMO_KEY = 'demo';
export const CLOCK_KEY = 'demo.clockOffset';

/** Is this parsed file a demo file? */
export const isDemoFile = (data) => !!data?.demo && typeof data.demo === 'object';

/** The running demo ({ name, note, startedAt, days }) or null. Without the snapshot (it is big). */
export async function demoState(db) {
  const rec = await db.table('meta').get(DEMO_KEY);
  if (!rec) return null;
  const { snapshot, ...rest } = rec;
  return rest;
}

/** Start a demo: copy everything, then merge the demo data. */
export async function startDemo(db, data, now = new Date()) {
  const problems = validateBackup(data);
  if (problems.length) throw new Error(problems.join(' '));
  if (await db.table('meta').get(DEMO_KEY)) throw new Error(t('A demo is already running. End it first.'));
  const snapshot = await buildBackup(db);
  await db.table('meta').put({ key: DEMO_KEY, name: data.demo.name ?? 'Demo', note: data.demo.note ?? '', days: data.demo.days ?? [], startedAt: now.toISOString(), snapshot });
  try {
    await restoreBackup(db, data, 'merge');
    await blocksAfterImport(db, data, 'merge'); // v0.33.0: old demo data gets the building blocks (tidyData)
  } catch (err) {
    await db.table('meta').delete(DEMO_KEY);
    throw err;
  }
}

/** End the demo: your data exactly as before the demo. */
export async function endDemo(db) {
  const rec = await db.table('meta').get(DEMO_KEY);
  if (!rec) return false;
  await restoreBackup(db, rec.snapshot, 'replace');
  await blocksAfterImport(db, rec.snapshot, 'replace'); // a copy from before v0.33.0: updated on the next start
  await db.table('meta').delete(DEMO_KEY);
  setClock(null);
  return true;
}

/* ---------- demo day ---------- */

/** Act as if today were this date (YYYY-MM-DD), or null for the real day. Reload afterwards. */
/** The real time, even while the demo day shifts Date. */
export const realNow = () => (globalThis.Date.realNow ? globalThis.Date.realNow() : Date.now());

export function setClock(date, now = realNow()) {
  try {
    if (!date) localStorage.removeItem(CLOCK_KEY);
    else {
      const real = new Date(now);
      const want = new Date(`${date}T00:00:00`);
      want.setHours(real.getHours(), real.getMinutes(), real.getSeconds());
      localStorage.setItem(CLOCK_KEY, String(want.getTime() - now));
    }
  } catch {
    /* private mode: no demo day */
  }
}

/** The offset in ms, 0 when none. */
export function clockOffset() {
  try {
    return Number(localStorage.getItem(CLOCK_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Make "new Date()" and "Date.now()" run with the offset. Called once, before the app starts. */
export function applyClock(offset = clockOffset()) {
  if (!offset || globalThis.Date.demoShifted) return;
  const Real = globalThis.Date;
  class DemoDate extends Real {
    constructor(...args) {
      super(...(args.length ? args : [Real.now() + offset]));
    }
    static now() {
      return Real.now() + offset;
    }
  }
  DemoDate.demoShifted = true;
  DemoDate.realNow = () => Real.now();
  globalThis.Date = DemoDate;
}
