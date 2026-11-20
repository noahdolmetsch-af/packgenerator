// «Zwift und Indoor sichtbar» (Noah 19.11.2026 «3a»): which rides count as indoor. Fictional rides only.
import { describe, it, expect } from 'vitest';
import { isIndoorBike, actRecord } from '../src/lib/training.js';

const act = (o) => actRecord({ id: '1', startLocal: '2026-11-18T19:30:00', name: 'Abendfahrt', type: 'Ride', movingS: 3600, ...o });

describe('isIndoorBike', () => {
  it('the trainer flag, the type VirtualRide or «Zwift» in the name', () => {
    expect(isIndoorBike(act({ trainer: true }))).toBe(true);
    expect(isIndoorBike(act({ type: 'VirtualRide' }))).toBe(true);
    expect(isIndoorBike(act({ name: 'Zwift - Group Ride: Muster (B) on Watopia' }))).toBe(true);
    expect(isIndoorBike(act({ name: 'zwift race' }))).toBe(true);
  });
  it('an outdoor ride, a run on a treadmill, a word that only contains it: no', () => {
    expect(isIndoorBike(act({}))).toBe(false);
    expect(isIndoorBike(act({ type: 'VirtualRun', trainer: true }))).toBe(false);
    expect(isIndoorBike(act({ name: 'Zwiftlike' }))).toBe(false);
    expect(isIndoorBike(null)).toBe(false);
  });
});
