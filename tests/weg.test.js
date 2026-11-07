// «Weg zum Ziel» K1: the store, goals and steps (rename, delete, order, tick), the days counted back from the
// start, the timeline, the time buffer, steps ticking by themselves and the backup round trip. Fictional data.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import {
  WEG_KEY, wegOf, newGoal, addGoal, renameGoal, removeGoal, moveGoal, setStart, addSteps, addOwnStep, renameStep, removeStep, setDone, setDue,
  moveStep, dueOf, timeline, progress, typeProgress, untilStart, timeBuffer, applyAuto, todayStep, templateOf, shift,
} from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';

const today = '2026-11-05';
const ids = (p) => { let n = 0; return () => `${p}${++n}`; };
const base = () => newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-05-15' }, { id: 'g1', now: 'x' });

describe('store', () => {
  it('a missing or broken record gives an empty, safe store', () => {
    expect(wegOf(null)).toEqual({ goals: [], onToday: true });
    expect(wegOf({ goals: [null, { id: 'a', kind: 'bogus', start: 'nope', steps: [{ id: 's', offset: 'x' }, { nope: 1 }] }] }).goals[0])
      .toMatchObject({ id: 'a', kind: 'free', start: '', steps: [{ id: 's', type: 'own', offset: null, due: '', done: false }] });
  });
  it('goals can be added, renamed, ordered and deleted; an empty name is ignored', () => {
    let w = addGoal(addGoal(wegOf(null), base()), newGoal({ title: 'Zweites', kind: 'free' }, { id: 'g2', now: 'x' }));
    w = renameGoal(w, 'g1', ' Neu ');
    expect(w.goals[0].title).toBe('Neu');
    expect(renameGoal(w, 'g1', '  ')).toBe(w);
    expect(moveGoal(w, 0, 1).goals.map((g) => g.id)).toEqual(['g2', 'g1']);
    expect(moveGoal(w, 0, 5)).toBe(w);
    expect(removeGoal(w, 'g1').goals.map((g) => g.id)).toEqual(['g2']);
  });
});

