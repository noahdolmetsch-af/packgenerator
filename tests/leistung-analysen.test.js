// TR7a/TR7b/TR7f: the pure maths of the analyses on one activity (src/lib/training/act/analysen.js).
// Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { mss, isClimb, sectionRows, movingToCourse, focusRange, courseChart, nearest, gridCells, halvesOf, similarRides, niceTicks, bestTable, BEST_SPANS } from '../src/lib/training/act/analysen.js';
import { powerBounds, shiftDay } from '../src/lib/training.js';

const SECS = [
  { from: 0, to: 5, s: 661, hm: 40, hr: 131, w: 182 },
  { from: 5, to: 10, s: 641, hm: 25, hr: 134, w: 190 },
  { from: 10, to: 15, s: 948, hm: 210, hr: 152, w: 238 },
  { from: 15, to: 20, s: 895, hm: 150, hr: 149, w: 231 },
  { from: 20, to: 22.3, s: 300, hm: 69, hr: 129, w: 170 },
];

describe('mss', () => {
  it('writes m:ss and h:mm:ss', () => {
    expect(mss(661)).toBe('11:01');
    expect(mss(59)).toBe('0:59');
    expect(mss(3725)).toBe('1:02:05');
    expect(mss(null)).toBe('0:00');
  });
});

describe('sections', () => {
  it('flags a climb above 3 % on average, not at exactly 3 %', () => {
    expect(isClimb(SECS[2])).toBe(true); // 4.2 %
    expect(isClimb(SECS[3])).toBe(false); // 3.0 %
    expect(isClimb(SECS[4])).toBe(false); // 69 m on 2.3 km = 3.0 %
    expect(isClimb({ from: 0, to: 0, hm: 50 })).toBe(false);
    expect(isClimb({ from: 0, to: 5, hm: null })).toBe(false);
  });
  it('adds km/h and the moving minutes', () => {
    const rows = sectionRows(SECS);
    expect(rows.map((r) => r.climb)).toEqual([false, false, true, false, false]);
    expect(rows[0].kmh).toBe(27.2);
    expect(rows[0].m0).toBe(0);
    expect(rows[1].m0).toBeCloseTo(661 / 60);
    expect(rows[2].m1).toBeCloseTo((661 + 641 + 948) / 60);
    expect(sectionRows(null)).toEqual([]);
  });
  it('places a section on the course minutes, after the breaks before it', () => {
    expect(movingToCourse(30, [[20, 24]])).toBe(34);
    expect(movingToCourse(10, [[20, 24]])).toBe(10);
    expect(movingToCourse(50, [[40, 42], [20, 24]])).toBe(56);
    const [a, b] = focusRange(SECS, 3, [[20, 24]]);
    expect(a).toBeCloseTo((661 + 641 + 948) / 60 + 4);
    expect(b).toBeCloseTo((661 + 641 + 948 + 895) / 60 + 4);
    expect(focusRange(SECS, 9)).toBeNull();
  });
});

