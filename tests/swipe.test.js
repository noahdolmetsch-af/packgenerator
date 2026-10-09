// v0.38.0 (Noah 3a, 4a): swiping a gear row (gear/swipe.js).
import { describe, it, expect } from 'vitest';
import { direction, release, drag, leftActions, RIGHT_ACTIONS, ACTION_W, SLOP, usedOnTrips, tripCount } from '../src/lib/gear/swipe.js';

describe('swiping a gear row', () => {
  it('leaves up and down to the page scroll', () => {
    expect(direction(3, 2)).toBe(null);
    expect(direction(SLOP + 20, 4)).toBe('swipe');
    expect(direction(4, SLOP + 20)).toBe('scroll');
    expect(direction(20, 18)).toBe('scroll'); // diagonal: the page scrolls
  });

  it('offers favourite and assign on the right, delete or archive on the left', () => {
    expect(RIGHT_ACTIONS).toEqual(['favourite', 'assign']);
    expect(leftActions(false)).toEqual(['delete']);
    expect(leftActions(true)).toEqual(['archive']);
  });

  it('snaps open, closed, or does the action at once on a long swipe', () => {
    const w = 360;
    expect(release(10, w)).toEqual({ state: 'closed', offset: 0 });
    expect(release(ACTION_W + 10, w)).toEqual({ state: 'right', offset: 2 * ACTION_W });
    expect(release(-ACTION_W / 2 - 1, w)).toEqual({ state: 'left', offset: -ACTION_W });
    expect(release(-w * 0.6, w).state).toBe('long');
    expect(release(-w * 0.6, w, { used: true }).state).toBe('long');
  });

  it('keeps the row within its actions while dragging', () => {
    expect(drag(0, 500, 360)).toBe(2 * ACTION_W + 24);
    expect(drag(0, -900, 360)).toBe(-360);
    expect(drag(-ACTION_W, 20, 360)).toBe(-ACTION_W + 20);
  });

  it('knows which items were on a trip', () => {
    const trips = [{ entries: [{ itemId: 'a' }] }, { entries: [{ itemId: 'a' }, { itemId: 'b' }] }];
    expect(usedOnTrips('a', trips)).toBe(true);
    expect(usedOnTrips('c', trips)).toBe(false);
    expect(tripCount('a', trips)).toBe(2);
    expect(tripCount('b', trips)).toBe(1);
  });
});
