// Paket M «3 Beobachtungen pro Woche» (#294, #14, #247): the pure rules of lib/lernen/beobachtungen.js.
// Fictional data only (test_data_gtp_); calendar days, never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { weekKey, dueMonday, isReady, obsOf, freeze, setKind, olderWeeks, daysOf, compare, candidates, pickThree, weekView, KINDS, PER_WEEK, MIN_DAYS } from '../src/lib/lernen/beobachtungen.js';
import { shiftDay, isoWeek } from '../src/lib/training.js';

const P = 'test_data_gtp_';
const MON = '2026-10-12';
const SUN = '2026-10-18';
const act = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '07:30', name: `${P}Runde`, type: 'Ride', kind: 'bike', km: 40, hm: 400, movingS: 5400, ...f });

/** Eleven calm weeks (Tuesday and Saturday, every other Saturday a long one), then a full week Monday–Friday. */
export function sample() {
  const acts = [];
  const long = new Set();
  for (let w = 1; w <= 11; w++) {
    const m = shiftDay(MON, -7 * w);
    acts.push(act(`t${w}`, shiftDay(m, 1)));
    const sat = shiftDay(m, 5);
    if (w % 2) {
      acts.push(act(`s${w}`, sat, { km: 110, movingS: 5 * 3600 }));
      long.add(sat);
    } else acts.push(act(`s${w}`, sat));
  }
  for (let i = 0; i < 5; i++) acts.push(act(`w${i}`, shiftDay(MON, i), { movingS: 4000 }));
  const ride = new Set(acts.map((a) => a.day));
  const health = [];
  for (let d = shiftDay(SUN, -90); d <= SUN; d = shiftDay(d, 1)) {
    const after = [1, 2, 3].some((k) => long.has(shiftDay(d, -k)));
    health.push({ date: d, sleep: { asleepMin: ride.has(shiftDay(d, -1)) ? 480 + (d.endsWith('5') ? 5 : 0) : 420 + (d.endsWith('3') ? 6 : 0) }, restingHr: after ? 58 : 52 + (d.endsWith('7') ? 1 : 0), steps: 8000 });
  }
  return { acts, health, trips: [], rides: [], answers: [], checks: [], log: [], flowActs: [] };
}

describe('weeks', () => {
  it('the key is the ISO year and week', () => {
    expect(weekKey(MON)).toBe('2026-W42');
    expect(weekKey('2026-12-28')).toBe('2026-W53');
    expect(weekKey('2027-01-04')).toBe('2027-W01');
    expect(isoWeek('2027-01-04')).toBe(1); // training.js: the noon offset counted one week too many
    expect(isoWeek('2026-10-12')).toBe(42);
  });
  it('due: on a Sunday the running week, otherwise the one that ended last Sunday', () => {
    expect(dueMonday(SUN)).toBe(MON);
    expect(dueMonday('2026-10-19')).toBe(MON);
    expect(dueMonday('2026-10-17')).toBe('2026-10-05');
    expect(isReady(MON, '2026-10-17')).toBe(false);
    expect(isReady(MON, SUN)).toBe(true);
  });
});

describe('the record', () => {
  it('defaults, freeze, hide a kind, older weeks', () => {
    expect(obsOf(null)).toEqual({ on: true, weeks: {}, done: [], offKinds: [] });
    let v = freeze(null, '2026-10-05', [{ kind: 'week', key: 'week-km-more', vars: {} }]);
    v = freeze(v, MON, [{ kind: 'sleep', key: 'sleep-min-more', vars: {} }]);
    expect(Object.keys(v.weeks)).toEqual(['2026-W41', '2026-W42']);
    v = setKind(v, 'week', false);
    expect(v.offKinds).toEqual(['week']);
    expect(olderWeeks(v, shiftDay(MON, 7)).map((w) => w.key)).toEqual(['2026-W42']); // W41 holds only a hidden kind
    expect(setKind(v, 'week', true).offKinds).toEqual([]);
  });
});

