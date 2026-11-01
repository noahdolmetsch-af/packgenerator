// Pausieren, Auto-Pause und Sensoren der Live-Karte (Noah 20.10.2026): src/lib/live/pause.js, ble.js,
// pauses() with the pauses of the recording (live-lib.js).
import { describe, it, expect } from 'vitest';
import { autoKmhOf, autoPauseStep, speedKmh, movingNow, totalNow, pausedNow, AUTO_KMH, TAIL_MAX_S } from '../src/lib/live/pause.js';
import { pauses, pausedS } from '../src/lib/live/live-lib.js';
import { parseHeartRate, parsePower, parseCsc, cadenceOf, keepSample, statsOf, limitStep } from '../src/lib/live/ble.js';
import { gainStep, tileValues, LIVE_TILES } from '../src/lib/live/livemap.js';

const T0 = 1_760_000_000_000;
const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer);

describe('auto-pause', () => {
  it('the limit is safe: 1 to 15 km/h in steps of 0.5, a comma works', () => {
    expect(autoKmhOf('3,7')).toBe(3.5);
    expect(autoKmhOf(0)).toBe(AUTO_KMH);
    expect(autoKmhOf('x')).toBe(AUTO_KMH);
    expect(autoKmhOf(40)).toBe(15);
    expect(autoKmhOf(0.2)).toBe(1);
  });
  it('pauses after 10 s below the limit, goes on after 3 s above it (+1 km/h)', () => {
    let r = autoPauseStep({}, { kmh: 2, now: T0, limit: 4 });
    expect(r.act).toBe(null);
    r = autoPauseStep(r.st, { kmh: 3, now: T0 + 9000, limit: 4 });
    expect(r.act).toBe(null);
    r = autoPauseStep(r.st, { kmh: 3, now: T0 + 10_000, limit: 4 });
    expect(r.act).toBe('pause');
    // paused by the auto-pause: 4.5 km/h is not enough (limit + 1)
    r = autoPauseStep(r.st, { kmh: 4.5, now: T0 + 12_000, limit: 4, paused: true, auto: true });
    expect(r.act).toBe(null);
    r = autoPauseStep(r.st, { kmh: 12, now: T0 + 13_000, limit: 4, paused: true, auto: true });
    expect(r.act).toBe(null);
    r = autoPauseStep(r.st, { kmh: 12, now: T0 + 16_000, limit: 4, paused: true, auto: true });
    expect(r.act).toBe('resume');
  });
  it('a short slow moment does not pause; your own «Pause» never goes on by itself', () => {
    let r = autoPauseStep({}, { kmh: 2, now: T0, limit: 4 });
    r = autoPauseStep(r.st, { kmh: 20, now: T0 + 5000, limit: 4 });
    r = autoPauseStep(r.st, { kmh: 2, now: T0 + 12_000, limit: 4 });
    expect(r.act).toBe(null);
    r = autoPauseStep({}, { kmh: 25, now: T0, limit: 4, paused: true, auto: false });
    r = autoPauseStep(r.st, { kmh: 25, now: T0 + 60_000, limit: 4, paused: true, auto: false });
    expect(r.act).toBe(null);
  });
  it('without a speed nothing happens', () => {
    expect(autoPauseStep({ below: T0 }, { kmh: null, now: T0 + 60_000 }).act).toBe(null);
  });
  it('the speed: GPS speed, else from two fixes', () => {
    expect(speedKmh({ speed: 5 }, null)).toBe(18);
    const a = { lat: 46.95, lon: 7.45, at: T0 };
    const b = { lat: 46.95 + 0.001, lon: 7.45, at: T0 + 20_000 }; // ~111 m in 20 s ≈ 20 km/h
    expect(Math.round(speedKmh(b, a))).toBe(20);
    expect(speedKmh(b, b)).toBe(null);
  });
});

describe('riding time with pauses', () => {
  const fixes = (list) => list.map(([m, sec]) => ({ lat: 46.95 + m / 111_000, lon: 7.45, at: T0 + sec * 1000 }));
  it('a pause between two points is no riding time', () => {
    // 0 → 600 s: riding 3 km; then a pause of 300 s after which you rode on from far away
    const f = fixes([[0, 0], [1500, 300], [3000, 600], [3500, 1000]]);
    const without = pauses(f);
    const withPause = pauses(f, { breaks: [[T0 + 620_000, T0 + 920_000]] });
    expect(without.movingS).toBe(1000);
    expect(withPause.movingS).toBe(700);
    expect(pausedS(T0, T0 + 2_000_000, [[T0 + 10_000, null]])).toBe(1990);
  });
  it('the clock: runs on between points, stands in a pause, at most 2 min tail', () => {
    expect(movingNow({ movingS: 600, lastAt: T0, now: T0 + 30_000 })).toBe(630);
    expect(movingNow({ movingS: 600, lastAt: T0, now: T0 + 30_000, paused: true })).toBe(600);
    expect(movingNow({ movingS: 600, lastAt: T0, now: T0 + 3_600_000 })).toBe(600 + TAIL_MAX_S);
    expect(movingNow({ movingS: 600, lastAt: T0, now: T0 + 60_000, breaks: [[T0 + 10_000, T0 + 50_000]] })).toBe(620);
    expect(totalNow(T0, T0 + 3_725_000)).toBe(3725);
    expect(pausedNow([[T0, T0 + 60_000], [T0 + 120_000, null]], T0 + 150_000)).toBe(90);
  });
});

