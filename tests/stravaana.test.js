/**
 * Analyse wie Strava (Noah 20.10.2026 «baue es 1:1 nach»): the numbers behind the part «Analyse» of the
 * tour page (src/lib/touren/stravaana.js) and the series the server sends (api/strava.js trimCourse → ser).
 * Fictional data only.
 */
import { describe, it, expect } from 'vitest';
import { PEAK_SPANS, PZ_NAMES, HZ_NAMES, peakOf, hrZoneRows, powerZoneRows, dist25, curveOf, serOf, idxOf, statOf, stretchOf, pointOf, effortOf } from '../src/lib/touren/stravaana.js';
import { powerBounds, shiftDay } from '../src/lib/training.js';
import { trimCourse, trimPower } from '../api/strava.js';

/** A fictional ride: 10 km in 1800 s, 5 km flat at 200 W, then 5 km up 250 m at 300 W. */
function ride() {
  const time = Array.from({ length: 1801 }, (_, i) => i);
  const dist = time.map((i) => (i / 1800) * 10000);
  const alt = dist.map((d) => (d < 5000 ? 400 : 400 + ((d - 5000) / 5000) * 250));
  const watts = dist.map((d) => (d < 5000 ? 200 : 300));
  const hr = dist.map((d) => (d < 5000 ? 130 : 160));
  const cad = time.map(() => 88);
  return { time: { data: time }, distance: { data: dist }, altitude: { data: alt }, watts: { data: watts }, heartrate: { data: hr }, cadence: { data: cad } };
}

describe('Peak Power, zones, 25 W', () => {
  it('lists the rows of Strava from 5 s to 1 h and reads them from the curve', () => {
    expect(PEAK_SPANS.map((s) => s[0])).toEqual([5, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600]);
    const a = { pCurve: [[5, 610], [60, 420], [1200, 280], [3600, null]], w20: 270 };
    expect(peakOf(a, 5)).toBe(610);
    expect(peakOf(a, 3600)).toBe(null);
    expect(peakOf({ w20: 270 }, 1200)).toBe(270);
  });
  it('heart rate zones Z5 first with ranges, time and share', () => {
    const rows = hrZoneRows({ hist: { 120: 600, 140: 300, 170: 100 } }, [130, 145, 155, 165]);
    expect(rows.map((r) => r.z)).toEqual([5, 4, 3, 2, 1]);
    expect(rows.map((r) => r.name)).toEqual([...HZ_NAMES].reverse());
    expect(rows[4]).toMatchObject({ from: null, to: 129, s: 600, pct: 60 });
    expect(rows[3]).toMatchObject({ from: 130, to: 144, s: 300, pct: 30 });
    expect(rows[0]).toMatchObject({ from: 165, to: null, s: 100, pct: 10 });
    expect(hrZoneRows({}, [130, 145, 155, 165])).toBe(null);
  });
  it('power zones Z7 first, the ranges from the FTP', () => {
    const ftp = 250;
    const b = powerBounds(ftp);
    const rows = powerZoneRows({ pHist: { 100: 60, 200: 120, 400: 20 } }, ftp);
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.name)).toEqual([...PZ_NAMES].reverse());
    expect(rows.at(-1)).toMatchObject({ z: 1, from: 0, to: b[0] });
    expect(rows[0]).toMatchObject({ z: 7, from: b[5] + 1, to: null });
    expect(rows.reduce((s, r) => s + r.s, 0)).toBe(200);
    expect(powerZoneRows({ pHist: { 100: 60 } }, null)).toBe(null);
  });
  it('25 W bins from 0 W to the highest one, from the server or from the 10 W bins', () => {
    expect(dist25({ p25: { 50: 10, 150: 30 } })).toEqual([{ w: 0, s: 0 }, { w: 25, s: 0 }, { w: 50, s: 10 }, { w: 75, s: 0 }, { w: 100, s: 0 }, { w: 125, s: 0 }, { w: 150, s: 30 }]);
    expect(dist25({ pHist: { 0: 5, 20: 5, 30: 7 } })).toEqual([{ w: 0, s: 5 }, { w: 25, s: 12 }]);
    expect(dist25({})).toBe(null);
    const { p25 } = trimPower(Array.from({ length: 100 }, (_, i) => i), Array.from({ length: 100 }, (_, i) => (i < 50 ? 110 : 260)));
    expect(dist25({ p25 }).find((x) => x.w === 100).s + dist25({ p25 }).find((x) => x.w === 250).s).toBe(99);
  });
});