describe('steps and days counted back from the start', () => {
  const g = addSteps(base(), [{ title: 'Plan', offset: 90 }, { title: 'Probe', offset: 7 }, { title: 'Eigen', due: '2026-12-01' }, { title: '  ' }], { ids: ids('s') });
  it('offset days count back from the start; an own day wins; no start gives no day', () => {
    expect(g.steps.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-02-14', '2027-05-08', '2026-12-01']);
    expect(dueOf(setStart({ goals: [g] }, 'g1', '').goals[0], g.steps[0])).toBe('');
    expect(dueOf({ ...g, start: '2027-06-01' }, g.steps[1])).toBe('2027-05-25');
  });
  it('rename, delete, order, own day, own step', () => {
    expect(renameStep(g, 's1', ' Trainingsplan ').steps[0].title).toBe('Trainingsplan');
    expect(renameStep(g, 's1', '').steps[0].title).toBe('Plan');
    expect(removeStep(g, 's2').steps.map((s) => s.id)).toEqual(['s1', 's3']);
    expect(moveStep(g, 2, 0).steps.map((s) => s.id)).toEqual(['s3', 's1', 's2']);
    expect(dueOf(setDue(g, 's1', '2027-03-01'), setDue(g, 's1', '2027-03-01').steps[0])).toBe('2027-03-01');
    const own = addOwnStep(g, { title: 'Eigener', due: '2027-01-02' }, { ids: ids('o') });
    expect(own.steps.at(-1)).toMatchObject({ id: 'o1', type: 'own', own: true, due: '2027-01-02' });
  });
});

describe('timeline and progress', () => {
  const g = addSteps(base(), [{ title: 'Packtag', offset: 1 }, { title: 'Plan', offset: 90 }, { title: 'Zu spät', offset: 200 }, { title: 'Ohne Tag' }], { ids: ids('t') });
  it('sorted by day, late steps marked, steps without a day last, phases by weeks before the start', () => {
    const rows = timeline(g, today);
    expect(rows.map((r) => r.step.title)).toEqual(['Zu spät', 'Plan', 'Packtag', 'Ohne Tag']);
    expect(rows.map((r) => r.state)).toEqual(['late', 'open', 'open', 'open']);
    expect(rows.map((r) => r.phase)).toEqual(['far', 'build', 'last', 'open']);
  });
  it('progress counts done and late and names the next open step', () => {
    const p = progress(setDone(g, 't1', true), today);
    expect(p).toMatchObject({ done: 1, total: 4, late: 1 });
    expect(p.next.step.title).toBe('Zu spät');
  });
  it('untilStart and the time buffer (idea 2b)', () => {
    expect(untilStart(g, today)).toEqual({ days: 191, weeks: 27 });
    expect(untilStart({ start: '' }, today)).toBeNull();
    expect(timeBuffer(g, today, 12)).toMatchObject({ buffer: 15, state: 'ok' });
    expect(timeBuffer(g, today, 26).state).toBe('tight');
    expect(timeBuffer(g, today, 30).state).toBe('short');
    expect(timeBuffer(g, today, 0)).toBeNull();
  });
  it('typeProgress counts one kind of step (the strip «3 of 5 sorted»)', () => {
    const o = addSteps(base(), [{ title: 'A', offset: 70, type: 'org' }, { title: 'B', offset: 30, type: 'org' }, { title: 'C', offset: 3 }], { ids: ids('p') });
    const p = typeProgress(setDone(o, 'p1', true), 'org', today);
    expect(p).toMatchObject({ done: 1, total: 2 });
    expect(p.next.step.title).toBe('B');
  });
});

describe('ticking by itself', () => {
  const t = { type: 'plan', auto: (g, s, ctx) => (ctx.planRuns ? true : null) };
  const g = addSteps(base(), [{ title: 'Plan', offset: 90, type: 'plan' }, { title: 'Eigen' }], { ids: ids('a') });
  it('a type ticks an open step by itself, never an own step, never takes a tick back', () => {
    const r = applyAuto(g, [t], { planRuns: true });
    expect(r.steps[0]).toMatchObject({ done: true, by: 'auto' });
    expect(r.steps[1].done).toBe(false);
    expect(applyAuto(r, [t], { planRuns: false })).toBe(r);
    expect(applyAuto(g, [t], {})).toBe(g);
  });
  it('a step the user unticked is never ticked again; a broken type changes nothing', () => {
    const ticked = applyAuto(g, [t], { planRuns: true });
    const unticked = setDone(ticked, 'a1', false);
    expect(applyAuto(unticked, [t], { planRuns: true }).steps[0].done).toBe(false);
    expect(applyAuto(g, [{ type: 'plan', auto: () => { throw new Error('x'); } }], {})).toBe(g);
  });
});

describe('Heute line and templates', () => {
  it('shows the next open step of the goal that starts first, off when switched off', () => {
    const a = addSteps(base(), [{ title: 'Erster', offset: 30 }], { ids: ids('h') });
    const b = addSteps(newGoal({ title: 'Früher', start: '2027-03-01' }, { id: 'g9', now: 'x' }), [{ title: 'Zuerst', offset: 10 }], { ids: ids('k') });
    const w = { goals: [a, b], onToday: true };
    expect(todayStep(w, today).row.step.title).toBe('Zuerst');
    expect(todayStep({ ...w, onToday: false }, today)).toBeNull();
    expect(todayStep({ goals: [{ ...a, start: '2020-01-01' }], onToday: true }, today)).toBeNull();
  });
  it('a template keeps the offsets and drops ticks and own days', () => {
    const g = setDone(addSteps(base(), [{ title: 'Plan', offset: 90 }, { title: 'Eigen', due: '2027-05-01' }], { ids: ids('m') }), 'm1', true);
    expect(templateOf(g)).toEqual([
      { type: 'own', title: 'Plan', offset: 90, note: undefined, own: undefined },
      { type: 'own', title: 'Eigen', offset: 14, note: undefined, own: undefined },
    ]);
  });
});

describe('registry', () => {
  it('knows the own step; suggestions come from every type and a failing type adds nothing', () => {
    expect(TYPES.map((t) => t.type)).toContain('own');
    expect(typeOf('nope').type).toBe('own');
    const good = { type: 'g', defaults: () => [{ title: 'X', offset: 5 }] };
    const bad = { type: 'b', defaults: () => { throw new Error('x'); } };
    expect(suggestions(base(), [good, bad])).toEqual([{ title: 'X', offset: 5, type: 'g' }]);
  });
});

describe('backup copy (the storage is checked before it goes online)', () => {
  it('the goals travel through a backup file and back, in replace and merge mode', async () => {
    const db = createDb('weg-1');
    const g = addSteps(base(), [{ title: 'Plan', offset: 90 }, { title: 'Eigen', due: '2027-01-02', own: true }], { ids: ids('b') });
    await db.settings.put({ key: WEG_KEY, value: addGoal(wegOf(null), g) });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.settings.some((r) => r.key === WEG_KEY)).toBe(true);
    const other = createDb('weg-2');
    await restoreBackup(other, file, 'replace');
    expect(wegOf((await other.settings.get(WEG_KEY)).value).goals[0].steps.map((s) => s.title)).toEqual(['Plan', 'Eigen']);
    const third = createDb('weg-3');
    await third.settings.put({ key: 'riderWeightG', value: 1 });
    await restoreBackup(third, file, 'merge');
    expect((await third.settings.get('riderWeightG')).value).toBe(1);
    expect(wegOf((await third.settings.get(WEG_KEY)).value).goals).toHaveLength(1);
  });
  it('an old backup without the record imports fine and leaves the goals empty', async () => {
    const db = createDb('weg-4');
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'riderWeightG', value: 1 }] } }, 'replace');
    expect(wegOf((await db.settings.get(WEG_KEY))?.value).goals).toEqual([]);
  });
  it('shift works on calendar days across a leap day', () => {
    expect(shift('2028-03-01', -1)).toBe('2028-02-29');
  });
});
