import { describe, it, expect } from 'vitest';
import { ratePerMin, modeHours, chargeMinutes, chargeFrom, chargeGain, cleanLights, fromOldLamp, starterLight, lightsPlan, worstState, usedPct, usableModes, modeOf } from '../src/lib/live/lichter.js';

const front = () =>
  cleanLights([
    { id: 'f', name: 'Front', left: 'full', mode: 'hi', modes: [{ id: 'lo', name: 'Eco', pct: 5, min: 60 }, { id: 'hi', name: 'Max', pct: 25, min: 60 }], charge: { pct: 20, min: 23 } },
  ]);

describe('lights: percent in minutes (Lichter)', () => {
  it('works out hours of light and charging time from «% in minutes»', () => {
    expect(ratePerMin(7, 60)).toBeCloseTo(7 / 60);
    expect(modeHours({ pct: 25, min: 60 })).toBe(4);
    expect(modeHours({ pct: 5, min: 60 })).toBe(20);
    expect(modeHours({ pct: 0, min: 60 })).toBe(0);
    expect(modeHours({ pct: 5, min: 0 })).toBe(0);
    expect(chargeMinutes({ pct: 20, min: 23 })).toBe(115); // 20 % in 23 min = 1 h 55 min from empty
    expect(chargeFrom({ pct: 20, min: 23 }, 0.5)).toBe(58);
    expect(chargeMinutes(null)).toBe(0);
  });
  it('says what a stop at a socket gives', () => {
    const [l] = front();
    expect(chargeGain({ ...l, left: 'low' }, 23)).toEqual({ pct: 20, hours: 0.8 }); // 20 % of 4 h
    expect(chargeGain({ ...l, left: 'half' }, 600)?.pct).toBe(50); // never more than the empty part
    expect(chargeGain({ ...l, charge: null }, 30)).toBeNull();
  });
  it('cleans what was stored: at most 8 lights, 6 modes, no nonsense', () => {
    expect(cleanLights('x')).toEqual([]);
    const many = cleanLights(Array.from({ length: 12 }, (_, i) => ({ name: `L${i}`, modes: Array.from({ length: 9 }, () => ({ pct: 5, min: 60 })) })));
    expect(many).toHaveLength(8);
    expect(many[0].modes).toHaveLength(6);
    expect(new Set(many.map((l) => l.id)).size).toBe(8);
    const [l] = cleanLights([{ name: 'A', left: 'weird', mode: 'nope', modes: [{ id: 'a', pct: -3, min: 'x' }] }]);
    expect(l.left).toBe('full');
    expect(l.mode).toBe('a');
    expect(l.modes[0]).toEqual({ id: 'a', name: '', pct: 0, min: 0 });
    expect(l.charge).toBeNull();
  });
  it('takes over the lamp of the first version', () => {
    const [l] = fromOldLamp({ burn: 8, left: 'half', level: 3, table: { 1: 24, 3: 6 }, chargeH: 3 }, 'Light');
    expect(l.name).toBe('Light');
    expect(l.left).toBe('half');
    expect(modeHours(modeOf(l))).toBe(6);
    expect(usableModes(l).map(modeHours)).toEqual([6, 24]); // the brightest first
    expect(chargeMinutes(l.charge)).toBe(180);
    const [o] = fromOldLamp(null, 'Light');
    expect(modeHours(modeOf(o))).toBe(10);
    expect(modeHours(modeOf(starterLight('x')))).toBe(10);
  });
  it('checks every light against the dark ahead and tells the mode that would last', () => {
    const night = Date.UTC(2027, 5, 12, 20, 0); // 22:00 in Zurich, dark
    const at = (lights, hours) => lightsPlan(lights, { lat: 47.37, lon: 8.54, now: night, endAt: night + hours * 36e5 });
    const [p] = at(front(), 3); // Max lasts 4 h: enough for 3 dark hours
    expect(p.plan.state).toBe('ok');
    expect(p.advice.kind).toBe('ok');
    const [q] = at(front(), 7); // Max does not last 7 h, Eco (20 h) does
    expect(q.plan.state).toBe('short');
    expect(q.advice).toMatchObject({ kind: 'lower', mode: { id: 'lo' } });
    const [r] = at([{ ...front()[0], left: 'low' }], 7); // nothing lasts with a nearly empty light
    expect(r.advice.kind).toBe('none');
    expect(worstState([p, q])).toBe('short');
    expect(worstState([])).toBe('day');
  });
  it('shows the share of the charge used in the dark', () => {
    const [l] = front();
    expect(usedPct(l, 120)).toBe(50); // Max: 25 % per hour
    expect(usedPct(l, 1000)).toBe(100);
  });
});
