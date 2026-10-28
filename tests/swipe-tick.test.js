// «Neuer Schwung» Packen 2 (B6, ui/swipe.js; the gear rows have their own gear/swipe.js): swipe a row to the right to tick it; the line and the direction.
import { describe, it, expect } from 'vitest';
import { swipeLine, swipeDone } from '../src/lib/ui/swipe.js';

describe('swipe to tick', () => {
  it('the line is 30 % of the row, between 48 and 96 px', () => {
    expect(swipeLine(200)).toBe(60);
    expect(swipeLine(100)).toBe(48);
    expect(swipeLine(600)).toBe(96);
    expect(swipeLine(0)).toBe(48);
  });
  it('done only far enough to the right and more sideways than up or down', () => {
    expect(swipeDone(100, 10, 360)).toBe(true);
    expect(swipeDone(60, 0, 360)).toBe(false);
    expect(swipeDone(120, 70, 360)).toBe(false);
    expect(swipeDone(-120, 0, 360)).toBe(false);
  });
});
