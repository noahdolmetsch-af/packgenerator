// v0.101.0 Design-Refresh P2 «Heute»: the new tiles' rules (fictional data).
import { describe, it, expect } from 'vitest';
import { weekDays, activeCount, monthKm, nextMilestone, yearAgo } from '../src/lib/home/bausteine.js';

describe('this week', () => {
  it('lists Monday to Sunday with rides and Im Flow ticks', () => {
    const days = weekDays({ today: '2026-10-08', rides: [{ date: '2026-10-07T07:00:00Z', km: 38.4 }, { date: '2026-10-07', km: 2 }], log: [{ day: '2026-10-05', actId: 'med' }, { day: '2026-10-05', actId: 'med' }, { day: '2026-10-08', actId: 'yoga' }, { day: '2026-10-01', actId: 'yoga' }] });
    expect(days.map((d) => d.day)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(days[0].acts).toEqual(['med']);
    expect(days[2]).toMatchObject({ ride: true, km: 40 });
    expect(days[4].future).toBe(true);
    expect(activeCount(days)).toBe(3);
  });
});

describe('bike this month', () => {
  it('sums this month and compares with the same days of last month', () => {
    const rides = [{ date: '2026-10-02', km: 100 }, { date: '2026-10-09', km: 112 }, { date: '2026-09-05', km: 200 }, { date: '2026-09-20', km: 50 }];
    expect(monthKm(rides, '2026-10-10')).toEqual({ km: 212, pct: 6 });
    expect(monthKm([], '2026-10-10')).toEqual({ km: 0, pct: null });
  });
});

describe('next milestone', () => {
  it('takes the bike closest to its next 1000 km', () => {
    expect(nextMilestone({ bikes: [{ id: 'a', name: 'Gravel', km: 6480 }, { id: 'b', name: 'MTB', km: 2110 }] })).toMatchObject({ kind: 'bike', bike: 'Gravel', at: 7000, left: 520 });
  });
  it('else the next number of trips, or nothing', () => {
    expect(nextMilestone({ tripsDone: 7 })).toMatchObject({ kind: 'trips', at: 10, left: 3 });
    expect(nextMilestone({})).toBeNull();
  });
});

describe('a year ago', () => {
  it('finds the trip closest to this day last year with a line of its debrief', () => {
    const trips = [{ id: 't1', title: 'Jura', startDate: '2025-10-04' }, { id: 't2', title: 'Far', startDate: '2025-08-01' }];
    const r = yearAgo({ trips, debriefs: [{ tripId: 't1', note: 'Second bottle was right.\nmore' }], today: '2026-10-10' });
    expect(r.trip.id).toBe('t1');
    expect(r.note).toBe('Second bottle was right.');
    expect(yearAgo({ trips: [trips[1]], today: '2026-10-10' })).toBeNull();
  });
});