describe('the days and comparisons', () => {
  it('ride days, long efforts (4 h or 80 km, a trip of two days) and Fitbit values', () => {
    const d = daysOf({ ...sample(), trips: [{ id: `${P}tr`, startDate: '2026-07-01', days: 2 }] });
    expect(d.ride.has(shiftDay(MON, 1))).toBe(true);
    expect(d.long.has('2026-07-02')).toBe(true); // the trip's last day
    expect(d.long.has(shiftDay(MON, -2))).toBe(true); // Saturday of the week before, 5 h
    expect(d.sleepMin.get(SUN)).toBeGreaterThan(0);
  });
  it('a comparison needs MIN_DAYS in each group', () => {
    expect(compare([1, 2, 3], [1, 2, 3, 4]).ok).toBe(false);
    const c = compare([8, 8, 9, 9], [5, 5, 6, 6]);
    expect(c).toMatchObject({ ok: true, a: 8.5, b: 5.5, diff: 3 });
    expect(MIN_DAYS).toBe(4);
  });
});

describe('the three of a week', () => {
  it('three of different kinds, the strongest first, each with a chart', () => {
    const { list } = pickThree(sample(), MON, SUN);
    expect(list).toHaveLength(PER_WEEK);
    expect(new Set(list.map((o) => o.kind)).size).toBe(PER_WEEK);
    for (const o of list) {
      expect(KINDS).toContain(o.kind);
      expect(o.chart.type === 'bars' ? o.chart.bars.length : 2).toBeGreaterThan(1);
      expect(o.score).toBeGreaterThan(0);
    }
    expect(list[0].score).toBeGreaterThanOrEqual(list[2].score);
  });
  it('finds sleep after riding (#14) and the days after a long tour (#247)', () => {
    const { list } = candidates(sample(), MON, SUN);
    const sleep = list.find((o) => o.kind === 'sleep');
    expect(sleep.key).toBe('sleep-min-more');
    expect(sleep.vars.a).toBeGreaterThan(sleep.vars.b);
    const after = list.find((o) => o.kind === 'after');
    expect(after.key).toBe('after-rhr-more');
    expect(after.vars).toMatchObject({ a: 58 });
    expect(after.chart.bars[0].v).toBeLessThan(after.chart.bars[1].v);
  });
  it('the streak and the week against the usual', () => {
    const { list } = candidates(sample(), MON, SUN);
    expect(list.find((o) => o.kind === 'streak')).toMatchObject({ key: 'streak-run', vars: { n: 5 } });
    expect(list.find((o) => o.kind === 'week')?.key).toMatch(/^week-(hours|km|days)-more$/);
    expect(list.find((o) => o.kind === 'time')).toMatchObject({ key: 'time-part', vars: { part: 'morning' } });
  });
  it('mood on meditation days against the others', () => {
    const data = sample();
    data.flowActs = [{ id: 'meditation', ring: 'mind' }];
    for (let i = 0; i < 20; i++) {
      const d = shiftDay(SUN, -i);
      const med = i % 2 === 0;
      if (med) data.log.push({ id: `${P}m${i}`, actId: 'meditation', day: d });
      data.answers.push({ id: `${P}a${i}`, qid: 'spass.stimmung', day: d, value: med ? 8 + (i % 4 === 0 ? 1 : 0) : 6 });
    }
    const m = candidates(data, MON, SUN).list.find((o) => o.kind === 'mind');
    expect(m).toMatchObject({ key: 'mind-more' });
  });
  it('never invents: no data → nothing, every kind «too little data»', () => {
    const r = pickThree({}, MON, SUN);
    expect(r.list).toEqual([]);
    expect(r.few.sort()).toEqual([...KINDS].sort());
  });
  it('a hidden kind stays out', () => {
    const { list } = pickThree(sample(), MON, SUN, { offKinds: ['sleep', 'after'] });
    expect(list.some((o) => o.kind === 'sleep' || o.kind === 'after')).toBe(false);
  });
});

