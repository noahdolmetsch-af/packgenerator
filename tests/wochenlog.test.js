import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { WEEKLOG_KEY, logOf, weekLog, isPast, withSnapshot, setDone, dismiss, pinsOf, setPins, movePin, clearPin, progress, weekFor, dueToday, suggest, pastWeeks } from '../src/lib/training/wochenlog.js';
import { planOf } from '../src/lib/training/wochenplan.js';

// Mon 09.11.2026 is in winter; Sunday is 15.11.
const MON = '2026-11-09';
const stored = planOf(null);
const { cfg, week } = weekFor(stored, MON);
const unit = (type) => week.units.find((u) => u.type === type);

describe('wochenlog: the log', () => {
  it('has a fixed key and cleans bad data', () => {
    expect(WEEKLOG_KEY).toBe('training.weeklog');
    expect(logOf(null)).toEqual({ v: 1, weeks: {} });
    const raw = { weeks: { nope: { done: {} }, [MON]: { done: { 'tennis@1': '2026-11-10', x: 'bad' }, no: ['a', ''], snap: { hours: 12, units: [{ id: 'a', type: 'gym', d: 2, t: '15:00', mins: 50 }, { id: 'b', type: 'gym', d: 9, t: '15:00', mins: 50 }] } } } };
    const log = logOf(raw);
    expect(Object.keys(log.weeks)).toEqual([MON]);
    expect(log.weeks[MON].done).toEqual({ 'tennis@1': '2026-11-10' });
    expect(log.weeks[MON].no).toEqual(['a']);
    expect(log.weeks[MON].snap.units).toHaveLength(1);
  });
  it('is the same after a round trip', () => {
    const log = setDone(logOf(null), MON, 'x', true, MON, week.units, cfg.hours);
    expect(logOf(JSON.parse(JSON.stringify(log)))).toEqual(log);
  });
});

describe('wochenlog: ticking and freezing', () => {
  it('a week is past after Sunday', () => {
    expect(isPast(MON, '2026-11-15')).toBe(false);
    expect(isPast(MON, '2026-11-16')).toBe(true);
  });
  it('a tick keeps the stable id and stores the week as it was', () => {
    const tennis = unit('tennis');
    expect(tennis.id).toMatch(/^tennis@\d$/);
    const log = setDone(logOf(null), MON, tennis.id, true, '2026-11-10', week.units, cfg.hours);
    expect(weekLog(log, MON).done[tennis.id]).toBe('2026-11-10');
    expect(weekLog(log, MON).snap.units.length).toBe(week.units.length);
    const off = setDone(log, MON, tennis.id, false, '2026-11-10', week.units, cfg.hours);
    expect(weekLog(off, MON).done[tennis.id]).toBeUndefined();
  });
  it('a tick stays when the unit is gone and comes back with it', () => {
    const log = setDone(logOf(null), MON, 'bikeOut#2', true, MON);
    const p = progress(week.units.filter((u) => u.id !== 'bikeOut#2'), weekLog(log, MON).done);
    expect(p.done).toBe(0);
    expect(weekLog(log, MON).done['bikeOut#2']).toBe(MON);
  });
  it('the snapshot follows the plan during the week and not after it', () => {
    const a = withSnapshot(logOf(null), MON, week.units, 12, MON);
    expect(withSnapshot(a, MON, week.units, 12, '2026-11-12')).toBe(a); // nothing differs: the same log, so no write
    const fewer = week.units.slice(1);
    const b = withSnapshot(a, MON, fewer, 12, '2026-11-12');
    expect(weekLog(b, MON).snap.units).toHaveLength(fewer.length);
    expect(weekLog(b, MON).snap.saved).toBe('2026-11-12');
    // after Sunday: frozen
    expect(withSnapshot(b, MON, week.units, 12, '2026-11-16')).toBe(b);
    expect(setDone(b, MON, 'x', true, '2026-11-16')).toBe(b);
    expect(dismiss(b, MON, 'a1', '2026-11-16')).toBe(b);
  });
  it('an empty plan stores no snapshot', () => {
    const log = logOf(null);
    expect(withSnapshot(log, MON, [], 0, MON)).toBe(log);
  });
  it('keeps only the newest 52 weeks', () => {
    let log = logOf(null);
    for (let i = 0; i < 60; i++) {
      const d = new Date(Date.UTC(2025, 0, 6 + 7 * i, 12)).toISOString().slice(0, 10);
      log = setDone(log, d, 'x', true, d, week.units, 12);
    }
    expect(Object.keys(log.weeks)).toHaveLength(52);
  });
});

