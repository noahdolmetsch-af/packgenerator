import { describe, it, expect } from 'vitest';
import { MAX_SUGG_DAY, weekdayOf, weekOf, normFixed, fixedList, togglePlan, hideSugg, prunePlans, wxOf, weekPlan, weekGoals, weekEvents, nextOn } from '../src/lib/flowweek.js';
import { normAct, flowStates } from '../src/lib/flow.js';
import { icsCalendar } from '../src/lib/flowmed.js';

// fictional activities; Tuesday 13 Oct 2026 is «today»
const TODAY = '2026-10-13';
const acts = [
  normAct({
    id: 'bike',
    name: 'Bike',
    icon: 'bike',
    ring: 'move',
    goals: [{ id: 'g', count: 3, days: 7 }],
    order: 0,
  }),
  normAct({
    id: 'yoga',
    name: 'Yoga',
    icon: 'yoga',
    ring: 'move',
    goals: [{ id: 'g', count: 1, days: 7 }],
    order: 1,
  }),
  normAct({
    id: 'med',
    name: 'Meditation',
    icon: 'lotus',
    ring: 'mind',
    goals: [{ id: 'g', count: 1, days: 1 }],
    order: 2,
  }),
  normAct({
    id: 'gym',
    name: 'Gym',
    icon: 'gym',
    ring: 'move',
    goals: [{ id: 'g', count: 1, days: 7 }],
    order: 3,
  }),
];
const log = [{ id: 'l1', actId: 'bike', day: '2026-10-12', n: 1, min: 35 }];
const fc = (days) => ({
  days: days.map(([date, max, rain, rainPct = 0]) => ({
    date,
    max,
    rain,
    rainPct,
  })),
});

