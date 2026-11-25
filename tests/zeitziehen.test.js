// «Termine ziehen»: the pure part of the shared building block (src/lib/ui/timedrag.js). Fictional times only.
import { describe, it, expect } from 'vitest';
import { snapMin, shapeSpan, shiftClock, addDaysTo, daysBetween, clockOf, minutesOfClock, linearMinutes } from '../src/lib/ui/timedrag.js';

describe('shapeSpan', () => {
  it('moves in quarter hours and keeps the length', () => {
    expect(shapeSpan({ start: 540, end: 600 }, 'move', 22)).toEqual({ start: 555, end: 615 });
    expect(shapeSpan({ start: 540, end: 600 }, 'move', -37)).toEqual({ start: 510, end: 570 });
  });
  it('stays inside the day', () => {
    expect(shapeSpan({ start: 30, end: 90 }, 'move', -500)).toEqual({ start: 0, end: 60 });
    expect(shapeSpan({ start: 1380, end: 1440 }, 'move', 500)).toEqual({ start: 1380, end: 1440 });
  });
  it('stretches from the lower edge, at least one step and at most 8 hours', () => {
    expect(shapeSpan({ start: 540, end: 600 }, 'size', 30)).toEqual({ start: 540, end: 630 });
    expect(shapeSpan({ start: 540, end: 600 }, 'size', -500)).toEqual({ start: 540, end: 555 });
    expect(shapeSpan({ start: 540, end: 600 }, 'size', 900)).toEqual({ start: 540, end: 1020 });
  });
  it('snaps', () => {
    expect(snapMin(7)).toBe(0);
    expect(snapMin(8)).toBe(15);
  });
});

describe('clock arithmetic', () => {
  it('shifts a wall-clock moment by days and minutes, over midnight too', () => {
    expect(shiftClock({ day: '2026-11-24', time: '09:00' }, 1, 30)).toEqual({ day: '2026-11-25', time: '09:30' });
    expect(shiftClock({ day: '2026-11-24', time: '23:30' }, 0, 45)).toEqual({ day: '2026-11-25', time: '00:15' });
    expect(shiftClock({ day: '2026-11-01', time: '00:15' }, 0, -30)).toEqual({ day: '2026-10-31', time: '23:45' });
    expect(shiftClock({ day: '2026-12-31', time: '10:00' }, 2, 0)).toEqual({ day: '2027-01-02', time: '10:00' });
  });
  it('counts days and converts clocks', () => {
    expect(addDaysTo('2026-02-28', 1)).toBe('2026-03-01');
    expect(daysBetween('2026-11-23', '2026-11-29')).toBe(6);
    expect(clockOf(75)).toBe('01:15');
    expect(minutesOfClock('18:30')).toBe(1110);
  });
  it('turns pixels into minutes for a fixed hour height', () => {
    expect(linearMinutes(72)(36)).toBe(30);
  });
});
