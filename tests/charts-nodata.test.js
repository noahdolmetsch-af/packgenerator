// «Keine Daten statt 0» (Noah 21.11.2026): a time to come or before the first record says why it is empty.
import { describe, it, expect } from 'vitest';
import { noDataText, firstDayOf } from '../src/lib/charts/nodata.js';

describe('noDataText', () => {
  it('says «not yet» for a bar that starts after today', () => {
    expect(noDataText('2026-12-01', '2026-12-31', '2026-10-09', '2025-01-03')).toBe('Not yet');
  });
  it('says there is no data before the first record', () => {
    expect(noDataText('2024-01-01', '2024-01-31', '2026-10-09', '2025-01-03')).toBe('No data in this period');
  });
  it('leaves a real zero alone, also the month of the first record', () => {
    expect(noDataText('2026-02-01', '2026-02-28', '2026-10-09', '2025-01-03')).toBe('');
    expect(noDataText('2025-01-01', '2025-01-31', '2026-10-09', '2025-01-03')).toBe('');
    expect(noDataText('2026-02-01', '2026-02-28', '2026-10-09', null)).toBe('');
  });
  it('finds the first day', () => {
    expect(firstDayOf([{ day: '2025-03-02' }, { day: '2025-01-03' }, {}])).toBe('2025-01-03');
    expect(firstDayOf([])).toBe(null);
  });
});