describe('the power curve against the last 6 weeks', () => {
  it('takes the best of each span of the rides in the 42 days before', () => {
    const day = '2026-09-20';
    const a = { day, pCurve: [[5, 600], [60, 400], [1200, 260]] };
    const acts = [
      a,
      { day: shiftDay(day, -10), pCurve: [[5, 650], [60, 380], [1200, 270]] },
      { day: shiftDay(day, -60), pCurve: [[5, 900], [60, 900], [1200, 900]] },
    ];
    const c = curveOf(a, acts);
    expect(c.mine).toEqual([[5, 600], [60, 400], [1200, 260]]);
    expect(c.grey).toEqual([[5, 650], [60, 400], [1200, 270]]);
    expect(c.from).toBe(shiftDay(day, -42));
    expect(curveOf({ day, pCurve: [[5, 600]] }, acts)).toBe(null);
  });
});

describe('the analysis series (server → app)', () => {
  const { ser } = trimCourse(ride());
  const s = serOf({ ser });
  it('sends values per 50 m with time, height, speed, power, heart rate, cadence', () => {
    expect(ser.step).toBe(0.05);
    expect(ser.km).toBe(10);
    expect(s.n).toBe(200);
    expect(s.temp).toBe(null);
    expect(s.spd[10]).toBeCloseTo(20, 0);
    expect(s.w[10]).toBe(200);
    expect(s.w[150]).toBe(300);
    expect(s.hr[150]).toBe(160);
    expect(s.cad[5]).toBe(88);
  });
  it('max and mean of a series, the numbers of a stretch, the values at one km', () => {
    expect(statOf(s, 'w')).toMatchObject({ max: 300 });
    expect(statOf(s, 'w').avg).toBeCloseTo(250, -1);
    expect(statOf(s, 'temp')).toBe(null);
    const up = stretchOf(s, 5, 10);
    expect(up.km).toBeGreaterThan(4.9);
    expect(up.time).toBeGreaterThan(880);
    expect(up.up).toBeGreaterThan(230);
    expect(up.grade).toBeGreaterThan(4.5);
    expect(up.w).toBe(300);
    expect(up.np).toBe(300);
    expect(up.vam).toBeGreaterThan(900);
    expect(stretchOf(s, 0, 5).up).toBeLessThan(5);
    const p = pointOf(s, 7.5);
    expect(p.km).toBeCloseTo(7.5, 5);
    expect(p.w).toBe(300);
    expect(p.grade).toBeCloseTo(5, 0);
    expect(idxOf(s, 99)).toBe(s.n - 1);
  });
  it('without a series there is no analysis', () => {
    expect(serOf({})).toBe(null);
    expect(serOf({ ser: { step: 0.05, t: [0] } })).toBe(null);
  });
});

describe('Relative Leistung', () => {
  it('sums the week of the ride and the 12 weeks, with the range of the 3 weeks before', () => {
    const day = '2026-09-17'; // a Thursday
    const acts = [{ day, effort: 80 }, { day: '2026-09-15', effort: 40 }];
    for (let w = 1; w <= 3; w++) acts.push({ day: shiftDay('2026-09-15', -7 * w), effort: 100 });
    const e = effortOf(acts[0], acts);
    expect(e.v).toBe(80);
    expect(e.days.map((x) => x.v)).toEqual([0, 40, 0, 80, 0, 0, 0]);
    expect(e.week).toBe(120);
    expect([e.lo, e.hi]).toEqual([75, 125]);
    expect(e.place).toBe('in');
    expect(e.weeks).toHaveLength(12);
    expect(effortOf({ day, effort: null }, acts)).toBe(null);
  });
});
