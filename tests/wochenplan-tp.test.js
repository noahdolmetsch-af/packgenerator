// «TrainingPeaks zählt im Wochen-Soll mit» (Noah 22.11.2026 «1a 2a 3a 4a»), W1: the planner knows TrainingPeaks.
// Made-up data only. Pure: planWeek(cfg, { monday, sessions }).
import { describe, it, expect } from 'vitest';
import { planOf, planWeek, tpWeek, tpTypeOf, tpLoad, plannedMins, TP_SRC } from '../src/lib/training/wochenplan.js';
import { weekFor, dueToday } from '../src/lib/training/wochenlog.js';

const MON = '2026-12-07'; // winter
const day = (d) => `2026-12-${String(7 + d).padStart(2, '0')}`;
const tp = (id, d, mins, o = {}) => ({ id, day: day(d), kind: 'bike', name: 'Basemiles', mins, zone: 2, src: TP_SRC, ...o });
const cfgOf = (hours) => planOf({ winter: { hours } }).winter;
const count = (r, type) => r.units.filter((u) => u.type === type).length;

describe('TrainingPeaks in der Woche: Wächter', () => {
  it('ohne TrainingPeaks bleibt die Woche gleich (auch mit Sessions anderer Herkunft)', () => {
    const cfg = cfgOf(15);
    const base = JSON.stringify(planWeek(cfg, { monday: MON, pins: {} }));
    const own = [{ id: 'a', day: day(1), kind: 'bike', name: 'Eigene Fahrt', mins: 120, zone: 2 }];
    expect(JSON.stringify(planWeek(cfg, { monday: MON, pins: {}, sessions: own }))).toBe(base);
    expect(JSON.stringify(planWeek(cfg, { monday: MON, pins: {}, sessions: [] }))).toBe(base);
    expect(planWeek(cfg, { monday: MON, pins: {} }).tp).toEqual([]);
  });
  it('TrainingPeaks einer anderen Woche ändert nichts', () => {
    const cfg = cfgOf(15);
    const far = [{ ...tp('x', 0, 180), day: '2026-12-21' }];
    const a = planWeek(cfg, { monday: MON, pins: {}, sessions: far });
    expect(a.units).toEqual(planWeek(cfg, { monday: MON, pins: {} }).units);
  });
});

