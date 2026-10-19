// Paket P «Was mir gut tut»: good days, combinations, comfort range, recipes, surprises, the wished
// mix and the short versions. Fictional data only; days are calendar days counted with addDays.
import { describe, it, expect } from 'vitest';
import { dayData, lifts, helps, drains, combos, comfort, recipe, goodRecipes, surprises, wishOf, wishGap, wishArcs, SHORT, MINUTES, shortOf, rideNumbers, FACTS, scoredDays } from '../src/lib/wohl.js';
import { CATS } from '../src/lib/balance.js';
import { lastDays, addDays } from '../src/lib/flow.js';

const T = '2026-10-15';
const days = lastDays(T, 30);
const row = (day, qid, value, kind = 'scale') => ({ id: `${day}-${qid}`, day, qid, value, kind, area: qid.split('.')[0], src: 'hand' });

/** 30 days: every second day outside and with friends (score 8), the others not (score 5). */
function sample() {
  const rows = [];
  days.forEach((d, i) => {
    const on = i % 2 === 0;
    rows.push(row(d, 'erreicht.zufrieden', on ? 8 : 5));
    rows.push(row(d, 'natur.draussen', on ? 'm90' : 'm0', 'chips'));
    rows.push(row(d, 'freunde.zeit', on ? 'much' : i % 4 === 1 ? 'short' : 'no', 'chips'));
    rows.push(row(d, 'koerper.bildschirm', on ? 2 : 6, 'number'));
  });
  return rows;
}

describe('dayData', () => {
  it('without any data every day is empty: nothing is invented', () => {
    const data = dayData({ days });
    expect(data).toHaveLength(30);
    expect(scoredDays(data)).toBe(0);
    expect(data.every((d) => FACTS.every((f) => d.facts[f.key] === null))).toBe(true);
  });
  it('reads the day score, the facts and a ride from the ledger', () => {
    const km = [{ date: T, km: 42.4, hm: 610, hrAvg: 131, kind: 'ride' }, { date: T, km: 1000, kind: 'start' }];
    const data = dayData({ rows: [row(T, 'spass.stimmung', 9), row(T, 'natur.draussen', 'm0', 'chips')], km, days: [T] });
    expect(data[0].score).toBe(9);
    expect(data[0].facts.ride).toBe(true);
    expect(data[0].facts.outside).toBe(true); // the ride says it was outside
    expect(data[0].values).toMatchObject({ km: 42, hm: 610, hrAvg: 131 });
  });
  it('takes sleep from Fitbit when it was not answered by hand', () => {
    const data = dayData({ health: [{ date: T, sleep: { asleepMin: 450 } }], days: [T] });
    expect(data[0].values.sleepH).toBe(7.5);
    expect(data[0].facts.sleep).toBe(true);
  });
});

describe('what helps and what drains', () => {
  const data = dayData({ rows: sample(), days });
  it('a fact with a better day score helps, with both groups counted', () => {
    const h = helps(data);
    expect(h[0]).toMatchObject({ key: 'outside', with: 8, without: 5, nWith: 15, nWithout: 15 });
  });
  it('a long screen day shows as an energy drain', () => {
    expect(drains(data).map((d) => d.key)).toContain('screen');
  });
  it('needs at least 5 days in each group', () => {
    expect(lifts(data.slice(0, 6))).toEqual([]);
  });
});

describe('good combinations', () => {
  it('two facts that are better together than alone', () => {
    const rows = [];
    days.forEach((d, i) => {
      const a = i % 2 === 0;
      const b = i % 3 === 0;
      rows.push(row(d, 'erreicht.zufrieden', a && b ? 9 : a || b ? 6 : 5));
      rows.push(row(d, 'natur.draussen', a ? 'm90' : 'm0', 'chips'));
      rows.push(row(d, 'achtsamkeit.moment', b ? 'yes' : 'no', 'yesno'));
    });
    const c = combos(dayData({ rows, days }));
    expect(c[0].keys).toEqual(['outside', 'moment']);
    expect(c[0].both).toBe(9);
    expect(c[0].nBoth).toBe(5);
  });
  it('nothing without enough days with both', () => {
    expect(combos(dayData({ rows: sample().filter((r) => r.day >= addDays(T, -4)), days }))).toEqual([]);
  });
});

describe('comfort range, recipes', () => {
  const data = dayData({ rows: sample(), days });
  it('the range of time outside with the best days', () => {
    const c = comfort(data).find((x) => x.key === 'outsideMin');
    expect(c.best).toMatchObject({ label: '30–90 min', mean: 8, n: 15 });
  });
  it('the recipe of a good day names what helped', () => {
    const r = recipe(data, days[0]);
    expect(r.good).toBe(true);
    expect(r.parts).toContain('outside');
    expect(recipe(data, '2020-01-01')).toBe(null);
  });
  it('the recipes of good days: what comes up most', () => {
    expect(goodRecipes(data)[0]).toMatchObject({ key: 'outside', n: 15, of: 15 });
  });
});

describe('surprises of the week', () => {
  it('a week far from the normal is a surprise', () => {
    const week = lastDays(T, 7);
    const rows = lastDays(T, 37).map((d) => row(d, 'erholung.schlaf', week.includes(d) ? 9 : 5));
    expect(surprises(rows, week)).toEqual([{ qid: 'erholung.schlaf', week: 9, normal: 5, dir: 'up', n: 7 }]);
  });
  it('a usual week is no surprise', () => {
    const rows = lastDays(T, 37).map((d, i) => row(d, 'erholung.schlaf', 5 + (i % 3)));
    expect(surprises(rows, lastDays(T, 7))).toEqual([]);
  });
});

describe('the wished mix of the ring', () => {
  const keys = CATS.map((c) => c.key);
  it('cleans the wish to steps of 10 within 0–100', () => {
    expect(wishOf({ fun: 73, rest: 140, x: 50, sport: 'a' }, keys)).toEqual({ fun: 70, rest: 100 });
  });
  it('names the categories furthest below the wish', () => {
    const cats = [{ key: 'fun', value: 30 }, { key: 'rest', value: 70 }, { key: 'nature', value: 10 }, { key: 'mind', value: null }];
    expect(wishGap(cats, { fun: 60, rest: 70, nature: 80, mind: 90 }).map((g) => g.key)).toEqual(['nature', 'fun']);
  });
  it('draws one arc per wished category', () => {
    expect(wishArcs(keys, { fun: 50 }).map((a) => a.key)).toEqual(['fun']);
  });
});

describe('short versions and the ride of a day', () => {
  it('every balance category has a 5, 20 and 60 minute version', () => {
    expect(MINUTES).toEqual([5, 20, 60]);
    for (const c of CATS) expect(SHORT[c.key]).toHaveLength(3);
    expect(shortOf('nature', 20)).toBe('A round around the block');
  });
  it('km, metres climbed and pulse of a day; null without a ride', () => {
    const km = [{ date: T, km: 20, hm: 300, hrAvg: 120, kind: 'ride' }, { date: T, km: 10.5, hm: 100, hrAvg: 140, kind: 'ride' }, { date: T, km: 5, kind: 'ride', state: 'removed' }];
    expect(rideNumbers(km, T)).toEqual({ km: 30.5, hm: 400, hrAvg: 130 });
    expect(rideNumbers(km, addDays(T, -1))).toBe(null);
  });
});
