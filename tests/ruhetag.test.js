// «Ruhetag-Hinweis» (Noah 05.11.2026, Aktiv 4a): after three hard days in a row one gentle line. Fictional data only.
import { describe, it, expect } from 'vitest';
import { hardFrom, ruhetagHint, HARD_STREAK, HARD_MIN, HARD_FIRST, MIN_DAYS } from '../src/lib/ruhetag.js';
import { loadRuhetag } from '../src/lib/ruhetag-data.js';
import { addDays } from '../src/lib/flow.js';

const TODAY = '2026-11-05';
const d = (n) => addDays(TODAY, n);
/** A history: `n` ordinary days of 40–80 load before the last 10 days, so the person's own norm exists. */
const history = (n = 20) => new Map(Array.from({ length: n }, (_, i) => [d(-12 - i), 40 + ((i * 7) % 41)]));
const withLoads = (extra, base = history()) => new Map([...base, ...Object.entries(extra)]);

describe('hardFrom', () => {
  it('without enough active days there is no own norm: only the high first limit counts', () => {
    expect(hardFrom(new Map([[d(-3), 100]]), TODAY)).toEqual({ hard: HARD_FIRST, own: false });
    expect(MIN_DAYS).toBeGreaterThan(1);
  });
  it('with enough days the upper quarter of the person is hard, never below the minimum', () => {
    const h = hardFrom(history(), TODAY);
    expect(h.own).toBe(true);
    expect(h.hard).toBeGreaterThanOrEqual(HARD_MIN);
    expect(h.hard).toBeGreaterThan(60);
    const calm = new Map(Array.from({ length: 20 }, (_, i) => [d(-1 - i), 20]));
    expect(hardFrom(calm, TODAY).hard).toBe(HARD_MIN);
  });
  it('days older than six weeks and today itself do not count', () => {
    const old = new Map(Array.from({ length: 20 }, (_, i) => [d(-60 - i), 500]));
    old.set(TODAY, 900);
    expect(hardFrom(old, TODAY).own).toBe(false);
  });
});

describe('ruhetagHint', () => {
  it('three hard days up to yesterday: the hint, for today', () => {
    const loads = withLoads({ [d(-3)]: 120, [d(-2)]: 130, [d(-1)]: 125 });
    expect(ruhetagHint({ loads, today: TODAY })).toMatchObject({ n: 3, todayHard: false, days: [d(-1), d(-2), d(-3)] });
  });
  it('today is the third hard day: the hint says tomorrow', () => {
    const loads = withLoads({ [d(-2)]: 120, [d(-1)]: 130, [TODAY]: 125 });
    expect(ruhetagHint({ loads, today: TODAY })).toMatchObject({ n: 3, todayHard: true });
  });
  it('two hard days, or a gap, is no streak', () => {
    expect(ruhetagHint({ loads: withLoads({ [d(-2)]: 120, [d(-1)]: 130 }), today: TODAY })).toBeNull();
    expect(ruhetagHint({ loads: withLoads({ [d(-4)]: 120, [d(-3)]: 125, [d(-1)]: 130 }), today: TODAY })).toBeNull();
    expect(HARD_STREAK).toBe(3);
  });
  it('an easy day in between ends the streak', () => {
    expect(ruhetagHint({ loads: withLoads({ [d(-4)]: 120, [d(-3)]: 125, [d(-2)]: 30, [d(-1)]: 130 }), today: TODAY })).toBeNull();
  });
  it('an easy ride today means the person is already taking it easy: no hint', () => {
    expect(ruhetagHint({ loads: withLoads({ [d(-3)]: 120, [d(-2)]: 130, [d(-1)]: 125, [TODAY]: 25 }), today: TODAY })).toBeNull();
  });
  it('«Not today» hides it for that day only', () => {
    const loads = withLoads({ [d(-3)]: 120, [d(-2)]: 130, [d(-1)]: 125 });
    expect(ruhetagHint({ loads, today: TODAY, hiddenOn: TODAY })).toBeNull();
    expect(ruhetagHint({ loads, today: TODAY, hiddenOn: d(-1) })).not.toBeNull();
  });
  it('a longer streak is counted', () => {
    const loads = withLoads({ [d(-4)]: 120, [d(-3)]: 120, [d(-2)]: 130, [d(-1)]: 125 });
    expect(ruhetagHint({ loads, today: TODAY }).n).toBe(4);
  });
  it('no activities at all: nothing', () => {
    expect(ruhetagHint({ today: TODAY })).toBeNull();
  });
});

describe('loadRuhetag (from the database)', () => {
  const act = (day, effort) => ({ id: `a${day}`, day, kind: 'bike', effort, movingS: 3600 });
  const fake = (rows, no = null) => ({
    activities: { where: () => ({ aboveOrEqual: (from) => ({ toArray: async () => rows.filter((r) => r.day >= from) }) }) },
    settings: { get: async (k) => (k === 'flow.ruhetagNo' && no ? { key: k, value: no } : undefined) },
  });
  const rows = [...Array.from({ length: 20 }, (_, i) => act(d(-12 - i), 40 + ((i * 7) % 41))), act(d(-3), 120), act(d(-2), 130), act(d(-1), 125)];
  it('reads the activities, counts their effort and gives the hint', async () => {
    expect(await loadRuhetag(TODAY, fake(rows))).toMatchObject({ n: 3, todayHard: false });
  });
  it('is hidden after «Not today»', async () => {
    expect(await loadRuhetag(TODAY, fake(rows, TODAY))).toBeNull();
  });
  it('without activities there is nothing (and no error)', async () => {
    expect(await loadRuhetag(TODAY, fake([]))).toBeNull();
    expect(await loadRuhetag(TODAY, {})).toBeNull();
  });
});