describe('wochenlog: progress', () => {
  it('counts units and the small daily habits apart', () => {
    const done = {};
    for (const u of week.units) if (u.type === 'tennis' || u.type === 'med') done[u.id] = MON;
    const p = progress(week.units, done);
    expect(p.done).toBe(week.units.filter((u) => u.type === 'tennis').length);
    expect(p.total).toBe(week.units.filter((u) => u.type !== 'med' && u.type !== 'stretch').length);
    expect(p.quietDone).toBe(week.units.filter((u) => u.type === 'med').length);
    expect(p.quietTotal).toBe(week.units.filter((u) => u.type === 'med' || u.type === 'stretch').length);
    expect(p.doneMins).toBe(week.units.filter((u) => u.type === 'tennis').reduce((a, u) => a + u.mins, 0));
  });
  it('the rest block counts as a unit, not as hours', () => {
    const rest = week.units.find((u) => u.type === 'rest');
    const p = progress(week.units, { [rest.id]: MON });
    expect(p.done).toBe(1);
    expect(p.doneMins).toBe(0);
  });
});

describe('wochenlog: Heute dran', () => {
  it('is nothing without a saved plan', () => {
    expect(dueToday(null, null, MON)).toBeNull();
  });
  it('names the first open unit of today and how many more', () => {
    const day = week.units.find((u) => u.type !== 'med' && u.type !== 'stretch').d;
    const today = new Date(Date.UTC(2026, 10, 9 + day, 12)).toISOString().slice(0, 10);
    const due = dueToday(stored, null, today);
    expect(due.next.d).toBe(day);
    expect(due.open.every((u) => u.d === day && u.type !== 'med' && u.type !== 'stretch')).toBe(true);
    expect(due.more).toBe(due.open.length - 1);
    // ticking the first leaves the others
    const log = setDone(logOf(null), due.monday, due.next.id, true, today, due.units, due.hours);
    const after = dueToday(stored, log, today);
    if (due.open.length === 1) expect(after).toBeNull();
    else expect(after.next.id).toBe(due.open[1].id);
  });
});

describe('wochenlog: Strava suggests, you tick', () => {
  const run = week.units.find((u) => u.type === 'runOut');
  const bike = week.units.find((u) => u.type === 'bikeOut');
  const day = (u) => new Date(Date.UTC(2026, 10, 9 + u.d, 12)).toISOString().slice(0, 10);
  const act = (o) => ({ id: 'a1', day: '', kind: 'bike', type: 'Ride', trainer: false, commute: false, movingS: 3600, ...o });
  it('offers a ride of the same day to an outdoor bike unit', () => {
    const s = suggest(week.units, [act({ day: day(bike) })], MON, {});
    expect(s[bike.id].id).toBe('a1');
  });
  it('does not offer a ride for a run, an indoor ride for outdoors, a commute, or a very short one', () => {
    expect(suggest(week.units, [act({ day: day(run), kind: 'bike' })], MON, {})[run.id]).toBeUndefined();
    expect(suggest(week.units, [act({ day: day(bike), trainer: true })], MON, {})[bike.id]).toBeUndefined();
    expect(suggest(week.units, [act({ day: day(bike), commute: true })], MON, {})[bike.id]).toBeUndefined();
    expect(suggest(week.units, [act({ day: day(bike), movingS: 300 })], MON, {})[bike.id]).toBeUndefined();
  });
  it('offers nothing for a ticked unit or for an activity said «no»', () => {
    expect(suggest(week.units, [act({ day: day(bike) })], MON, { [bike.id]: MON })[bike.id]).toBeUndefined();
    expect(suggest(week.units, [act({ day: day(bike) })], MON, {}, ['a1'])[bike.id]).toBeUndefined();
  });
  it('one activity serves one unit', () => {
    const twins = week.units.filter((u) => u.type === 'bikeOut' && u.d === bike.d);
    const s = suggest(week.units, [act({ day: day(bike) })], MON, {});
    expect(Object.keys(s)).toHaveLength(1);
    expect(twins.length).toBeGreaterThanOrEqual(1);
  });
  it('never ticks by itself: suggest changes nothing', () => {
    const done = {};
    suggest(week.units, [act({ day: day(bike) })], MON, done);
    expect(done).toEqual({});
  });
});

describe('wochenlog: past weeks', () => {
  it('lists only frozen weeks with a snapshot, newest first, with the count', () => {
    const main = week.units.filter((u) => u.type !== 'med' && u.type !== 'stretch');
    let log = setDone(logOf(null), '2026-11-02', main[0].id, true, '2026-11-03', week.units, 12);
    log = setDone(log, '2026-10-26', main[1].id, true, '2026-10-27', week.units, 12);
    log = setDone(log, MON, week.units[0].id, true, MON, week.units, 12); // this week: not frozen
    const list = pastWeeks(log, '2026-11-10');
    expect(list.map((w) => w.monday)).toEqual(['2026-11-02', '2026-10-26']);
    expect(list[0].total).toBeGreaterThan(0);
    expect(list[0].ticked).toBe(1);
  });
});

