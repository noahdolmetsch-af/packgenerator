// «Kochen» Schritt 2 (Noah 28.10.2026 «5a»): the pure part of the cooking mode
import { describe, it, expect } from 'vitest';
import { RECIPES } from '../src/lib/kochen/rezepte.js';
import { cookStepOfHash, cookHref, recipeOfHash, clampStep, timerOf, secondsLeft, fmtClock, stepsMinutes } from '../src/lib/kochen/kochen.js';

describe('cooking mode', () => {
  it('the step lives in the address, the recipe id stays the same', () => {
    expect(cookHref('pasta-salad', 2)).toBe('#/me/alltag/kochen/pasta-salad?cook=2');
    expect(cookStepOfHash(cookHref('pasta-salad', 2))).toBe(2);
    expect(recipeOfHash(cookHref('pasta-salad', 2))).toBe('pasta-salad');
    expect(cookStepOfHash('#/me/alltag/kochen/pasta-salad')).toBe(0);
    expect(cookStepOfHash('#/me/alltag/kochen')).toBe(0);
    expect(cookStepOfHash('#/me/alltag/kochen/x?a=1&cook=3')).toBe(3);
    expect(cookStepOfHash('#/me/alltag/kochen/x?cook=0')).toBe(1);
  });
  it('a step stays inside the recipe', () => {
    expect(clampStep(0, 4)).toBe(1);
    expect(clampStep(9, 4)).toBe(4);
    expect(clampStep('2', 4)).toBe(2);
    expect(clampStep(3, 0)).toBe(1);
  });
  it('a timer only on steps that wait, in seconds', () => {
    expect(timerOf({ min: 9, timer: true })).toBe(540);
    expect(timerOf({ min: 9, timer: false })).toBe(0);
    expect(timerOf({ text: 'own step' })).toBe(0);
    const withTimer = RECIPES.filter((r) => r.steps.some((s) => timerOf(s) > 0));
    expect(withTimer.length).toBeGreaterThan(50);
  });
  it('seconds left and the clock', () => {
    expect(secondsLeft(10_500, 10_000)).toBe(1);
    expect(secondsLeft(9_000, 10_000)).toBe(0);
    expect(fmtClock(540)).toBe('9:00');
    expect(fmtClock(65)).toBe('1:05');
    expect(fmtClock(3725)).toBe('1:02:05');
    expect(fmtClock(-3)).toBe('0:00');
  });
  it('all minutes of a recipe', () => {
    expect(stepsMinutes({ steps: [{ min: 2 }, { min: 9 }, {}] })).toBe(11);
    expect(stepsMinutes(null)).toBe(0);
  });
});
