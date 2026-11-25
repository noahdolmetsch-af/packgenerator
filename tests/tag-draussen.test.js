import { describe, it, expect } from 'vitest';
import { outdoorWindow, needOf, planRef, STEP_MIN } from '../src/lib/tag/draussen.js';
import { atLocal } from '../src/lib/wetter/kern.js';

const OFF = 3600; // Zurich in winter
const DAY = '2026-11-25';
const at = (h, m = 0, day = DAY) => atLocal(day, h, OFF) + m * 6e4;
/** A core for DAY with every hour dry and 8 °C, except the hours in `rain` (local hours). */
const core = ({ rain = [], day = DAY, set = 16.7 } = {}) => ({
  offset: OFF,
  hours: Array.from({ length: 24 }, (_, h) => ({ ms: atLocal(day, h, OFF), temp: 8, feels: 8, rainP: rain.includes(h) ? 90 : 5, rainMm: rain.includes(h) ? 1.5 : 0, code: 3, wind: 8, gust: 14, cape: 0 })),
  days: [{ date: day, rise: at(7, 40, day), set: at(16, 40, day) }],
});
const NOW = at(8, 0);

describe('needOf', () => {
  it('today: the goal minus what is done; another day: the whole goal', () => {
    expect(needOf(90, 30, DAY, DAY)).toBe(60);
    expect(needOf(90, 120, DAY, DAY)).toBe(0);
    expect(needOf(90, 30, '2026-11-26', DAY)).toBe(90);
  });
});

describe('outdoorWindow', () => {
  it('finds a dry window of the length needed, on a quarter hour, before sunset', () => {
    const w = outdoorWindow(core(), { need: 90, day: DAY, now: NOW });
    expect(w.mins).toBe(90);
    expect(w.end - w.start).toBe(90 * 6e4);
    expect(w.start % (STEP_MIN * 6e4)).toBe(0);
    expect(w.end).toBeLessThanOrEqual(at(16, 40));
    expect(w.temp).toBe(8);
  });
  it('rounds the need up to a quarter hour and never starts before now + 30 minutes', () => {
    const w = outdoorWindow(core(), { need: 50, day: DAY, now: at(10, 10) });
    expect(w.mins).toBe(60);
    expect(w.start).toBeGreaterThanOrEqual(at(10, 40));
  });
  it('goes around appointments of the calendar and of your own dates, but not around its own plan', () => {
    const events = [{ start: new Date(at(8, 0)).toISOString(), end: new Date(at(13, 0)).toISOString() }];
    const w = outdoorWindow(core(), { events, need: 90, day: DAY, now: NOW });
    expect(w.start).toBeGreaterThanOrEqual(at(13, 0));
    const items = [{ kind: 'date', day: DAY, time: '13:00', mins: 60 }];
    const w2 = outdoorWindow(core(), { events, items, need: 90, day: DAY, now: NOW });
    expect(w2.start).toBeGreaterThanOrEqual(at(14, 0));
    const own = [{ kind: 'date', day: DAY, time: '13:00', mins: 90, ref: planRef(DAY) }];
    expect(outdoorWindow(core(), { events, items: own, need: 90, day: DAY, now: NOW }).start).toBeGreaterThanOrEqual(at(13, 0));
  });
  it('keeps out of the rain', () => {
    const w = outdoorWindow(core({ rain: [8, 9, 10, 11] }), { need: 90, day: DAY, now: NOW });
    expect(w.start).toBeGreaterThanOrEqual(at(12, 0));
  });
  it('without a full window it names the longest dry stretch, or nothing', () => {
    const rainy = core({ rain: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16] });
    const w = outdoorWindow(rainy, { need: 90, day: DAY, now: NOW });
    expect(w.start).toBeUndefined();
    expect(w.short).toBeNull();
    const late = outdoorWindow(core({ rain: [7, 8, 9, 10, 11, 12, 13, 14, 15] }), { need: 90, day: DAY, now: NOW });
    expect(late.short.mins).toBe(30); // dry only from 16:00, sunset at 16:40, on quarter hours
    const events = [{ start: new Date(at(8, 0)).toISOString(), end: new Date(at(15, 0)).toISOString() }];
    const s = outdoorWindow(core(), { events, need: 90, day: DAY, now: NOW });
    expect(s.start).toBeGreaterThanOrEqual(at(15, 0)); // 15:00 to 16:40 still holds 90 minutes
    const tight = [{ start: new Date(at(8, 0)).toISOString(), end: new Date(at(15, 40)).toISOString() }];
    const t = outdoorWindow(core(), { events: tight, need: 90, day: DAY, now: NOW });
    expect(t.short.mins).toBe(45); // 15:45 to 16:30 on quarter hours
  });
  it('is null when the weather does not reach the day or nothing is missing', () => {
    expect(outdoorWindow(core(), { need: 90, day: '2026-12-20', now: NOW })).toBeNull();
    expect(outdoorWindow(null, { need: 90, day: DAY, now: NOW })).toBeNull();
    expect(outdoorWindow(core(), { need: 0, day: DAY, now: NOW })).toBeNull();
  });
});