describe('wochenlog: backup', () => {
  it('the log goes through a backup and back unchanged (settings table, no new table)', async () => {
    const db = createDb('wochenlog-a');
    const log = setDone(logOf(null), MON, week.units.find((u) => u.type === 'tennis').id, true, '2026-11-10', week.units, cfg.hours);
    await db.settings.put({ key: WEEKLOG_KEY, value: log });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.settings.find((r) => r.key === WEEKLOG_KEY).value).toEqual(log);
    const other = createDb('wochenlog-b');
    await restoreBackup(other, file, 'replace');
    expect(logOf((await other.settings.get(WEEKLOG_KEY)).value)).toEqual(log);
  });
  it('an old backup without the log restores fine and gives an empty log', async () => {
    const db = createDb('wochenlog-c');
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'riderWeightG', value: 64000 }] } }, 'replace');
    expect(logOf((await db.settings.get(WEEKLOG_KEY))?.value)).toEqual({ v: 1, weeks: {} });
  });
});

describe('wochenlog: moved units (part 4)', () => {
  const tennis = unit('tennis');
  it('a pin is cleaned: day 0..6 and a real time, nothing else', () => {
    expect(pinsOf({ a: { d: 2, t: '15:00' }, b: { d: 7, t: '15:00' }, c: { d: 1, t: '25:00' }, d: { d: 1.5, t: '10:00' }, e: null })).toEqual({ a: { d: 2, t: '15:00' } });
    expect(pinsOf('x')).toEqual({});
  });
  it('moves one unit, takes it back, and a week without pins is the plain plan', () => {
    const moved = movePin(logOf(null), MON, tennis.id, 4, '18:00', MON);
    expect(weekLog(moved, MON).pins[tennis.id]).toEqual({ d: 4, t: '18:00' });
    const { week: w } = weekFor(stored, MON, weekLog(moved, MON).pins);
    const u = w.units.find((x) => x.id === tennis.id);
    expect([u.d, u.t, u.pinned]).toEqual([4, '18:00', true]);
    expect(u.why).toEqual({ key: 'pinned' });
    const back = clearPin(moved, MON, tennis.id, MON);
    expect(weekLog(back, MON).pins).toEqual({});
    expect(weekFor(stored, MON, weekLog(back, MON).pins).week.units.find((x) => x.id === tennis.id).pinned).toBe(false);
  });
  it('is the same log when nothing changes, and a past week can not be moved', () => {
    const log = movePin(logOf(null), MON, tennis.id, 4, '18:00', MON);
    expect(movePin(log, MON, tennis.id, 4, '18:00', MON)).toBe(log);
    expect(setPins(log, MON, {}, '2026-11-16')).toBe(log);
    expect(movePin(logOf(null), MON, tennis.id, 4, '18:00', '2026-11-16').weeks[MON]).toBeUndefined();
  });
  it('undo puts the earlier pins back and leaves the ticks alone', () => {
    let log = setDone(logOf(null), MON, 'x', true, MON);
    const before = weekLog(log, MON).pins;
    log = movePin(log, MON, tennis.id, 4, '18:00', MON);
    log = setPins(log, MON, before, MON);
    expect(weekLog(log, MON).pins).toEqual({});
    expect(weekLog(log, MON).done.x).toBe(MON);
  });
  it('a moved unit stays moved through a backup round trip and keeps its tick', () => {
    let log = movePin(logOf(null), MON, tennis.id, 4, '18:00', MON);
    log = setDone(log, MON, tennis.id, true, MON, weekFor(stored, MON, weekLog(log, MON).pins).week.units, cfg.hours);
    expect(logOf(JSON.parse(JSON.stringify(log)))).toEqual(log);
    expect(weekLog(log, MON).snap.units.find((x) => x.id === tennis.id).d).toBe(4);
  });
  it('Heute dran follows the moved unit', () => {
    const log = movePin(logOf(null), MON, tennis.id, 4, '18:00', MON);
    const friday = '2026-11-13';
    const due = dueToday(stored, log, friday);
    expect(due.open.some((u) => u.id === tennis.id && u.t === '18:00')).toBe(true);
    const tuesday = '2026-11-10';
    expect((dueToday(stored, log, tuesday)?.open ?? []).some((u) => u.id === tennis.id)).toBe(false);
  });
});
