// «Jetzt dran» steuern (Noah 05.11.2026 «4a»): «Später» for a week and one switch per kind of row. Fictional data only.
import { describe, it, expect } from 'vitest';
import { ROW_KINDS, LATER_DAYS, kindOf, rowsOf, isHidden, setKind, putOff, showAgain, waiting } from '../src/lib/home/rows.js';

const TODAY = '2026-11-05';
const wear = { key: 'wear', tone: 'quiet', text: 'Kette wachsen Testvelo: fällig in etwa 18 km' };

describe('rowsOf', () => {
  it('cleans the stored setting', () => {
    expect(rowsOf(null)).toEqual({ off: [], later: {} });
    expect(rowsOf({ off: ['wear', 'wear', 'backup', 7], later: { wear: { until: '2026-11-12', text: 'x' }, bad: { until: 'morgen' }, nope: null } })).toEqual({ off: ['wear'], later: { wear: { until: '2026-11-12', text: 'x' } } });
  });
});

describe('kinds', () => {
  it('knows the kind of a row from its key', () => {
    expect(kindOf({ key: 'compass:g1' })).toBe('compass');
    expect(kindOf({ key: 'wear' })).toBe('wear');
  });
  it('reminders that protect data or a trip can not be switched off', () => {
    const kinds = ROW_KINDS.map((k) => k.kind);
    for (const k of ['backup', 'care', 'debrief', 'ride', 'charge', 'prep', 'eve']) expect(kinds).not.toContain(k);
  });
  it('a switched off kind hides its rows, switching it on shows them again', () => {
    const off = setKind(null, 'wear', true);
    expect(isHidden(wear, off, TODAY)).toBe(true);
    expect(isHidden({ key: 'todo', tone: 'quiet' }, off, TODAY)).toBe(false);
    expect(isHidden(wear, setKind(off, 'wear', false), TODAY)).toBe(false);
  });
  it('an unknown kind is ignored', () => {
    expect(setKind(null, 'backup', true)).toEqual({ off: [], later: {} });
  });
});

describe('«Later»', () => {
  it('hides a row for a week, then it is back by itself', () => {
    const c = putOff(null, wear, TODAY);
    expect(c.later.wear.until).toBe('2026-11-12');
    expect(LATER_DAYS).toBe(7);
    expect(isHidden(wear, c, TODAY)).toBe(true);
    expect(isHidden(wear, c, '2026-11-11')).toBe(true);
    expect(isHidden(wear, c, '2026-11-12')).toBe(false);
  });
  it('counts calendar days over the end of a month', () => {
    expect(putOff(null, wear, '2026-10-28').later.wear.until).toBe('2026-11-04');
  });
  it('lists what waits, the soonest first, and forgets the ended ones', () => {
    let c = putOff(null, { ...wear, key: 'unused', text: 'Teile' }, '2026-11-01');
    c = putOff(c, wear, TODAY);
    expect(waiting(c, TODAY).map((x) => x.key)).toEqual(['unused', 'wear']);
    expect(waiting(c, '2026-11-09').map((x) => x.key)).toEqual(['wear']);
  });
  it('«Show again» brings one row or all rows back', () => {
    let c = putOff(putOff(null, wear, TODAY), { key: 'unused', text: 'Teile' }, TODAY);
    expect(isHidden(wear, showAgain(c, 'wear'), TODAY)).toBe(false);
    expect(isHidden({ key: 'unused' }, showAgain(c, 'wear'), TODAY)).toBe(true);
    expect(waiting(showAgain(c), TODAY)).toEqual([]);
  });
  it('keeps the switches when a row is put off', () => {
    const c = putOff(setKind(null, 'todo', true), wear, TODAY);
    expect(c.off).toEqual(['todo']);
  });
});
