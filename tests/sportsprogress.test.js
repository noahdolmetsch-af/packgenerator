import { describe, it, expect } from 'vitest';
import { suggestMeasures, parseValue, valueText, stepValue, valuesOf, bestOf, changeOf, monthCompare, curve, newValue, stravaMeasures, GRADES } from '../src/lib/sportsprogress.js';

const m = { id: 'm1', sport: 'act:gym', kind: 'measure', name: 'Beinpresse', unit: 'kg' };
const v = (day, val, extra = {}) => ({ id: `v-${day}`, kind: 'value', mid: 'm1', sport: 'act:gym', day, v: val, at: `${day}T10:00` , ...extra });

describe('Paket O «Verlauf und Fortschritt»', () => {
  it('suggests measures only while none are set up (Noah «2b, wenn nichts eingetragen a»)', () => {
    expect(suggestMeasures('act:gym', []).map((s) => s.name)).toEqual(expect.arrayContaining(['Leg press', 'eGym strength level', 'Sauna rounds after the gym']));
    expect(suggestMeasures('act:gym', [m])).toEqual([]);
    expect(suggestMeasures('trip:gravel', []).map((s) => s.unit)).toEqual(['km', 'm']);
    expect(suggestMeasures('act:whatever', [])).toEqual([{ name: 'Minutes', unit: 'min' }]);
  });
  it('reads and writes kg, pace and grades', () => {
    expect(parseValue('82,5', 'kg')).toBe(82.5);
    expect(parseValue('', 'kg')).toBe(null);
    expect(parseValue('-3', 'kg')).toBe(null);
    expect(parseValue('5:30', 'pace')).toBe(330);
    expect(valueText(330, 'pace')).toBe('5:30');
    expect(parseValue('6a+', 'grade')).toBe(GRADES.indexOf('6a+'));
    expect(valueText(GRADES.indexOf('7a'), 'grade')).toBe('7a');
    expect(stepValue(80, 'kg', 1)).toBe(82.5);
    expect(stepValue(0, 'count', -1)).toBe(0);
  });
  it('best value with a star, the change in weeks and the month before', () => {
    const vals = valuesOf([v('2026-09-01', 80), v('2026-09-20', 85), v('2026-10-13', 90), { kind: 'measure', id: 'x' }], 'm1');
    expect(vals.map((x) => x.v)).toEqual([80, 85, 90]);
    expect(bestOf(vals, 'kg').v).toBe(90);
    expect(changeOf(vals, 'kg')).toEqual({ diff: 10, weeks: 6, better: true });
    expect(changeOf(vals.slice(0, 1), 'kg')).toBe(null);
    const mc = monthCompare(vals, 'kg', '2026-10-19');
    expect(mc).toMatchObject({ now: 90, before: 80, diff: 10, better: true });
    // a pace: less is better
    const pace = [v('2026-09-01', 360), v('2026-10-01', 330)];
    expect(bestOf(pace, 'pace').v).toBe(330);
    expect(changeOf(pace, 'pace').better).toBe(true);
  });
  it('draws a curve with the best dot marked', () => {
    const c = curve([v('2026-09-01', 80), v('2026-10-01', 90)], 'kg', 100, 50, 0);
    expect(c.d).toBe('M0 50 L100 0');
    expect(c.dots[1].best).toBe(true);
    expect(curve([v('2026-09-01', 80)], 'kg')).toBe(null);
  });
  it('a new value keeps sets and reps only when given', () => {
    expect(newValue(m, { day: '2026-10-19', v: 90, reps: 10, sets: 3 })).toEqual({ sport: 'act:gym', kind: 'value', mid: 'm1', day: '2026-10-19', v: 90, reps: 10, sets: 3 });
    expect(newValue(m, { day: '2026-10-19', v: 90, reps: NaN })).not.toHaveProperty('reps');
  });
  it('Strava values come in by themselves for the matching sport', () => {
    const acts = [
      { id: 'a1', day: '2026-10-01', type: 'GravelRide', km: 62.4, movingS: 9000, hm: 800 },
      { id: 'a2', day: '2026-10-02', type: 'Run', km: 10, movingS: 3000, hm: 0 },
    ];
    const g = stravaMeasures(acts, 'trip:gravel');
    expect(g.map((x) => x.measure.id)).toEqual(['strava:km', 'strava:min', 'strava:m']);
    expect(g[0].values[0].v).toBe(62.4);
    expect(stravaMeasures(acts, 'act:run').map((x) => x.measure.id)).toEqual(['strava:km', 'strava:min']);
    expect(stravaMeasures(acts, 'act:sauna')).toEqual([]);
  });
});
