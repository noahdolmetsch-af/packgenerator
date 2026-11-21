// «Übliche Dauer» (Noah 21.11.2026 «2b», S1): the setting per sport, standard 60 min, never mixed with minMin.
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { USUAL_KEY, DEFAULT_MIN, STANDARD_RULES, standardFor, cleanMin, usualMap, usualFor, withUsual, readUsual, saveUsual, restoreUsual } from '../src/lib/flow/usualmin.js';
import { normAct } from '../src/lib/flow.js';
import DE from '../src/lib/i18n/de/index.js';

describe('the usual duration of a sport', () => {
  it('without a setting a session counts one hour', () => {
    expect(DEFAULT_MIN).toBe(60);
    expect(usualFor({}, 'run')).toEqual({ min: 60, own: false, std: 60 });
    expect(usualFor(undefined, 'run')).toEqual({ min: 60, own: false, std: 60 });
  });
  it('a set value is used for that sport only', () => {
    const map = { run: 45, yoga: 75 };
    expect(usualFor(map, 'run')).toEqual({ min: 45, own: true, std: 60 });
    expect(usualFor(map, 'yoga').min).toBe(75);
    expect(usualFor(map, 'tennis')).toEqual({ min: 60, own: false, std: 60 });
  });
  it('rubbish in the setting is ignored', () => {
    expect(usualMap({ a: 30, b: 0, c: -5, d: 'x', e: 99999, f: 12.6 })).toEqual({ a: 30, e: 1440, f: 13 });
    expect(usualMap(null)).toEqual({});
    expect(usualMap([30])).toEqual({});
    expect(cleanMin('')).toBe(0);
  });
  it('withUsual sets, resets and leaves the input alone', () => {
    const before = { run: 45 };
    const next = withUsual(before, 'yoga', 30);
    expect(next).toEqual({ run: 45, yoga: 30 });
    expect(before).toEqual({ run: 45 });
    expect(withUsual(next, 'run', 0)).toEqual({ yoga: 30 });
    expect(withUsual(next, 'yoga', '')).toEqual({ run: 45 });
  });
  it('it is not the minimum duration of the timer', () => {
    const act = normAct({ id: 'yoga', name: 'Yoga', minMin: 30 });
    expect(usualFor({}, act.id).min).toBe(60);
    expect(act.minMin).toBe(30);
  });
});

describe('Noah\'s usual durations (21.11.2026 «Standartwert beim abhaken»)', () => {
  const std = (name, id = 'x', nameDe) => standardFor({ id, name, nameDe });
  it('ice hockey 2 h, tennis 1 h, yoga 1 h, sauna 12 min, gym 20 min', () => {
    expect(std('Ice hockey', 'hockey', 'Eishockey')).toBe(120);
    expect(std('Tennis', 'tennis', 'Tennis spielen')).toBe(60);
    expect(std('Yoga', 'yoga')).toBe(60);
    expect(std('Sauna', 'sauna')).toBe(12);
    expect(std('Gym', 'gym')).toBe(20);
    expect(std('eGym')).toBe(20);
  });
  it('treadmill, running indoors and «rennen indoor» are one activity: 20 min (two blocks of 10), found by the name in German or English', () => {
    expect(std('Laufband rennen')).toBe(20);
    expect(std('Treadmill at the gym')).toBe(20); // the treadmill wins over «gym»
    expect(std('Laufen indoor')).toBe(20);
    expect(std('Rennen indoor')).toBe(20);
    expect(std('Indoor running')).toBe(20);
    expect(std('Running', 'run', 'Laufen')).toBe(0); // outdoors: no rule, the general 60 counts
  });
  it('a sport without a rule counts 60, an own setting always wins', () => {
    expect(standardFor({ id: 'climb', name: 'Climbing' })).toBe(0);
    expect(usualFor({}, 'climb', { id: 'climb', name: 'Climbing' })).toEqual({ min: 60, own: false, std: 60 });
    expect(usualFor({}, 'sauna', { id: 'sauna', name: 'Sauna' })).toEqual({ min: 12, own: false, std: 12 });
    expect(usualFor({ sauna: 24 }, 'sauna', { id: 'sauna', name: 'Sauna' })).toEqual({ min: 24, own: true, std: 12 });
    expect(usualFor({}, 'hockey').min).toBe(120); // by the id alone, for the seeded sports
  });
  it('the rules are a short list, the most specific first', () => {
    expect(STANDARD_RULES.length).toBeLessThan(10);
  });
});

describe('the setting in the database (it goes into the backup with the other settings)', () => {
  it('saves, reads, resets and restores', async () => {
    const db = createDb('usual-1');
    expect(await readUsual(db)).toEqual({});
    const b0 = await saveUsual(db, 'run', 45);
    expect(b0).toEqual({});
    expect(await readUsual(db)).toEqual({ run: 45 });
    expect((await db.settings.get(USUAL_KEY)).value).toEqual({ run: 45 });
    const b1 = await saveUsual(db, 'run', 0);
    expect(b1).toEqual({ run: 45 });
    expect(await db.settings.get(USUAL_KEY)).toBeUndefined();
    await restoreUsual(db, b1);
    expect(await readUsual(db)).toEqual({ run: 45 });
  });
  it('never touches the ticks', async () => {
    const db = createDb('usual-2');
    await db.flowLog.put({ id: 'e1', actId: 'run', day: '2026-11-18', at: '2026-11-18T07:00:00.000Z', n: 1 });
    await saveUsual(db, 'run', 90);
    expect(await db.flowLog.get('e1')).toEqual({ id: 'e1', actId: 'run', day: '2026-11-18', at: '2026-11-18T07:00:00.000Z', n: 1 });
  });
});

describe('the German texts', () => {
  it('«Usual duration» is «Übliche Dauer»', () => {
    expect(DE['Usual duration']).toBe('Übliche Dauer');
  });
});

describe('the backup (check with a copy, Noah rule 3)', () => {
  it('the setting travels in the backup and an older copy without it gives 60 minutes everywhere', async () => {
    const { buildBackup, restoreBackup, validateBackup } = await import('../src/lib/backup.js');
    const a = createDb('usual-backup-a');
    await saveUsual(a, 'run', 45);
    const copy = JSON.parse(JSON.stringify(await buildBackup(a)));
    expect(validateBackup(copy)).toEqual([]);
    expect(copy.tables.settings.some((r) => r.key === USUAL_KEY && r.value.run === 45)).toBe(true);
    const b = createDb('usual-backup-b');
    await restoreBackup(b, copy, 'replace');
    expect(await readUsual(b)).toEqual({ run: 45 });
    // an older copy: the same file without the setting
    const old = JSON.parse(JSON.stringify(copy));
    old.tables.settings = old.tables.settings.filter((r) => r.key !== USUAL_KEY);
    const c = createDb('usual-backup-c');
    await restoreBackup(c, old, 'replace');
    expect(await readUsual(c)).toEqual({});
    expect(usualFor(await readUsual(c), 'run').min).toBe(60);
  });
});