describe('Ersatz nach Sportart (2a)', () => {
  const cfg = { ...cfgOf(15), counts: { ...cfgOf(15).counts, bikeOut: 3, bikeIn: 0 } };
  it('drei Stunden Velo nehmen zwei «Velo draussen» weg, mit Notiz', () => {
    const before = planWeek(cfg, { monday: MON, pins: {} });
    expect(count(before, 'bikeOut')).toBe(3);
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [tp('t1', 1, 180)] });
    expect(count(r, 'bikeOut')).toBe(1);
    expect(r.notes.find((n) => n.key === 'tp-replaces')).toMatchObject({ type: 'bikeOut', n: 2 });
    expect(r.notes.find((n) => n.key === 'tp-in')).toMatchObject({ n: 1, mins: 180, hours: 3 });
  });
  it('Titel mit «Indoor» ersetzt zuerst «Velo drinnen»', () => {
    const c = { ...cfg, counts: { ...cfg.counts, bikeOut: 1, bikeIn: 2 } };
    const r = planWeek(c, { monday: MON, pins: {}, sessions: [tp('t1', 1, 100, { name: 'VO2max (Indoor, 5x4)' })] });
    expect(count(r, 'bikeIn')).toBe(0);
    expect(count(r, 'bikeOut')).toBe(1);
  });
  it('Velo reicht für beide Arten: der Rest deckt die andere Art', () => {
    const c = { ...cfg, counts: { ...cfg.counts, bikeOut: 1, bikeIn: 1 } };
    const r = planWeek(c, { monday: MON, pins: {}, sessions: [tp('t1', 2, 8 * 60 + 47)] });
    expect(count(r, 'bikeOut') + count(r, 'bikeIn')).toBe(0);
  });
  it('Lauf ersetzt Laufen, Kraft ersetzt Gym, Wandern ersetzt nichts', () => {
    const c = { ...cfg, counts: { ...cfg.counts, runOut: 2, gym: 2 } };
    const r = planWeek(c, { monday: MON, pins: {}, sessions: [tp('r', 0, 90, { kind: 'run', name: 'Easy run' }), tp('k', 2, 60, { kind: 'other', name: 'Kraft Beine', zone: null }), tp('h', 5, 200, { kind: 'hike', name: 'Wanderung' })] });
    expect(count(r, 'runOut')).toBe(0);
    expect(count(r, 'gym')).toBe(1);
    expect(count(r, 'tennis')).toBe(count(planWeek(c, { monday: MON, pins: {} }), 'tennis'));
  });
  it('Tennis, Eishockey, Yoga bleiben, auch bei sehr viel Velo; TrainingPeaks über dem Soll rechnet nie ins Minus', () => {
    const before = planWeek(cfg, { monday: MON, pins: {} });
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [tp('a', 1, 600), tp('b', 3, 600), tp('c', 5, 600)] });
    for (const t of ['hockey', 'tennis', 'yoga', 'gym']) expect(count(r, t)).toBe(count(before, t));
    expect(r.notes.some((n) => n.key === 'tp-over')).toBe(true);
  });
  it('die Einheiten von TrainingPeaks stehen nicht in units, aber in tp', () => {
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [tp('t1', 1, 90, { time: '17:00' })] });
    expect(r.units.some((u) => u.type === 'tp')).toBe(false);
    expect(r.tp).toEqual([expect.objectContaining({ id: 'tp:t1', d: 1, mins: 90, t: '17:00', type: 'bikeOut' })]);
  });
  it('Sommer: die Velo-Stunden schrumpfen mit', () => {
    const s = planOf(null).summer;
    const sm = '2027-06-07';
    const a = planWeek(s, { monday: sm, pins: {} });
    const r = planWeek(s, { monday: sm, pins: {}, sessions: [{ id: 't', day: '2027-06-08', kind: 'bike', name: 'Long', mins: 240, zone: 2, src: TP_SRC }] });
    const outMins = (x) => x.units.filter((u) => u.type === 'bikeOut').reduce((v, u) => v + u.mins, 0);
    expect(outMins(r)).toBeLessThan(outMins(a));
  });
});

describe('Fest und mit Warnung (3a)', () => {
  it('harte TrainingPeaks-Tage ergeben «drei harte Tage am Stück»', () => {
    const cfg = { ...cfgOf(15), counts: { hockey: 0, tennis: 0, yoga: 0, gym: 0, sauna: 0, rest: 0, bikeOut: 0, bikeIn: 0, runOut: 0, runIn: 0, mini: 0 }, fixes: {} };
    const hard = [0, 1, 2].map((d) => tp(`h${d}`, d, 60, { zone: 4 }));
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: hard });
    const w = r.warnings.find((x) => x.key === 'hard-run');
    expect(w).toMatchObject({ d: 2 });
    expect(w.fix).toBeUndefined(); // nothing of the plan to take away
    expect(r.dayLoad.slice(0, 3)).toEqual(['H', 'H', 'H']);
  });
  it('mehr als drei Einheiten an einem Tag zählt TrainingPeaks mit', () => {
    const cfg = cfgOf(15);
    const four = [0, 1, 2, 3].map((i) => tp(`m${i}`, 4, 30, { time: `0${6 + i * 2}:00` }));
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: four });
    expect(r.warnings.some((w) => w.key === 'too-many' && w.d === 4)).toBe(true);
  });
  it('eine feste Einheit über TrainingPeaks meldet die Überschneidung mit der TrainingPeaks-Id', () => {
    const cfg = cfgOf(15); // tennis is fixed on Tuesday 10:00
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [tp('t1', 1, 90, { time: '09:30' })] });
    const w = r.warnings.find((x) => x.key === 'overlap' && (x.a === 'tp:t1' || x.b === 'tp:t1'));
    expect(w).toBeTruthy();
    expect(r.tp.find((x) => x.id === 'tp:t1')).toBeTruthy();
  });
  it('die freien Einheiten weichen TrainingPeaks aus (keine Überschneidung)', () => {
    const cfg = cfgOf(15);
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [0, 1, 2, 3, 4, 5, 6].map((d) => tp(`z${d}`, d, 120, { time: '11:00' })) });
    const own = r.warnings.filter((w) => w.key === 'overlap' && !String(w.a).startsWith('tp:') && !String(w.b).startsWith('tp:'));
    expect(own).toEqual([]);
    const flexOverlap = r.warnings.filter((w) => w.key === 'overlap' && (r.units.find((u) => u.id === w.a)?.fixed === false || r.units.find((u) => u.id === w.b)?.fixed === false));
    expect(flexOverlap).toEqual([]);
  });
  it('ein langer Tag ohne Uhrzeit hält einen Halbtag besetzt', () => {
    const cfg = { ...cfgOf(6), counts: { hockey: 0, tennis: 0, yoga: 0, gym: 0, sauna: 0, rest: 0, bikeOut: 0, bikeIn: 0, runOut: 0, runIn: 0, mini: 0 }, fixes: {} };
    const free = planWeek(cfg, { monday: MON, pins: {} }).freeHalves;
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [tp('l', 5, 370)] });
    expect(r.freeHalves).toBeLessThan(free);
  });
});

