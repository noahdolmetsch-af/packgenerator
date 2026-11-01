// Idee A3 «Freie Zeit plus gutes Wetter»: the next free and dry window from the calendar and the weather core.
// Fictional data only; a made-up weather core with the hours of three days in Zurich time (UTC+1 in winter here).
import { describe, it, expect } from 'vitest';
import { freeSlot, busySpans, hideSlot, RIDE_H } from '../src/lib/freiezeit/slots.js';
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
    for (const k of ['{day} {from}–{to} free and dry', 'A round of about {km} km? From your calendar and the weather at home, the next {n} days.', 'Not now', 'Free time and good weather']) expect(de[k], k).toBeTruthy();
  });
});
