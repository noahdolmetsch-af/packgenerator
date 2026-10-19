import { describe, it, expect } from 'vitest';
import { needsNudge } from '../src/lib/sync/nudge.js';

describe('sync nudge on Ich', () => {
  it('shows while the sync is off and there is own data', () => {
    expect(needsNudge({ items: 3, cfg: null })).toBe(true);
    expect(needsNudge({ items: 3, cfg: { on: false } })).toBe(true);
  });
  it('stays away when sync is on, in the demo, without data or when hidden', () => {
    expect(needsNudge({ items: 3, cfg: { on: true } })).toBe(false);
    expect(needsNudge({ items: 3, demo: true })).toBe(false);
    expect(needsNudge({ items: 0 })).toBe(false);
    expect(needsNudge({ items: 3, nudge: { off: true } })).toBe(false);
  });
});
