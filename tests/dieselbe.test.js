import { describe, it, expect } from 'vitest';
import { sameSession, coveredBy, joinPieces, fitFamily, stravaFamily, isWalk } from '../src/lib/flow/dieselbe.js';
import { healthToAsk } from '../src/lib/flow/healthfeel.js';
import { suggestions } from '../src/lib/flow/fitbittraining.js';
import { shiftDay } from '../src/lib/training.js';

// «Eine Fahrt = ein Eintrag» (Noah 27.11.2026): fictional data only
const day = '2026-11-18';
const ride = { type: 'OUTDOOR_BIKE', name: 'Radfahren', start: '07:10', end: '08:10', min: 60, km: 22, hr: 141 };
const strava = (over = {}) => ({ id: '1', day, time: '07:00', elapsedS: 3900, movingS: 3700, type: 'Ride', device: 'Garmin Edge 1040', ...over });

describe('same session (one rule for all cards)', () => {
  it('sport families', () => {
    expect(fitFamily({ type: 'OUTDOOR_BIKE' })).toBe('bike');
    expect(fitFamily({ type: 'SPINNING' })).toBe('bike');
    expect(fitFamily({ type: 'WALKING', name: 'Gehen' })).toBe('walk');
    expect(fitFamily({ type: 'RUNNING' })).toBe('run');
    expect(fitFamily({ type: 'TENNIS' })).toBe('other');
    expect(stravaFamily({ type: 'GravelRide' })).toBe('bike');
    expect(stravaFamily({ type: 'Walk' })).toBe('walk');
    expect(stravaFamily({ type: 'Tennis' })).toBe('other');
    expect(isWalk({ type: 'WALKING' })).toBe(true);
  });
  it('the watch started late or ended early: inside the Strava ride is the same', () => {
    expect(sameSession(day, ride, strava())).toBe(true);
    expect(sameSession(day, { ...ride, start: '07:50', min: 12 }, strava())).toBe(true);
  });
  it('a little before or after counts only for the same sport (up to 30 minutes)', () => {
    expect(sameSession(day, { ...ride, start: '08:20', min: 20 }, strava())).toBe(true); // ride 07:00–08:05, ends 15 min after: same sport
    expect(sameSession(day, { ...ride, start: '08:40', min: 20 }, strava())).toBe(false); // 35 minutes after
    expect(sameSession(day, { type: 'WALKING', name: 'Gehen', start: '08:20', min: 20 }, strava())).toBe(false); // a walk after the ride is no ride
    expect(sameSession(day, { type: 'TENNIS', name: 'Tennis', start: '08:20', min: 20 }, strava())).toBe(false); // other sport, after: its own workout
    expect(sameSession(day, { type: 'TENNIS', name: 'Tennis', start: '08:20', min: 20 }, strava({ type: 'Tennis' }))).toBe(true); // Strava has the tennis as well
  });
  it('another day, another sport at the same time or a far time is not the same', () => {
    expect(sameSession(day, ride, strava({ day: '2026-11-17' }))).toBe(false);
    expect(sameSession(day, ride, strava({ type: 'Run' }))).toBe(false);
    expect(sameSession(day, ride, strava({ time: '11:00' }))).toBe(false);
  });
  it('without a time on either side the same length (within 10 %) counts', () => {
    expect(sameSession(day, { ...ride, start: undefined }, strava({ time: undefined, elapsedS: 3700 }))).toBe(true);
    expect(sameSession(day, { ...ride, start: undefined }, strava({ time: undefined, elapsedS: 1800 }))).toBe(false);
  });
  it('a Garmin recording wins when two fit, then the closest start', () => {
    const phone = strava({ id: '2', time: '07:10', device: 'Strava App' });
    const edge = strava({ id: '3', time: '07:00', device: 'Garmin Edge 530' });
    expect(coveredBy(day, ride, [phone, edge]).id).toBe('3');
    expect(coveredBy(day, ride, [phone]).id).toBe('2');
    expect(coveredBy(day, ride, [])).toBeNull();
  });
});

describe('pieces of one workout', () => {
  it('joins the same sport with a gap up to 15 minutes: one start, the sums, the pulse weighted by minutes', () => {
    const a = { type: 'OUTDOOR_BIKE', start: '07:10', end: '07:40', min: 30, km: 10, hr: 140, kcal: 200 };
    const b = { type: 'OUTDOOR_BIKE', start: '07:50', end: '08:10', min: 20, km: 7, hr: 150, kcal: 150 };
    const c = { type: 'OUTDOOR_BIKE', start: '09:00', end: '09:20', min: 20 };
    const out = joinPieces([c, b, a]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ start: '07:10', end: '08:10', min: 50, km: 17, hr: 144, kcal: 350, pieces: 2 });
    expect(out[1].start).toBe('09:00');
  });
  it('never joins other sports or other types', () => {
    expect(joinPieces([{ type: 'TENNIS', start: '10:00', end: '10:30', min: 30 }, { type: 'TENNIS', start: '10:35', end: '11:00', min: 25 }])).toHaveLength(2);
    expect(joinPieces([{ type: 'OUTDOOR_BIKE', start: '10:00', end: '10:30', min: 30 }, { type: 'RUNNING', start: '10:35', end: '11:00', min: 25 }])).toHaveLength(2);
  });
});

describe('the cards use the rule', () => {
  it('«How was it?» does not ask about a ride Garmin has, a late-started piece or a plain walk of the watch', () => {
    const rows = [{ date: day, exercises: [{ ...ride, start: '07:50', min: 12 }, { type: 'WALKING', name: 'Gehen', start: '15:43', end: '16:16', min: 33 }] }];
    expect(healthToAsk(rows, [strava()], null, day, shiftDay)).toBeNull();
    expect(healthToAsk(rows, [], null, day, shiftDay)).toMatchObject({ type: 'OUTDOOR_BIKE' }); // the walk never, the ride only without Strava
  });
  it('«Count?» does not suggest what Strava has, the same rule', () => {
    const acts = [{ id: 'bike', name: 'Bike' }];
    const health = [{ date: day, exercises: [{ ...ride, start: '07:50', min: 12 }] }];
    expect(suggestions({ health, acts, log: [], activities: [strava()], handled: [], today: day })).toEqual([]);
    expect(suggestions({ health, acts, log: [], activities: [], handled: [], today: day })).toHaveLength(1);
  });
});
