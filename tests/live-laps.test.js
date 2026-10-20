// Runden und «Gegen dich selbst» (Noah 20.10.2026 «2-3 ja»): src/lib/live/laps.js.
import { describe, it, expect } from 'vitest';
import { lapsOf, lapNow, ghostOf, ghostAt, ghostDelta, lastRideOf, deltaText } from '../src/lib/live/laps.js';

const T0 = 1_760_000_000_000;
// a straight made-up route north, 10 km, a point every 100 m
const route = Array.from({ length: 101 }, (_, i) => ({ lat: 46.9 + (i * 0.1) / 111.2, lon: 7.4, km: i * 0.1 }));

describe('laps', () => {
  it('the first lap starts at the start; each tap starts the next', () => {
    const laps = [{ at: T0 + 600_000, km: 5, movingS: 600 }, { at: T0 + 1_500_000, km: 12.5, movingS: 1400 }];
    const l = lapsOf(laps, { km: 15, movingS: 1700, now: T0 + 1_900_000, startAt: T0 });
    expect(l.map((x) => [x.n, x.km, x.movingS])).toEqual([[1, 5, 600], [2, 7.5, 800], [3, 2.5, 300]]);
    expect(lapNow([], { km: 3, movingS: 400, startAt: T0 })).toMatchObject({ n: 1, km: 3, movingS: 400 });
  });
});

describe('against your last ride', () => {
  // last ride: 10 km in 30 min riding, with a 10 min pause at km 5
  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const sec = i <= 50 ? i * 18 : i * 18 + 600;
    pts.push([route[i].lat, route[i].lon, sec]);
  }
  const last = { id: 'rec-1', kind: 'rec', tripId: 'test_data_gtp_trip', startAt: T0, pts, breaks: [[T0 + 900_000 + 1000, T0 + 1_500_000]], open: false };
  const g = ghostOf(last, route);

  it('the riding time along the route leaves out the pause', () => {
    expect(g.length).toBeGreaterThan(50);
    expect(ghostAt(g, 5)).toBeCloseTo(900, -1);
    expect(ghostAt(g, 10)).toBeCloseTo(1800, -1);
    expect(ghostAt(g, 11)).toBe(null);
  });
  it('+ behind, − ahead, from where you started', () => {
    expect(ghostDelta(g, { km: 5, movingS: 960 })).toBe(60);
    expect(ghostDelta(g, { km: 5, movingS: 840 })).toBe(-60);
    // started today at km 2 (the ghost needed 360 s from 0 to 2)
    expect(ghostDelta(g, { km: 5, movingS: 540, startKm: 2 })).toBe(0);
  });
  it('the last closed ride of the same tour', () => {
    const rows = [last, { ...last, id: 'rec-2', startAt: T0 + 864e5 }, { ...last, id: 'rec-3', open: true, startAt: T0 + 2 * 864e5 }, { ...last, id: 'rec-4', tripId: 'other' }];
    expect(lastRideOf(rows, { tripId: 'test_data_gtp_trip', notId: 'rec-9' }).map((r) => r.id)).toEqual(['rec-2', 'rec-1']);
  });
  it('a ride beside the route is no ghost; text of the difference', () => {
    const away = { ...last, pts: pts.map(([a, b, s]) => [a + 0.05, b + 0.05, s]) };
    expect(ghostOf(away, route)).toEqual([]);
    expect([deltaText(65), deltaText(-42), deltaText(0), deltaText(null)]).toEqual(['+1:05', '−0:42', '±0:00', '–']);
  });
});