describe('what the week review shows', () => {
  it('waiting before Sunday, live on Sunday (not stored), new on Monday (to store), frozen afterwards', () => {
    expect(weekView(null, sample(), MON, '2026-10-17').state).toBe('waiting');
    // Sunday: shown from today's data, nothing stored yet, so a ride synced later still counts (Noah 01.11.2026)
    const live = weekView(null, sample(), MON, SUN);
    expect(live.state).toBe('live');
    expect(live.store).toBeUndefined();
    expect(live.list).toHaveLength(3);
    const v = weekView(null, sample(), MON, '2026-10-19');
    expect(v.state).toBe('new');
    expect(v.store.weeks['2026-W42']).toHaveLength(3);
    expect(v.store.done).toEqual(['2026-W42']);
    // more data later does not change a frozen week
    const later = weekView(v.store, { ...sample(), health: [] }, MON, '2026-10-21');
    expect(later.state).toBe('frozen');
    expect(later.list.map((o) => o.key)).toEqual(v.list.map((o) => o.key));
  });
  it('a week an older version froze on its Sunday is worked out again once; older weeks stay as they are', () => {
    const old = { on: true, offKinds: [], weeks: { '2026-W42': [{ kind: 'week', key: 'week-hours-less', vars: {} }] } };
    expect(weekView(old, sample(), MON, '2026-10-19').state).toBe('new');
    expect(weekView(old, sample(), MON, '2026-11-30').state).toBe('frozen');
  });
  it('the running week meets the same days of the weeks before, never a whole week', () => {
    // Wednesday: this week has 3 rides in 3 days, the weeks before one ride in their first 3 days
    const r = candidates(sample(), MON, '2026-10-14');
    const week = r.list.find((o) => o.kind === 'week');
    expect(week?.chart.upto).toBe(3);
    expect(week?.vars.upto).toBe('2026-10-14');
  });
  it('days were active but nothing measured: no «100 % less»', () => {
    const base = sample();
    const data = { ...base, acts: base.acts.filter((a) => a.day < MON), log: [{ id: `${P}l`, actId: 'yoga', day: MON, at: `${MON}T07:00:00.000Z`, n: 1 }], flowActs: [{ id: 'yoga', ring: 'move', icon: 'yoga', goals: [] }] };
    const c = candidates(data, MON, '2026-10-14');
    expect(c.list.find((o) => o.kind === 'week' && /hours|km/.test(o.key))).toBeUndefined();
  });
  it('off, and thin when nothing has enough data (nothing stored)', () => {
    expect(weekView({ on: false }, sample(), MON, SUN).state).toBe('off');
    const thin = weekView(null, {}, MON, SUN);
    expect(thin.state).toBe('thin');
    expect(thin.store).toBeUndefined();
  });
});

describe('body and weather observations (Noah 01.11.2026 «5c»)', () => {
  it('body: resting heart rate of the week against the same days of the four weeks before; none without Fitbit weeks', () => {
    const health = [];
    for (let d = shiftDay(SUN, -40); d <= SUN; d = shiftDay(d, 1)) health.push({ date: d, restingHr: d >= MON ? 60 : 52, steps: 8000 });
    const o = candidates({ ...sample(), health }, MON, SUN).list.find((x) => x.kind === 'body');
    expect(o?.key).toBe('body-rhr-more');
    expect(o.vars).toMatchObject({ a: 60, b: 52 });
    expect(o.chart.bars).toHaveLength(5);
    expect(candidates({ ...sample(), health: [] }, MON, SUN).few).toContain('body');
  });
  it('weather: active share on dry against rainy days; needs enough days of both', () => {
    const weather = {};
    const acts = [];
    for (let i = 0; i < 40; i++) {
      const d = shiftDay(MON, -i);
      const wet = i % 2 === 0;
      weather[d] = { rainMm: wet ? 6 : 0 };
      if (!wet) acts.push(act(`dry${i}`, d));
    }
    const r = candidates({ acts, weather }, MON, SUN);
    const o = r.list.find((x) => x.kind === 'weather');
    expect(o?.key).toBe('weather-dry');
    expect(o.vars).toMatchObject({ a: 100, b: 0 });
    expect(candidates({ acts, weather: {} }, MON, SUN).few).toContain('weather');
  });
});
