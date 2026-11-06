// «Doppeltipp-Schutz» (Durchklick Etappe 4, Noah 06.11.2026 «5a»): the shared block swallows the second tap only
import { describe, it, expect } from 'vitest';
import { isDoubleTap, GAP_MS, GUARDED } from '../src/lib/ui/doubletap.js';

describe('isDoubleTap', () => {
  const a = {};
  const b = {};
  it('the second tap on the same button within the gap is swallowed', () => {
    expect(isDoubleTap({ el: a, time: 1000 }, a, 1000 + 20)).toBe(true);
    expect(isDoubleTap({ el: a, time: 1000 }, a, 1000 + GAP_MS - 1)).toBe(true);
  });
  it('a later tap, another button or the first tap is not', () => {
    expect(isDoubleTap({ el: a, time: 1000 }, a, 1000 + GAP_MS)).toBe(false);
    expect(isDoubleTap({ el: a, time: 1000 }, b, 1010)).toBe(false);
    expect(isDoubleTap(null, a, 1000)).toBe(false);
  });
  it('only save-like buttons are guarded, not steppers or tabs', () => {
    expect(GUARDED).toContain('button[type="submit"]');
    expect(GUARDED).not.toContain('button,');
    expect(GUARDED).not.toMatch(/\.btn\b/);
  });
});
