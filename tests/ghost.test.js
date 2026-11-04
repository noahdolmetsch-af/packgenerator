// «Beat your Ghost» (Cockpit-Idee 4): which earlier ride can be the ghost, and how this ride compares.
import { describe, it, expect } from 'vitest';
import { alike, ghostsOf, driftOf, compare, resultOf, betterOf, ghostCase } from '../src/lib/training/act/ghost.js';

const ride = (id, day, x = {}) => ({ id, day, time: '08:00', kind: 'bike', name: 'Abendrunde', km: 40, hm: 600, movingS: 5400, hrAvg: 140, wAvg: 190, wDevice: true, tempAvg: 14, ...x });
const me = ride('me', '2026-10-20', { hrAvg: 136 });

describe('alike', () => {
  it('same name and km within 10 % is the same route and a good match', () => {
    expect(alike(me, ride('g', '2026-09-01', { km: 42 }))).toMatchObject({ route: true, level: 'good', kmPct: 5, hmPct: 0 });
  });
  it('another route with close km and Hm is good, further away is fair, too different is nothing', () => {
    expect(alike(me, ride('g', '2026-09-01', { name: 'Other', km: 41, hm: 620 }))).toMatchObject({ route: false, level: 'good' });
    expect(alike(me, ride('g', '2026-09-01', { name: 'Other', km: 46, hm: 600 }))).toMatchObject({ route: false, level: 'fair' });
    expect(alike(me, ride('g', '2026-09-01', { name: 'Other', km: 60 }))).toBeNull();
    expect(alike(me, ride('g', '2026-09-01', { name: 'Other', hm: 900 }))).toBeNull();
  });
  it('temperature and wind differences are known only when both rides have them', () => {
    expect(alike(me, ride('g', '2026-09-01', { tempAvg: 6 })).tempD).toBe(-8);
    expect(alike(me, ride('g', '2026-09-01')).windD).toBeNull();
    const a = alike({ ...me, wxRide: { wind: 8 } }, ride('g', '2026-09-01', { wxRide: { wind: 22 } }));
    expect(a.windD).toBe(14);
  });
});

describe('ghostsOf', () => {
  it('only earlier bike rides with a heart rate; the same route first, then the smallest difference', () => {
    const all = [
      me,
      ride('later', '2026-10-25'),
      ride('run', '2026-09-01', { kind: 'run' }),
      ride('nohr', '2026-09-02', { hrAvg: 0 }),
      ride('near', '2026-09-03', { name: 'Other', km: 40.5 }),
      ride('route', '2026-08-01', { km: 43 }),
      ride('far', '2026-09-04', { name: 'Other', km: 80 }),
    ];
    expect(ghostsOf(all, me).map((g) => g.act.id)).toEqual(['route', 'near']);
  });
  it('is empty for a ride that cannot be compared and caps the list', () => {
    expect(ghostsOf([ride('a', '2026-09-01')], { ...me, hrAvg: 0 })).toEqual([]);
    expect(ghostsOf([ride('a', '2026-09-01')], { ...me, kind: 'run' })).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => ride(`g${i}`, `2026-09-0${i % 9 + 1}`));
    expect(ghostsOf(many, me)).toHaveLength(6);
  });
});

describe('drift', () => {
  it('watts per beat fall with power, heart rate rise without', () => {
    expect(driftOf({ halves: [{ s: 1, w: 190, hr: 130 }, { s: 1, w: 190, hr: 135 }] })).toEqual({ kind: 'wpb', pct: 3.7 });
    expect(driftOf({ halves: [{ s: 1, hr: 130 }, { s: 1, hr: 135 }] })).toEqual({ kind: 'hr', pct: 3.8 });
    expect(driftOf({ halves: [{ s: 1, w: 190, hr: 130 }, { s: 1, hr: 135 }] }, 'wpb')).toBeNull();
    expect(driftOf({})).toBeNull();
  });
});

describe('compare', () => {
  it('the same power with less heart rate is said so', () => {
    const c = compare(me, ride('g', '2026-09-01', { hrAvg: 142, wAvg: 192 }));
    expect(c.verdict).toEqual({ key: 'samepower-less', n: 6 });
    expect(c.power).toBe(true);
    expect(c.rows.map((r) => r.key)).toEqual(['w', 'hr', 'wpb', 'kmh', 'time']);
  });
  it('more heart rate at the same power', () => {
    expect(compare(me, ride('g', '2026-09-01', { hrAvg: 130 })).verdict).toEqual({ key: 'samepower-more', n: 6 });
  });
  it('ahead or behind by watts per beat when the power differs', () => {
    const ahead = compare({ ...me, wAvg: 215 }, ride('g', '2026-09-01'));
    expect(ahead.verdict.key).toBe('ahead');
    expect(compare({ ...me, wAvg: 160 }, ride('g', '2026-09-01')).verdict.key).toBe('behind');
  });
  it('level inside 2 %, and no verdict text for a difference of one beat at the same power', () => {
    expect(compare({ ...me, hrAvg: 139 }, ride('g', '2026-09-01', { hrAvg: 140 })).verdict).toEqual({ key: 'level' });
  });
  it('without a power meter it compares km/h per beat', () => {
    const noP = { wAvg: null, wDevice: false };
    const c = compare(ride('m', '2026-10-20', { ...noP, movingS: 4800 }), ride('g', '2026-09-01', { ...noP }));
    expect(c.power).toBe(false);
    expect(c.rows.map((r) => r.key)).toContain('kmhb');
    expect(c.verdict.key).toBe('ahead');
  });
  it('drift only when both rides have the same kind', () => {
    const h = (a, b) => ({ halves: [{ s: 1, w: 190, hr: a }, { s: 1, w: 190, hr: b }] });
    expect(compare({ ...me, ...h(130, 135) }, ride('g', '2026-09-01', h(130, 140))).drift).toMatchObject({ kind: 'wpb' });
    expect(compare(me, ride('g', '2026-09-01', h(130, 140))).drift).toBeNull();
  });
  it('is null without a heart rate', () => {
    expect(compare({ ...me, hrAvg: 0 }, ride('g', '2026-09-01'))).toBeNull();
  });
});

describe('beaten?', () => {
  it('resultOf turns the verdict into beat, level or behind', () => {
    expect(resultOf({ verdict: { key: 'ahead' } })).toBe('beat');
    expect(resultOf({ verdict: { key: 'samepower-less' } })).toBe('beat');
    expect(resultOf({ verdict: { key: 'level' } })).toBe('level');
    expect(resultOf({ verdict: { key: 'behind' } })).toBe('behind');
    expect(resultOf({ verdict: { key: 'samepower-more' } })).toBe('behind');
    expect(resultOf(null)).toBeNull();
  });
  it('betterOf: more is better for power and speed, less for heart rate, time and drift', () => {
    expect(betterOf('w', 188, 179)).toBe(true);
    expect(betterOf('hr', 138, 141)).toBe(true);
    expect(betterOf('time', 5760, 5900)).toBe(true);
    expect(betterOf('drift', 6.3, 6.6)).toBe(true);
    expect(betterOf('hr', 150, 141)).toBe(false);
    expect(betterOf('w', 180, 180)).toBeNull();
    expect(betterOf('w', null, 180)).toBeNull();
  });
  it('ghostCase picks the ghost, the comparison and the result; null without a ghost', () => {
    const g = ride('g', '2026-09-01', { hrAvg: 142 });
    const c = ghostCase([me, g], me);
    expect(c.ghost.act.id).toBe('g');
    expect(c.result).toBe('beat');
    expect(ghostCase([me], me)).toBeNull();
  });
});
