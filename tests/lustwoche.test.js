// «Worauf hab ich Lust?» + your week (Noah 05.11.2026): free minutes and the weather of the next hours.
import { describe, it, expect } from 'vitest';
import { freeMinutes, timeChoice, weatherAhead, WEEK_CAP } from '../src/lib/frei/lustwoche.js';

const NOW = Date.parse('2026-11-05T10:00:00Z');
const ev = (fromMin, toMin, extra = {}) => ({ start: new Date(NOW + fromMin * 6e4).toISOString(), end: new Date(NOW + toMin * 6e4).toISOString(), ...extra });

describe('free minutes before the next appointment', () => {
  it('counts to the next busy one; all-day and «free» ones do not count', () => {
    expect(freeMinutes([ev(50, 90)], NOW)).toBe(50);
    expect(freeMinutes([ev(50, 90), ev(20, 30)], NOW)).toBe(20);
    expect(freeMinutes([ev(20, 30, { allDay: true }), ev(25, 40, { busy: false })], NOW)).toBe(WEEK_CAP);
    expect(freeMinutes([], NOW)).toBe(WEEK_CAP);
    expect(freeMinutes([ev(900, 960)], NOW)).toBe(WEEK_CAP); // far away: no limit
  });
  it('an appointment that is on now leaves nothing', () => {
    expect(freeMinutes([ev(-10, 30)], NOW)).toBe(0);
  });
  it('the biggest time chip that fits', () => {
    expect(timeChoice(200)).toBe(120);
    expect(timeChoice(59)).toBe(30);
    expect(timeChoice(15)).toBe(15);
    expect(timeChoice(10)).toBeNull();
  });
});

describe('the weather of the next hours', () => {
  const core = (rainP) => ({ hours: [0, 1, 2].map((n) => ({ ms: NOW + n * 36e5, rainP, rainMm: 0, code: 1, cape: 0 })) });
  it('dry is good, rain is bad, nothing is null', () => {
    expect(weatherAhead(core(5), NOW)).toBe('good');
    expect(weatherAhead(core(90), NOW)).toBe('bad');
    expect(weatherAhead({ hours: [] }, NOW)).toBeNull();
    expect(weatherAhead(null, NOW)).toBeNull();
  });
});
