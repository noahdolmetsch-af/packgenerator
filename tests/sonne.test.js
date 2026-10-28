// «Sonnenaufgang auf dem Hügel» (Träume und Neuland N9, Noah 27.10.2026 «1-5 a»): clear mornings and evenings.
import { describe, it, expect } from 'vitest';
import { nextClear, clearIn, viewSpots, rideTo, leaveAt, zurich } from '../src/lib/dreams/sonne.js';
import { sunAt } from '../src/lib/unterwegs/himmel.js';

const P = 'test_data_gtp_';
const HOME = { lat: 47.38, lon: 8.54 };
const day = (date, c, p = 0) => ({ date, hourly: { t: Array(24).fill(8), p: Array(24).fill(p), c: Array.isArray(c) ? c : Array(24).fill(c) } });

describe('clear sky', () => {
  it('little cloud and little rain in the hour; null without cloud cover', () => {
    expect(clearIn(day('2026-10-30', 20), 7)).toBe(true);
    expect(clearIn(day('2026-10-30', 80), 7)).toBe(false);
    expect(clearIn(day('2026-10-30', 10, 60), 7)).toBe(false);
    expect(clearIn({ date: '2026-10-30', hourly: { t: [], p: [] } }, 7)).toBe(null);
  });

  it('the next clear sunrise and sunset after now', () => {
    const rise29 = sunAt('2026-10-29', HOME.lat, HOME.lon).rise;
    const h29 = zurich(rise29).hour;
    const cloudy29 = Array(24).fill(10);
    cloudy29[h29] = 90; // the 29th: cloudy at sunrise, clear in the evening
    const days = [day('2026-10-28', 90), day('2026-10-29', cloudy29), day('2026-10-30', 0)];
    const got = nextClear(days, HOME, Date.parse('2026-10-28T12:00:00Z'));
    expect(got.rise.date).toBe('2026-10-30');
    expect(got.set.date).toBe('2026-10-29');
    expect(got.rise.hm).toMatch(/^0[67]:\d\d$/);
    expect(nextClear(days, null)).toEqual({ rise: null, set: null });
  });
});

describe('view points', () => {
  const pts = [
    { id: 'a', kind: 'view', name: `${P}Aussicht`, lat: 47.40, lon: 8.56 },
    { id: 'b', kind: 'view', name: `${P}Weit`, lat: 46.9, lon: 8.0 },
    { id: 'c', kind: 'sleep', name: `${P}Schlafplatz`, lat: 47.39, lon: 8.55 },
  ];
  it('own view points near home, nearest first', () => {
    expect(viewSpots(pts, HOME).map((p) => p.id)).toEqual(['a']);
  });
  it('when to leave: the ride and 15 minutes before', () => {
    expect(rideTo(4)).toBe(20);
    expect(rideTo(null)).toBe(30);
    const at = Date.parse('2026-10-30T06:20:00Z'); // 07:20 in Zürich
    expect(leaveAt(at, 4)).toBe('06:45');
    expect(leaveAt(at, null)).toBe('06:35');
  });
});
