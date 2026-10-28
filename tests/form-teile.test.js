// «Diagramme zum Antippen» K3 (Noah 27.10.2026 «1-5 a»): the days behind each row of «Was heute zählt» on
// «Form und Erholung». Value, normal and points per day are the ones the readiness counts. Fictional data only.
import { describe, it, expect } from 'vitest';
import { PARTS, PART_KEYS, lastDays, partDays, partsWithData } from '../src/lib/flow/form/teile.js';
import { recoveryParts, readiness, formSeries } from '../src/lib/form.js';
import { PART_NAMES } from '../src/lib/flow/form/words.js';

const TODAY = '2026-10-21';
const table = new Map();
lastDays(TODAY, 40).forEach((d, i) => table.set(d, { rhr: 48 + (i % 4), hrv: 50 + (i % 3), sleep: 420 + (i % 5) * 10 }));

describe('Was heute zählt: the days of each part', () => {
  it('every part has a name, a rule and a normal', () => {
    expect(PART_KEYS).toEqual(Object.keys(PART_NAMES));
    for (const k of PART_KEYS) expect(PARTS[k].rule.length).toBeGreaterThan(20);
  });
  it('the n days up to today, oldest first', () => {
    expect(lastDays(TODAY, 3)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21']);
  });
  it('the resting pulse of today: the same value, normal and points as the readiness', () => {
    const days = partDays('rhr', { table }, TODAY, 7);
    expect(days).toHaveLength(7);
    expect(days.at(-1).day).toBe(TODAY);
    const p = recoveryParts(table, TODAY).find((x) => x.key === 'rhr');
    expect(days.at(-1)).toEqual({ day: TODAY, v: p.v, normal: p.normal, points: p.points });
  });
  it('a day without a value stays empty, never 0', () => {
    const t2 = new Map(table);
    t2.set('2026-10-19', {});
    const d = partDays('hrv', { table: t2 }, TODAY, 3);
    expect(d[0]).toEqual({ day: '2026-10-19', v: null, normal: null, points: null });
    expect(d[1].v).toBeTypeOf('number');
  });
  it('the felt sleep and energy come from the morning checks of each day', () => {
    const felt = new Map([
      [TODAY, { sleep: 8, energy: 3 }],
      ['2026-10-20', { sleep: 5, energy: null }],
    ]);
    const s = partDays('feltSleep', { table, felt }, TODAY, 3);
    expect(s.map((d) => d.v)).toEqual([null, 5, 8]);
    expect(s.at(-1)).toMatchObject({ normal: 6, points: 5 });
    expect(partDays('energy', { table, felt }, TODAY, 2).map((d) => d.v)).toEqual([null, 3]);
  });
  it('the form: the rounded form and the points of the readiness', () => {
    const loads = new Map(lastDays(TODAY, 60).map((d, i) => [d, i % 3 ? 60 : 0]));
    const series = formSeries(loads, '2026-08-01', TODAY);
    const d = partDays('form', { table, series }, TODAY, 7);
    expect(d.at(-1).v).toBe(Math.round(series.at(-1).form));
    expect(d.at(-1).points).toBeCloseTo(readiness({ series, parts: [] }).formPts, 6);
    expect(d.at(-1).normal).toBe(0);
  });
  it('the parts with data', () => {
    expect(partsWithData({ table }, TODAY, 7)).toEqual(['rhr', 'hrv', 'sleep']);
  });
});
