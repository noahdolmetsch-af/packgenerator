// Windows on Heute (Noah 19.10.2026 «1a 3a»): the evening before a trip and Sunday's Wochenrückblick.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { hourLater, mayShow, later, notToday, done, eveBefore, weekDue, windowNow, EVE_FROM, WEEK_FROM } from '../src/lib/home/windows.js';

const trip = (over = {}) => ({ id: 'test_data_gtp_t1', title: 'test_data_gtp_ Runde', startDate: '2026-10-10', endDate: '2026-10-11', entries: [{ itemId: 'a', packed: true }, { itemId: 'b', packed: false }], ...over });

describe('windows on Heute', () => {
  it('«Später» is one hour later, over midnight and month ends too', () => {
    expect(hourLater('2026-10-09T17:05')).toBe('2026-10-09T18:05');
    expect(hourLater('2026-10-31T23:30')).toBe('2026-11-01T00:30');
  });

  it('«Später» waits one hour, «Heute nicht» and the main button until tomorrow', () => {
    const now = '2026-10-09T18:00';
    expect(mayShow({}, 'eve', now)).toBe(true);
    const l = later({}, 'eve', now);
    expect(mayShow(l, 'eve', '2026-10-09T18:59')).toBe(false);
    expect(mayShow(l, 'eve', '2026-10-09T19:00')).toBe(true);
    expect(mayShow(l, 'week', now)).toBe(true); // only its own window
    const n = notToday({}, 'eve', now);
    expect(mayShow(n, 'eve', '2026-10-09T23:59')).toBe(false);
    expect(mayShow(n, 'eve', '2026-10-10T18:00')).toBe(true);
    expect(mayShow(done({}, 'week', now), 'week', '2026-10-09T21:00')).toBe(false);
  });

  it('the evening before a trip: from 17:00, while not everything is packed', () => {
    expect(EVE_FROM).toBe('17:00');
    expect(eveBefore([trip()], '2026-10-09T16:59')).toBe(null);
    expect(eveBefore([trip()], '2026-10-09T17:00')?.trip.id).toBe('test_data_gtp_t1');
    expect(eveBefore([trip()], '2026-10-09T17:00').packed).toMatchObject({ packed: 1, of: 2 });
    expect(eveBefore([trip({ entries: [] })], '2026-10-09T18:00').packed).toBe(null); // no list yet: still asks
    expect(eveBefore([trip({ entries: [{ itemId: 'a', packed: true }] })], '2026-10-09T18:00')).toBe(null); // all packed
    expect(eveBefore([trip({ startDate: '2026-10-11' })], '2026-10-09T18:00')).toBe(null); // not tomorrow
    expect(eveBefore([trip({ skipped: true })], '2026-10-09T18:00')).toBe(null);
  });

  it('the Wochenrückblick: Sunday from 18:00', () => {
    expect(WEEK_FROM).toBe('18:00');
    expect(weekDue('2026-10-11T17:59')).toBe(false); // a Sunday
    expect(weekDue('2026-10-11T18:00')).toBe(true);
    expect(weekDue('2026-10-10T20:00')).toBe(false); // a Saturday
  });

  it('one window at a time, the trip first', () => {
    // Saturday 10.10. evening: a trip on Sunday 11.10.
    const t2 = trip({ startDate: '2026-10-12' });
    expect(windowNow({ rec: {}, now: '2026-10-11T19:00', trips: [t2] }).id).toBe('eve');
    expect(windowNow({ rec: notToday({}, 'eve', '2026-10-11T19:00'), now: '2026-10-11T19:00', trips: [t2] }).id).toBe('week');
    expect(windowNow({ rec: {}, now: '2026-10-11T12:00', trips: [t2] })).toBe(null);
  });
});
