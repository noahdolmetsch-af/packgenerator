// «Zusammenhänge: mehr Muster» (Noah 23.11.2026): bester Bereich, Wochentage, Erholung, Neu diese Woche. Erfundene Daten, Kalendertage.
import { describe, it, expect } from 'vitest';
import { lastDays, addDays, insights } from '../src/lib/erkenntnisse.js';
import { bestBand, weekday, weekdayPattern, recoveryOf, newThisWeek } from '../src/lib/erkenntnisse/muster.js';
import { rangeText, dayLong } from '../src/lib/erkenntnisse/words.js';

const TODAY = '2026-11-23'; // a Monday
const span = lastDays(TODAY, 90);

describe('Wochentage und Bereiche', () => {
  it('weekday(): 0 is Monday, 6 is Sunday', () => {
    expect(weekday('2026-11-23')).toBe(0);
    expect(weekday('2026-11-29')).toBe(6);
    expect(dayLong('de-CH', 0)).toBe('Montag');
  });

  it('the best range: the third with the best mean, the cuts round, every third needs 5 days', () => {
    // sleep 5…8.9 h; the battery is best for 7 to 8 h and lower below and above
    const sleepH = {};
    const battery = {};
    span.slice(0, 60).forEach((d, i) => {
      const h = 5 + (i % 8) * 0.5;
      sleepH[d] = h;
      battery[d] = h < 6.5 ? 4 : h < 8.5 ? 8 : 6;
    });
    const b = bestBand({ x: 'sleepH', y: 'battery', lag: 0 }, { sleepH, battery }, span);
    expect(b).toBeTruthy();
    expect(b.mean).toBeGreaterThan(b.rest);
    expect(b.rows).toHaveLength(3);
    expect(b.rows.every((r) => r.n >= 5)).toBe(true);
    expect(Number.isInteger(b.from * 2)).toBe(true); // halves of an hour
    expect(bestBand({ x: 'act:sauna', y: 'battery', lag: 0 }, { 'act:sauna': {}, battery: {} }, span)).toBe(null);
    expect(bestBand({ x: 'sleepH', y: 'battery', lag: 0 }, { sleepH: { [span[0]]: 6 }, battery: { [span[0]]: 5 } }, span)).toBe(null);
    expect(rangeText((x) => x, (x) => x, 'sleepH', null, 6)).toBe('up to {b}');
  });

  it('the days of the week: the lowest and the highest, only when clearly different', () => {
    const battery = {};
    span.forEach((d, i) => (battery[d] = (weekday(d) === 0 ? 4 : weekday(d) === 5 ? 8 : 6) + ((i * 7) % 3) * 0.1));
    const w = weekdayPattern({ battery }, TODAY);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ y: 'battery', low: 0, high: 5 });
    // no difference between the days: nothing
    const flat = {};
    span.forEach((d, i) => (flat[d] = 6 + ((i * 7) % 5) * 0.2));
    expect(weekdayPattern({ battery: flat }, TODAY)).toEqual([]);
  });
});

describe('Erholung', () => {
  it('after days over 200 active zone minutes: the resting pulse of the next days against the normal, and when it is back', () => {
    const azm = {};
    const rhr = {};
    span.forEach((d) => ((azm[d] = 40), (rhr[d] = 50)));
    // a hard day every 9th day; the pulse is +4 the day after, +2 two days after, normal on the third
    span.forEach((d, i) => {
      if (i % 9 === 0 && i < 80) {
        azm[d] = 260;
        rhr[addDays(d, 1)] = 54;
        rhr[addDays(d, 2)] = 52;
      }
    });
    const r = recoveryOf({ azm, rhr }, TODAY);
    expect(r.cut).toBe(200);
    expect(r.n).toBeGreaterThanOrEqual(5);
    expect(r.steps[0]).toMatchObject({ k: 1 });
    expect(r.steps[0].dev).toBeGreaterThan(3);
    expect(r.backAfter).toBe(3);
  });

  it('the long run: the last 30 days against the 30 before; nothing without enough days', () => {
    const rhr = {};
    span.forEach((d, i) => (rhr[d] = i < 60 ? 54 : 50));
    const r = recoveryOf({ azm: {}, rhr }, TODAY);
    expect(r.trend).toMatchObject({ now: 50, before: 54, diff: -4 });
    expect(recoveryOf({ azm: {}, rhr: {} }, TODAY)).toBe(null);
  });
});

describe('Neu diese Woche', () => {
  it('an insight that shows today but did not a week ago is new', () => {
    const sleepH = {};
    const battery = {};
    // the first 20 days: no relation; the last 10 days: more sleep, fuller battery (it shows only from the last days on)
    span.slice(-30).forEach((d, i) => {
      const k = i % 4;
      sleepH[d] = 6 + k * 0.7;
      battery[d] = i < 18 ? 6 + ((i * 5) % 3) * 0.1 - 0.1 : 3 + k * 2;
    });
    const series = { sleepH, battery };
    const week = newThisWeek(series, TODAY);
    const ids = week.map((x) => x.id);
    const wasShown = insights(series, addDays(TODAY, -7)).some((x) => x.id === 'sleep-battery' && x.shown);
    if (!wasShown) expect(ids).toContain('sleep-battery');
    expect(week.every((x) => x.fresh === 'new' || x.fresh === 'stronger')).toBe(true);
    expect(week.length).toBeLessThanOrEqual(2);
    // nothing changed a week later: nothing is new
    expect(newThisWeek({ sleepH: {}, battery: {} }, TODAY)).toEqual([]);
  });
});
