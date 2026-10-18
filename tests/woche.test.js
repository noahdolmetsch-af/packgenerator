// «Woche planen» WP1–WP4: the rules of the week (lib/woche.js). Fictional data only.
import { describe, it, expect } from 'vitest';
import { buildWeek, cleanItem, itemsOf, cleanAway, awayOf, applyAway, planMonday, skipFor, calEntries, dotsOf, freeDay, KINDS, takeSuggestion } from '../src/lib/woche.js';
import { easter, holidaysOf, holidayOn, lastSunday, seasonOf } from '../src/lib/woche/kalender.js';
import { PLACES, BAR_PLACES, pageOf, placeOf, PLACE_TABS, tabOf } from '../src/lib/nav.js';

const MON = '2026-10-19';
const base = { monday: MON, today: '2026-10-20', actName: (id) => `act ${id}` };

describe('planMonday', () => {
  it('plans this week on weekdays and the next one from Saturday on', () => {
    expect(planMonday('2026-10-20')).toBe(MON); // Tuesday
    expect(planMonday('2026-10-23')).toBe(MON); // Friday
    expect(planMonday('2026-10-24')).toBe('2026-10-26'); // Saturday
    expect(planMonday('2026-10-25')).toBe('2026-10-26'); // Sunday
  });
});

describe('items and holidays', () => {
  it('cleans own items: a date needs a day, a to-do may wait without one', () => {
    expect(cleanItem({ title: '  ' })).toBeNull();
    expect(cleanItem({ kind: 'todo', title: 'Order a tube' }).day).toBeNull();
    expect(itemsOf([{ kind: 'date', title: 'Dentist' }, { kind: 'date', title: 'Tennis', day: MON, time: '18:00' }])).toHaveLength(1);
  });
  it('a holiday defaults its follow-ups by type (Noah 4a: all suggested, all deselectable)', () => {
    const bike = cleanAway({ from: '2026-10-23', to: '2026-10-25', type: 'bike' });
    expect(bike).toMatchObject({ pause: true, service: true, pack: true, shift: false });
    const off = cleanAway({ from: '2026-10-23', type: 'off' });
    expect(off).toMatchObject({ to: '2026-10-23', service: false, pack: false });
    expect(cleanAway({ from: '2026-10-25', to: '2026-10-23' }).to).toBe('2026-10-25');
    expect(awayOf([{ from: 'x' }])).toEqual([]);
  });
  it('applyAway adds the packing to-do the day before and moves dated to-dos after the holidays', () => {
    const a = cleanAway({ id: 'a1', from: '2026-10-23', to: '2026-10-25', title: 'Jura weekend', shift: true });
    const items = [cleanItem({ id: 't1', kind: 'todo', title: 'Backup photos', day: '2026-10-24' }), cleanItem({ id: 'd1', kind: 'date', title: 'Dentist', day: '2026-10-24' })];
    const out = applyAway(a, items, (k, title) => k.replace('{title}', title)).items;
    expect(out.find((x) => x.id === 't1').day).toBe('2026-10-26');
    expect(out.find((x) => x.id === 'd1').day).toBe('2026-10-24'); // dates stay
    const pack = out.find((x) => x.ref === 'pack:a1');
    expect(pack).toMatchObject({ kind: 'todo', day: '2026-10-22', title: 'Prepare the packing list: Jura weekend' });
    expect(applyAway(a, out).items.filter((x) => x.ref === 'pack:a1')).toHaveLength(1); // not twice
  });
});

