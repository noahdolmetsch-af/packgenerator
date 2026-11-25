// «Trainingspläne zählen wie TrainingPeaks» (Noah 23.11.2026 «5a», thread «Wochenplan-Vorschläge verlässlich machen»), step 6:
// the sessions of a training plan in use (src 'tpl:<id>') stand fixed in the week and replace the plan's own units, so a plan like
// «Ultra» from 28 Dec does not put bike units on top. Made-up data only. Pure.
import { describe, it, expect } from 'vitest';
import { planOf, planWeek, tpWeek, TP_SRC } from '../src/lib/training/wochenplan.js';

const MON = '2026-12-28';
const dayOf = (d) => { const t = new Date(Date.UTC(2026, 11, 28 + d, 12)); return t.toISOString().slice(0, 10); };
const ses = (id, d, mins, src, o = {}) => ({ id, day: dayOf(d), kind: 'bike', name: 'Grundlage', mins, zone: 2, src, ...o });
const cfg = { ...planOf({ winter: { hours: 15 } }).winter, counts: { ...planOf(null).winter.counts, bikeOut: 3, bikeIn: 0 } };
const count = (r, type) => r.units.filter((u) => u.type === type).length;

describe('Trainingsplan in der Woche', () => {
  it('tpWeek nimmt Einheiten eines Trainingsplans wie die aus TrainingPeaks', () => {
    const w = tpWeek([ses('a', 1, 90, 'tpl:ultra'), ses('b', 2, 60, TP_SRC), ses('c', 3, 60, 'sug'), ses('d', 4, 60, undefined)], MON);
    expect(w.map((x) => x.id)).toEqual(['tp:a', 'tp:b']);
    expect(w[0].plan).toBe(true);
    expect(w[1].plan).toBeUndefined();
  });
  it('drei Stunden Velo aus dem Plan nehmen zwei «Velo draussen» weg, mit eigener Notiz', () => {
    const before = planWeek(cfg, { monday: MON, pins: {} });
    expect(count(before, 'bikeOut')).toBe(3);
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [ses('p1', 1, 180, 'tpl:ultra')] });
    expect(count(r, 'bikeOut')).toBe(1);
    expect(r.notes.find((n) => n.key === 'tpl-replaces')).toMatchObject({ type: 'bikeOut', n: 2 });
    expect(r.notes.find((n) => n.key === 'tpl-in')).toMatchObject({ n: 1, mins: 180, hours: 3 });
    expect(r.notes.some((n) => n.key === 'tp-in' || n.key === 'tp-replaces')).toBe(false);
  });
  it('mit TrainingPeaks und Plan zusammen bleibt TrainingPeaks bei seinen Worten', () => {
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [ses('p1', 1, 90, 'tpl:ultra'), ses('t1', 3, 90, TP_SRC)] });
    expect(r.notes.find((n) => n.key === 'tp-in')).toMatchObject({ n: 1 });
    expect(r.notes.find((n) => n.key === 'tpl-in')).toMatchObject({ n: 1 });
    expect(r.notes.some((n) => n.key === 'tp-replaces')).toBe(true);
  });
  it('die Einheiten des Plans stehen fest und zählen aufs Stundenziel', () => {
    const r = planWeek(cfg, { monday: MON, pins: {}, sessions: [ses('p1', 1, 240, 'tpl:ultra')] });
    expect(r.tp).toHaveLength(1);
    expect(r.units.some((u) => u.tp)).toBe(false); // the fixed ones are in `tp`, not in the plan's own units
  });
  it('ohne Plan bleibt die Woche gleich', () => {
    const a = JSON.stringify(planWeek(cfg, { monday: MON, pins: {}, sessions: [ses('x', 1, 90, 'sug')] }));
    expect(a).toBe(JSON.stringify(planWeek(cfg, { monday: MON, pins: {} })));
  });
});
