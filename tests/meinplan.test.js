import { describe, it, expect } from 'vitest';
import { meinPlan, weekRows, sumOf, WEEKS_BACK, WEEKS_AHEAD } from '../src/lib/training/meinplan.js';
import { planOf as weekplanOf } from '../src/lib/training/wochenplan.js';
import { weekFor, setDone, logOf } from '../src/lib/training/wochenlog.js';

// Mon 09.11.2026 is in winter; Wednesday is 11.11. Fictional data only.
const MON = '2026-11-09';
const WED = '2026-11-11';
const stored = weekplanOf(null);
const { cfg, week } = weekFor(stored, MON);
const main = week.units.filter((u) => !['med', 'stretch', 'rest'].includes(u.type));
const planned = main.reduce((a, u) => a + u.mins, 0);

describe('meinplan: nothing to show', () => {
  it('has no plan without a weekly plan and without sessions', () => {
    const m = meinPlan({ today: WED });
    expect(m.hasPlan).toBe(false);
    expect(m.goal).toBeNull();
    expect(m.week.rows).toEqual([]);
    expect(m.soFar).toBeNull();
    expect(m.weeks).toHaveLength(WEEKS_BACK + 1 + WEEKS_AHEAD);
  });
});

describe('meinplan: the week', () => {
  it('lists the units of the weekly plan with their ticks', () => {
    const first = main[0];
    const log = setDone(logOf(null), MON, first.id, true, WED, week.units, cfg.hours);
    const m = meinPlan({ stored, rawLog: log, today: WED });
    expect(m.hasPlan).toBe(true);
    expect(m.sources).toEqual({ weekplan: true, sessions: false });
    const row = m.week.rows.find((r) => r.id === first.id);
    expect(row.done).toBe(true);
    expect(row.doneMins).toBe(first.mins);
    expect(m.week.plannedMins).toBe(planned);
    expect(m.week.doneMins).toBe(first.mins);
    expect(m.week.doneUnits).toBe(1);
    expect(m.week.units).toBe(main.length);
    expect(m.week.pct).toBe(Math.round((first.mins / planned) * 100));
  });

  it('does not count the small habits, the rest block or units let go', () => {
    const rows = [
      { type: 'tennis', mins: 60, doneMins: 60, done: true, released: false },
      { type: 'med', mins: 30, doneMins: 30, done: true, released: false },
      { type: 'rest', mins: 180, doneMins: 0, done: false, released: false },
      { type: 'gym', mins: 50, doneMins: 0, done: false, released: true },
    ];
    expect(sumOf(rows)).toEqual({ plannedMins: 60, doneMins: 60, units: 1, doneUnits: 1, pct: 100 });
    expect(sumOf([]).pct).toBeNull();
  });

  it('«so far» counts only the plan up to today', () => {
    const early = main.filter((u) => u.d <= 2);
    const log = early.reduce((l, u) => setDone(l, MON, u.id, true, WED, week.units, cfg.hours), logOf(null));
    const m = meinPlan({ stored, rawLog: log, today: WED });
    expect(m.soFar).toBe(100);
  });

  it('adds the sessions of the week suggestion, ticked by an activity or by hand', () => {
    const rawPlan = { sessions: [
      { id: 's1', day: '2026-11-10', kind: 'bike', name: 'Easy ride', mins: 90, zone: 2 },
      { id: 's2', day: '2026-11-12', kind: 'run', name: 'Run', mins: 40, zone: 2, done: true },
      { id: 's3', day: '2026-11-13', kind: 'bike', name: 'Late', mins: 60, zone: 2 },
    ] };
    const acts = [{ id: 'a1', day: '2026-11-10', kind: 'bike', movingS: 80 * 60 }];
    const rows = weekRows({ stored: null, log: logOf(null), sessions: rawPlan.sessions, acts }, MON, WED);
    expect(rows.map((r) => [r.d, r.done, r.doneMins])).toEqual([[1, true, 80], [3, true, 40], [4, false, 0]]);
    const m = meinPlan({ rawPlan, acts, today: WED });
    expect(m.sources).toEqual({ weekplan: false, sessions: true });
    expect(m.week.plannedMins).toBe(190);
    expect(m.week.doneMins).toBe(120);
  });
});

describe('meinplan: the weeks', () => {
  it('a past week is read from its frozen snapshot, whatever the plan says today', () => {
    const lastMon = '2026-11-02';
    const w = weekFor(stored, lastMon).week;
    let log = logOf(null);
    log = setDone(log, lastMon, w.units[0].id, true, '2026-11-03', w.units, 10);
    const m = meinPlan({ stored, rawLog: log, today: WED });
    const prev = m.weeks.find((x) => x.monday === lastMon);
    expect(prev.future).toBe(false);
    expect(prev.plannedMins).toBeGreaterThan(0);
    // the plan changes later: the past week stays
    const other = { ...stored, winter: { ...stored.winter, hours: 20 } };
    const m2 = meinPlan({ stored: other, rawLog: log, today: WED });
    expect(m2.weeks.find((x) => x.monday === lastMon).plannedMins).toBe(prev.plannedMins);
  });

  it('shows 4 weeks back, this week and 3 ahead, oldest first, with the calendar week', () => {
    const m = meinPlan({ stored, today: WED });
    expect(m.weeks.map((x) => x.monday)).toEqual(['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
    expect(m.weeks[4].current).toBe(true);
    expect(m.weeks[5].future).toBe(true);
    expect(m.weeks[4].kw).toBe(46);
    expect(m.kw).toBe(46);
    // weeks before the first visit have no snapshot: they are not «last weeks with a plan»
    expect(m.last.every((x) => x.plannedMins > 0 && !x.current && !x.future)).toBe(true);
  });
});

describe('meinplan: the goal', () => {
  it('counts the weeks to the goal day and says when it has passed', () => {
    const m = meinPlan({ stored, rawGoal: { name: 'Alps crossing', until: '2027-01-04' }, today: WED });
    expect(m.goal).toEqual({ name: 'Alps crossing', until: '2027-01-04', weeks: 8, passed: false });
    const old = meinPlan({ stored, rawGoal: { name: 'Old', until: '2026-10-01' }, today: WED });
    expect(old.goal.passed).toBe(true);
    expect(old.goal.weeks).toBe(0);
    expect(meinPlan({ stored, rawGoal: { hours: 6 }, today: WED }).goal).toBeNull();
  });
});
