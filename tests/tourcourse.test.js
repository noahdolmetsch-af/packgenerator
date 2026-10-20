// Tour-Seite «wie komoot» (Noah 20.10.2026): the course by distance and the speed over time
import { describe, it, expect } from 'vitest';
import { dprofPoints, courseOf, speedOf, speedIn } from '../src/lib/touren/tourcourse.js';
import { trimCourse, DPROF_MAX, SPROF_POINTS } from '../api/strava.js';
import { decode, gainOf, rangeOf } from '../src/lib/map/fineprofile.js';

// 20 km: 10 km up from 400 m to 900 m, 10 km down again; one point every 10 s at 20 km/h, a 10 min stop at km 10
function streams() {
  const time = [];
  const distance = [];
  const altitude = [];
  let t = 0;
  for (let m = 0; m <= 20000; m += 55.5) {
    time.push(t);
    distance.push(m);
    altitude.push(m <= 10000 ? 400 + m * 0.05 : 900 - (m - 10000) * 0.05);
    t += 10;
    if (Math.abs(m - 9990) < 30) t += 600;
  }
  return { time: { data: time }, distance: { data: distance }, altitude: { data: altitude } };
}

describe('the server: course and speed', () => {
  it('heights every 50 m as differences, the speed over the time with the stop', () => {
    const { dprof, sprof } = trimCourse(streams());
    expect(dprof.step).toBe(0.05);
    expect(dprof.d.length).toBeLessThanOrEqual(DPROF_MAX);
    const pts = dprofPoints(dprof);
    expect(pts[0][1]).toBe(400);
    expect(Math.max(...pts.map((p) => p[1]))).toBeGreaterThanOrEqual(898);
    expect(sprof.length).toBeLessThanOrEqual(SPROF_POINTS);
    expect(Math.max(...sprof.map((p) => p[1]))).toBeCloseTo(20, 0);
    expect(sprof.some((p) => p[1] < 1)).toBe(true); // the stop
    expect(trimCourse(null)).toEqual({ dprof: null, sprof: null });
  });
  it('a very long ride gets a coarser step', () => {
    const n = 4000;
    const s = { time: { data: Array.from({ length: n }, (_, i) => i * 60) }, distance: { data: Array.from({ length: n }, (_, i) => i * 150) }, altitude: { data: Array.from({ length: n }, () => 500) } };
    const { dprof } = trimCourse(s);
    expect(dprof.d.length).toBeLessThanOrEqual(DPROF_MAX);
    expect(dprof.step).toBeGreaterThan(0.05);
  });
});

describe('the app: the profile of a tour', () => {
  it('the recorded course, smoothed into a fine profile: up, down, highest and lowest', () => {
    const { dprof, sprof } = trimCourse(streams());
    const c = courseOf([{ id: '1', dprof, sprof, km: 20 }]);
    expect(c.src).toBe('ride');
    const f = decode(c.fine);
    expect(f.km).toBeCloseTo(20, 0);
    const g = gainOf(c.fine);
    expect(g.up).toBeGreaterThan(480);
    expect(g.up).toBeLessThan(520);
    expect(rangeOf(c.fine).lo).toBeLessThanOrEqual(405);
    expect(rangeOf(c.fine).hi).toBeGreaterThanOrEqual(890);
  });
  it('two rides one after the other; without a course the GPX route of the trip; else nothing', () => {
    const { dprof } = trimCourse(streams());
    const c = courseOf([{ dprof }, { km: 5 }, { dprof }]);
    expect(decode(c.fine).km).toBeCloseTo(45, 0);
    const route = { profileFine: { v: 1, step: 0.1, km: 0.3, d: [500, 10, 10, 10] } };
    expect(courseOf([{ km: 10 }], { route })).toEqual({ fine: route.profileFine, src: 'route' });
    expect(courseOf([{ km: 10 }])).toBe(null);
    expect(dprofPoints({ step: 0.05, d: [1] })).toBe(null);
  });
  it('the speed of a stretch: moving only', () => {
    const sp = speedOf([{ sprof: [[0, 20], [1, 22], [2, 0], [3, 18]], prof: { pts: [[0, 400], [3, 450]] }, elapsedS: 240 }]);
    expect(sp).toMatchObject({ max: 22, end: 4 });
    expect(sp.ele).toHaveLength(2);
    expect(speedIn(sp, 0, 3)).toEqual({ kmh: 20, min: 3 });
    expect(speedOf([{ sprof: [[0, 1]] }])).toBe(null);
  });
});
