// Touren-Ideen 44, 45, 47, 49 (996 Ideen; Noah 26.10.2026 «1a 2b 3a 4b 5b»): the rules behind
// «Touren nebeneinander» and the card «Tour vorbereiten». Fictional data only (test_data_gtp_).
import { describe, it, expect } from 'vitest';
import {
  DAY_SPORTS, daySportsOf, setDaySport, sportChanges, CHANGE_TIPS,
  unclearOf, unclearAdd, unclearEdit, unclearToggle, unclearRemove, unclearOpen,
  BORDER_AREAS, borderOf, borderAddCountry, borderRenameCountry, borderRemoveCountry, borderAddPoint, borderEditPoint, borderTogglePoint, borderRemovePoint, borderMovePoint, borderOpen, isStale, STALE_DAYS,
} from '../src/lib/tourplan/prep.js';
import { compareChoices, spanOf, overlapDays, timeline, sharedGear, openTasks, firstPair, pickTrip, MAX_DAYS } from '../src/lib/tourplan/compare.js';
import { STANDARD_LISTS } from '../src/lib/standard.js';
import { APP_LISTS } from '../src/lib/applists.js';

const trip = (over = {}) => ({ id: 'test_data_gtp_t1', title: 'test_data_gtp_Runde', startDate: '2026-11-02', days: 4, entries: [], ...over });

describe('45 sport per day', () => {
  it('is an app list with bike, hiking and rest day', () => {
    expect(APP_LISTS).toContain('daySports');
    expect(STANDARD_LISTS.find((l) => l.key === 'daySports').entries().map((e) => e.id)).toEqual(DAY_SPORTS);
  });
  it('keeps one kind per day, drops unknown kinds and days past the end', () => {
    const t = trip({ daySports: { 0: 'bike', 1: 'nope', 7: 'hike' } });
    expect(daySportsOf(t)).toEqual(['bike', null, null, null]);
    expect(setDaySport(t, 1, 'hike')).toEqual({ 0: 'bike', 1: 'hike' });
    expect(setDaySport(t, 0, null)).toEqual({});
    expect(setDaySport(t, 9, 'bike')).toEqual({ 0: 'bike' });
  });
  it('says what to think of where the kind changes (3a)', () => {
    const t = trip({ days: 5, daySports: { 0: 'bike', 1: 'bike', 2: 'hike', 3: 'rest', 4: 'bike' } });
    const ch = sportChanges(t);
    expect(ch.map((c) => [c.day, c.from, c.to])).toEqual([[2, 'bike', 'hike'], [3, 'hike', 'rest'], [4, 'rest', 'bike']]);
    expect(ch[0].tips).toEqual(CHANGE_TIPS.offBike);
    expect(ch[1].tips).toEqual(CHANGE_TIPS.intoRest);
    expect(ch[2].tips).toEqual([CHANGE_TIPS.onBike[0]]);
    expect(sportChanges(trip({ daySports: { 0: 'hike', 2: 'bike' } }))[0].tips).toEqual(CHANGE_TIPS.onBike);
    expect(sportChanges(trip())).toEqual([]);
  });
});

describe('47 unclear spots: a list with km (4b)', () => {
  it('adds, sorts by km, edits, ticks and removes', () => {
    let t = trip();
    t = { ...t, unclear: unclearAdd(t, { km: '42.04', text: ' Bridge open? ' }, 'u1') };
    t = { ...t, unclear: unclearAdd(t, { km: 7, text: 'Gravel ok?' }, 'u2') };
    t = { ...t, unclear: unclearAdd(t, { km: '', text: 'Water at the pass?' }, 'u3') };
    expect(unclearAdd(t, { km: 3, text: '  ' })).toHaveLength(3);
    expect(unclearOf(t).map((x) => [x.id, x.km, x.text])).toEqual([['u2', 7, 'Gravel ok?'], ['u1', 42, 'Bridge open?'], ['u3', null, 'Water at the pass?']]);
    t = { ...t, unclear: unclearEdit(t, 'u3', { km: 60, text: 'Water at the top?' }) };
    expect(unclearOf(t).at(-1)).toMatchObject({ km: 60, text: 'Water at the top?' });
    t = { ...t, unclear: unclearToggle(t, 'u2', '2026-10-26T10:00:00.000Z') };
    expect(unclearOf(t)[0]).toMatchObject({ done: true, doneAt: '2026-10-26T10:00:00.000Z' });
    expect(unclearOpen(t)).toBe(2);
    t = { ...t, unclear: unclearRemove(t, 'u1') };
    expect(unclearOf(t).map((x) => x.id)).toEqual(['u2', 'u3']);
    expect(unclearOf({ unclear: [null, { text: '' }, { km: -3, text: 'x' }] })).toEqual([{ id: 'u0', km: null, text: 'x', done: false, doneAt: null }]);
  });
});

