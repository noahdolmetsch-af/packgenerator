// «Woche leichter oder härter» (V4b2 Teil 2) writes a new flag `hard` into `mode` of a week in the setting
// `training.weeklog`. Noah (22.11.2026): data changes are checked with a copy of a backup first. A backup in the
// OLD format (no `hard` anywhere) is restored into a second database; the week reads as before, «härter» can be
// switched on and off, a new backup carries it, and an old app (which knows only `light`) loses nothing else.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';
import { WEEKLOG_KEY, logOf, weekLog, setMode } from '../src/lib/training/wochenlog.js';
import { WEEKPLAN_KEY, planOf, modeCfg, isSummer } from '../src/lib/training/wochenplan.js';

const MONDAY = '2026-11-23';
const TODAY = '2026-11-22';

// The old format: a week with `light` only, one week that is already past, a done unit, a moved unit.
const OLD_LOG = {
  v: 1,
  weeks: {
    '2026-11-09': { done: { u1: '2026-11-10' }, no: [], pins: {}, mode: { light: true }, released: [], snap: null },
    [MONDAY]: { done: {}, no: ['x'], pins: { u2: { d: 2, t: '18:00' } }, mode: { rain: true }, released: [], snap: null },
  },
};

let n = 0;
async function backupCopy() {
  const src = createDb(`wochenart-src-${++n}`);
  await src.settings.put({ key: WEEKLOG_KEY, value: JSON.parse(JSON.stringify(OLD_LOG)) });
  await src.settings.put({ key: WEEKPLAN_KEY, value: planOf(null) });
  const file = JSON.parse(JSON.stringify(await buildBackup(src))); // what «Backup speichern» writes
  expect(validateBackup(file)).toEqual([]);
  const copy = createDb(`wochenart-copy-${++n}`);
  await restoreBackup(copy, file, 'replace');
  return { file, copy };
}

describe('Woche härter, from a copy of an old backup', () => {
  it('the old log reads as before and has no `hard` anywhere', async () => {
    const { copy } = await backupCopy();
    const raw = (await copy.settings.get(WEEKLOG_KEY)).value;
    expect(JSON.stringify(raw)).not.toContain('hard');
    const log = logOf(raw);
    expect(weekLog(log, '2026-11-09').mode).toEqual({ light: true });
    expect(weekLog(log, '2026-11-09').done).toEqual({ u1: '2026-11-10' });
    expect(weekLog(log, MONDAY).mode).toEqual({ rain: true });
    expect(weekLog(log, MONDAY).pins).toEqual({ u2: { d: 2, t: '18:00' } });
  });

  it('härter is switched on and off in the copy and the rest of the week stays', async () => {
    const { copy } = await backupCopy();
    const log0 = logOf((await copy.settings.get(WEEKLOG_KEY)).value);
    const on = setMode(log0, MONDAY, { ...weekLog(log0, MONDAY).mode, hard: true }, TODAY);
    expect(weekLog(on, MONDAY).mode).toEqual({ rain: true, hard: true });
    expect(weekLog(on, MONDAY).pins).toEqual({ u2: { d: 2, t: '18:00' } });
    await copy.settings.put({ key: WEEKLOG_KEY, value: JSON.parse(JSON.stringify(on)) });
    // the new backup carries it and restores into a third database
    const file = JSON.parse(JSON.stringify(await buildBackup(copy)));
    expect(validateBackup(file)).toEqual([]);
    const third = createDb(`wochenart-third-${++n}`);
    await restoreBackup(third, file, 'replace');
    const back = logOf((await third.settings.get(WEEKLOG_KEY)).value);
    expect(weekLog(back, MONDAY).mode).toEqual({ rain: true, hard: true });
    const off = setMode(back, MONDAY, { rain: true }, TODAY);
    expect(weekLog(off, MONDAY).mode).toEqual({ rain: true });
  });

  it('a past week stays as it was, even if härter is tried on it', async () => {
    const { copy } = await backupCopy();
    const log0 = logOf((await copy.settings.get(WEEKLOG_KEY)).value);
    const tried = setMode(log0, '2026-11-09', { hard: true }, TODAY);
    expect(weekLog(tried, '2026-11-09').mode).toEqual({ light: true });
  });

  it('a week is lighter or harder, never both, also when a file says both', () => {
    const log = logOf({ v: 1, weeks: { [MONDAY]: { mode: { light: true, hard: true } } } });
    expect(weekLog(log, MONDAY).mode).toEqual({ hard: true });
  });

  it('the hours of a harder week are 120 % of the plan and at most 24, the lighter one 60 %', () => {
    const cfg = planOf(null).winter;
    const summer = isSummer(MONDAY);
    const hard = modeCfg(cfg, summer, { hard: true });
    const light = modeCfg(cfg, summer, { light: true });
    expect(hard.hours).toBe(Math.min(24, Math.round(cfg.hours * 1.2)));
    expect(light.hours).toBeLessThan(cfg.hours);
    expect(modeCfg(cfg, summer, {})).toBe(cfg);
  });
});
