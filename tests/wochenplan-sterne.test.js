// «Wochenplan» Teil 5 (Noah 09.11.2026): the week star counts in Meilensteine (data milestones «Weeks with a star» and
// «Star weeks in a row»), never on Heute, and has German words. Fictional data only; days are calendar days.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { seedActs, addDays } from '../src/lib/flow.js';
import { msContext, dataMilestones, evaluate } from '../src/lib/flowms.js';
import { msExtra, planStars } from '../src/lib/flow/msdata.js';
import { logOf, setDone, weekFor } from '../src/lib/training/wochenlog.js';
import { planOf } from '../src/lib/training/wochenplan.js';

const stored = planOf(null);
const acts = seedActs();
const MONDAYS = ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-09'];
const TODAY = '2026-11-10';

function logWith(mondays) {
  let log = logOf(null);
  for (const m of mondays) {
    const { cfg, week } = weekFor(stored, m);
    for (const u of week.units) if (u.type !== 'med' && u.type !== 'stretch') log = setDone(log, m, u.id, true, addDays(m, 1), week.units, cfg.hours);
  }
  return log;
}
const ctxOf = (log) => msContext({ acts, log: [], today: TODAY, extra: msExtra({ weeklog: log }) });
const byId = (ctx, id) => dataMilestones(ctx).find((m) => m.id === id);

describe('week stars as milestones', () => {
  it('no star, no milestone: the two stay away until a week is complete', () => {
    expect(planStars(null)).toEqual({ planWeeks: null, planRuns: null });
    expect(planStars(logWith([]))).toEqual({ planWeeks: null, planRuns: null });
    const ctx = ctxOf(logOf(null));
    expect(byId(ctx, 'd.planWeeks')).toBeUndefined();
  });
  it('every complete week is one star day, the series counts weeks in a row', () => {
    const { planWeeks, planRuns } = planStars(logWith(MONDAYS));
    expect([...planWeeks.keys()].sort()).toEqual(MONDAYS.map((m) => addDays(m, 1)));
    expect(planRuns.get(addDays('2026-10-26', 1))).toBe(3);
    expect(planRuns.get(addDays('2026-11-09', 1))).toBe(1);
  });
  it('«Weeks with a star» counts the weeks, «Star weeks in a row» keeps the best series', () => {
    const ctx = ctxOf(logWith(MONDAYS));
    const weeks = evaluate(byId(ctx, 'd.planWeeks'), ctx);
    expect(weeks.value).toBe(4);
    expect(weeks.reached.map((r) => r.star)).toEqual([1, 2]); // steps 1 and 4
  });
  it('the best series stays after a gap and the first star of a series comes at two weeks', () => {
    const ctx = ctxOf(logWith(MONDAYS));
    const runs = evaluate(byId(ctx, 'd.planRuns'), ctx);
    expect(runs.value).toBe(3);
    expect(runs.reached.map((r) => r.star)).toEqual([1]);
    expect(runs.next).toBe(2);
  });
  it('they are data milestones: never on Heute, in the area «Everyday», with German words', () => {
    const ctx = ctxOf(logWith(MONDAYS));
    for (const id of ['d.planWeeks', 'd.planRuns']) {
      const m = byId(ctx, id);
      expect(m.group).toBe('data');
      expect(m.area).toBe('daily');
      expect(DE[m.name], m.name).toBeTruthy();
      expect(DE[m.what], m.what).toBeTruthy();
      expect([...m.steps].sort((a, b) => a - b)).toEqual(m.steps);
    }
  });
});
