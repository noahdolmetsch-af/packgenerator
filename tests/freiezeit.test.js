// Idee A3 «Freie Zeit plus gutes Wetter»: the next free and dry window from the calendar and the weather core.
// Fictional data only; a made-up weather core with the hours of three days in Zurich time (UTC+1 in winter here).
import { describe, it, expect } from 'vitest';
import { freeSlot, busySpans, hideSlot, weekSlot, ownBusy, RIDE_H } from '../src/lib/freiezeit/slots.js';
import { atLocal } from '../src/lib/wetter/kern.js';
import de from '../src/lib/i18n/de/index.js';

const OFF = 3600; // +01:00
const dates = ['2026-11-03', '2026-11-04', '2026-11-05'];
const good = { temp: 14, feels: 14, rainP: 5, rainMm: 0, code: 1, wind: 8, gust: 15, cape: 0 };
function core(change = () => ({})) {
  const hours = [];
  for (const date of dates) for (let h = 0; h < 24; h++) hours.push({ ms: atLocal(date, h, OFF), ...good, ...change(date, h) });
  const days = dates.map((date) => ({ date, rise: atLocal(date, 7, OFF), set: atLocal(date, 17, OFF) + 18e5 }));
  return { offset: OFF, hours, days };
}
const now = atLocal('2026-11-03', 6, OFF);
const ev = (date, from, to, extra = {}) => ({ day: date, title: 'Termin', allDay: false, start: new Date(atLocal(date, from, OFF)).toISOString(), end: new Date(atLocal(date, to, OFF)).toISOString(), ...extra });

describe('free time and good weather', () => {
  it('finds the first free dry window of the day, around the appointments', () => {
    const s = freeSlot(core(), [ev('2026-11-03', 7, 12)], { now, kmh: 18 });
    expect(s.date).toBe('2026-11-03');
    expect(s.start).toBe(atLocal('2026-11-03', 12, OFF));
    expect(s.end - s.start).toBe(RIDE_H * 36e5);
    expect(s.km).toBe(35); // 2 h × 18 km/h, on 5 km
  });
  it('rain or a thunderstorm in an hour, or dark hours, leave the window out', () => {
    const wetToday = core((date) => (date === '2026-11-03' ? { rainP: 80, rainMm: 1 } : {}));
    expect(freeSlot(wetToday, [], { now }).date).toBe('2026-11-04');
    const allWet = core(() => ({ rainP: 90, rainMm: 2 }));
    expect(freeSlot(allWet, [], { now })).toBe(null);
  });
  it('all-day and free appointments do not block; «Not now» hides one window', () => {
    expect(busySpans([{ allDay: true, start: '2026-11-03' }, ev('2026-11-03', 7, 21, { busy: false })])).toEqual([]);
    const first = freeSlot(core(), [], { now });
    const next = freeSlot(core(), [], { now, hidden: hideSlot([], first.start) });
    expect(next.start).not.toBe(first.start);
    expect(hideSlot(Array.from({ length: 25 }, (_, i) => i), 99)).toHaveLength(20);
  });
  it('no weather, no window', () => {
    expect(freeSlot(null, [], { now })).toBe(null);
    expect(freeSlot({ hours: [] }, [], { now })).toBe(null);
  });
  it('has German for its words', () => {
    for (const k of ['{day} {from}–{to} free and dry', 'Here a {n}-hour round fits: about {km} km.', 'Plan the ride', 'Not now', 'Free time and good weather']) expect(de[k], k).toBeTruthy();
  });
});

// «Planen 2a» (Noah 05.11.2026): the best window of the shown week, 3 hours when they fit, around own dates too.
describe('the best window of the week', () => {
  const monday = '2026-11-02'; // the week of the made-up core (Tue 3 – Thu 5)
  it('takes a 3-hour round when 3 hours are free and dry', () => {
    const s = weekSlot(core(), [], { monday, now, kmh: 18 });
    expect(s.hours).toBe(3);
    expect(s.end - s.start).toBe(3 * 36e5);
    expect(s.km).toBe(55); // 3 h × 18 km/h = 54, on 5 km
  });
  it('falls back to 2 hours when only 2 are free', () => {
    const tight = [ev('2026-11-03', 7, 10), ev('2026-11-03', 12, 21), ev('2026-11-04', 7, 21), ev('2026-11-05', 7, 21)];
    const s = weekSlot(core(), tight, { monday, now });
    expect(s.hours).toBe(2);
    expect(s.start).toBe(atLocal('2026-11-03', 10, OFF));
  });
  it('your own dates with a time block, for an hour or as long as they say; done ones do not', () => {
    expect(ownBusy([{ kind: 'date', day: '2026-11-03', time: '09:00', title: 'x' }], OFF)).toEqual([[atLocal('2026-11-03', 9, OFF), atLocal('2026-11-03', 10, OFF)]]);
    expect(ownBusy([{ kind: 'date', day: '2026-11-03', time: '09:30', mins: 180, done: false }], OFF)[0][1] - atLocal('2026-11-03', 9, OFF)).toBe(3.5 * 36e5);
    expect(ownBusy([{ kind: 'date', day: '2026-11-03', time: '09:00', done: true }, { kind: 'todo', day: '2026-11-03', time: '09:00' }, { kind: 'date', day: '2026-11-03', time: '' }], OFF)).toEqual([]);
    const items = [{ kind: 'date', day: '2026-11-03', time: '07:00', mins: 300 }];
    expect(weekSlot(core(), [], { monday, now, items }).start).toBe(atLocal('2026-11-03', 12, OFF));
  });
  it('looks only at the shown week: next week starts on its Monday, a past week gives nothing', () => {
    const wk = ['2026-11-09', '2026-11-10'];
    const hours = [];
    for (const date of wk) for (let h = 0; h < 24; h++) hours.push({ ms: atLocal(date, h, OFF), ...good });
    const next = { offset: OFF, hours, days: wk.map((date) => ({ date, rise: atLocal(date, 7, OFF), set: atLocal(date, 17, OFF) })) };
    expect(weekSlot(next, [], { monday: '2026-11-09', now }).date).toBe('2026-11-09');
    expect(weekSlot(core(), [], { monday: '2026-10-26', now })).toBe(null);
    expect(weekSlot(core(), [], { monday: null, now })).toBe(null);
  });
});