describe('Bluetooth sensor messages', () => {
  it('heart rate, 8 and 16 bit', () => {
    expect(parseHeartRate(dv([0x00, 142]))).toBe(142);
    expect(parseHeartRate(dv([0x01, 0x9a, 0x00]))).toBe(154);
    expect(parseHeartRate(dv([0x00, 0]))).toBe(null);
    expect(parseHeartRate(dv([0x00]))).toBe(null);
  });
  it('power with crank data after the balance and the torque', () => {
    // flags 0x25: balance (1) + torque (2) + crank; power 250 W; crank revs 1000, time 2048
    const m = parsePower(dv([0x25, 0x00, 0xfa, 0x00, 0x32, 0x10, 0x00, 0xe8, 0x03, 0x00, 0x08]));
    expect(m.watts).toBe(250);
    expect(m.crank).toEqual({ revs: 1000, time: 2048 });
    expect(parsePower(dv([0x00, 0x00, 0x2c, 0x01])).watts).toBe(300);
    expect(parsePower(dv([0x00, 0x00, 0x2c, 0x01])).crank).toBe(null);
  });
  it('speed and cadence: crank after the wheel data', () => {
    const m = parseCsc(dv([0x03, 1, 0, 0, 0, 0, 4, 10, 0, 0, 4]));
    expect(m.crank).toEqual({ revs: 10, time: 1024 });
    expect(parseCsc(dv([0x01, 1, 0, 0, 0, 0, 4])).crank).toBe(null);
  });
  it('cadence from two crank readings, over the 16-bit roll-over', () => {
    expect(cadenceOf({ revs: 10, time: 0 }, { revs: 11, time: 683 })).toBe(90);
    expect(cadenceOf({ revs: 65535, time: 65000 }, { revs: 0, time: 65000 + 683 - 65536 })).toBe(90);
    expect(cadenceOf({ revs: 10, time: 100 }, { revs: 10, time: 100 })).toBe(null);
    expect(cadenceOf({ revs: 10, time: 0 }, { revs: 10, time: 1024 })).toBe(0);
    expect(cadenceOf(null, { revs: 1, time: 1 })).toBe(null);
  });
  it('samples every 5 s, stats, own limit tone once per time above', () => {
    const l = [];
    keepSample(l, 0, 120);
    keepSample(l, 3, 125);
    keepSample(l, 5, 130);
    expect(l).toEqual([[0, 120], [5, 130]]);
    expect(statsOf([[0, 0], [5, 200], [10, 300]], { noZero: true })).toEqual({ avg: 250, max: 300, n: 2 });
    let r = limitStep({}, { value: 170, limit: 165, now: T0 });
    expect(r.ring).toBe(false);
    r = limitStep(r.st, { value: 171, limit: 165, now: T0 + 60_000 });
    expect(r.ring).toBe(true);
    r = limitStep(r.st, { value: 172, limit: 165, now: T0 + 120_000 });
    expect(r.ring).toBe(false);
    r = limitStep(r.st, { value: 150, limit: 165, now: T0 + 130_000 });
    r = limitStep(r.st, { value: 170, limit: 165, now: T0 + 140_000 });
    r = limitStep(r.st, { value: 170, limit: 165, now: T0 + 200_000 });
    expect(r.ring).toBe(true);
    expect(limitStep({}, { value: 200, limit: 0, now: T0 }).ring).toBe(false);
  });
});

describe('the new numbers on top', () => {
  it('metres up from the GPS height without the jitter', () => {
    let st;
    for (const a of [500, 502, 499, 501, 498, 503, 510, 509, 520]) st = gainStep(st, a);
    expect(st.gain).toBe(23); // 498 → 510, then 509 → 520
  });
  it('total time, pulse, power, cadence, metres up, top speed, stops', () => {
    const v = tileValues({ totalS: 2 * 3600 + 7 * 60, hr: 141.4, power: 212, cadence: 88, gain: 534.6, maxKmh: 61.24, stops: 3 });
    expect([v.total.value, v.hr.value, v.power.value, v.cadence.value, v.gain.value, v.max.value, v.stops.value]).toEqual(['2:07:00', '141', '212', '88', '535', '61.2', '3']);
    expect(tileValues({}).hr.value).toBe('–');
    for (const k of ['total', 'hr', 'power', 'cadence', 'gain', 'max', 'stops']) expect(LIVE_TILES.some((x) => x.key === k)).toBe(true);
  });
});
