// GPX-Weg (Noah 15.10.2026 «1-5 a»): one ride counts once, whichever way it came in.
import { describe, it, expect } from 'vitest';
import { startKey, uniqueRides, learnPace, paceOf, paceSeries } from '../src/lib/pace.js';
import { addToPace, dropFromPace } from '../src/lib/gpx.js';

const viaPace = { id: '2026-09-21T06:35-46', name: 'test_data_gtp_ Pass', date: '2026-09-21', km: 46.3, gainM: 1179, movingH: 3.68, totalH: 4.13, use: true };
const viaRide = { id: 'ride-2026-09-21T06:35-45', name: 'test_data_gtp_ Pass', date: '2026-09-21', km: 45.4, gainM: 1150, movingH: 3.55, totalH: 4.13 };

describe('one ride, one count', () => {
  it('knows a ride by its start minute', () => {
    expect(startKey(viaPace.id)).toBe('2026-09-21T06:35');
    expect(startKey(viaRide.id)).toBe('2026-09-21T06:35');
  });
  it('keeps each start minute once, the first wins', () => {
    expect(uniqueRides([viaPace, { ...viaRide, use: true }]).map((r) => r.id)).toEqual([viaPace.id]);
  });
  it('does not add the same ride twice to your pace', () => {
    const s = addToPace({ rides: [viaPace] }, viaRide, '2026-10-15T12:00:00Z');
    expect(s.rides).toHaveLength(1);
    expect(s.n).toBe(1);
  });
  it('counts and charts an old double only once', () => {
    const rides = [viaPace, { ...viaRide, use: true }];
    expect(learnPace(rides).n).toBe(1);
    expect(paceOf({ kmh: null, rides }).n).toBe(1);
    expect(paceSeries(rides)).toHaveLength(1);
  });
  it('takes both copies out when the ride stops counting', () => {
    expect(dropFromPace({ rides: [viaPace, { ...viaRide, use: true }] }, viaRide.id).rides).toEqual([]);
  });
});
