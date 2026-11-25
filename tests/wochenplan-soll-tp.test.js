// «Die Stunden des Wochenplans halten mit TrainingPeaks» (Noah 23.11.2026 «2a und b», Thread «Wochenplan-Vorschläge verlässlich machen»).
// 2a: das Soll gilt für alles (TrainingPeaks zählt voll mit, der Plan lässt zuerst das Unwichtigste weg). 2b: auf Wunsch ein eigenes Soll für solche Wochen.
// Made-up data only. Pure functions.
import { describe, it, expect } from 'vitest';
import { planOf, planWeek, plannedMins, fitToHours, modeCfg, configOf, MAX_HOURS } from '../src/lib/training/wochenplan.js';

const MON = '2026-11-23'; // winter
const cfg = planOf(null).winter; // 15 h
const tp = (id, d, mins, o = {}) => ({ id, day: `2026-11-${23 + d}`, kind: 'bike', name: 'Test Endurance', mins, zone: 2, src: 'tp', time: '07:00', ...o });
// about 9 h of TrainingPeaks bike, six sessions
const WEEK = [tp('a', 0, 90), tp('b', 1, 90), tp('c', 3, 90), tp('d', 4, 130, { time: '08:00' }), tp('e', 5, 80, { time: '09:00' }), tp('f', 6, 60, { time: '09:00' })];
const total = (r) => plannedMins(r.units) + r.tp.reduce((a, x) => a + x.mins, 0);
const count = (r, t) => r.units.filter((u) => u.type === t).length;

describe('2a: das Soll gilt für alles', () => {
  it('ohne TrainingPeaks ändert sich nichts', () => {
    const r = planWeek(cfg, { monday: MON });
    expect(r.notes.some((n) => n.key === 'soll-cut' || n.key === 'soll-over')).toBe(false);
    expect(count(r, 'mini')).toBe(1);
  });
  it('mit wenig TrainingPeaks bleibt alles, was in die Stunden passt', () => {
    const r = planWeek(cfg, { monday: MON, sessions: [tp('x', 2, 60)] });
    expect(r.notes.filter((n) => n.key === 'soll-cut')).toEqual([]);
  });
  it('mit viel TrainingPeaks fällt zuerst Mini-Workout, dann Laufen drinnen, dann das zweite Gym weg', () => {
    const r = planWeek(cfg, { monday: MON, sessions: [tp('x', 2, 240)] });
    const cut = r.notes.filter((n) => n.key === 'soll-cut').map((n) => n.type);
    expect(cut.slice(0, 3)).toEqual(['mini', 'runIn', 'gym'].slice(0, cut.slice(0, 3).length));
    expect(cut[0]).toBe('mini');
    expect(count(r, 'mini')).toBe(0);
  });
  it('Tennis, Eishockey, Yoga, das erste Gym und die Sauna bleiben immer', () => {
    const r = planWeek(cfg, { monday: MON, sessions: WEEK });
    for (const t of ['hockey', 'tennis', 'yoga', 'sauna']) expect(count(r, t)).toBe(planWeek(cfg, { monday: MON }).units.filter((u) => u.type === t).length);
    expect(count(r, 'gym')).toBeGreaterThanOrEqual(1);
  });
  it('mit 9 Std. TrainingPeaks: Plan plus TrainingPeaks liegt viel näher am Soll als vorher, der Rest steht als Hinweis', () => {
    const r = planWeek(cfg, { monday: MON, sessions: WEEK });
    expect(total(r)).toBeLessThan(15 * 60 + 5 * 60); // vorher: ca. 19,5 Std. und mehr
    const over = r.notes.find((n) => n.key === 'soll-over');
    expect(over).toMatchObject({ hours: 15, own: false });
    expect(over.mins).toBeGreaterThan(0);
  });
  it('fitToHours schneidet nie unter den Boden und nie mehr als nötig', () => {
    const c = { ...cfg.counts };
    const r = fitToHours(cfg, c, null, 100000);
    expect(r.counts).toEqual(c);
    expect(r.notes).toEqual([]);
    const tight = fitToHours(cfg, c, null, 0);
    expect(tight.counts.gym).toBe(1);
    expect(tight.counts.mini + tight.counts.runIn + tight.counts.runOut + tight.counts.bikeIn + tight.counts.bikeOut).toBe(0);
    expect(tight.counts.tennis).toBe(c.tennis);
    expect(tight.counts.yoga).toBe(c.yoga);
  });
  it('eine Skitour-Woche bleibt ausgenommen: die Tour ist der Plan', () => {
    const r = planWeek(cfg, { monday: MON, ski: true, sessions: WEEK });
    expect(r.notes.some((n) => n.key === 'soll-cut')).toBe(false);
  });
});

describe('2b: ein eigenes Soll für Wochen mit TrainingPeaks', () => {
  it('ohne Wert gilt das Soll, mit Wert dieser; weniger wird nicht gekürzt, wenn das eigene Soll grösser ist', () => {
    const own = { ...cfg, tpHours: 22 };
    const a = planWeek(cfg, { monday: MON, sessions: WEEK });
    const b = planWeek(own, { monday: MON, sessions: WEEK });
    expect(b.units.length).toBeGreaterThan(a.units.length);
    expect(b.notes.filter((n) => n.key === 'soll-cut')).toEqual([]);
    expect(b.notes.find((n) => n.key === 'soll-over')?.own ?? true).toBe(true);
  });
  it('ohne TrainingPeaks und Termine zählt tpHours nicht', () => {
    const r = planWeek({ ...cfg, tpHours: 24 }, { monday: MON });
    expect(r.units.length).toBe(planWeek(cfg, { monday: MON }).units.length);
  });
  it('configOf: tpHours ist optional, ganz, zwischen 6 und 24; alte Einstellungen ohne Feld laden unverändert', () => {
    expect(configOf({ hours: 15 }, false).tpHours).toBeUndefined();
    expect(configOf({ hours: 15, tpHours: 21.4 }, false).tpHours).toBe(21);
    expect(configOf({ hours: 15, tpHours: 99 }, false).tpHours).toBe(MAX_HOURS);
    expect(configOf({ hours: 15, tpHours: 'x' }, false).tpHours).toBeUndefined();
    expect(JSON.stringify(configOf({ hours: 15 }, false))).not.toContain('tpHours');
  });
  it('leichte und härtere Woche verändern das eigene Soll im gleichen Verhältnis', () => {
    const c = { ...cfg, tpHours: 20 };
    expect(modeCfg(c, false, { light: true }).tpHours).toBe(12);
    expect(modeCfg(c, false, { hard: true }).tpHours).toBe(24);
    expect(modeCfg(c, false, {}).tpHours).toBe(20);
  });
});
