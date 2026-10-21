import { describe, it, expect } from 'vitest';
import { fitbitTrip, sleepText } from '../src/lib/review/fitbittrip.js';

// Fictional Fitbit days around a made-up trip on 2026-10-20 (Noah 21.10.2026 «fehlen werte für stimmung und energie»).
const day = (date, restingHr, asleepMin) => ({ date, ...(restingHr != null ? { restingHr } : {}), ...(asleepMin != null ? { sleep: { asleepMin } } : {}) });

describe('Fitbit around a trip', () => {
  it('the night before, the 2 days after, and the normal of the 30 days before', () => {
    const rows = [...Array.from({ length: 10 }, (_, i) => day(`2026-10-${String(5 + i).padStart(2, '0')}`, 50 + (i % 3), 420)), day('2026-10-20', 53, 400), day('2026-10-21', 56, 380), day('2026-10-22', 52, 460)];
    const f = fitbitTrip(rows, '2026-10-20', '2026-10-20');
    expect(f.before).toEqual({ date: '2026-10-20', restingHr: 53, sleepMin: 400 });
    expect(f.after.map((x) => x.date)).toEqual(['2026-10-21', '2026-10-22']);
    expect(f.normal).toEqual({ restingHr: 51, sleepMin: 420 });
  });
  it('nothing measured → null; a gap after the trip is left out', () => {
    expect(fitbitTrip([], '2026-10-20', '2026-10-20')).toBeNull();
    expect(fitbitTrip([day('2026-10-22', 54)], '2026-10-20', '2026-10-20').after).toEqual([{ date: '2026-10-22', restingHr: 54, sleepMin: null }]);
  });
  it('sleep as hours and minutes', () => {
    expect(sleepText(425)).toBe('7 h 05 min');
    expect(sleepText(null)).toBeNull();
  });
});
