// «Tour-Auswertung» (Noah 20.10.2026 «3a und b»): the Garmin values of a tour, the resting heart rate, the dots
import { describe, it, expect } from 'vitest';
import { tourValues, bestOf, restOfTour, restDots, corrOf, corrWord, daysOf, ANA_SPANS } from '../src/lib/touren/tourana.js';
import { trimHrCurve, trimPower, HR_SPANS, POWER_SPANS, DETAIL_KIND } from '../api/strava.js';
import { CURVE_SPANS } from '../src/lib/training/act/power.js';
import { DETAIL_V } from '../src/lib/training.js';

const ride = (id, f = {}) => ({ id, day: '2026-10-10', time: '08:00', kind: 'bike', km: 40, hm: 500, movingS: 3600, elapsedS: 4200, hrAvg: 140, hrMax: 172, wDevice: true, wAvg: 180, wMax: 650, wNorm: 200, ...f });

describe('the spans', () => {
  it('power and heart rate have 1, 2, 5, 10 and 20 minutes, the app and the server agree', () => {
    for (const [s] of ANA_SPANS) {
      expect(POWER_SPANS).toContain(s);
      expect(HR_SPANS).toContain(s);
      expect(CURVE_SPANS.map((x) => x[0])).toContain(s);
    }
    expect(DETAIL_KIND).toBe(DETAIL_V);
  });
  it('the heart rate curve: the best average over each span, pauses not counted', () => {
    const time = Array.from({ length: 1500 }, (_, i) => i);
    const hr = time.map((i) => (i >= 200 && i < 320 ? 170 : 130));
    const c = trimHrCurve(time, hr);
    expect(c.find((x) => x[0] === 60)[1]).toBe(170);
    expect(c.find((x) => x[0] === 120)[1]).toBe(170);
    expect(c.find((x) => x[0] === 1200)[1]).toBe(134);
    expect(trimHrCurve(time, null)).toBe(null);
    expect(trimHrCurve([0, 100], [120, 120])).toBe(null);
    const { pCurve } = trimPower(time, time.map((i) => (i < 600 ? 250 : 150)));
    expect(pCurve.find((x) => x[0] === 600)[1]).toBe(250);
    expect(pCurve.find((x) => x[0] === 120)[1]).toBe(250);
  });
});

describe('the values of a tour', () => {
  it('one ride: stops, NP, best minutes of power and heart rate', () => {
    const a = ride('1', { pauses: { n: 3, secs: 540 }, pCurve: [[60, 420], [120, 380], [300, 300], [600, 260], [1200, 240]], hCurve: [[60, 178], [120, 175], [300, 168], [600, 162], [1200, 158]] });
    const v = tourValues([a]);
    // the stop time as Strava: elapsed minus moving (4200 − 3600), not only the stops of 60 s and more
    expect(v.time).toMatchObject({ km: 40, hm: 500, moving: 3600, elapsed: 4200, stops: 3, stopS: 600, kmh: 40 });
    expect(v.power).toMatchObject({ avg: 180, np: 200, max: 650 });
    expect(v.power.best.map((b) => b.v)).toEqual([420, 380, 300, 260, 240]);
    expect(v.hr).toMatchObject({ avg: 140, max: 172 });
    expect(v.hr.best.map((b) => b.v)).toEqual([178, 175, 168, 162, 158]);
    expect(v.missing).toEqual([]);
  });
  it('an older detail: the best 20 minutes from w20, the rest is still missing', () => {
    const v = tourValues([ride('1', { w20: 230, pCurve: [[5, 700], [60, 400], [300, 290], [1200, 230]] })]);
    expect(v.power.best.map((b) => b.v)).toEqual([400, null, 290, null, 230]);
    expect(v.missing).toContain('power');
    expect(v.missing).toContain('hr');
  });
  it('several rides: sums, time-weighted means, the highest best, own corrections', () => {
    const a = ride('1', { movingS: 3600, wAvg: 200, wNorm: 220, hrAvg: 150, pCurve: [[60, 400]] });
    const b = ride('2', { movingS: 1800, wAvg: 140, wNorm: 160, hrAvg: 120, hrMax: 180, pCurve: [[60, 450]], own: { km: 10 } });
    const v = tourValues([a, b]);
    expect(v.time.km).toBe(50);
    expect(v.time.moving).toBe(5400);
    expect(v.power.avg).toBe(180);
    expect(v.power.np).toBe(Math.round(((220 ** 4 * 3600 + 160 ** 4 * 1800) / 5400) ** 0.25));
    expect(v.power.best[0].v).toBe(450);
    expect(v.hr).toMatchObject({ avg: 140, max: 180 });
    expect(bestOf([a, b], 'pCurve', 120)).toBe(null);
  });
  it('without a power meter no power; without heart rate no heart rate', () => {
    const v = tourValues([ride('1', { wDevice: false, hrAvg: null })]);
    expect(v.power).toBe(null);
    expect(v.hr).toBe(null);
    expect(tourValues([]).time.km).toBe(null);
  });
});

describe('the resting heart rate', () => {
  const health = Array.from({ length: 40 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 8, 1 + i, 12));
    return { date: d.toISOString().slice(0, 10), restingHr: 50 + (i % 3) };
  });
  it('the tour days and the normal of the 30 days before', () => {
    expect(daysOf('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
    expect(daysOf('2026-10-01', null)).toEqual(['2026-10-01']);
    const r = restOfTour(health, '2026-10-05', '2026-10-06');
    expect(r.days).toEqual([{ day: '2026-10-05', v: 51 }, { day: '2026-10-06', v: 52 }]);
    expect(r.normal).toBe(51);
    expect(r.diff).toBe(0);
    expect(restOfTour(health, '2026-10-06', '2026-10-06').diff).toBe(1);
    expect(restOfTour(health, '2026-12-01', '2026-12-01')).toBe(null);
    expect(restOfTour([], '2026-10-05')).toBe(null);
  });
  it('the dots: NP from 3 power rides, else Ø heart rate; r and its word', () => {
    const h = [48, 50, 52, 54, 56, 58].map((v, i) => ({ date: `2026-10-0${i + 1}`, restingHr: v }));
    const acts = h.map((x, i) => ride(String(i), { day: x.date, wNorm: 240 - i * 10 }));
    const { mode, dots } = restDots(acts, h);
    expect(mode).toBe('np');
    expect(dots).toHaveLength(6);
    expect(corrOf(dots)).toBe(-1);
    expect(corrWord(-1)).toEqual({ strength: 'clear', up: false });
    expect(corrWord(0.1).strength).toBe('none');
    expect(corrWord(null)).toBe(null);
    const hrOnly = restDots(acts.map((a) => ({ ...a, wDevice: false })), h);
    expect(hrOnly.mode).toBe('hr');
    expect(corrOf(hrOnly.dots)).toBe(null); // all the same Ø heart rate: no spread
    expect(corrOf(dots.slice(0, 4))).toBe(null);
  });
});