describe('course chart', () => {
  const prof = { pts: [[0, 500, 120, 180], [10, 600, 140, 220], [20, 550, 150, 0], [30, 520, 130, 200]], breaks: [[18, 22]] };
  it('scales the minutes to the width and keeps each line in the box', () => {
    const c = courseChart(prof, 416, 200);
    expect(c.x(0)).toBe(8);
    expect(c.x(30)).toBe(408);
    expect(c.ticks.map((k) => k.m)).toEqual([0, 8, 15, 23, 30]);
    expect(c.area.startsWith('M8 ')).toBe(true);
    expect(c.area.endsWith('Z')).toBe(true);
    // no power line through the break (W 0): two pieces
    expect(c.w.match(/M/g).length).toBe(2);
    expect(c.hr.match(/M/g).length).toBe(1);
    const ys = [...c.hr.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    for (const y of ys) expect(y >= c.top && y <= c.base).toBe(true);
    expect(c.breaks).toHaveLength(1);
    expect(c.wRange).toEqual([180, 220]);
  });
  it('draws nothing without points or width', () => {
    expect(courseChart({ pts: [[0, 1, 2, 3]] }, 300, 200)).toBeNull();
    expect(courseChart(prof, 0, 200)).toBeNull();
    expect(courseChart(null, 300, 200)).toBeNull();
  });
  it('finds the nearest minute', () => {
    expect(nearest(prof.pts, 13)[0]).toBe(10);
    expect(nearest(prof.pts, 16)[0]).toBe(20);
    expect(nearest([], 3)).toBeNull();
  });
});

describe('grid «Puls mal Leistung»', () => {
  const hr = [115, 135, 150, 165];
  const pb = powerBounds(240); // 132, 180, 216, 252, 288, 360
  it('puts each bin by its middle into a zone pair, in minutes', () => {
    const g = gridCells({ '125|160': 600, '130|160': 300, '110|100': 120, '170|360': 60, '145|200': 90 }, hr, pb);
    expect(g).toHaveLength(5);
    expect(g[0]).toHaveLength(7);
    expect(g[1][1]).toBe(15); // 127.5 / 170 W
    expect(g[0][0]).toBe(2); // 112.5 / 110 W
    expect(g[4][6]).toBe(1); // 172.5 / 370 W
    expect(g[2][2]).toBe(2); // 147.5 / 210 W (1.5 min rounds to 2)
  });
  it('the bin middle decides at a bound', () => {
    // 112.5 bpm is Z1, 115 → 117.5 Z2; 170 W + 10 = 180 ≤ 180 → Z2
    expect(gridCells({ '110|170': 60 }, hr, pb)[0][1]).toBe(1);
    expect(gridCells({ '115|180': 60 }, hr, pb)[1][2]).toBe(1);
  });
  it('null without data or bounds', () => {
    expect(gridCells(null, hr, pb)).toBeNull();
    expect(gridCells({}, hr, pb)).toBeNull();
    expect(gridCells({ '120|200': 60 }, hr, null)).toBeNull();
  });
});

describe('halves', () => {
  it('more heart rate at almost the same power', () => {
    const h = halvesOf([{ s: 2880, w: 190, hr: 134 }, { s: 2880, w: 186, hr: 140 }]);
    expect(h.power).toBe(true);
    expect(h.hr).toEqual({ dir: 'more', p: 4 });
    expect(h.w).toEqual({ dir: 'same', p: 0 });
    expect(h.rows.map((r) => r.wpb)).toEqual([1.42, 1.33]);
  });
  it('less heart rate and more power, and the same heart rate', () => {
    expect(halvesOf([{ s: 1, w: 200, hr: 150 }, { s: 1, w: 220, hr: 141 }])).toMatchObject({ hr: { dir: 'less', p: 6 }, w: { dir: 'more', p: 10 } });
    expect(halvesOf([{ s: 1, w: 200, hr: 150 }, { s: 1, w: 180, hr: 150.5 }])).toMatchObject({ hr: { dir: 'same', p: 0 }, w: { dir: 'less', p: 10 } });
  });
  it('without power only the heart rate', () => {
    const h = halvesOf([{ s: 1, hr: 130 }, { s: 1, hr: 136 }]);
    expect(h.power).toBe(false);
    expect(h.w).toBeNull();
    expect(h.rows[0].wpb).toBeNull();
    expect(h.hr.dir).toBe('more');
    // power values without a power meter (an estimate) are left out
    expect(halvesOf([{ s: 1, w: 190, hr: 134 }, { s: 1, w: 186, hr: 140 }], false)).toMatchObject({ power: false, w: null });
  });
  it('null without both halves', () => {
    expect(halvesOf(null)).toBeNull();
    expect(halvesOf([{ s: 1, hr: 130 }])).toBeNull();
    expect(halvesOf([{ s: 1, hr: 130 }, { s: 1, hr: null }])).toBeNull();
  });
});

describe('similar rides', () => {
  const me = { id: 'a', day: '2026-10-13', kind: 'bike', gearId: 'g1', km: 42, hm: 680, movingS: 5760, hrAvg: 140, wDevice: true, wAvg: 188 };
  const r = (id, f) => ({ id, day: '2026-09-01', kind: 'bike', gearId: 'g1', km: 40, hm: 650, movingS: 5400, hrAvg: 135, wDevice: true, wAvg: 180, ...f });
  const all = [me, r('b'), r('c', { km: 50 }), r('d', { hm: 800 }), r('e', { km: 51 }), r('f', { gearId: 'g2' }), r('g', { kind: 'run' }), r('h', { wDevice: false, wAvg: null }), r('i', { hrAvg: null }), r('j', { hm: 820 })];
  it('same gear, km and Hm within ±20 %, power only from power meters', () => {
    const s = similarRides(all, me);
    expect(s.power).toBe(true);
    expect(s.pts.map((p) => p.id)).toEqual(['b', 'c', 'd']);
    expect(s.me).toMatchObject({ x: 188, y: 140 });
    expect(s.km).toEqual([34, 50]);
    expect(s.hm).toEqual([544, 816]);
  });
  it('without power: km/h, and power-less rides count', () => {
    const s = similarRides(all, { ...me, wDevice: false, wAvg: null });
    expect(s.power).toBe(false);
    expect(s.pts.map((p) => p.id)).toEqual(['b', 'c', 'd', 'h']);
    expect(s.pts[0].x).toBe(26.7);
  });
  it('needs at least 3', () => {
    expect(similarRides(all.slice(0, 3), me)).toBeNull();
    expect(similarRides(all, { ...me, kind: 'run' })).toBeNull();
    expect(similarRides(all, null)).toBeNull();
  });
});

describe('nice ticks', () => {
  it('round steps in the range', () => {
    expect(niceTicks(166, 202, 4)).toEqual([170, 180, 190, 200]);
    expect(niceTicks(128, 146, 3)).toEqual([130, 135, 140, 145]);
    expect(niceTicks(5, 5)).toEqual([5]);
  });
});

describe('best values', () => {
  const day = '2026-10-13';
  const cur = (a, b, c, d, e) => [[5, a], [60, b], [300, c], [1200, d], [3600, e]].filter((p) => p[1] != null);
  const me = { id: 'm', day, pCurve: cur(584, 402, 296, 248, 214) };
  const all = [
    me,
    { id: 'x', day: shiftDay(day, -10), pCurve: cur(640, 398, 305, 251, 214) },
    { id: 'y', day: shiftDay(day, -100), pCurve: cur(702, 431, 322, 262, 219) },
    { id: 'z', day: '2025-12-30', pCurve: cur(900, 500, 400, 300, 280) },
    { id: 'f', day: shiftDay(day, 2), pCurve: cur(999, 999, 999, 999, 999) },
  ];
  it('this ride, the 90 days before and the year so far; star at least as good', () => {
    const t = bestTable(me, all);
    expect(t.year).toBe('2026');
    expect(t.rows.map((r) => r.span)).toEqual(BEST_SPANS);
    expect(t.rows.map((r) => r.me)).toEqual([584, 402, 296, 248, 214]);
    expect(t.rows.map((r) => r.d90)).toEqual([640, 398, 305, 251, 214]);
    expect(t.rows.map((r) => r.year)).toEqual([702, 431, 322, 262, 219]);
    expect(t.rows.map((r) => r.star)).toEqual([false, true, false, false, true]);
  });
  it('a span this ride did not reach shows no value and no star; nothing without a curve', () => {
    const short = { id: 's', day, pCurve: cur(500, 300, 250, null, null) };
    const t = bestTable(short, all);
    expect(t.rows[4]).toMatchObject({ me: null, star: false });
    expect(bestTable({ id: 'n', day, pCurve: null }, all)).toBeNull();
    expect(bestTable({ id: 'n', day, pCurve: [] }, all)).toBeNull();
  });
  it('alone: every value is a star', () => {
    expect(bestTable(me, [me]).rows.every((r) => r.star && r.d90 == null)).toBe(true);
  });
});
