// «Unterwegs-Modus» (Plan «ganze App», Schritt 7a): on only for the tour Noah switched it on for, never by itself.
import { describe, it, expect } from 'vitest';
import { KEY, modeOn } from '../src/lib/tourpfad/unterwegs.js';

describe('Unterwegs-Modus', () => {
  it('is off without a setting and for another tour', () => {
    expect(modeOn(undefined, 't1')).toBe(false);
    expect(modeOn(null, 't1')).toBe(false);
    expect(modeOn({ tripId: 't2', since: '2026-11-23T10:00:00.000Z' }, 't1')).toBe(false);
    expect(modeOn({ tripId: 't1' }, '')).toBe(false);
  });
  it('is on for the tour it was switched on for', () => {
    expect(modeOn({ tripId: 't1', since: '2026-11-23T10:00:00.000Z' }, 't1')).toBe(true);
  });
  it('uses one setting key', () => {
    expect(KEY).toBe('unterwegsMode');
  });
});
