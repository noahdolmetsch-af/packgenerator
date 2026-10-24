// «Meilensteine als Belohnung» (Noah 22.10.2026 «1a 2a 3a 4a 5a»): the same base counters for every sport
// (every tick counts 1), challenges per sport that become a star, and the star check right after a tick.
// Fictional data only; days are calendar days (addDays), never «now + n × 24 h».
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { seedActs, normAct, addDays } from '../src/lib/flow.js';
import { msContext, actMilestones, allMilestones, challengeMilestones, evaluate, weekTarget } from '../src/lib/flowms.js';
import { presetsFor, newActChallenge, challengesOf, actCount, challengesFor, actArea, CHALLENGES_KEY } from '../src/lib/challenge.js';
import { createDb } from '../src/lib/db.js';
import { starsAfterTick } from '../src/lib/flow/starcheck.js';
import DE from '../src/lib/i18n/de/index.js';

const T = '2026-10-09'; // a Friday
const acts = seedActs();
const yoga = normAct({ id: 'yoga', name: 'Yoga', goals: [{ id: 'g', count: 2, days: 7 }] });
let k = 0;
const e = (actId, day, extra = {}) => ({ id: `m${++k}`, actId, day, at: `${day}T10:00:00.000Z`, n: 1, ...extra });
const find = (list, id) => list.find((r) => r.id === id);

describe('base counters per sport (2a)', () => {
  it('every sport, also an own new one, gets times done, weeks in a row, times this year and hours', () => {
    const own = normAct({ id: 'own-climb', name: 'Klettern' });
    for (const a of [yoga, own]) {
      const ids = actMilestones(a, T).map((m) => m.id);
      expect(ids).toEqual(expect.arrayContaining([`${a.id}.sessions`, `${a.id}.weeks`, `${a.id}.year.2026`, `${a.id}.hours`]));
    }
  });
  it('keeps the old ids, so stars reached before stay (sessions, tennis hours, push-ups, commute)', () => {
    const tennis = acts.find((a) => a.id === 'tennis');
    expect(actMilestones(tennis, T).map((m) => m.id)).toEqual(expect.arrayContaining(['tennis.sessions', 'tennis.hours']));
    const push = acts.find((a) => a.id === 'pushups');
    if (push) expect(actMilestones(push, T).map((m) => m.id)).toContain('pushups.total');
  });
  it('meditation keeps its own set', () => {
    const med = acts.find((a) => a.id === 'meditation');
    expect(actMilestones(med, T).map((m) => m.id)).toContain('meditation.devoted');
    expect(actMilestones(med, T).map((m) => m.id)).not.toContain('meditation.weeks');
  });
  it('every tick counts 1, also two on the same day (1a)', () => {
    const log = [e('yoga', T), e('yoga', T), e('yoga', addDays(T, -1))];
    const ctx = msContext({ acts: [yoga], log, today: T });
    const r = evaluate(actMilestones(yoga, T).find((m) => m.id === 'yoga.sessions'), ctx);
    expect(r.value).toBe(3);
  });
  it('weeks in a row follow the goal (2 days a week)', () => {
    expect(weekTarget(yoga)).toBe(2);
    // three weeks with Monday and Wednesday ticked (2026-09-21, 28, 10-05 are Mondays)
    const log = ['2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30', '2026-10-05', '2026-10-07'].map((d) => e('yoga', d));
    const ctx = msContext({ acts: [yoga], log, today: T });
    const r = evaluate(actMilestones(yoga, T).find((m) => m.id === 'yoga.weeks'), ctx);
    expect(r.value).toBe(3);
  });
  it('this year counts from 1 January only; the key stays the same over the years', () => {
    const log = [e('yoga', '2025-12-30'), e('yoga', '2026-01-02'), e('yoga', T)];
    const ctx = msContext({ acts: [yoga], log, today: T });
    const m = actMilestones(yoga, T).find((x) => x.key === 'yoga.year');
    expect(evaluate(m, ctx).value).toBe(2);
    expect(actMilestones(yoga, '2027-01-03').find((x) => x.key === 'yoga.year').id).toBe('yoga.year.2027');
  });
  it('hours show only once a tick has minutes', () => {
    const without = allMilestones(msContext({ acts: [yoga], log: [e('yoga', T)], today: T }));
    expect(find(without, 'yoga.hours')).toBeUndefined();
    const withMin = allMilestones(msContext({ acts: [yoga], log: [e('yoga', T, { min: 90 })], today: T }));
    expect(find(withMin, 'yoga.hours').value).toBe(1.5);
  });
  it('every counter says what counts, in German (5a)', () => {
    for (const m of actMilestones(yoga, T)) {
      expect(DE[m.name], m.name).toBeTruthy();
      expect(DE[m.counts], m.counts).toBeTruthy();
    }
    expect(DE['counts: {what}']).toBe('zählt: {what}');
  });
});

