// «Erkenntnisse» (Noah 19.10.2026 «4b» + own page): fictional data only, calendar days.
import { describe, it, expect } from 'vitest';
import { seriesOf, spearman, look, insights, rhrHigh, lastDays, ownNumberQuestions, ownPairs, testHint, PAIRS, MIN_DAYS, niceCut, actSeries, actPairs, leversOf, soonOf, isLever, expMetricOf } from '../src/lib/erkenntnisse.js';

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

  describe('a guess to test', () => {
    const span = lastDays(TODAY, 21);
    // long nights go with a better mood: every other day 8 h and mood 8, else 5 h and mood 5 (today is the last day)
    const series = (todayH) => {
      const sleepH = {};
      const mood = {};
      span.forEach((d, i) => {
        const long = i % 2 === 0;
        sleepH[d] = long ? 8 : 5;
        mood[d] = long ? 8 : 5;
      });
      sleepH[TODAY] = todayH;
      return { sleepH, mood };
    };
    it('gives the strongest same-day hint of something measured and a feeling when today fits', () => {
      const h = testHint(series(8), TODAY);
      expect(h).toMatchObject({ x: 'sleepH', y: 'mood', lag: 0, today: 8 });
      expect(h.cut).toBeLessThan(8);
    });
    it('nothing when today lies below the cut, when there is no value today or when the pair is a feeling and a feeling', () => {
      expect(testHint(series(4), TODAY)).toBeNull();
      const s = series(8);
      delete s.sleepH[TODAY];
      expect(testHint(s, TODAY)).toBeNull();
      const f = { sleepFelt: s.sleepH, mood: s.mood };
      f.sleepFelt[TODAY] = 8;
      expect(testHint(f, TODAY)).toBeNull();
    });
    it('a strength threshold keeps weak hints away', () => {
      expect(testHint(series(8), TODAY, { minRho: 1.1 })).toBeNull();
    });
  });
});

