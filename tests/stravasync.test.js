// E3: Strava activities from the server as ledger rides. Fictional bikes and rides only.
import { describe, it, expect } from 'vitest';
import { toRides, gearChanges, typeName } from '../src/lib/stravasync.js';

const bikes = [{ id: 'b1', name: 'Gravel Blau' }, { id: 'b2', name: 'MTB Rot' }];
const act = (over = {}) => ({ id: '11', name: 'Runde', type: 'GravelRide', start: '2026-10-11T22:30:00Z', km: 42.3, gearId: 'b1', device: 'Garmin Edge 540', trainer: false, ...over });

describe('toRides', () => {
  it('turns an activity into a ledger ride with the bike name and the Zurich day', () => {
    const { rides, other } = toRides([act()], bikes);
    expect(other).toBe(0);
    expect(rides[0]).toMatchObject({ source: 'strava', date: '2026-10-12', km: 42.3, type: 'Gravel Ride', gear: 'Gravel Blau', stravaId: '11' });
  });

  it('counts runs and indoor rides without a bike as other', () => {
    const { rides, other } = toRides([act({ id: '1', type: 'Run' }), act({ id: '2', type: 'VirtualRide', gearId: null }), act({ id: '3', type: 'VirtualRide' })], bikes);
    expect(other).toBe(2);
    expect(rides.map((r) => r.stravaId)).toEqual(['3']);
  });

  it('keeps a ride without a bike (it goes to «Prüfen»)', () => {
    expect(toRides([act({ gearId: null })], bikes).rides[0].gear).toBe('');
  });

  it('typeName splits Strava sport types', () => {
    expect(typeName('EMountainBikeRide')).toBe('E-Mountain Bike Ride');
    expect(typeName('Ride')).toBe('Ride');
  });
});

describe('gearChanges', () => {
  it('finds rides whose bike was changed in Strava', () => {
    const known = [{ id: 'k1', stravaId: '11', gear: 'Gravel Blau' }, { id: 'k2', stravaId: '12', gear: 'MTB Rot' }];
    const { rides } = toRides([act({ gearId: 'b2' }), act({ id: '12', gearId: 'b2' }), act({ id: '13' })], bikes);
    const changes = gearChanges(known, rides);
    expect(changes).toHaveLength(1);
    expect(changes[0].entry.id).toBe('k1');
    expect(changes[0].ride.gear).toBe('MTB Rot');
  });
});
