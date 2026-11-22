import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { UNITACTS_KEY, NO_SHEET, needsSheet, unitActsOf, withUnitAct, takers, suggestAct, actForUnit, minuteChips, isUnitEntry, weekOfEntry, setUnitTick, unitEntries, removeUnitEntries } from '../src/lib/flow/unitdone.js';
import { WEEKLOG_KEY, logOf, weekLog } from '../src/lib/training/wochenlog.js';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';

const acts = [
  { id: 'a-yoga', name: 'Yoga', order: 1 },
  { id: 'a-run', name: 'Running', nameDe: 'Laufen', order: 2 },
  { id: 'a-ten', name: 'Tennis', order: 3 },
  { id: 'a-old', name: 'Tennis alt', order: 4, paused: true },
  { id: 'a-x', name: 'Freunde', order: 5 },
];

describe('«Plan zuerst»: welche Einheit das Blatt öffnet', () => {
  it('the small daily habits and the rest day tick at once, every other kind opens the sheet', () => {
    expect(NO_SHEET).toEqual(['med', 'stretch', 'rest']);
    for (const t of ['med', 'stretch', 'rest']) expect(needsSheet(t)).toBe(false);
    for (const t of ['tennis', 'bikeOut', 'gym', 'sauna', 'mini']) expect(needsSheet(t)).toBe(true);
  });
});

describe('die Sportart einer Einheit', () => {
  it('a name that fits is suggested (also by the German name), a paused sport never', () => {
    expect(suggestAct('yoga', acts)?.id).toBe('a-yoga');
    expect(suggestAct('runOut', acts)?.id).toBe('a-run');
    expect(suggestAct('tennis', acts)?.id).toBe('a-ten'); // the paused «Tennis alt» is not taken
    expect(suggestAct('hockey', acts)).toBeNull();
    expect(suggestAct('rest', acts)).toBeNull();
  });
  it('the remembered sport wins over the suggestion and only counts while it exists and is not paused', () => {
    const raw = { v: 1, map: { tennis: 'a-x' } };
    expect(actForUnit('tennis', acts, raw)).toEqual({ act: acts[4], remembered: true });
    expect(actForUnit('tennis', acts, { v: 1, map: { tennis: 'gone' } })).toEqual({ act: acts[2], remembered: false });
    expect(actForUnit('tennis', acts, { v: 1, map: { tennis: 'a-old' } }).act.id).toBe('a-ten');
    expect(actForUnit('hockey', acts, null)).toEqual({ act: null, remembered: false });
  });
  it('the setting is cleaned and changes without touching the one given', () => {
    expect(unitActsOf(null)).toEqual({ v: 1, map: {} });
    expect(unitActsOf({ map: { tennis: 'a-ten', x: 3, y: '' } })).toEqual({ v: 1, map: { tennis: 'a-ten' } });
    const a = { v: 1, map: { tennis: 'a-ten' } };
    expect(withUnitAct(a, 'yoga', 'a-yoga')).toEqual({ v: 1, map: { tennis: 'a-ten', yoga: 'a-yoga' } });
    expect(withUnitAct(a, 'tennis', null)).toEqual({ v: 1, map: {} });
    expect(a).toEqual({ v: 1, map: { tennis: 'a-ten' } });
  });
  it('takers sorts by order and drops the paused', () => {
    expect(takers([...acts].reverse()).map((a) => a.id)).toEqual(['a-yoga', 'a-run', 'a-ten', 'a-x']);
  });
});

describe('die Dauer-Chips', () => {
  it('the minutes of the unit join the usual chips, once, ascending', () => {
    expect(minuteChips(100)).toEqual([30, 45, 60, 90, 100]);
    expect(minuteChips(60)).toEqual([30, 45, 60, 90]);
    expect(minuteChips(25)).toEqual([25, 30, 45, 60, 90]);
    expect(minuteChips(null)).toEqual([30, 45, 60, 90]);
    expect(minuteChips(5000)).toEqual([30, 45, 60, 90]);
  });
});

