// «Wetter oben» W2 (Noah 23.11.2026 «b»): the three cards of Today from the weather answer (made-up place, offset 0).
import { describe, it, expect } from 'vitest';
import { weekBest, afterRain, rideWindow } from '../src/lib/wetter/heutekarten.js';

const H = 36e5;
const t0 = Date.UTC(2026, 10, 24, 0); // 24.11.2026 00:00
// 3 days of hours from yesterday 00:00; f(i, ms) gives the values of an hour
function mk(f, nDays = 10) {
  const start = t0 - 24 * H;
  const hours = Array.from({ length: 24 * nDays }, (_, i) => ({ ms: start + i * H, temp: 8, feels: 7, rainP: 5, rainMm: 0, code: 3, wind: 8, gust: 12, dir: 270, cape: 0, ...f(i, start + i * H) }));
  const days = Array.from({ length: nDays }, (_, d) => ({ date: new Date(start + d * 24 * H).toISOString().slice(0, 10), rise: start + d * 24 * H + 7 * H, set: start + d * 24 * H + 17 * H }));
  return { offset: 0, hours, days };
}

describe('weekBest', () => {
  it('names the dry day and says today or tomorrow', () => {
    const rainyToday = mk((i, ms) => (ms >= t0 && ms < t0 + 24 * H ? { rainP: 90, rainMm: 1.5 } : {}));
    const b = weekBest(rainyToday, t0 + 8 * H);
    expect(b.date).toBe('2026-11-25');
    expect(b.day).toBe('tomorrow');
    expect(b.word).toBe('good');
    expect(weekBest(mk(() => ({})), t0 + 6 * H).day).toBe('today');
  });
  it('is null without hours', () => {
    expect(weekBest({ offset: 0, hours: [], days: [] }, t0)).toBeNull();
    expect(weekBest(null, t0)).toBeNull();
  });
});

describe('afterRain', () => {
  it('shows after rain of 1 mm or more in the last 24 hours', () => {
    const core = mk((i, ms) => (ms >= t0 - 6 * H && ms < t0 - 3 * H ? { rainMm: 0.6 } : {}));
    const r = afterRain(core, t0 + 8 * H);
    expect(r.mm).toBe(1.8);
    expect(r.lastMs).toBe(t0 - 4 * H);
  });
  it('is null on a dry day, for a little drizzle and for rain older than a day', () => {
    expect(afterRain(mk(() => ({})), t0 + 8 * H)).toBeNull();
    expect(afterRain(mk((i, ms) => (ms === t0 - 3 * H ? { rainMm: 0.5 } : {})), t0 + 8 * H)).toBeNull();
    expect(afterRain(mk((i, ms) => (ms < t0 - 20 * H ? { rainMm: 3 } : {})), t0 + 8 * H)).toBeNull();
  });
});

describe('rideWindow', () => {
  // Open-Meteo stamps rain at the END of its hour: a wet value at 14:00 is the rain of 13:00–14:00 (regenzeit.js)
  it('is dry until sunset on a dry day', () => {
    const w = rideWindow(mk(() => ({})), t0 + 10 * H + 20 * 6e4);
    expect(w.by).toBe('dark');
    expect(w.until).toBe(t0 + 17 * H);
    expect(w.lampOn).toBe(t0 + 17 * H - 30 * 6e4);
  });
  it('ends where the rain starts, the same time as the rest of Today says', () => {
    const w = rideWindow(mk((i, ms) => (ms >= t0 + 14 * H && ms < t0 + 16 * H ? { rainP: 80, rainMm: 1 } : {})), t0 + 10 * H);
    expect(w.by).toBe('rain');
    expect(w.until).toBe(t0 + 13 * H);
  });
  it('is null when it rains now, after sunset or when the dry stretch is short', () => {
    expect(rideWindow(mk((i, ms) => (ms >= t0 + 9 * H && ms < t0 + 12 * H ? { rainP: 80, rainMm: 1 } : {})), t0 + 10 * H)).toBeNull();
    expect(rideWindow(mk(() => ({})), t0 + 18 * H)).toBeNull();
    expect(rideWindow(mk((i, ms) => (ms >= t0 + 12 * H ? { rainP: 80, rainMm: 1 } : {})), t0 + 10 * H + 30 * 6e4)).toBeNull();
  });
});