describe('challenges per sport (3a)', () => {
  it('three ready ones: this month, 6 weeks, the year, with counts from the goal', () => {
    const p = presetsFor(yoga, T);
    expect(p.map((x) => x.key)).toEqual(['month', 'weeks6', 'year']);
    expect(p[0].until).toBe('2026-10-31');
    expect(p[1].until).toBe(addDays(T, 41));
    expect(p[2].until).toBe('2026-12-31');
    expect(p[1].times).toBe(12); // 2 a week × 6
    for (const x of p) expect(x.times).toBeGreaterThan(0);
  });
  it('a challenge counts the ticks of its sport inside its days; reached, it is one star', () => {
    const c = newActChallenge({ act: yoga, times: 3, until: '2026-10-31', today: '2026-10-01', id: 'c1' });
    expect(c.area).toBe(actArea('yoga'));
    const kept = challengesOf([c]);
    expect(kept[0].actId).toBe('yoga');
    const log = [e('yoga', '2026-09-30'), e('yoga', '2026-10-02'), e('yoga', '2026-10-05'), e('run', '2026-10-06')];
    expect(actCount(kept[0], log)).toBe(2);
    const ctx = msContext({ acts: [yoga, normAct({ id: 'run', name: 'Run' })], log: [...log, e('yoga', T)], today: T, challenges: kept });
    const r = evaluate(challengeMilestones(ctx)[0], ctx);
    expect(r.id).toBe('ch.c1');
    expect(r.reached.map((s) => s.star)).toEqual([1]);
    expect(r.reached[0].day).toBe(T);
  });
  it('a stopped challenge that was not reached drops out; a reached one stays', () => {
    const open = { ...newActChallenge({ act: yoga, times: 5, until: '2026-10-31', today: '2026-10-01', id: 'c2' }), stopped: true };
    const won = { ...newActChallenge({ act: yoga, times: 1, until: '2026-10-31', today: '2026-10-01', id: 'c3' }), stopped: true };
    const ctx = msContext({ acts: [yoga], log: [e('yoga', '2026-10-03')], today: T, challenges: challengesOf([open, won]) });
    expect(challengeMilestones(ctx).map((m) => m.id)).toEqual(['ch.c3']);
    expect(challengesFor(challengesOf([open, won]), 'yoga').length).toBe(0);
    expect(challengesFor(challengesOf([open, won]), 'yoga', { stopped: true }).length).toBe(2);
  });
});

describe('the star right after a tick (4a)', () => {
  it('keeps the new star and returns it once; a second check finds nothing new', async () => {
    const db = createDb(`ms-belohnung-${Date.now()}`);
    await db.open();
    await db.flowActs.put(yoga);
    await db.flowLog.bulkPut([1, 2, 3, 4].map((i) => e('yoga', addDays(T, -i))));
    await db.flowLog.put(e('yoga', T)); // the 5th tick: star 1 of «Mal gemacht»
    const first = await starsAfterTick(db, yoga, T);
    expect(first.fresh.map((s) => s.id)).toContain('yoga.sessions:1');
    expect(await db.flowStars.get('yoga.sessions:1')).toBeTruthy();
    const again = await starsAfterTick(db, yoga, T);
    expect(again.fresh).toEqual([]);
    db.close();
  });
  it('a challenge reached by the tick is a star too', async () => {
    const db = createDb(`ms-belohnung-ch-${Date.now()}`);
    await db.open();
    await db.flowActs.put(yoga);
    await db.settings.put({ key: CHALLENGES_KEY, value: [newActChallenge({ act: yoga, times: 2, until: '2026-10-31', today: '2026-10-01', id: 'c9' })] });
    await db.flowLog.bulkPut([e('yoga', '2026-10-05'), e('yoga', T)]);
    const { fresh } = await starsAfterTick(db, yoga, T);
    expect(fresh.map((s) => s.id)).toContain('ch.c9:1');
    db.close();
  });
});