describe('der Haken im Wochenplan und im Verlauf', () => {
  const day = '2026-11-18'; // a Wednesday; its Monday is 2026-11-16
  const e = { id: 'fl-p', actId: 'a-ten', day, at: '2026-11-18T08:00:00.000Z', n: 1, via: 'plan', unit: 'tennis@1', min: 60, feel: 'good' };
  it('an entry of a unit is recognised, with its week', () => {
    expect(isUnitEntry(e)).toBe(true);
    expect(isUnitEntry({ ...e, via: 'hand' })).toBe(false);
    expect(isUnitEntry({ ...e, unit: '' })).toBe(false);
    expect(isUnitEntry(null)).toBe(false);
    expect(weekOfEntry(e)).toBe('2026-11-16');
  });
  it('the tick of a unit is written to training.weeklog and taken back; a past week is left alone', async () => {
    const db = createDb('unit-a');
    expect(await setUnitTick(db, { monday: '2026-11-16', id: 'tennis@1', on: true, today: day })).toBe(true);
    let log = logOf((await db.settings.get(WEEKLOG_KEY)).value);
    expect(weekLog(log, '2026-11-16').done).toEqual({ 'tennis@1': day });
    expect(await setUnitTick(db, { monday: '2026-11-16', id: 'tennis@1', on: false, today: day })).toBe(true);
    log = logOf((await db.settings.get(WEEKLOG_KEY)).value);
    expect(weekLog(log, '2026-11-16').done).toEqual({});
    expect(await setUnitTick(db, { monday: '2026-11-02', id: 'tennis@1', on: true, today: day })).toBe(false); // week is over
  });
  it('the entries of a unit are found by unit and week and taken away together', async () => {
    const db = createDb('unit-b');
    await db.flowLog.bulkPut([e, { ...e, id: 'fl-other', unit: 'yoga@1' }, { ...e, id: 'fl-week', day: '2026-11-25' }, { ...e, id: 'fl-hand', via: 'hand' }]);
    expect((await unitEntries(db, '2026-11-16', 'tennis@1')).map((x) => x.id)).toEqual(['fl-p']);
    expect((await removeUnitEntries(db, '2026-11-16', 'tennis@1')).map((x) => x.id)).toEqual(['fl-p']);
    expect(await db.flowLog.get('fl-p')).toBeUndefined();
    expect(await db.flowLog.get('fl-other')).toBeDefined();
    expect(await db.flowLog.get('fl-week')).toBeDefined();
  });
});

describe('das neue Feld «unit» und die neue Einstellung im Backup', () => {
  const e = { id: 'fl-1', actId: 'a-ten', day: '2026-11-18', at: '2026-11-18T08:00:00.000Z', n: 1, via: 'plan', unit: 'tennis@1', min: 60, feel: 'good' };
  it('entries with and without unit and the setting survive export → import unchanged, the file stays valid', async () => {
    const db = createDb('unit-c');
    const old = { ...e, id: 'fl-old', via: undefined, unit: undefined, min: undefined, feel: undefined };
    delete old.via; delete old.unit; delete old.min; delete old.feel;
    await db.flowLog.bulkPut([old, e]);
    await db.settings.put({ key: UNITACTS_KEY, value: { v: 1, map: { tennis: 'a-ten' } } });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(validateBackup(file)).toEqual([]);
    const other = createDb('unit-d');
    await restoreBackup(other, file, 'replace');
    expect(await other.flowLog.get('fl-1')).toEqual(e);
    expect(await other.flowLog.get('fl-old')).toEqual(old);
    expect((await other.settings.get(UNITACTS_KEY)).value).toEqual({ v: 1, map: { tennis: 'a-ten' } });
  });
  it('an old backup without the setting restores as it was and the sports are suggested again', async () => {
    const db = createDb('unit-e');
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { flowLog: [{ ...e, id: 'fl-z' }] } }, 'replace');
    expect(await db.settings.get(UNITACTS_KEY)).toBeUndefined();
    expect(actForUnit('tennis', acts, (await db.settings.get(UNITACTS_KEY))?.value).act.id).toBe('a-ten');
  });
});
