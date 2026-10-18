// «Mehr selbst einstellen» (IS 254–255): the own values, their standards and where they count.
import { describe, it, expect, afterEach } from 'vitest';
import { OWN_FIELDS, OWN_DEFAULTS, clampOwn, normOwn, setOwn, isOwnChanged } from '../src/lib/ownvalues.js';
import { own, useOwn } from '../src/lib/ownlive.svelte.js';
import { PACK_DAYS, currentStep } from '../src/lib/phase.js';
import { BACKUP_DAYS, backupDue } from '../src/lib/backup.js';
import { CHECK_KM, checkKmOf } from '../src/lib/care.js';
import { careStd, careChange } from '../src/lib/care/plan.js';
import { NEW_DAYS, isNew } from '../src/lib/home/tiles.js';
import { WARM_LIMIT } from '../src/lib/debrief.js';
import { todayFocus } from '../src/lib/today.js';

afterEach(() => useOwn(null));

describe('own values', () => {
  it('the standards are the numbers that were fixed in the code', () => {
    expect(OWN_DEFAULTS).toEqual({ packDays: PACK_DAYS, coldC: WARM_LIMIT, checkKm: CHECK_KM, newDays: NEW_DAYS, backupDays: BACKUP_DAYS });
    expect(own.v).toEqual(OWN_DEFAULTS);
  });
  it('clamps typed values to sane ranges', () => {
    expect(clampOwn('packDays', '3')).toBe(3);
    expect(clampOwn('packDays', 99)).toBe(14);
    expect(clampOwn('backupDays', 0)).toBe(1);
    expect(clampOwn('checkKm', '1240')).toBe(1200);
    expect(clampOwn('coldC', '−5')).toBe(-5);
    expect(clampOwn('coldC', '7,6')).toBe(8);
    expect(clampOwn('newDays', 'abc')).toBeNull();
    expect(clampOwn('newDays', '')).toBeNull();
    expect(clampOwn('nope', 3)).toBeNull();
  });
  it('makes a stored record whole, broken fields fall back to the standard', () => {
    expect(normOwn(null)).toEqual(OWN_DEFAULTS);
    expect(normOwn({ packDays: 4, backupDays: 'x', coldC: 50 })).toEqual({ ...OWN_DEFAULTS, packDays: 4, coldC: 25 });
  });
  it('stores only what differs from the standard; null goes back', () => {
    const a = setOwn(null, 'backupDays', 7);
    expect(a).toEqual({ backupDays: 7 });
    expect(isOwnChanged(a, 'backupDays')).toBe(true);
    expect(setOwn(a, 'backupDays', null)).toEqual({});
    expect(setOwn(a, 'packDays', 2)).toEqual({ backupDays: 7 });
    for (const f of OWN_FIELDS) expect(f.min <= f.std && f.std <= f.max, f.key).toBe(true);
  });
});

describe('the app follows the own values', () => {
  const trip = (startDate) => ({ id: 't1', title: 'Testtour', startDate, days: 2, domains: ['bikepacking'], entries: [{ itemId: 'a', packed: false }] });
  it('packing starts N days before', () => {
    // 2026-10-15 → 2026-10-18: three calendar days
    expect(currentStep(trip('2026-10-18'), '2026-10-15')).toBe('plan');
    expect(todayFocus([trip('2026-10-18')], [], '2026-10-15').kind).toBe('plan');
    useOwn({ packDays: 3 });
    expect(currentStep(trip('2026-10-18'), '2026-10-15')).toBe('pack');
    expect(todayFocus([trip('2026-10-18')], [], '2026-10-15').kind).toBe('pack');
  });
  it('the backup reminder after N days', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    expect(backupDue('2026-10-12T12:00:00Z', now).due).toBe(false);
    useOwn({ backupDays: 7 });
    expect(backupDue('2026-10-12T12:00:00Z', now)).toEqual({ due: true, days: 8 });
  });
  it('the «New» mark for N days', () => {
    const news = [{ version: '9.0.0', date: '2026-10-01' }];
    expect(isNew({ since: '9.0.0' }, '2026-10-10', news)).toBe(true);
    useOwn({ newDays: 5 });
    expect(isNew({ since: '9.0.0' }, '2026-10-10', news)).toBe(false);
    useOwn({ newDays: 0 });
    expect(isNew({ since: '9.0.0' }, '2026-10-01', news)).toBe(false);
  });
  it('the km check of a bike without its own number', () => {
    useOwn({ checkKm: 800 });
    expect(checkKmOf({})).toBe(800);
    expect(checkKmOf({ checkKm: 1500 })).toBe(1500);
    expect(careStd('check')).toEqual({ everyKm: 800 });
    // the own standard is «Standard» on the bike too: choosing it keeps nothing on the bike
    expect(careChange({ checkKm: 1500 }, 'check', { values: { everyKm: 800 } })).toEqual({ checkKm: undefined });
  });
});
