import { describe, it, expect } from 'vitest';
import { localDay } from '../src/lib/localday.js';

describe('localDay', () => {
  it('uses the device clock, not UTC', () => {
    const d = new Date(2026, 9, 8, 0, 30); // 8 Oct 00:30 local time
    expect(localDay(d)).toBe('2026-10-08');
  });
  it('pads month and day', () => {
    expect(localDay(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