describe('49 crossing a border: only own points (5b)', () => {
  it('starts empty, with three areas', () => {
    expect(BORDER_AREAS.map((a) => a.key)).toEqual(['docs', 'phone', 'insurance']);
    expect(borderOf(trip())).toEqual([]);
  });
  it('adds countries and points, renames, ticks with a date, moves within an area, removes', () => {
    let t = trip();
    t = { ...t, border: borderAddCountry(t, ' test_data_gtp_Land ', 'c1') };
    expect(borderAddCountry(t, ' ')).toHaveLength(1);
    t = { ...t, border: borderAddPoint(t, 'c1', { area: 'phone', text: 'Roaming on', source: 'contract' }, 'p1') };
    t = { ...t, border: borderAddPoint(t, 'c1', { area: 'docs', text: 'ID card' }, 'p2') };
    t = { ...t, border: borderAddPoint(t, 'c1', { area: 'phone', text: 'Data pack' }, 'p3') };
    t = { ...t, border: borderAddPoint(t, 'c1', { area: 'weird', text: 'Card' }, 'p4') };
    expect(borderOf(t)[0].points.map((p) => [p.id, p.area])).toEqual([['p1', 'phone'], ['p2', 'docs'], ['p3', 'phone'], ['p4', 'docs']]);
    t = { ...t, border: borderMovePoint(t, 'c1', 'p3', -1) };
    expect(borderOf(t)[0].points.map((p) => p.id)).toEqual(['p3', 'p2', 'p1', 'p4']);
    expect(borderMovePoint(t, 'c1', 'p3', -1)).toEqual(borderOf(t));
    t = { ...t, border: borderEditPoint(t, 'c1', 'p1', { text: 'Roaming switched on', source: '' }) };
    expect(borderOf(t)[0].points[2]).toMatchObject({ text: 'Roaming switched on', source: '' });
    t = { ...t, border: borderTogglePoint(t, 'c1', 'p2', '2026-01-01T08:00:00.000Z') };
    expect(borderOpen(t)).toBe(3);
    const p2 = borderOf(t)[0].points[1];
    expect(isStale(p2, Date.parse('2026-01-01T08:00:00.000Z') + (STALE_DAYS + 1) * 864e5)).toBe(true);
    expect(isStale(p2, Date.parse('2026-02-01T08:00:00.000Z'))).toBe(false);
    t = { ...t, border: borderRenameCountry(t, 'c1', 'test_data_gtp_Neu') };
    expect(borderOf(t)[0].country).toBe('test_data_gtp_Neu');
    t = { ...t, border: borderRemovePoint(t, 'c1', 'p4') };
    expect(borderOf(t)[0].points).toHaveLength(3);
    expect(borderRemoveCountry(t, 'c1')).toEqual([]);
  });
});

describe('44 trips side by side (1a)', () => {
  const items = { I1: { id: 'I1', name: 'test_data_gtp_Zelt', qty: 1 }, I2: { id: 'I2', name: 'test_data_gtp_Jacke', qty: 2 }, I3: { id: 'I3', name: 'test_data_gtp_Lampe', qty: 1 } };
  const A = trip({ id: 'A', startDate: '2026-11-02', days: 4, entries: [{ itemId: 'I1', packed: true }, { itemId: 'I2' }, { itemId: 'I3' }], ready: [{ id: 'r', done: true }, { id: 's', done: false }], route: { km: 80 } });
  const B = trip({ id: 'B', startDate: '2026-11-04', days: 3, entries: [{ itemId: 'I1' }, { itemId: 'I2' }], planB: { kind: 'train' } });
  it('counts the days and their overlap by calendar day (also over the change of time)', () => {
    expect(spanOf(A)).toEqual({ start: '2026-11-02', end: '2026-11-05' });
    expect(spanOf(trip({ startDate: '2026-10-24', days: 3 }))).toEqual({ start: '2026-10-24', end: '2026-10-26' });
    expect(spanOf({ days: 2 })).toBe(null);
    expect(overlapDays(A, B)).toEqual(['2026-11-04', '2026-11-05']);
    expect(overlapDays(A, trip({ startDate: '2026-11-06', days: 1 }))).toEqual([]);
    const tl = timeline(A, B);
    expect(tl).toHaveLength(5);
    expect(tl[2]).toEqual({ day: '2026-11-04', a: true, b: true });
    expect(timeline(A, trip({ startDate: '2026-12-20', days: 2 }))).toBe(null);
    expect(MAX_DAYS).toBe(31);
  });
  it('finds gear on both lists that you own too few of on shared days', () => {
    const g = sharedGear(A, B, items);
    expect(g.map((x) => [x.item.id, x.need, x.have, x.short])).toEqual([['I1', 2, 1, true], ['I2', 2, 2, false]]);
    const later = { ...B, startDate: '2026-11-20' };
    expect(sharedGear(A, later, items).some((x) => x.short)).toBe(false);
  });
  it('lists what is still open per trip', () => {
    const a = Object.fromEntries(openTasks(A).map((r) => [r.key, [r.done, r.total, r.state]]));
    expect(a).toEqual({ pack: [1, 3, 'open'], ready: [1, 2, 'open'], route: [1, null, 'ok'], planb: [0, null, 'open'], unclear: [0, 0, 'none'], border: [0, 0, 'none'] });
    expect(openTasks(B).find((r) => r.key === 'planb').state).toBe('ok');
  });
  it('offers coming and running trips, picks the next two, and a third tap replaces the older pick', () => {
    const done = trip({ id: 'D', startDate: '2026-10-01', finished: '2026-10-02' });
    const old = trip({ id: 'O', startDate: '2026-10-01', days: 2 });
    const running = trip({ id: 'R', startDate: '2026-10-25', days: 3 });
    const list = compareChoices([B, done, A, old, running, trip({ id: 'N', startDate: '' })], '2026-10-26');
    expect(list.map((x) => x.id)).toEqual(['R', 'A', 'B', 'N']);
    expect(firstPair(list)).toEqual(['R', 'A']);
    expect(pickTrip(['R', 'A'], 'B')).toEqual(['A', 'B']);
    expect(pickTrip(['R', 'A'], 'R')).toEqual(['A']);
  });
});