// Noah 23.11.2026 «ja» (Thread «Zusammenhänge nützlicher machen»): activities, round cuts, levers, soon visible
describe('Zusammenhänge nützlicher', () => {
  const span = lastDays(TODAY, 40);
  const ticksOn = (every, id = 'sauna') => span.filter((_, i) => i % every === 0).map((day) => ({ actId: id, day }));

  it('cuts are rounded to what a person says: 9.6 km → 10, 5.46 h → 5.5, 4.3 steps thousands → 500', () => {
    expect(niceCut('km', 9.6)).toBe(10);
    expect(niceCut('km', 23)).toBe(25);
    expect(niceCut('sleepH', 5.46)).toBe(5.5);
    expect(niceCut('steps', 7312)).toBe(7500);
    expect(niceCut('rhr', 49.6)).toBe(50);
    expect(niceCut('act:sauna', 0)).toBe(0);
  });

  it('a rounded cut is used when both sides keep days, and the picture gets the values of both sides', () => {
    const km = {};
    const mood = {};
    span.forEach((d, i) => ((km[d] = 2 + (i % 10)), (mood[d] = 3 + (i % 10) * 0.5)));
    const r = look({ id: 'km-mood', x: 'km', y: 'mood', lag: 0 }, { km, mood }, span);
    expect(Number.isInteger(r.cut)).toBe(true);
    expect(r.hiVals.length).toBe(r.hi.n);
    expect(r.loVals.length).toBe(r.lo.n);
    expect(r.hiVals.length + r.loVals.length).toBe(r.n);
  });

  it('an activity becomes a series: 1 on a ticked day, 0 on known days; too few or nearly daily ticks are left out', () => {
    const known = new Set(span);
    const s = actSeries({ acts: [], log: [...ticksOn(4, 'sauna'), ...ticksOn(1, 'daily'), ...ticksOn(20, 'rare')] }, span, known);
    expect(Object.keys(s)).toEqual(['act:sauna']); // daily: every day (nothing to compare); rare: 2 days only
    expect(s['act:sauna'][span[0]]).toBe(1);
    expect(s['act:sauna'][span[1]]).toBe(0);
    expect(actSeries({ acts: [{ id: 'sauna', paused: true }], log: ticksOn(4) }, span, known)).toEqual({});
  });

  it('seriesOf adds act series, HRV, and the pairs against sleep, resting pulse, HRV, battery and mood (day and day after)', () => {
    const health = span.map((date, i) => ({ date, hrvMs: 40 + (i % 4), restingHr: 50, sleep: { asleepMin: 420 } }));
    const s = seriesOf({ health, days: span, acts: { acts: [], log: ticksOn(4) } });
    expect(s.hrv[span[1]]).toBe(41);
    expect(s['act:sauna']).toBeTruthy();
    const ids = actPairs(s).map((p) => `${p.y}${p.lag}`);
    expect(ids).toEqual(expect.arrayContaining(['sleepH1', 'rhr1', 'hrv1', 'battery0', 'battery1', 'mood0', 'mood1', 'sleepFelt1']));
    expect(actPairs({ 'act:meditation': {} }).some((p) => p.y === 'mood' && !p.lag)).toBe(false);
  });

  it('an activity that goes with a better night shows, and is a lever with a gain', () => {
    // sauna every 4th day, the next night 1 h longer
    const health = span.map((date, i) => ({ date, sleep: { asleepMin: 360 + (i > 0 && (i - 1) % 4 === 0 ? 60 : 0) + (i % 3) * 5 }, restingHr: 50, hrvMs: 40 }));
    const rows = span.map((day) => ({ qid: 'erholung.akku', day, value: 6, kind: 'scale' }));
    const s = seriesOf({ rows, health, days: span, acts: { acts: [], log: ticksOn(4) } });
    const all = insights(s, TODAY);
    const row = all.find((x) => x.x === 'act:sauna' && x.y === 'sleepH');
    expect(row).toMatchObject({ shown: true, lag: 1 });
    expect(row.hi.mean).toBeGreaterThan(row.lo.mean);
    const levers = leversOf(all);
    expect(levers[0]).toMatchObject({ x: 'act:sauna', y: 'sleepH' });
    expect(levers[0].gain).toBeGreaterThan(0.5);
  });

  it('levers: only things you can do, only the good way, every thing once, at most three; the resting pulse is better lower', () => {
    const row = (x, y, hi, lo, rho = 0.6) => ({ id: `${x}-${y}`, x, y, lag: 0, shown: true, rho, n: 30, hi: { mean: hi, n: 10 }, lo: { mean: lo, n: 20 } });
    const rows = [
      row('sleepH', 'battery', 8, 6),
      row('sleepH', 'mood', 7, 5, 0.55), // sleep again: not twice
      row('rhr', 'battery', 5, 8), // the body's own value: not a lever
      row('act:sauna', 'rhr', 47, 50, 0.5), // a lower resting pulse is good
      row('act:hockey', 'sleepH', 6, 7, 0.45), // worse: no lever
      row('km', 'mood', 7, 6, 0.4),
      row('steps', 'mood', 7, 6, 0.38),
    ];
    const l = leversOf(rows);
    expect(l.map((x) => x.id)).toEqual(['sleepH-battery', 'act:sauna-rhr', 'km-mood']);
    expect(l[1].gain).toBe(3);
    expect(isLever('rhr')).toBe(false);
    expect(isLever('act:yoga')).toBe(true);
  });

  it('soon visible: from 7 days, with a first trend from 8 days when it already shows', () => {
    const days = lastDays(TODAY, 10);
    const sleepH = {};
    const battery = {};
    days.forEach((d, i) => ((sleepH[d] = 5 + (i % 4)), (battery[d] = 4 + (i % 4) * 2)));
    const series = { sleepH, battery };
    const all = insights(series, TODAY);
    const { soon, waiting, first } = soonOf(all, series, TODAY);
    expect(waiting.length).toBeGreaterThan(0);
    expect(soon.every((x) => x.n >= 7)).toBe(true);
    expect(first).toMatchObject({ x: 'sleepH', y: 'battery', shown: true });
    // too few days: nothing soon, no first trend
    expect(soonOf(insights({ sleepH: { [days[0]]: 6 }, battery: { [days[0]]: 5 } }, TODAY), series, TODAY).first).toBe(null);
  });

  it('the try measures the value of y', () => {
    expect(expMetricOf('sleepH')).toBe('sleep');
    expect(expMetricOf('battery')).toBe('felt:energy');
    expect(expMetricOf('sat')).toBe('');
  });
});
