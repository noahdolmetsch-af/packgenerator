// «Recovery Day» (Noah 22.11.2026 «Recovery Day ja»): a free day of TrainingPeaks has no duration, so it is no session.
// The feed reader keeps it as a day in the plan record (`rest`), the weekly plan puts no free unit on it. Made-up data only.
import { describe, it, expect } from 'vitest';
import { sessionsFrom, prefsOf, REST_RE, importIcs, TP_KEY } from '../src/lib/trainingpeaks.js';
import { PLAN_KEY, restOf, plannerSessions, planValue, planOf as sessionsOf } from '../src/lib/training.js';
import { planOf, planWeek, restWeek, tpWeek } from '../src/lib/training/wochenplan.js';
import { weekFor } from '../src/lib/training/wochenlog.js';
import { meinPlan } from '../src/lib/training/meinplan.js';

const ics = (events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flatMap((e) => ['BEGIN:VEVENT', ...e, 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');
const TODAY = '2026-12-07';
const MON = '2026-12-07';
const day = (d) => `2026-12-${String(7 + d).padStart(2, '0')}`;
const dateOf = (d) => day(d).replaceAll('-', '');
const FEED = ics([
  ['UID:a@test', 'SUMMARY:Recovery Day', `DTSTART;VALUE=DATE:${dateOf(1)}`],
  ['UID:b@test', 'SUMMARY:Ruhetag', `DTSTART;VALUE=DATE:${dateOf(4)}`],
  ['UID:c@test', 'SUMMARY:Swim', `DTSTART;VALUE=DATE:${dateOf(2)}`, 'DESCRIPTION:Technique'], // no duration, no free day: left out
  ['UID:d@test', 'SUMMARY:Bike - Endurance', `DTSTART;VALUE=DATE:${dateOf(3)}`, 'DESCRIPTION:Planned duration: 1:30'],
]);
const cfgOf = (hours) => planOf({ winter: { hours } }).winter;
const memDb = (rows = {}) => {
  const m = new Map(Object.entries(rows).map(([k, v]) => [k, { key: k, value: v }]));
  return { settings: { get: async (k) => m.get(k), put: async (r) => void m.set(r.key, r) }, peek: (k) => m.get(k)?.value };
};

describe('the feed: a free day is no session', () => {
  it('a free day without a duration is kept as a day, not counted as left out', () => {
    const f = sessionsFrom(FEED, TODAY);
    expect(f.rest).toEqual([day(1), day(4)]);
    expect(f.sessions.map((s) => s.name)).toEqual(['Bike - Endurance']);
    expect(f.skipped).toBe(1); // only the swim entry
  });
  it('the words, in German and English, and nothing else', () => {
    for (const w of ['Recovery Day', 'Rest day', 'Ruhetag', 'Erholungstag', 'Day off', 'Recovery Day - easy walk']) expect(REST_RE.test(w), w).toBe(true);
    for (const w of ['Recovery ride', 'Bike', 'Rest', 'Restday work', 'Interval Day']) expect(REST_RE.test(w), w).toBe(false);
  });
  it('a free day with a duration stays a session', () => {
    const f = sessionsFrom(ics([['UID:x@test', 'SUMMARY:Recovery Day', 'DTSTART:20261208T080000Z', 'DTEND:20261208T090000Z']]), TODAY);
    expect(f.rest).toEqual([]);
    expect(f.sessions.length).toBe(1);
  });
  it('the plan record keeps the days, the record counts them, the same feed gives the same record', async () => {
    const db = memDb();
    const r = await importIcs(db, FEED, { now: Date.parse('2026-12-07T10:00:00Z'), today: TODAY });
    expect(r.rest).toBe(2);
    expect(db.peek(PLAN_KEY).rest).toEqual([day(1), day(4)]);
    expect(prefsOf(db.peek(TP_KEY)).rest).toBe(2);
    expect(sessionsOf(db.peek(PLAN_KEY)).length).toBe(1);
  });
  it('a feed without free days leaves no `rest` in the record', async () => {
    const db = memDb({ [PLAN_KEY]: { sessions: [], rest: [day(2)] } });
    await importIcs(db, ics([['UID:d@test', 'SUMMARY:Bike', `DTSTART;VALUE=DATE:${dateOf(3)}`, 'DESCRIPTION:Planned duration: 1:00']]), { now: Date.parse('2026-12-07T10:00:00Z'), today: TODAY });
    expect(db.peek(PLAN_KEY).rest).toBeUndefined();
  });
});

describe('the plan record: days stay, nothing leaks into the lists', () => {
  it('restOf cleans, plannerSessions adds entries, planOf does not', () => {
    const v = { sessions: [], rest: [day(4), 'nonsense', day(1), day(1)] };
    expect(restOf(v)).toEqual([day(1), day(4)]);
    expect(plannerSessions(v).map((s) => [s.day, s.rest])).toEqual([[day(1), true], [day(4), true]]);
    expect(sessionsOf(v)).toEqual([]);
    expect(restOf(null)).toEqual([]);
    expect(restOf({ rest: 'x' })).toEqual([]);
  });
  it('a writer of the sessions keeps the days', () => {
    const v = { sessions: [], rest: [day(1)] };
    expect(planValue(v, [{ id: 'a' }])).toEqual({ sessions: [{ id: 'a' }], rest: [day(1)] });
    expect(planValue({ sessions: [] }, [])).toEqual({ sessions: [] });
    expect(planValue(null, [])).toEqual({ sessions: [] });
  });
});

describe('the weekly plan: nothing free on a free day', () => {
  const base = planWeek(cfgOf(15), { monday: MON });
  const freeUnits = (w, d) => w.units.filter((u) => u.d === d && !u.fixed && u.type !== 'med' && u.type !== 'stretch');
  const busy = [0, 1, 2, 3, 4, 5, 6].find((d) => freeUnits(base, d).length > 0);

  it('the test week has a day with free units to take away', () => {
    expect(busy).toBeDefined();
  });
  it('restWeek: the weekdays of the free days in this week only', () => {
    const ss = [{ rest: true, day: day(1) }, { rest: true, day: day(5) }, { rest: true, day: '2026-12-20' }, { rest: true, day: 'x' }, { day: day(2) }];
    expect(restWeek(ss, MON)).toEqual([1, 5]);
    expect(restWeek(undefined, MON)).toEqual([]);
  });
  it('no free unit lands on the free day, and the planner says so', () => {
    const w = planWeek(cfgOf(15), { monday: MON, sessions: [{ id: 'rest-x', rest: true, day: day(busy), src: 'tp', kind: 'other', mins: 0 }] });
    expect(freeUnits(w, busy)).toEqual([]);
    expect(w.notes.filter((n) => n.key === 'tp-rest')).toEqual([{ key: 'tp-rest', d: busy }]);
    expect(w.tp).toEqual([]); // a free day is no TrainingPeaks session: no hours
  });
  it('what stands fixed stays on the free day', () => {
    const fixedDays = base.units.filter((u) => u.fixed).map((u) => u.d);
    if (!fixedDays.length) return;
    const d = fixedDays[0];
    const w = planWeek(cfgOf(15), { monday: MON, sessions: [{ id: 'rest-x', rest: true, day: day(d), src: 'tp', kind: 'other', mins: 0 }] });
    expect(w.units.filter((u) => u.d === d && u.fixed).length).toBe(base.units.filter((u) => u.d === d && u.fixed).length);
  });
  it('without a free day the week is as it was (also with plain sessions)', () => {
    expect(JSON.stringify(planWeek(cfgOf(15), { monday: MON, sessions: [{ id: 'k', day: day(2), kind: 'bike', mins: 60, src: 'other' }] }))).toBe(JSON.stringify(base));
    expect(tpWeek([{ rest: true, day: day(1), src: 'tp', mins: 0 }], MON)).toEqual([]);
  });
  it('weekFor passes the free days on', () => {
    const { week } = weekFor(null, MON, {}, {}, plannerSessions({ sessions: [], rest: [day(busy)] }));
    expect(freeUnits(week, busy)).toEqual([]);
  });
});

describe('Mein Trainingsplan: a free day makes no row and no plan', () => {
  it('only free days: no sessions source, no rows from them', () => {
    const m = meinPlan({ stored: null, rawPlan: { sessions: [], rest: [day(1)] }, acts: [], today: TODAY });
    expect(m.sources.sessions).toBe(false);
    expect(m.week.rows.length).toBe(0);
    expect(m.hasPlan).toBe(false);
  });
});
