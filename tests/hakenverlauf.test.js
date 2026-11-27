// «Haken-Verlauf» (Noah 27.11.2026 «3a»): the rules behind the grid on Auswerten › Woche (src/lib/flow/hakenverlauf.js).
import { describe, it, expect } from 'vitest';
import { SPANS, WEEK_FROM, spanOf, daysOf, columnsOf, rowsOf, daysWithTick, shadeOf } from '../src/lib/flow/hakenverlauf.js';

const TODAY = '2026-11-24'; // a Tuesday
const acts = [
  { id: 'gym', name: 'Gym', ring: 'move', order: 1, goals: [] },
  { id: 'meditation', name: 'Meditation', ring: 'mind', order: 2, goals: [] },
  { id: 'sauna', name: 'Sauna', ring: 'rest', order: 3, goals: [] },
  { id: 'yoga', name: 'Yoga', ring: 'move', order: 4, goals: [] },
  { id: 'old', name: 'Old', ring: 'move', order: 5, goals: [], paused: true },
];
const e = (actId, day, i = 0) => ({ id: `${actId}-${day}-${i}`, actId, day, n: 1 });

describe('Haken-Verlauf', () => {
  it('knows its four spans and falls back to 10 days', () => {
    expect(SPANS).toEqual([10, 30, 90, 365]);
    expect(spanOf('30')).toBe(30);
    expect(spanOf('7')).toBe(10);
    expect(spanOf(null)).toBe(10);
  });

  it('lists the days oldest first and ends today', () => {
    const d = daysOf(TODAY, 10);
    expect(d).toHaveLength(10);
    expect(d[0]).toBe('2026-11-15');
    expect(d[9]).toBe(TODAY);
  });

  it('has one column per day up to 31 days and one per week from 32 days on', () => {
    expect(columnsOf(TODAY, 10)).toHaveLength(10);
    expect(columnsOf(TODAY, 30)).toHaveLength(30);
    const w = columnsOf(TODAY, 90);
    expect(WEEK_FROM).toBe(32);
    expect(w.every((c) => c.week)).toBe(true);
    expect(w.reduce((s, c) => s + c.days.length, 0)).toBe(90);
    expect(w.at(-1).today).toBe(true);
    // weeks start on Monday: 23 Nov 2026 is the Monday of the last week
    expect(w.at(-1).from).toBe('2026-11-23');
    expect(w.at(-1).days).toEqual(['2026-11-23', '2026-11-24']);
    expect(columnsOf(TODAY, 365).reduce((s, c) => s + c.days.length, 0)).toBe(365);
  });

  it('marks the weekend and today in the day columns', () => {
    const c = columnsOf(TODAY, 10);
    expect(c.filter((x) => x.weekend).map((x) => x.key)).toEqual(['2026-11-15', '2026-11-21', '2026-11-22']);
    expect(c.filter((x) => x.today).map((x) => x.key)).toEqual([TODAY]);
  });

  it('groups the rows by ring, most days first, and keeps the quiet ones apart', () => {
    const log = [e('gym', '2026-11-16'), e('gym', '2026-11-18'), e('gym', '2026-11-18', 1), e('yoga', '2026-11-20'), e('yoga', '2026-11-21'), e('yoga', TODAY), e('sauna', TODAY), e('meditation', '2026-11-01')];
    const r = rowsOf({ acts, log, today: TODAY, n: 10 });
    expect(r.groups.map((g) => g.ring)).toEqual(['move', 'rest']);
    expect(r.groups[0].rows.map((x) => [x.act.id, x.n])).toEqual([['yoga', 3], ['gym', 2]]); // two ticks on one day are one day
    expect(r.quiet.map((a) => a.id)).toEqual(['meditation']); // its tick is older than 10 days; paused ones never show
    expect(r.groups[0].rows[1].cells).toEqual([0, 1, 0, 1, 0, 0, 0, 0, 0, 0]);
    expect(daysWithTick(r.groups)).toBe(5);
  });

  it('counts the days of a week in a week column', () => {
    const log = [e('gym', '2026-11-23'), e('gym', '2026-11-24'), e('gym', '2026-11-16')];
    const r = rowsOf({ acts, log, today: TODAY, n: 90 });
    const gym = r.groups[0].rows[0];
    expect(gym.cells.at(-1)).toBe(2);
    expect(gym.cells.at(-2)).toBe(1);
    expect(gym.n).toBe(3);
  });

  it('counts a bike trip day for an activity that counts trips', () => {
    const bike = { id: 'bike', name: 'Cycling outdoors', ring: 'move', order: 6, goals: [], counts: ['trip'] };
    const r = rowsOf({ acts: [bike], log: [], tripDayList: ['2026-11-20', '2026-11-21'], today: TODAY, n: 10 });
    expect(r.groups[0].rows[0].n).toBe(2);
  });

  it('shades a week from a faint to a full tone', () => {
    expect(shadeOf(0)).toBe(0);
    expect(shadeOf(1)).toBeGreaterThan(0.3);
    expect(shadeOf(7)).toBe(1);
  });
});