describe('buildWeek', () => {
  const away = awayOf([{ id: 'a1', from: '2026-10-23', to: '2026-10-25', title: 'Jura weekend', type: 'bike' }]);
  const sessions = [
    { id: 's1', day: '2026-10-20', kind: 'bike', name: 'Intervals', mins: 60 },
    { id: 's2', day: '2026-10-21', kind: 'bike', name: '', mins: 120 },
    { id: 's3', day: '2026-10-24', kind: 'bike', name: 'Long ride', mins: 180 },
  ];
  const items = itemsOf([
    { id: 'd1', kind: 'date', title: 'Dentist', day: '2026-10-21', time: '07:45' },
    { id: 't1', kind: 'todo', title: 'Order a tube', day: '2026-10-20' },
    { id: 't2', kind: 'todo', title: 'Backup photos' },
  ]);
  const care = [{ bikeId: 'b1', bikeName: 'Gravel', key: 'km:chain', part: 'chain', name: 'Measure the chain' }];
  const w = buildWeek({ ...base, items, away, sessions, care, acts: [{ day: '2026-10-20', kind: 'bike' }], fixed: [{ id: 'f1', actId: 'yoga', wd: 4, time: '07:00' }], cal: calEntries([{ id: 'g1', title: 'Team lunch', day: '2026-10-22', time: '12:00', src: 'google' }]), goalHours: 7 });

  it('puts every kind on its day, sorted by time', () => {
    const tue = w.days[1];
    expect(tue.today).toBe(true);
    expect(tue.entries.map((e) => e.id)).toEqual(['tr:s1', 't1']);
    expect(tue.entries[0].done).toBe(true); // a Strava ride on the day ticks the session
    expect(w.days[2].entries.map((e) => e.kind)).toEqual(['date', 'sport']); // 07:45 first
    expect(w.days[3].entries.map((e) => e.id)).toEqual(['fx:f1', 'cal:g1']); // Thursday: Aktiv's fixed date, the outside calendar
    expect(w.days[3].entries[1].sub.src).toBe('google');
  });
  it('holidays pause the training plan and show on their days', () => {
    expect(w.days[5].entries.map((e) => e.kind)).toEqual(['away']);
    expect(w.paused.map((p) => p.ref)).toEqual(['drop:s3']);
    expect(w.suggestions.find((s) => s.ref === 'drop:s3').act).toBe('drop');
    expect(w.sums).toMatchObject({ sessions: 3, mins: 180, goalMins: 420, dates: 2, todos: 1 });
    expect(w.sums.away).toEqual(['2026-10-23', '2026-10-24', '2026-10-25']);
  });
  it('suggests undated to-dos and bike care, the bike before the holidays', () => {
    const todo = w.suggestions.find((s) => s.ref === 'todo:t2');
    expect(todo.day >= '2026-10-20' && todo.day < '2026-10-23').toBe(true);
    const bike = w.suggestions.find((s) => s.ref === 'bike:b1:km:chain');
    expect(bike.day < '2026-10-23').toBe(true);
    expect(bike.sub).toMatchObject({ bike: 'Gravel', before: 'Jura weekend' });
  });
  it('a planned bike job is no suggestion any more; a skipped suggestion waits a week', () => {
    const planned = itemsOf([...items, { kind: 'bike', title: 'Measure the chain', day: '2026-10-21', bikeId: 'b1', part: 'km:chain' }]);
    expect(buildWeek({ ...base, items: planned, care }).suggestions.some((s) => s.kind === 'bike')).toBe(false);
    const no = skipFor([], 'todo:t2', MON);
    expect(buildWeek({ ...base, items, no }).suggestions.some((s) => s.ref === 'todo:t2')).toBe(false);
    expect(buildWeek({ ...base, monday: '2026-10-26', items, no }).suggestions.some((s) => s.ref === 'todo:t2')).toBe(true);
  });
  it('hidden kinds leave the days and the suggestions, the sums stay', () => {
    const h = buildWeek({ ...base, items, care, hide: ['todo', 'bike'] });
    expect(h.days.flatMap((d) => d.entries).some((e) => e.kind === 'todo')).toBe(false);
    expect(h.suggestions).toEqual([]);
    expect(h.sums.todos).toBe(1);
  });
  it('dots: one per kind of a day; freeDay skips holidays', () => {
    expect(dotsOf(w.days[2])).toEqual(['date', 'sport']);
    expect(freeDay(w.days, '2026-10-23', away)).toBeNull();
    expect(KINDS).toHaveLength(5);
  });
});

describe('the place «Woche» (Noah 1a)', () => {
  it('is a place next to Heute; the phone bar keeps five, without Material', () => {
    expect(PLACES.map((p) => p.key)).toEqual(['today', 'week', 'trips', 'gear', 'bikes', 'active']);
    expect(BAR_PLACES.map((p) => p.key)).toEqual(['today', 'week', 'trips', 'bikes', 'active']);
    expect(pageOf('#/week')).toBe('week');
    expect(pageOf('#/week/plan')).toBe('week');
    expect(placeOf('week')).toBe('week');
    expect(PLACE_TABS.week).toHaveLength(3);
    expect(tabOf('week', '#/week')).toBe('week');
    expect(tabOf('week', '#/week/plan')).toBe('plan');
    expect(tabOf('week', '#/week/away')).toBe('away');
  });
});

