// W1 «Deine Fahrten» (Noah 15.10.2026 «1-5 a»): the bar of a ride and the open rides. Fictional data only.
import { describe, it, expect } from 'vitest';
import { rideBar, openRides, RIDES_OPEN } from '../src/lib/debrief/fahrtenliste.js';

describe('the bar: riding time against the guess (4a)', () => {
  it('slower than guessed: orange, the ride fills the track', () => {
    expect(rideBar(3 + 41 / 60, 2 + 47 / 60)).toEqual({ ride: 100, guess: 76, faster: false, min: 54 });
  });
  it('faster or as guessed: green', () => {
    expect(rideBar(2, 2.5)).toEqual({ ride: 80, guess: 100, faster: true, min: 30 });
    expect(rideBar(2, 2).faster).toBe(true);
  });
  it('no bar without times', () => {
    expect(rideBar(0, 2)).toBeNull();
    expect(rideBar(2, null)).toBeNull();
  });
});

describe('the open rides (5a)', () => {
  const rides = Array.from({ length: 9 }, (_, i) => ({ id: `r${i}` }));
  it('the newest five, all on request', () => {
    expect(RIDES_OPEN).toBe(5);
    expect(openRides(rides).map((r) => r.id)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4']);
    expect(openRides(rides, { all: true })).toHaveLength(9);
  });
  it('a ride saved in this visit stays open, also an older one', () => {
    expect(openRides(rides, { isNew: (r) => r.id === 'r8' }).map((r) => r.id)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r8']);
  });
});
