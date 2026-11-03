// B13 (Noah 27.10.2026 «4a»): one swipe for every list (ui/swiperow.js).
import { describe, it, expect } from 'vitest';
import { settle, follow, ACTION_W } from '../src/lib/ui/swiperow.js';

describe('swiping a list row', () => {
  const w = 360;
  const sides = { right: 1, left: 1 };
  it('snaps closed after a short move', () => {
    expect(settle(10, w, sides)).toEqual({ state: 'closed', offset: 0 });
    expect(settle(-10, w, sides)).toEqual({ state: 'closed', offset: 0 });
  });
  it('opens the side the finger went to', () => {
    expect(settle(ACTION_W / 2 + 1, w, sides)).toEqual({ state: 'right', offset: ACTION_W });
    expect(settle(-ACTION_W / 2 - 1, w, sides)).toEqual({ state: 'left', offset: -ACTION_W });
    expect(settle(-ACTION_W - 10, w, { right: 1, left: 2 })).toEqual({ state: 'left', offset: -2 * ACTION_W });
  });
  it('does the first action at once on a long swipe', () => {
    expect(settle(w * 0.6, w, sides).state).toBe('long-right');
    expect(settle(-w * 0.6, w, sides).state).toBe('long-left');
  });
  it('never opens a side without actions', () => {
    expect(settle(w, w, { left: 1 }).state).toBe('closed');
    expect(follow(0, 200, w, { left: 1 })).toBe(0);
    expect(follow(0, -500, w, { left: 1 })).toBe(-w);
    expect(follow(0, 120, w, sides)).toBe(120);
  });
});
