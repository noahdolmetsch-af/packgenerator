// «Erkenntnisse» (Noah 19.10.2026 «4b» + own page): fictional data only, calendar days.
import { describe, it, expect } from 'vitest';
import { seriesOf, spearman, look, insights, rhrHigh, lastDays, ownNumberQuestions, ownPairs, PAIRS, MIN_DAYS } from '../src/lib/erkenntnisse.js';

const TODAY = '2026-10-19';
const days = lastDays(TODAY, 30);

describe('Erkenntnisse', () => {
  it('Spearman: the same order 1, the reverse -1, no variation null', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 1, 1], [1, 2, 3])).toBe(null);
  });

  it('the series: answers per day, Fitbit hours, ride km and meditation as 0 on answered days', () => {
    const rows = [
      { qid: 'erholung.akku', day: days[0], value: 6, kind: 'scale' },
      { qid: 'erholung.akku', day: days[0], value: 8, kind: 'scale' },
      { qid: 'tour', day: days[1], value: 30, kind: 'ride' },
      { qid: 'spass.stimmung', day: days[2], value: 5, kind: 'scale' },
    ];
    const s = seriesOf({ rows, health: [{ date: days[0], restingHr: 52, sleep: { asleepMin: 450 } }], log: [{ actId: 'meditation', day: days[0], min: 20 }], days });
    expect(s.battery[days[0]]).toBe(7);
    expect(s.sleepH[days[0]]).toBe(7.5);
    expect(s.rhr[days[0]]).toBe(52);
    expect(s.km[days[1]]).toBe(30);
    expect(s.km[days[2]]).toBe(0); // answered, no ride
    expect(s.med[days[0]]).toBe(20);
    expect(s.med[days[2]]).toBe(0);
  });

  it('a pair shows from 14 days and |rho| ≥ 0.3, in two groups split at the median', () => {
    const sleepH = {};
    const battery = {};
    days.slice(0, 13).forEach((d, i) => ((sleepH[d] = 6 + (i % 3)), (battery[d] = 4 + (i % 3) * 2)));
    const pair = PAIRS.find((p) => p.id === 'sleep-battery');
    expect(look(pair, { sleepH, battery }, days)).toMatchObject({ n: 13, ready: false, shown: false });
    days.slice(13, 20).forEach((d, i) => ((sleepH[d] = 6 + (i % 3)), (battery[d] = 4 + (i % 3) * 2)));
    const r = look(pair, { sleepH, battery }, days);
    expect(r.n).toBeGreaterThanOrEqual(MIN_DAYS);
    expect(r).toMatchObject({ ready: true, shown: true, clear: true, cut: 7 });
    expect(r.hi.mean).toBe(8);
    expect(r.lo.mean).toBeLessThan(r.hi.mean);
  });

  it('no relation: ready but not shown; the day after uses the next day', () => {
    const azm = {};
    const rhr = {};
    days.forEach((d, i) => ((azm[d] = i % 2 ? 60 : 0), (rhr[d] = 50 + ((i * 7) % 5))));
    const flat = look(PAIRS.find((p) => p.id === 'azm-rhr'), { azm, rhr }, days);
    expect(flat.ready).toBe(true);
    // the next day: rhr of day i+1 is high when azm of day i was high
    const rhr2 = {};
    days.forEach((d, i) => (rhr2[d] = (i - 1) % 2 ? 58 : 50));
    const lag = look(PAIRS.find((p) => p.id === 'azm-rhr'), { azm, rhr: rhr2 }, days);
    expect(lag).toMatchObject({ shown: true, lag: 1 });
    expect(lag.hi.mean).toBe(58);
    expect(lag.lo.mean).toBe(50);
    expect(insights({ azm, rhr: rhr2 }, days.at(-1))[0].id).toBe('azm-rhr');
  });

  it('the resting pulse: three days above the normal + 5, else nothing', () => {
    const health = lastDays(TODAY, 33).map((date, i) => ({ date, restingHr: i >= 30 ? 60 : 50 }));
    expect(rhrHigh(health, TODAY)).toEqual({ normal: 50, last: [60, 60, 60] });
    health.at(-2).restingHr = 54;
    expect(rhrHigh(health, TODAY)).toBe(null);
    expect(rhrHigh(health.slice(-3), TODAY)).toBe(null); // no normal yet
  });

  it('weather, appointments and own number questions become series (Noah 19.10.2026 «2a 3a 4a und b»)', () => {
    const own = [
      { id: 'own-a', text: 'Kaffee', form: { kind: 'number', unit: 'cups' } },
      { id: 'own-b', text: 'Ruhig', form: { kind: 'scale' } },
      { id: 'own-c', text: 'Notiz', form: { kind: 'text' } },
    ];
    expect(ownNumberQuestions(own).map((q) => q.id)).toEqual(['own-a', 'own-b']);
    expect(ownNumberQuestions(own, ['own-b']).map((q) => q.id)).toEqual(['own-a']);
    const rows = [
      { qid: 'own-a', day: days[0], value: 2 },
      { qid: 'own-a', day: days[0], value: 4 },
    ];
    const s = seriesOf({ rows, days, weather: { [days[0]]: { sunH: 6, lightH: 11, rainMm: 0, tmax: 15 } }, events: { [days[0]]: 3 }, own: ownNumberQuestions(own) });
    expect(s.sunH[days[0]]).toBe(6);
    expect(s.rainMm[days[0]]).toBe(0);
    expect(s.evts[days[0]]).toBe(3);
    expect(s['own:own-a'][days[0]]).toBe(3);
    expect(ownPairs([own[0]]).map((p) => p.id)).toEqual(['own-own-a-mood', 'own-own-a-battery']);
  });

  it('sunny days with a better mood show; appointments look at the night after', () => {
    const sunH = {};
    const mood = {};
    days.forEach((d, i) => ((sunH[d] = i % 2 ? 8 : 1), (mood[d] = i % 2 ? 8 : 5)));
    const r = look(PAIRS.find((p) => p.id === 'sun-mood'), { sunH, mood }, days);
    expect(r).toMatchObject({ shown: true, hi: { mean: 8 }, lo: { mean: 5 } });
    expect(PAIRS.find((p) => p.id === 'evts-sleepfelt').lag).toBe(1);
    // two values only, the higher one more often: the split moves down so both groups have days
    const evts = {};
    days.forEach((d, i) => (evts[d] = i % 2 ? 1 : 6));
    const e = look(PAIRS.find((p) => p.id === 'evts-mood'), { evts, mood }, days.slice(0, 29)); // 15 × 6, 14 × 1: the median is 6
    expect(e).toMatchObject({ shown: true, cut: 1, hi: { mean: 5 }, lo: { mean: 8 } });
    const coffee = {};
    days.forEach((d, i) => (coffee[d] = i % 2 ? 4 : 1));
    const all = insights({ 'own:own-a': coffee, mood }, days.at(-1), { own: [{ id: 'own-a', text: 'Kaffee' }] });
    expect(all.find((x) => x.id === 'own-own-a-mood')).toMatchObject({ shown: true, name: 'Kaffee' });
  });
});
