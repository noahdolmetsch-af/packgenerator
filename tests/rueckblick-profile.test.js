// v0.151.0 HP1–HP5: the ridden and the planned profile of a past trip, kept apart.
import { describe, it, expect } from 'vitest';
import { joinProfiles, tripFacts } from '../src/lib/review/rueckblick.js';

const trip = { id: 'test_data_hp_trip', title: 'test_data_hp_ tour', startDate: '2026-09-01', days: 2, status: 'done', route: { km: 30, profile: [[0, 400], [15, 700], [30, 450]] } };
const ride = (id, date, profile) => ({ id, tripId: trip.id, date, startAt: `${date}T08:00`, km: profile.at(-1)[0], profile });

describe('joinProfiles', () => {
  it('puts the rides one after the other', () => {
    expect(joinProfiles([{ profile: [[0, 400], [10, 500]] }, { profile: [[0, 500], [5, 600]] }])).toEqual([[0, 400], [10, 500], [10, 500], [15, 600]]);
  });
  it('is null without a ride of two points or more', () => {
    expect(joinProfiles([])).toBeNull();
    expect(joinProfiles([{ profile: [[0, 400]] }, { profile: null }])).toBeNull();
  });
});

describe('tripFacts profiles', () => {
  it('a trip has its rides as rideProfile and its route as planProfile', () => {
    const rides = [ride('r2', '2026-09-02', [[0, 500], [12, 450]]), ride('r1', '2026-09-01', [[0, 400], [18, 650]])];
    const row = tripFacts({ trips: [trip], rides, today: '2026-10-01' }).find((r) => r.id === trip.id);
    expect(row.rideProfile).toEqual([[0, 400], [18, 650], [18, 500], [30, 450]]);
    expect(row.planProfile).toBe(trip.route.profile);
  });
  it('a trip without a ride has no rideProfile, a ride without a trip no planProfile', () => {
    const lone = { id: 'r9', date: '2026-09-10', startAt: '2026-09-10T08:00', km: 5, profile: [[0, 300], [5, 320]] };
    const rows = tripFacts({ trips: [trip], rides: [lone], today: '2026-10-01' });
    expect(rows.find((r) => r.id === trip.id).rideProfile).toBeNull();
    const solo = rows.find((r) => r.id === 'r9');
    expect(solo.rideProfile).toEqual(lone.profile);
    expect(solo.planProfile).toBeNull();
  });
});
