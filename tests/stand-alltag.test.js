import { describe, it, expect } from 'vitest';
import { alltagStand, shopOpen, nextDeadlineDays, lastDays, runningOf } from '../src/lib/stand/alltag.js';
import { startOutdoor, addMin } from '../src/lib/outdoor.js';

const walk = (day, min) => ({ id: `${day}-${min}`, day, type: 'Walk', movingS: min * 60 });
const rec = () => startOutdoor({ today: '2026-11-22', until: '2026-12-31' });
const TODAY = '2026-11-25';

describe('Stand in Zahlen: Alltag', () => {
  it('counts only the open points of the shopping list', () => {
    expect(shopOpen(null)).toBe(0);
    expect(shopOpen({ items: [] })).toBe(0);
    expect(shopOpen({ items: [{ done: false }, { done: true }, { done: false }, null] })).toBe(2);
  });

  it('gives the days to the next last day to cancel and skips stopped, past and undated contracts', () => {
    const c = (end, extra = {}) => ({ id: end, name: 'x', end, renew: 0, notice: 1, stopped: false, ...extra });
    expect(nextDeadlineDays([], TODAY)).toBeNull();
    // end 2026-12-31 with one month notice: last day 2026-11-30, 5 days ahead
    expect(nextDeadlineDays([c('2026-12-31')], TODAY)).toBe(5);
    // the nearest one wins; a stopped one and one without an end do not count
    expect(nextDeadlineDays([c('2027-03-31'), c('2026-12-31'), c('2026-12-30', { stopped: true }), { id: 'a', name: 'y', renew: 12, notice: 1 }], TODAY)).toBe(5);
    // a last day already gone (end ahead, notice period passed) does not count
    expect(nextDeadlineDays([c('2026-12-10')], TODAY)).toBeNull();
    // today itself is 0 days
    expect(nextDeadlineDays([c('2026-12-25')], TODAY)).toBe(0);
  });

  it('knows a running challenge and its days in a row', () => {
    expect(runningOf(null, [], TODAY)).toBeNull();
    expect(runningOf({ ...rec(), stopped: true }, [], TODAY)).toBeNull();
    expect(runningOf({ ...rec(), closed: true }, [], TODAY)).toBeNull();
    expect(runningOf(startOutdoor({ today: '2027-01-01', until: '2027-02-01' }), [], TODAY)).toBeNull(); // not begun
    expect(runningOf(startOutdoor({ today: '2026-10-01', until: '2026-11-01' }), [], TODAY)).toBeNull(); // over
    const acts = [walk('2026-11-22', 95), walk('2026-11-23', 100), walk('2026-11-24', 90), walk('2026-11-25', 20)];
    const s = alltagStand({ rec: rec(), activities: acts, today: TODAY });
    expect(s.running).toBe(true);
    expect(s.streak).toBe(3); // today is still open, the three days before count
    expect(s.doneToday).toBe(false);
    const done = alltagStand({ rec: addMin(rec(), TODAY, 90), activities: acts.slice(0, 3), today: TODAY });
    expect(done.streak).toBe(4);
    expect(done.doneToday).toBe(true);
  });

  it('lists the last 14 days, never before the first day of the challenge', () => {
    const acts = [walk('2026-11-24', 45)];
    const d = lastDays(rec(), acts, TODAY);
    expect(d.map((x) => x.day)).toEqual(['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']);
    expect(d[2]).toEqual({ day: '2026-11-24', min: 45, done: false });
    const long = lastDays(startOutdoor({ today: '2026-10-01', until: '2026-12-31' }), [], TODAY);
    expect(long).toHaveLength(14);
    expect(long[13].day).toBe(TODAY);
    expect(long[0].day).toBe('2026-11-12');
    expect(lastDays(null, [], TODAY)).toEqual([]);
  });

  it('is calm without data: zeros and no chart days', () => {
    const s = alltagStand({ today: TODAY });
    expect(s).toEqual({ running: false, streak: 0, doneToday: false, days: [], shop: 0, deadline: null });
  });

  it('keeps the three numbers together', () => {
    const s = alltagStand({ rec: rec(), activities: [walk('2026-11-24', 100)], shop: { items: [{ done: false }, { done: false }, { done: true }] }, contracts: [{ id: 'a', name: 'x', end: '2026-12-31', renew: 0, notice: 1 }], today: TODAY });
    expect([s.streak, s.shop, s.deadline]).toEqual([1, 2, 5]);
  });
});
