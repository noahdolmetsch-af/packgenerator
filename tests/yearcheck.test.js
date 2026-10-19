// Paket Q #137: once a year «Stimmt das noch?».
import { describe, it, expect } from 'vitest';
import { startYear, yearDue, yearValues } from '../src/lib/clear/yearcheck.js';

describe('Stimmt das noch?', () => {
  const now = new Date('2026-10-19T08:00:00Z');
  it('the year starts with the first start', () => {
    expect(startYear(null, now).at).toBe(now.toISOString());
    expect(startYear({ at: '2025-01-01T00:00:00Z' }, now)).toBeNull();
  });
  it('is due a year after the last check, unless snoozed', () => {
    expect(yearDue({ at: '2026-01-01T00:00:00Z' }, now)).toBe(false);
    expect(yearDue({ at: '2025-10-18T00:00:00Z' }, now)).toBe(true);
    expect(yearDue({ at: '2025-10-18T00:00:00Z', until: '2026-10-19T09:00:00Z' }, now)).toBe(false);
    expect(yearDue(null, now)).toBe(false);
  });
  it('asks only about values that exist; papers that run out soon', () => {
    const v = yearValues({ riderG: 72400, home: { name: 'Testdorf' }, docs: [{ id: 'd1', title: 'Testausweis', until: '2026-12' }, { id: 'd2', title: 'Später', until: '2028-01' }] }, '2026-10-19');
    expect(v.map((x) => x.key)).toEqual(['rider', 'home', 'doc-d1']);
    expect(v[0].vars.kg).toBe(72.4);
  });
});
