import { describe, it, expect } from 'vitest';
import { PROBE_STEPS, HOME_STEPS, stepsFor, autoResult, rowsOf, summary, answer, withTodo, addOwn, renameOwn, removeOwn, probeDue, todoDue, dayDiff, shiftDay } from '../src/lib/probe/probe.js';
import { parseBetween } from '../src/lib/phase.js';

const day = { id: 'd1', title: 'Testrunde', days: 1, startDate: '2026-11-03' };
const multi = { id: 'm1', title: 'Testreise', days: 3, startDate: '2026-11-03', bikeId: 'b1', country: 'IT' };

describe('Generalprobe steps', () => {
  it('fit the trip', () => {
    const d = stepsFor(PROBE_STEPS, day).map((s) => s.key);
    expect(d).toEqual(['offline', 'power', 'sos', 'backup']);
    const m = stepsFor(PROBE_STEPS, multi).map((s) => s.key);
    expect(m).toEqual(PROBE_STEPS.map((s) => s.key));
    expect(stepsFor(HOME_STEPS, day).map((s) => s.key)).not.toContain('dry');
    expect(stepsFor(HOME_STEPS, multi).map((s) => s.key)).toContain('bike');
  });
  it('know some answers by themselves', () => {
    expect(autoResult('offline', day, { offlineAt: '2026-11-01T10:00:00Z' })).toBe('ok');
    expect(autoResult('offline', day, {})).toBe(null);
    expect(autoResult('backup', day, { backupAt: '2026-10-28T08:00:00Z', today: '2026-11-01' })).toBe('ok');
    expect(autoResult('backup', day, { backupAt: '2026-10-20T08:00:00Z', today: '2026-11-01' })).toBe(null);
    expect(autoResult('planb', { ...multi, planB: { kind: 'train' } })).toBe('ok');
    expect(autoResult('stays', { ...multi, stays: [{ n: 0, until: '18:00' }, { n: 1, until: '20:00' }] })).toBe('ok');
    expect(autoResult('stays', { ...multi, stays: [{ n: 0, until: '18:00' }] })).toBe(null);
    expect(autoResult('power', day, { chargeDone: 2, chargeTotal: 2 })).toBe('ok');
    expect(autoResult('debrief', day, { debriefDone: true })).toBe('ok');
  });
  it('keep the user answer above the auto one, and a second tap clears it', () => {
    let rec = answer(null, 'offline', 'gap', 'now');
    let rows = rowsOf(PROBE_STEPS, day, rec, { offlineAt: 'x' });
    expect(rows.find((r) => r.key === 'offline')).toMatchObject({ r: 'gap', auto: false });
    rec = answer(rec, 'offline', 'gap');
    rows = rowsOf(PROBE_STEPS, day, rec, { offlineAt: 'x' });
    expect(rows.find((r) => r.key === 'offline')).toMatchObject({ r: 'ok', auto: true });
    rec = withTodo(answer(rec, 'sos', 'gap'), 'sos', 'td-1');
    expect(rowsOf(PROBE_STEPS, day, rec).find((r) => r.key === 'sos').todo).toBe('td-1');
  });
  it('count', () => {
    let rec = answer(null, 'offline', 'ok');
    rec = answer(rec, 'power', 'gap');
    rec = answer(rec, 'sos', 'skip');
    const s = summary(rowsOf(PROBE_STEPS, day, rec));
    expect(s).toMatchObject({ ok: 1, gap: 1, skip: 1, open: 1, total: 3, done: false });
    expect(summary(rowsOf(PROBE_STEPS, day, answer(rec, 'backup', 'ok'))).done).toBe(true);
  });
  it('own steps: add, rename, delete', () => {
    let rec = addOwn(null, '  Pflanzen giessen ', 'o1');
    expect(addOwn(rec, '   ')).toBe(rec);
    rec = renameOwn(rec, 'o1', 'Pflanzen');
    rec = answer(rec, 'o1', 'ok');
    expect(rowsOf(PROBE_STEPS, day, rec).at(-1)).toMatchObject({ key: 'o1', name: 'Pflanzen', own: true, r: 'ok' });
    rec = removeOwn(rec, 'o1');
    expect(rowsOf(PROBE_STEPS, day, rec).some((r) => r.key === 'o1')).toBe(false);
    expect(rec.steps.o1).toBeUndefined();
  });
  it('is due from 7 days before the start; to-dos the evening before or tomorrow', () => {
    expect(probeDue(day, '2026-10-27')).toBe(true);
    expect(probeDue(day, '2026-10-26')).toBe(false);
    expect(probeDue(day, '2026-11-04')).toBe(false);
    expect(todoDue('probe', day, '2026-10-30')).toBe('2026-11-02');
    expect(todoDue('probe', day, '2026-11-03')).toBe('2026-11-03');
    expect(todoDue('heim', day, '2026-10-31')).toBe('2026-11-01');
    expect(dayDiff('2026-10-24', '2026-10-26')).toBe(2);
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('has its own address next to the other between pages', () => {
    expect(parseBetween('#/trip/m1/probe')).toEqual({ id: 'm1', kind: 'probe' });
    expect(parseBetween('#/trip/m1/heim')).toEqual({ id: 'm1', kind: 'heim' });
  });
});
