/**
 * Analyse wie Garmin Connect (Noah 20.10.2026 «baue sie 1:1 nach»): the rows of «Statistiken» and the numbers
 * of «Diagramme» (src/lib/touren/garmin.js). Fictional data only.
 */
import { describe, it, expect } from 'vitest';
import { statsOf, heightOf, pedalTurnsOf, intensityMinutesOf, chartHead, ticksOf, zoneAt, CHARTS } from '../src/lib/touren/garmin.js';
import { serOf } from '../src/lib/touren/stravaana.js';
import { trimCourse } from '../api/strava.js';

/** 10 km in 1800 s: up 100 m to km 5, down 60 m to the end; 90 rpm, 150 bpm. */
function ser() {
  const time = Array.from({ length: 1801 }, (_, i) => i);
  const dist = time.map((i) => (i / 1800) * 10000);
  const alt = dist.map((d) => (d < 5000 ? 400 + (d / 5000) * 100 : 500 - ((d - 5000) / 5000) * 60));
  const st = { time: { data: time }, distance: { data: dist }, altitude: { data: alt }, cadence: { data: time.map(() => 90) }, heartrate: { data: time.map(() => 150) } };
  return serOf({ ser: trimCourse(st).ser });
}

describe('Statistiken', () => {
  const s = ser();
  const a = { km: 10, movingS: 1700, elapsedS: 1800, spdAvg: 21.2, spdMax: 48.1, hrAvg: 150, hrMax: 171, wAvg: 190, wMax: 640, wNorm: 205, kj: 340, kcal: 380, cad: 88, hm: 100, tempAvg: 17, tempMin: 12, tempMax: 26, pCurve: [[1200, 214]], hist: { 120: 600, 140: 600, 170: 600 } };
  const groups = statsOf(a, { ser: s, ftp: 250, kg: 70, bounds: [130, 145, 155, 165] });
  const by = Object.fromEntries(groups.flatMap((g) => g.rows.map((r) => [r.key, r.v])));
  it('has the groups of Garmin, in its order', () => {
    expect(groups.map((g) => g.key)).toEqual(['speed', 'time', 'hr', 'power', 'food', 'cad', 'height', 'temp', 'turns', 'im']);
  });
  it('fills the rows from the activity and the series', () => {
    expect(by.spd).toBeCloseTo(20, 5);
    expect(by.spdMoving).toBe(21.2);
    expect(by.w20).toBe(214);
    expect(by.if).toBeCloseTo(0.82, 5);
    expect(by.tss).toBeGreaterThan(0);
    expect(by.wkg).toBeCloseTo(205 / 70, 5);
    expect(by.down).toBeGreaterThan(55);
    expect(by.lo).toBe(400);
    expect(by.hi).toBe(500);
    expect(by.turns).toBeGreaterThan(2600);
    expect([by.imMid, by.imHigh, by.imTotal]).toEqual([10, 10, 30]);
  });
  it('leaves out every row and group without a value', () => {
    const g = statsOf({ km: 5, movingS: 900, elapsedS: 1000 });
    expect(g.map((x) => x.key)).toEqual(['speed', 'time']);
    expect(g[0].rows.map((r) => r.key)).toEqual(['spd', 'spdMoving']);
    expect(statsOf(null)).toEqual([]);
  });
});

describe('the parts', () => {
  it('height, pedal turns, intensity minutes', () => {
    expect(heightOf({ alt: [400, 410, 405, null, 420, 390] })).toEqual({ down: 35, lo: 390, hi: 420 });
    expect(heightOf({})).toBe(null);
    expect(pedalTurnsOf({ n: 3, t: [0, 60, 120], cad: [90, 80, 0] })).toBe(170);
    expect(intensityMinutesOf({}, [1, 2, 3, 4])).toBe(null);
  });
  it('the chart heads: height min and max, else mean and max', () => {
    const s = ser();
    expect(chartHead(s, 'alt')).toMatchObject({ lo: 400, hi: 500 });
    expect(chartHead(s, 'cad')).toMatchObject({ lo: 90, hi: 90 });
    expect(chartHead(s, 'w')).toBe(null);
    expect(CHARTS.map((c) => c.key)).toEqual(['alt', 'spd', 'w', 'hr', 'cad', 'temp']);
  });
  it('nice ticks and the zone of a heart rate', () => {
    expect(ticksOf(411, 541, 5)).toEqual([400, 450, 500, 550]);
    expect(ticksOf(0, 51, 5)).toEqual([0, 20, 40, 60]);
    expect(zoneAt(120, [130, 145, 155, 165])).toBe(1);
    expect(zoneAt(170, [130, 145, 155, 165])).toBe(5);
    expect(zoneAt(null, [130])).toBe(null);
  });
});