describe('Hilfen', () => {
  it('tpTypeOf und tpLoad', () => {
    expect(tpTypeOf({ kind: 'bike', name: 'Basemiles Indoor Mix' })).toBe('bikeIn');
    expect(tpTypeOf({ kind: 'bike', name: 'Endurance' })).toBe('bikeOut');
    expect(tpTypeOf({ kind: 'run', name: 'Intervals' })).toBe('runOut');
    expect(tpTypeOf({ kind: 'other', name: 'Strength A' })).toBe('gym');
    expect(tpTypeOf({ kind: 'other', name: 'Schwimmen' })).toBe(null);
    expect(tpTypeOf({ kind: 'hike', name: 'Walk' })).toBe(null);
    expect([tpLoad(5), tpLoad(4), tpLoad(3), tpLoad(2), tpLoad(null)]).toEqual(['H', 'H', 'M', 'L', 'M']);
  });
  it('tpWeek nimmt nur src tp, nur diese Woche, sortiert', () => {
    const list = [tp('b', 3, 60), tp('a', 1, 60), { ...tp('o', 1, 60), src: undefined }, { ...tp('far', 0, 60), day: '2026-12-14' }];
    expect(tpWeek(list, MON).map((x) => x.id)).toEqual(['tp:a', 'tp:b']);
    expect(tpWeek(null, MON)).toEqual([]);
  });
  it('weekFor und dueToday reichen die Sessions an den Planer', () => {
    const stored = { v: 1, winter: { hours: 15, counts: { ...planOf(null).winter.counts, bikeOut: 2, bikeIn: 0 } } };
    const withTp = weekFor(stored, MON, {}, {}, [tp('t', 1, 240)]);
    const without = weekFor(stored, MON, {}, {});
    expect(withTp.week.units.filter((u) => u.type === 'bikeOut').length).toBeLessThan(without.week.units.filter((u) => u.type === 'bikeOut').length);
    const wed = day(2);
    expect(dueToday(stored, null, wed, [tp('t', 1, 240)]).units.filter((u) => u.type === 'bikeOut').length).toBe(withTp.week.units.filter((u) => u.type === 'bikeOut').length);
  });
  it('plannedMins zählt nur die Einheiten des Plans', () => {
    const r = planWeek(cfgOf(15), { monday: MON, pins: {}, sessions: [tp('t', 1, 600)] });
    expect(plannedMins(r.units)).toBe(plannedMins(r.units.filter((u) => u.type !== 'tp')));
  });
});
