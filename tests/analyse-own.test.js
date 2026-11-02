import { describe, it, expect } from 'vitest';
import { sleepScoreOf, restlessOf, cardioLoadOf } from '../src/lib/analyse/own.js';

describe('analyse own calculations', () => {
  it('Schlafindex: duration, depth and calm', () => {
    expect(sleepScoreOf({ asleepMin: 480, deepMin: 100, remMin: 116, efficiency: 95 })).toBe(100);
    expect(sleepScoreOf({ asleepMin: 240, deepMin: 27, remMin: 27, efficiency: 82.5 })).toBe(50); // 25 + 12.5 + 12.5
    // without stages: duration and calm count up to 100
    expect(sleepScoreOf({ asleepMin: 480, efficiency: 95 })).toBe(100);
    expect(sleepScoreOf({ asleepMin: 0 })).toBeNull();
    expect(sleepScoreOf(null)).toBeNull();
  });
  it('Unruhe: minutes awake per hour asleep', () => {
    expect(restlessOf({ asleepMin: 420, awakeMin: 35 })).toBe(5);
    expect(restlessOf({ asleepMin: 420 })).toBeNull();
  });
  it('Cardio-Belastung: weighted zone minutes', () => {
    expect(cardioLoadOf({ light: 30, mod: 10, vig: 5, peak: 1 })).toBe(30 + 20 + 15 + 4);
    expect(cardioLoadOf({})).toBeNull();
    expect(cardioLoadOf(null)).toBeNull();
  });
});
