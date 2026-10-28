// «Diagramme zum Antippen» K1 (Noah 27.10.2026 «1-5 a»): the spans, your normal resting pulse, the date
// marks and the highest point of the chart «Verlauf» on «Form und Erholung». Fictional data only.
import { describe, it, expect } from 'vitest';
import { SPANS, SPAN_DEFAULT, rhrNormal, dateMarks, peakOf } from '../src/lib/flow/form/zeitraum.js';

describe('Verlauf: spans, normal, dates, peak', () => {
  it('four spans, 12 weeks first shown', () => {
    expect(SPANS.map((s) => s.days)).toEqual([28, 84, 182, 365]);
    expect(SPANS.find((s) => s.key === SPAN_DEFAULT).days).toBe(84);
  });
  it('the normal resting pulse is the middle half of the 30 days before today', () => {
    const table = new Map();
    const vals = [44, 45, 46, 47, 48, 49, 50, 51, 52, 60];
    vals.forEach((v, i) => table.set(`2026-10-${String(20 - i).padStart(2, '0')}`, { rhr: v }));
    table.set('2026-10-21', { rhr: 99 }); // today does not count
    expect(rhrNormal(table, '2026-10-21')).toEqual({ lo: 46, hi: 51 });
    expect(rhrNormal(new Map([['2026-10-20', { rhr: 50 }]]), '2026-10-21')).toBeNull();
  });
  it('at least three dates: first, between, last', () => {
    expect(dateMarks(84)).toEqual([0, 28, 55, 83]);
    expect(dateMarks(3)).toEqual([0, 1, 2]);
    expect(dateMarks(2)).toEqual([0, 1]);
    expect(dateMarks(0)).toEqual([]);
  });
  it('the highest value and where it is; gaps are skipped', () => {
    expect(peakOf([3, null, 9, 9, 2])).toEqual({ i: 2, v: 9 });
    expect(peakOf([null, undefined])).toBeNull();
  });
});
