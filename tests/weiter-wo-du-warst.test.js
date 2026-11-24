import { describe, it, expect } from 'vitest';
import { begun, recent, putAway, awayValue, lineKey, WEITER_DAYS } from '../src/lib/home/weiter.js';

const today = '2026-11-24';
const now = Date.parse('2026-11-24T10:00:00Z');
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();
const trip = (id, extra = {}) => ({ id, title: `Tour ${id}`, entries: [{ id: 'a', packed: false }], createdAt: hoursAgo(5), updatedAt: hoursAgo(5), ...extra });

describe('Weiter, wo du warst', () => {
  it('counts a change of the last 3 days, not older, not from the far future', () => {
    expect(WEITER_DAYS).toBe(3);
    expect(recent(hoursAgo(71), now)).toBe(true);
    expect(recent(hoursAgo(73), now)).toBe(false);
    expect(recent(null, now)).toBe(false);
    expect(recent(new Date(now + 5 * 3600 * 1000).toISOString(), now)).toBe(false);
  });

  it('lists a trip without a date, newest first', () => {
    const rows = begun({ trips: [trip('a', { updatedAt: hoursAgo(30) }), trip('b', { updatedAt: hoursAgo(2) })], today, now });
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
    expect(rows[0].href).toMatch(/^#\//);
  });

  it('leaves out a trip with a date (the old «Weitermachen» covers it), the lead trip, and old ones', () => {
    const rows = begun({
      trips: [trip('dated', { startDate: '2026-12-05', days: 2 }), trip('lead'), trip('old', { updatedAt: hoursAgo(100) }), trip('x')],
      today,
      leadId: 'lead',
      now,
    });
    expect(rows.map((r) => r.id)).toEqual(['x']);
  });

  it('lists a debrief that was started, but not one that was not touched', () => {
    const over = (id, extra = {}) => trip(id, { startDate: '2026-11-20', days: 1, ...extra });
    const rows = begun({
      trips: [over('d1'), over('d2')],
      debriefs: [{ tripId: 'd1', status: 'draft', updatedAt: hoursAgo(3) }],
      today,
      now,
    });
    expect(rows.map((r) => [r.id, r.key, r.step])).toEqual([['d1', 'debrief', 'debrief']]);
  });

  it('puts the line away for one day and one thing only', () => {
    const lead = { id: 'l', updatedAt: 'u1' };
    const key = lineKey({ lead });
    expect(putAway(awayValue(today, key), today, key)).toBe(true);
    expect(putAway(awayValue('2026-11-23', key), today, key)).toBe(false);
    expect(putAway(awayValue(today, key), today, lineKey({ lead: { ...lead, updatedAt: 'u2' } }))).toBe(false);
    expect(putAway(null, today, key)).toBe(false);
    expect(lineKey({ ride: { startAt: 5 }, lead })).toBe('ride:5');
    expect(lineKey({})).toBe('');
  });
});
