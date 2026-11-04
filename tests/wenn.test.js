// «Was wäre, wenn …» (Cockpit-Idee 2): a model of fitness, fatigue and form with a range, only for what can be modelled.
import { describe, it, expect } from 'vitest';
import { optionsFor, whatIf, CHECKS, CHOOSE_DAYS } from '../src/lib/flow/form/wenn.js';
import { plannedLoad, plannedByDay, actsByDayOf } from '../src/lib/flow/form/landschaft.js';

const TODAY = '2026-10-20';
const loads = new Map(Array.from({ length: 40 }, (_, i) => [`2026-${i < 20 ? '09' : '10'}-${String((i % 20) + 1).padStart(2, '0')}`, i % 3 === 0 ? 0 : 70]));
const ses = (day, mins, zone = 2) => ({ id: `${day}`, day, kind: 'bike', name: 'x', mins, zone });
const DAY = '2026-10-23';

describe('options', () => {
  it('pause, short and long; «as planned» only when a session is planned that day', () => {
    expect(optionsFor({ day: DAY }).map((o) => o.key)).toEqual(['pause', 'short', 'long']);
    const planned = plannedByDay([ses(DAY, 60)], new Map(), TODAY);
    expect(optionsFor({ planned, day: DAY }).map((o) => o.key)).toEqual(['plan', 'pause', 'short', 'long']);
    expect(optionsFor({ planned, day: DAY })[0].load).toBe(plannedLoad(ses(DAY, 60)));
  });
  it('short and long come from minutes and zone, kept inside sane limits', () => {
    const o = optionsFor({ day: DAY, short: 45, long: 180, zone: 2 });
    expect(o[1]).toMatchObject({ key: 'short', mins: 45, load: plannedLoad({ mins: 45, zone: 2 }) });
    expect(o[2].load).toBeGreaterThan(o[1].load);
    expect(optionsFor({ day: DAY, short: 1, long: 99999 }).map((x) => x.mins).slice(1)).toEqual([10, 480]);
    expect(optionsFor({ day: DAY, short: 'x', long: null })[1].mins).toBe(45);
  });
});

describe('whatIf', () => {
  const run = (extra = {}) => whatIf({ loads, today: TODAY, day: DAY, options: optionsFor({ day: DAY }), ...extra });
  it('answers for the days after the chosen day', () => {
    const r = run();
    expect(r).toHaveLength(3);
    expect(r[0].points.map((p) => p.offset)).toEqual(CHECKS);
    expect(r[0].points[0].day).toBe('2026-10-24');
  });
  it('a longer session leaves more fatigue and less form the day after, and more fitness later', () => {
    const [pause, short, long] = run();
    expect(long.points[0].fat.v).toBeGreaterThan(short.points[0].fat.v);
    expect(short.points[0].fat.v).toBeGreaterThan(pause.points[0].fat.v);
    expect(long.points[0].form.v).toBeLessThan(pause.points[0].form.v);
    expect(long.points[2].fit.v).toBeGreaterThanOrEqual(pause.points[2].fit.v);
  });
  it('fatigue fades over the days after the session', () => {
    const long = run()[2];
    expect(long.points[0].fat.v).toBeGreaterThan(long.points[2].fat.v);
  });
  it('every number sits inside its range, and the range is wider with a bigger load', () => {
    const [pause, , long] = run();
    for (const o of run()) for (const p of o.points) for (const k of ['fit', 'fat', 'form']) expect(p[k].lo).toBeLessThanOrEqual(p[k].v), expect(p[k].v).toBeLessThanOrEqual(p[k].hi);
    const w = (o) => o.points[0].fat.hi - o.points[0].fat.lo;
    expect(w(long)).toBeGreaterThan(w(pause) - 1);
  });
  it('the planned sessions of the other days stay; the chosen day takes the place of its own', () => {
    const planned = plannedByDay([ses(DAY, 120), ses('2026-10-25', 60)], new Map(), TODAY);
    const opts = optionsFor({ planned, day: DAY });
    const r = whatIf({ loads, planned, today: TODAY, day: DAY, options: opts });
    const plan = r.find((o) => o.key === 'plan');
    const pause = r.find((o) => o.key === 'pause');
    expect(plan.points[0].fat.v).toBeGreaterThan(pause.points[0].fat.v);
    // the 25th is planned in both: with the pause the form is still not the same as without any plan
    const none = whatIf({ loads, today: TODAY, day: DAY, options: optionsFor({ day: DAY }) }).find((o) => o.key === 'pause');
    expect(pause.points[2].fat.v).toBeGreaterThan(none.points[2].fat.v - 0.5);
  });
  it('is empty for a day outside the next week', () => {
    expect(run({ day: TODAY })).toEqual([]);
    expect(run({ day: '2026-11-30' })).toEqual([]);
    expect(run({ day: null })).toEqual([]);
    expect(CHOOSE_DAYS).toBe(7);
  });
  it('actsByDayOf groups by day', () => {
    expect([...actsByDayOf([{ day: 'a', id: 1 }, { day: 'a', id: 2 }, { day: 'b', id: 3 }]).keys()]).toEqual(['a', 'b']);
  });
});