describe('content (Noah 18.10.2026 «1a 2a 3b 4a 5a»)', () => {
  it('knows the holidays of Zürich and the season hints of a week', () => {
    expect(easter(2026)).toBe('2026-04-05');
    expect(easter(2027)).toBe('2027-03-28');
    expect(holidaysOf(2026).map((h) => h.day)).toEqual(['2026-01-01', '2026-01-02', '2026-04-03', '2026-04-06', '2026-05-01', '2026-05-14', '2026-05-25', '2026-08-01', '2026-12-25', '2026-12-26']);
    expect(holidayOn('2026-05-14')).toBe('ascension');
    expect(holidayOn('2026-05-15')).toBeNull();
    expect(lastSunday(2026, 10)).toBe('2026-10-25');
    expect(seasonOf(MON).map((x) => x.key)).toEqual(['lights', 'winter']);
    expect(seasonOf('2026-07-06')).toEqual([]);
    const w = buildWeek({ ...base, monday: '2026-05-11', today: '2026-05-11' });
    expect(w.days[3].holiday).toBe('ascension');
  });
  it('a long ride on a rainy day is suggested for the driest free day (1a)', () => {
    const forecast = { days: [
      { date: '2026-10-21', max: 9, rain: 'rain', rainPct: 90 },
      { date: '2026-10-22', max: 12, rain: 'none', rainPct: 5 },
      { date: '2026-10-24', max: 15, rain: 'none', rainPct: 0 },
    ] };
    const sessions = [{ id: 'L', day: '2026-10-21', kind: 'bike', name: 'Long ride', mins: 180, zone: 2 }];
    const w = buildWeek({ ...base, sessions, forecast });
    expect(w.days[2].wx).toMatchObject({ wet: true });
    const s = w.suggestions.find((x) => x.ref === 'wx:L');
    expect(s).toMatchObject({ act: 'move', day: '2026-10-24', kind: 'sport' }); // Saturday beats Thursday
    expect(takeSuggestion(s, { sessions }).sessions[0].day).toBe('2026-10-24');
    expect(buildWeek({ ...base, sessions: [{ ...sessions[0], mins: 60 }], forecast }).suggestions.some((x) => x.act === 'move')).toBe(false);
  });
  it('hints on the load and last week in one line (2a, 3b)', () => {
    const sessions = [
      { id: 'a', day: '2026-10-20', kind: 'bike', mins: 60, zone: 4 },
      { id: 'b', day: '2026-10-21', kind: 'run', mins: 160, zone: 2 },
      { id: 'p', day: '2026-10-13', kind: 'bike', mins: 60 },
      { id: 'q', day: '2026-10-15', kind: 'bike', mins: 60 },
    ];
    const acts = [{ day: '2026-10-13', kind: 'bike', km: 31.6, movingS: 3600 }, { day: '2026-10-20', kind: 'bike', km: 40, movingS: 5400 }];
    const w = buildWeek({ ...base, sessions, acts });
    expect(w.review).toEqual({ planned: 2, done: 1, rides: 1, km: 32, mins: 60, todos: 0 });
    expect(w.hints.map((h) => h.key)).toEqual(['twoHard', 'jump']);
    expect(w.hints[0].day).toBe('2026-10-21');
    expect(buildWeek({ ...base, monday: '2026-07-06', today: '2026-07-06' }).review).toBeNull();
  });
  it('to-dos before a trip, each once (5a); season hints taken once a year', () => {
    const trips = [{ id: 'T', title: 'Jura', startDate: '2026-10-24', days: 2 }];
    const w = buildWeek({ ...base, trips });
    const tour = w.suggestions.filter((x) => x.ref.startsWith('tour:T:'));
    expect(tour.map((x) => [x.tour.what, x.day])).toEqual([['pack', '2026-10-23'], ['wx', '2026-10-23'], ['bike', '2026-10-22']]);
    const items = takeSuggestion(tour[0], { items: [] }, tour[0].day, 'Packing list: Jura').items;
    expect(items[0]).toMatchObject({ kind: 'todo', ref: 'tour:T:pack', day: '2026-10-23' });
    expect(buildWeek({ ...base, trips, items: itemsOf(items) }).suggestions.some((x) => x.ref === 'tour:T:pack')).toBe(false);
    const season = w.suggestions.find((x) => x.season === 'lights');
    const kept = itemsOf(takeSuggestion(season, { items: [] }, season.day, 'lights').items);
    expect(buildWeek({ ...base, items: kept }).suggestions.some((x) => x.season === 'lights')).toBe(false);
  });
});
