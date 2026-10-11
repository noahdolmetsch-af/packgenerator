// v0.94.0 «Kachel-Wand» (Noah 4a, idea 6): one series over everything, with rest weeks (series.js).
// Dates are calendar days; 2026-10-05 and 2026-10-12 are Mondays.
import { describe, it, expect } from 'vitest';
import { activeDays, seriesOf, restOf, toggleRest, SERIES_STEPS, WEEKS_SHOWN } from '../src/lib/home/series.js';
import { milestoneLevels, milestoneStep, milestoneText } from '../src/lib/home/heute.js';

const TODAY = '2026-10-09'; // Friday

describe('active days', () => {
  it('collects Im Flow days, rides and the days of trips that happened, never the future', () => {
    const d = activeDays({
      log: [{ day: '2026-10-01' }, { day: '2026-10-20' }, { day: null }],
      rides: [{ date: '2026-09-20T07:00:00Z' }],
      trips: [{ id: 't', startDate: '2026-09-12', days: 2, status: 'done' }],
      debriefs: [{ tripId: 't' }],
      today: TODAY,
    });
    expect(d.has('2026-10-01')).toBe(true);
    expect(d.has('2026-10-20')).toBe(false);
    expect(d.has('2026-09-20')).toBe(true);
    expect(d.has('2026-09-13')).toBe(true);
  });
});

describe('the series', () => {
  const days = new Set(['2026-09-22', '2026-09-29', '2026-10-01']); // weeks of 21.9 and 28.9
  it('the running week does not break it until it is over', () => {
    const s = seriesOf(days, [], TODAY);
    expect(s.n).toBe(2);
    expect(s.active).toBe(false);
    expect(s.next).toBe(4);
    expect(s.left).toBe(2);
    expect(s.weeks).toHaveLength(WEEKS_SHOWN);
    expect(s.weeks.at(-1)).toMatchObject({ week: '2026-10-05', now: true, on: false });
  });
  it('a gap week breaks it; a rest week bridges it without counting', () => {
    const gap = new Set(['2026-09-15', '2026-09-29']);
    expect(seriesOf(gap, [], TODAY).n).toBe(1);
    const s = seriesOf(gap, ['2026-09-21'], TODAY);
    expect(s.n).toBe(2);
    expect(s.record).toBe(2);
  });
  it('a rest week this week keeps it and shows', () => {
    const s = seriesOf(days, ['2026-10-05'], TODAY);
    expect(s.n).toBe(2);
    expect(s.rest).toBe(true);
  });
  it('the record stays when the series broke', () => {
    const old = new Set(['2026-08-03', '2026-08-10', '2026-08-17', '2026-10-06']);
    const s = seriesOf(old, [], TODAY);
    expect(s.n).toBe(1);
    expect(s.record).toBe(3);
  });
  it('after the last step there is no next one', () => {
    const many = new Set();
    for (let i = 0; i < 110; i++) many.add(new Date(Date.parse('2026-10-05T00:00:00Z') - i * 7 * 864e5).toISOString().slice(0, 10));
    const s = seriesOf(many, [], TODAY);
    expect(s.n).toBe(110);
    expect(s.next).toBe(null);
    expect(SERIES_STEPS.at(-1)).toBe(104);
  });
  it('rest weeks are Mondays; toggling adds and removes this week', () => {
    expect(restOf(['2026-10-05', '2026-10-06', 'x', 3])).toEqual(['2026-10-05']);
    expect(restOf(null)).toEqual([]);
    expect(toggleRest([], TODAY)).toEqual(['2026-10-05']);
    expect(toggleRest(['2026-10-05'], TODAY)).toEqual([]);
  });
});

describe('the series as a milestone', () => {
  it('is celebrated when it grows, not the first time it is counted', () => {
    const base = { tripsDone: 0, bikes: [], nights: 0 };
    const s0 = milestoneStep(null, milestoneLevels({ ...base, series: 2 }), '2026-10-01');
    expect(s0.state.levels.series).toBe(2);
    expect(s0.state.events).toEqual([]);
    const s1 = milestoneStep(s0.state, milestoneLevels({ ...base, series: 2 }), '2026-10-05');
    expect(s1.state.events).toEqual([]);
    const s2 = milestoneStep(s1.state, milestoneLevels({ ...base, series: 4 }), '2026-10-09');
    expect(s2.state.events).toEqual([{ key: 'series', n: 4, day: '2026-10-09' }]);
    expect(milestoneText(s2.state.events[0])).toContain('4');
  });
});
