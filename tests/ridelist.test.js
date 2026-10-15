// GPX-Weg R3 (Noah 15.10.2026 «5a»): one way for GPX, TCX and CSV. Fictional trips and rides only.
import { describe, it, expect } from 'vitest';
import { isList, kmIntoDebrief, listToTrips, handToKmImport, takeHanded } from '../src/lib/ridelist.js';

const trip = { id: 'test_data_gtp_trip-a', title: 'Demo Tour A', startDate: '2026-09-20', days: 2, bikeId: 'test_data_gtp_bike' };
const walk = { id: 'test_data_gtp_trip-w', title: 'Demo Wanderung', startDate: '2026-09-20', days: 1 };

describe('isList', () => {
  it('knows the CSV list by name or type', () => {
    expect(isList({ name: 'activities.csv' })).toBe(true);
    expect(isList({ name: 'x', type: 'text/csv' })).toBe(true);
    expect(isList({ name: 'ride.gpx', type: 'application/gpx+xml' })).toBe(false);
  });
});

describe('kmIntoDebrief', () => {
  it('makes a debrief with the km of the rides on the trip days', () => {
    const d = kmIntoDebrief(null, trip, [
      { date: '2026-09-20', km: 61.4, name: 'Tag 1' },
      { date: '2026-09-21', km: 48.2, name: 'Tag 2' },
      { date: '2026-09-25', km: 30, name: 'später' },
    ], '2026-10-01T10:00:00.000Z');
    expect(d.tripId).toBe(trip.id);
    expect(d.rides.map((r) => r.name)).toEqual(['Tag 1', 'Tag 2']);
    expect(d.km).toBe(110);
  });
  it('replaces the same ride, keeps the others and the answers', () => {
    const before = { tripId: trip.id, status: 'draft', note: 'gut', rides: [{ date: '2026-09-20', km: 60, name: 'Tag 1' }], km: 60 };
    const d = kmIntoDebrief(before, trip, [{ date: '2026-09-20', km: 61, name: 'Tag 1' }, { date: '2026-09-21', km: 40, name: 'Tag 2' }]);
    expect(d.rides).toHaveLength(2);
    expect(d.km).toBe(101);
    expect(d.note).toBe('gut');
    expect(before.km).toBe(60);
  });
  it('is null when no ride is on the trip days', () => {
    expect(kmIntoDebrief(null, trip, [{ date: '2026-08-01', km: 20, name: 'x' }])).toBeNull();
  });
});

describe('listToTrips', () => {
  it('finds bike trips, counts rides outside and other sports', () => {
    const acts = [
      { date: '2026-09-20', km: 61, name: 'a', type: 'Ride' },
      { date: '2026-09-21', km: 48, name: 'b', type: 'Gravel Ride' },
      { date: '2026-09-20', km: 8, name: 'c', type: 'Run' },
      { date: '2026-09-28', km: 30, name: 'd', type: 'Ride' },
    ];
    const res = listToTrips(acts, [trip, walk]);
    expect(res.hits).toHaveLength(1);
    expect(res.hits[0].trip.id).toBe(trip.id);
    expect(res.hits[0].km).toBe(109);
    expect(res.outside).toBe(1);
    expect(res.other).toBe(1);
    expect(res.all).toBe(3);
  });
});

describe('hand over to Import rides', () => {
  it('gives the files once', () => {
    handToKmImport([{ name: 'activities.csv' }]);
    expect(takeHanded()).toHaveLength(1);
    expect(takeHanded()).toHaveLength(0);
  });
});