describe('the week (AK1)', () => {
  it('runs Monday to Sunday', () => {
    expect(weekdayOf('2026-10-12')).toBe(1);
    expect(weekdayOf('2026-10-18')).toBe(7);
    expect(weekOf(TODAY)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    expect(weekOf('2026-10-18')[0]).toBe('2026-10-12');
    expect(nextOn(TODAY, 4)).toBe('2026-10-15');
    expect(nextOn(TODAY, 2)).toBe(TODAY);
  });

  it('keeps fixed dates whole and sorted', () => {
    expect(normFixed({})).toBeNull();
    expect(normFixed({ actId: 'yoga', wd: 9, time: 'x', minutes: 1 })).toMatchObject({ wd: 7, time: '18:00', minutes: 5 });
    expect(fixedList([{ actId: 'a', wd: 4, time: '07:00' }, { actId: 'b', wd: 2, time: '18:00' }, null]).map((f) => f.actId)).toEqual(['b', 'a']);
    expect(fixedList('nope')).toEqual([]);
  });

  it('plans and unplans a tapped suggestion, hides one, and drops old ones', () => {
    const one = togglePlan([], '2026-10-14', 'bike', TODAY);
    expect(one).toEqual([{ day: '2026-10-14', actId: 'bike' }]);
    expect(togglePlan(one, '2026-10-14', 'bike', TODAY)).toEqual([]);
    expect(hideSugg(['2026-10-14|gym'], '2026-10-14', 'gym', TODAY)).toEqual(['2026-10-14|gym']);
    expect(
      prunePlans(
        [
          { day: '2026-09-01', actId: 'x' },
          { day: TODAY, actId: 'y' },
        ],
        TODAY,
      ),
    ).toEqual([{ day: TODAY, actId: 'y' }]);
  });

  it('reads the weather of a day', () => {
    const f = fc([
      [TODAY, 14, 'none'],
      ['2026-10-14', 9, 'rain', 80],
      ['2026-10-15', 10, 'showers', 40],
    ]);
    expect(wxOf(f, TODAY)).toMatchObject({ dry: true, wet: false });
    expect(wxOf(f, '2026-10-14')).toMatchObject({ dry: false, wet: true });
    // v0.144.0 RE: 40 % is over the one rain limit (30 %), so the showers day counts as wet now
    expect(wxOf(f, '2026-10-15')).toMatchObject({ dry: false, wet: true });
    expect(wxOf(null, TODAY)).toBeNull();
  });

  it('shows done, fixed and planned days and suggests the rest by weather', () => {
    const states = flowStates(acts, log, TODAY);
    const forecast = fc([
      [TODAY, 14, 'none'],
      ['2026-10-14', 9, 'rain', 80],
      ['2026-10-15', 10, 'showers'],
      ['2026-10-16', 13, 'none'],
      ['2026-10-17', 20, 'none'],
      ['2026-10-18', 11, 'showers'],
    ]);
    const w = weekPlan({
      acts,
      states,
      log,
      today: TODAY,
      fixed: fixedList([{ actId: 'yoga', wd: 4, time: '07:00' }]),
      plans: [{ day: '2026-10-16', actId: 'bike' }],
      forecast,
    });
    const at = (day) => w.days.find((d) => d.day === day).items;
    expect(at('2026-10-12')).toEqual([{ kind: 'done', actId: 'bike', n: 1, min: 35 }]);
    expect(w.days[0].past).toBe(true);
    // yoga is fixed on Thursday, so no yoga suggestion
    expect(at('2026-10-15')).toContainEqual({
      kind: 'fix',
      actId: 'yoga',
      time: '07:00',
      id: expect.any(String),
    });
    expect(w.days.flatMap((d) => d.items).filter((x) => x.actId === 'yoga' && x.kind === 'sug')).toEqual([]);
    expect(at('2026-10-16')).toContainEqual({ kind: 'plan', actId: 'bike' });
    // bike needs 3, has 1 done and 1 planned: one more, on the warmest dry day
    const bikeSugg = w.days.flatMap((d) => d.items.filter((x) => x.kind === 'sug' && x.actId === 'bike').map(() => d.day));
    expect(bikeSugg).toEqual(['2026-10-17']);
    // the gym likes the rainy Wednesday, meditation is daily and suggested today
    expect(at('2026-10-14')).toContainEqual({
      kind: 'sug',
      actId: 'gym',
      why: 'rain',
    });
    expect(at(TODAY)).toContainEqual({
      kind: 'sug',
      actId: 'med',
      why: 'daily',
    });
    expect(w.tip).toEqual({ day: '2026-10-17', actId: 'bike' });
  });

  it('does not suggest what was hidden, and gives no tip without a forecast', () => {
    const states = flowStates(acts, log, TODAY);
    const w = weekPlan({
      acts,
      states,
      log,
      today: TODAY,
      no: [`${TODAY}|med`],
    });
    expect(w.days[1].items.some((x) => x.actId === 'med')).toBe(false);
    expect(w.tip).toBeNull();
    // without weather the suggestions spread over the days, the earliest free ones first
    const sugg = (day) =>
      w.days
        .find((d) => d.day === day)
        .items.filter((x) => x.kind === 'sug')
        .map((x) => x.actId);
    expect([TODAY, '2026-10-14', '2026-10-15', '2026-10-16'].map(sugg)).toEqual([['bike'], ['bike'], ['yoga'], ['gym']]);
  });

  it('suggests at most two things a day', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      normAct({
        id: `a${i}`,
        name: `A${i}`,
        icon: 'gym',
        goals: [{ id: 'g', count: 2, days: 7 }],
        order: i,
      }),
    );
    const w = weekPlan({
      acts: many,
      states: flowStates(many, [], TODAY),
      log: [],
      today: TODAY,
    });
    for (const d of w.days) expect(d.items.filter((x) => x.kind === 'sug').length).toBeLessThanOrEqual(MAX_SUGG_DAY);
  });

  it('a fixed date of a resting activity does not show', () => {
    const hockey = normAct({
      id: 'hockey',
      name: 'Hockey',
      icon: 'hockey',
      goals: [],
      season: {
        summer: [4, 5, 6, 7, 8, 9, 10],
        winter: [{ id: 'g', count: 1, days: 7 }],
      },
    });
    const w = weekPlan({
      acts: [hockey],
      states: [],
      log: [],
      today: TODAY,
      fixed: fixedList([{ actId: 'hockey', wd: 6, time: '08:00' }]),
    });
    expect(w.days.flatMap((d) => d.items)).toEqual([]);
    const nov = weekPlan({
      acts: [hockey],
      states: [],
      log: [],
      today: '2026-11-03',
      fixed: fixedList([{ actId: 'hockey', wd: 6, time: '08:00' }]),
    });
    expect(nov.days.flatMap((d) => d.items)).toEqual([{ kind: 'fix', actId: 'hockey', time: '08:00', id: expect.any(String) }]);
  });

  it('counts the goals of the week', () => {
    const g = weekGoals(flowStates(acts, log, TODAY));
    expect(g.map((x) => [x.act.id, x.n, x.of, x.met])).toEqual([
      ['bike', 1, 3, false],
      ['yoga', 0, 1, false],
      ['med', 0, 7, false],
      ['gym', 0, 1, false],
    ]);
  });

  it('writes the fixed dates weekly and the planned ones as all-day events', () => {
    const ev = weekEvents({
      fixed: fixedList([{ actId: 'yoga', wd: 4, time: '07:00', minutes: 75 }]),
      plans: [
        { day: '2026-10-16', actId: 'bike' },
        { day: '2026-10-01', actId: 'bike' },
      ],
      today: TODAY,
      name: (id) => id.toUpperCase(),
    });
    expect(ev).toHaveLength(2);
    const ics = icsCalendar(ev, Date.parse('2026-10-13T06:00:00Z'));
    expect(ics).toContain('DTSTART;TZID=Europe/Zurich:20261015T070000');
    expect(ics).toContain('DTEND;TZID=Europe/Zurich:20261015T081500');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH');
    expect(ics).toContain('SUMMARY:YOGA');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261016');
    expect(ics).toContain('DTEND;VALUE=DATE:20261017');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
