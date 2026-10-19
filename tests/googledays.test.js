// Google Health → day rows (api/_lib/googledays.js). Fictional values only.
import { describe, it, expect } from 'vitest';
import { daysFrom, sleepOf, spanDays, nextDay, listFilter } from '../api/_lib/googledays.js';

const d = (day, month = 10) => ({ year: 2026, month, day });
const night = (end, asleep, meta = {}) => ({ sleep: { metadata: meta, interval: { civilEndTime: { date: end, time: { hours: 7, minutes: 0 } } }, summary: { minutesAsleep: String(asleep) } } });

describe('googledays', () => {
  it('counts days and crosses month ends', () => {
    expect(spanDays('2026-10-01', '2026-10-01')).toBe(1);
    expect(spanDays('2026-09-30', '2026-10-02')).toBe(3);
    expect(spanDays('2026-10-02', '2026-10-01')).toBeNull();
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
    expect(listFilter('sleep', '2026-10-01', '2026-10-02')).toBe('sleep.interval.civil_end_time >= "2026-10-01" AND sleep.interval.civil_end_time < "2026-10-03"');
  });

  it('the main sleep counts to the wake-up day; naps never count', () => {
    const rows = daysFrom({ sleep: [night(d(5), 500, { nap: true }), night(d(5), 300), night(d(5), 200, { mainSleep: true })] }, '2026-10-01', '2026-10-31');
    expect(rows).toHaveLength(1);
    expect(rows[0].sleep.asleepMin).toBe(200);
  });

  it('leaves out what Google did not send and days outside the range', () => {
    const rows = daysFrom({ rhr: [{ dailyRestingHeartRate: { date: d(2), beatsPerMinute: '49' } }, { dailyRestingHeartRate: { date: d(9) } }], steps: [{ civilStartTime: { date: d(30, 9) }, steps: { countSum: '10' } }] }, '2026-10-01', '2026-10-05');
    expect(rows).toEqual([{ date: '2026-10-02', restingHr: 49 }]);
    expect(sleepOf({ summary: {} })).toBeNull();
  });
});
