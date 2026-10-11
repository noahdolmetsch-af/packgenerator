// Hobby pages 2 «Kissenzeit» (B2, H22a): marks as { sec, sound }, the older minute list still read,
// the dial's angle ↔ seconds on the 30-second grid, tap / drag / long press on marks, and the seven
// sounds planned from a running timer. Fictional data only.
import { describe, it, expect } from 'vitest';
import { bowlOf, bowlTimes, marksOf, parseMarks, angleToSec, secToAngle, pointAngle, toggleMark, moveMark, setMarkSound, markNear, planMarks, GRID } from '../src/lib/flowbowl.js';
import { startTimer, pauseTimer, resumeTimer, elapsedSec } from '../src/lib/flowtimer.js';
import { SOUNDS, SOUND_IDS, voices, soundLength, strokesOf, soundAt, soundOk } from '../src/lib/flowsounds.js';

describe('marks as { sec, sound }', () => {
  it('the older minute list is still read (3 → 180 s, 7.5 → 450 s)', () => {
    expect(bowlOf({ mode: 'marks', marks: [3, 7.5] }).marks).toEqual([{ sec: 180 }, { sec: 450 }]);
    expect(bowlTimes(600, { mode: 'marks', marks: parseMarks('2, 7,5 99') })).toEqual([0, 120, 450, 600]);
  });
  it('objects keep their own sound; sorted, one per second, nothing at 0 or below', () => {
    expect(marksOf([{ sec: 600, sound: 'gong' }, { sec: 180 }, { sec: 180, sound: 'wood' }, { sec: 0 }, { sec: -5 }, 'x', null])).toEqual([{ sec: 180, sound: 'wood' }, { sec: 600, sound: 'gong' }]);
    expect(bowlTimes(1200, { mode: 'marks', marks: [{ sec: 300, sound: 'gong' }, { sec: 900 }] })).toEqual([0, 300, 900, 1200]);
  });
  it('a mark after the end is left out', () => {
    expect(bowlTimes(600, { mode: 'marks', marks: [{ sec: 300 }, { sec: 900 }] })).toEqual([0, 300, 600]);
  });
});

describe('the dial: angle ↔ seconds on a 30-second grid', () => {
  it('seconds to an angle and back', () => {
    expect(secToAngle(0, 2700)).toBe(0);
    expect(secToAngle(675, 2700)).toBe(90);
    expect(secToAngle(1350, 2700)).toBe(180);
    expect(angleToSec(90, 1800)).toBe(450);
    expect(angleToSec(100, 1800)).toBe(510); // 500 s → the grid: 510 (17 × 30)
    expect(angleToSec(180, 2700)).toBe(1350);
    expect(angleToSec(-90, 1800)).toBe(1350); // negative angles go round
    expect(angleToSec(450, 1800)).toBe(450);
  });
  it('never on the start or the end itself, every value on the grid', () => {
    expect(angleToSec(0, 1200)).toBe(GRID);
    expect(angleToSec(359.9, 1200)).toBe(1200 - GRID);
    for (let a = 0; a < 360; a += 7) expect(angleToSec(a, 1500) % GRID).toBe(0);
    expect(angleToSec(90, 50)).toBeNull(); // too short for marks
  });
  it('a point around the centre: 0° on top, clockwise', () => {
    expect(pointAngle(120, 20, 120, 120)).toBe(0);
    expect(pointAngle(220, 120, 120, 120)).toBe(90);
    expect(pointAngle(120, 220, 120, 120)).toBe(180);
    expect(pointAngle(20, 120, 120, 120)).toBe(270);
  });
  it('tap sets a mark, tap on it takes it away, drag moves it with its sound, long press gives a sound', () => {
    let m = toggleMark([], 600);
    expect(m).toEqual([{ sec: 600 }]);
    m = toggleMark(m, 180);
    expect(m.map((x) => x.sec)).toEqual([180, 600]);
    expect(toggleMark(m, 610)).toEqual([{ sec: 180 }]); // near enough: taken away
    m = setMarkSound(m, 600, 'tingsha');
    expect(m).toEqual([{ sec: 180 }, { sec: 600, sound: 'tingsha' }]);
    m = moveMark(m, 600, 900);
    expect(m).toEqual([{ sec: 180 }, { sec: 900, sound: 'tingsha' }]);
    expect(moveMark(m, 180, 900)).toEqual([{ sec: 900 }]); // onto another: replaces it
    expect(setMarkSound(m, 900, null)).toEqual([{ sec: 180 }, { sec: 900 }]);
    expect(markNear(m, 200)).toEqual({ sec: 180 });
    expect(markNear(m, 400)).toBeNull();
  });
  it('a regular plan becomes own marks with the same times', () => {
    expect(planMarks(1200, { mode: 'every', every: 5 })).toEqual([{ sec: 300 }, { sec: 600 }, { sec: 900 }]);
    expect(planMarks(1200, { mode: 'none' })).toEqual([]);
    expect(planMarks(1200, { mode: 'marks', marks: [{ sec: 450, sound: 'gong' }] })).toEqual([{ sec: 450, sound: 'gong' }]);
  });
});

describe('the seven sounds', () => {
  it('seven, each with voices (vibration none), each rings for a while', () => {
    expect(SOUND_IDS).toEqual(['bowlHigh', 'bowlLow', 'gong', 'tingsha', 'wood', 'bell', 'vibrate']);
    for (const s of SOUNDS) {
      const v = voices(s.id);
      if (s.id === 'vibrate') expect(v).toEqual([]);
      else {
        expect(v.length, s.id).toBeGreaterThan(1);
        for (const x of v) {
          expect(x.freq).toBeGreaterThan(20);
          expect(x.amp).toBeGreaterThan(0);
          expect(x.decay).toBeGreaterThan(0);
        }
      }
    }
    expect(soundLength('gong')).toBeGreaterThan(soundLength('wood'));
    expect(voices('bowlHigh')[0].freq).toBeGreaterThan(voices('bowlLow')[0].freq);
    expect(voices('tingsha').some((x) => x.at > 0)).toBe(true); // two strokes
    expect(voices('wood').some((x) => x.type === 'noise')).toBe(true);
    expect(soundOk('nope')).toBe('bowlHigh');
  });
  it('the strokes still to come of a session, with their sounds; after a pause the plan is the rest', () => {
    const t0 = Date.parse('2026-10-09T07:00:00+02:00');
    let tm = { ...startTimer({ actId: 'meditation', minutes: 20, bowl: { mode: 'every', every: 5 }, now: t0 }), sound: 'bowlHigh', endSound: 'gong', marks: [{ sec: 600, sound: 'wood' }] };
    expect(strokesOf(tm, 0).map((s) => [s.sec, s.sound])).toEqual([
      [300, 'bowlHigh'],
      [600, 'wood'],
      [900, 'bowlHigh'],
      [1200, 'gong'],
    ]);
    expect(soundAt(tm, 0)).toBe('gong');
    tm = pauseTimer(tm, t0 + 400_000);
    tm = resumeTimer(tm, t0 + 700_000); // five minutes of pause
    const el = elapsedSec(tm, t0 + 760_000);
    expect(el).toBe(460);
    expect(strokesOf(tm, el).map((s) => s.sec)).toEqual([600, 900, 1200]);
    expect(strokesOf({ ...tm, played: [600] }, el).map((s) => s.sec)).toEqual([900, 1200]);
  });
});
