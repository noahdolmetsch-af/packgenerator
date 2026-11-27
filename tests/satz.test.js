// «Der Satz nach dem Haken» (Noah 27.11.2026 «1b 2a»): src/lib/flow/satz.js
import { describe, it, expect } from 'vitest';
import { actFacts, satzLines, runsOf, daysOf } from '../src/lib/flow/satz.js';

const add = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
let id = 0;
const e = (actId, day, extra = {}) => ({ id: `e${++id}`, actId, day, n: 1, ...extra });
const gym = { id: 'gym', name: 'Gym' };
const sauna = { id: 'sauna', name: 'Sauna' };
const nameOf = (a) => a.name;
const TODAY = '2026-11-19'; // Thursday

describe('runs', () => {
  it('splits days into series of days in a row', () => {
    expect(runsOf(['2026-11-01', '2026-11-02', '2026-11-05'])).toEqual([['2026-11-01', '2026-11-02'], ['2026-11-05']]);
    expect(daysOf([e('gym', '2026-11-02'), e('gym', '2026-11-02'), e('x', '2026-11-01')], 'gym', '2026-11-05')).toEqual(['2026-11-02']);
  });
});

describe('Satz nach dem Haken', () => {
  it('names a series and says when it is the longest', () => {
    const log = [...[-20, -19, -18, -10, -9].map((n) => e('gym', add(TODAY, n))), ...[-12, -11].map((n) => e('gym', add(TODAY, n))), ...[-3, -2, -1, 0].map((n) => e('gym', add(TODAY, n)))];
    const entry = log[log.length - 1];
    const f = actFacts({ act: gym, acts: [gym], log, entry });
    expect(f.run).toBe(4);
    expect(f.record).toBe(4);
    const l = satzLines(f, 'Gym', nameOf);
    expect(l[0].kind).toBe('run');
    expect(l[0].text).toMatch(/day 4 in a row, as long as your longest series/);
    const log2 = [...[-3, -2, -1, 0].map((n) => e('gym', add(TODAY, n))), e('gym', add(TODAY, -30)), e('gym', add(TODAY, -29))];
    const f2 = actFacts({ act: gym, acts: [gym], log: log2, entry: log2[3] });
    expect(satzLines(f2, 'Gym', nameOf)[0].text).toBe('Gym: day 4 in a row.'); // fewer than 10 ticks: no record talk
  });

  it('names a long pause with your usual distance', () => {
    const days = [-80, -73, -66, -59, -52, -45, -38, -31, -24, -17, -10].map((n) => add(TODAY, n));
    const log = [...days.map((d) => e('gym', d)), e('gym', TODAY)];
    const f = actFacts({ act: gym, acts: [gym], log, entry: log[log.length - 1] });
    expect(f.gap).toBe(10);
    expect(f.usualGap).toBe(7);
    expect(satzLines(f, 'Gym', nameOf)[0].text).toBe('Gym: 10 days since the last time, usually 7 days between two.');
  });

  it('says how often this week against the usual, and counts ticks when there are no minutes', () => {
    const past = [];
    for (let w = 1; w <= 8; w++) past.push(e('sauna', add('2026-11-16', -7 * w)));
    const week = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'].map((d) => e('sauna', d));
    const log = [...past, ...week];
    const f = actFacts({ act: sauna, acts: [sauna], log, entry: week[3] });
    expect(f.weekN).toBe(4);
    expect(f.usual).toEqual({ perWeek: 1 });
    const l = satzLines(f, 'Sauna', nameOf);
    expect(l[0].kind).toBe('run'); // four days in a row beat the count
    const f2 = actFacts({ act: sauna, acts: [sauna], log: [...past, week[0], week[2]], entry: week[2] });
    expect(satzLines(f2, 'Sauna', nameOf)[0].text).toBe('Sauna: time 2 this week, usually about 1 a week.');
  });

  it('compares the length only with measured minutes and says nothing when it is usual', () => {
    const days = [-30, -25, -20, -15, -10, -5].map((n) => e('gym', add(TODAY, n), { min: 60 }));
    const short = e('gym', TODAY, { min: 30 });
    let f = actFacts({ act: gym, acts: [gym], log: [...days, short], entry: short });
    expect(f.usualMin).toBe(60);
    expect(satzLines(f, 'Gym', nameOf).map((x) => x.kind)).toContain('short');
    const same = e('gym', TODAY, { min: 62 });
    f = actFacts({ act: gym, acts: [gym], log: [...days, same], entry: same });
    expect(satzLines(f, 'Gym', nameOf).map((x) => x.kind)).not.toContain('short');
    const none = e('gym', TODAY);
    f = actFacts({ act: gym, acts: [gym], log: [...days, none], entry: none });
    expect(f.min).toBe(null);
  });

  it('adds the weekly goal and what you often tick next, only when not done today', () => {
    const gymDays = [-40, -33, -26, -19, -12, -5].map((n) => add(TODAY, n));
    const log = [...gymDays.map((d) => e('gym', d)), ...gymDays.slice(0, 5).map((d) => e('sauna', d)), e('gym', TODAY)];
    const entry = log[log.length - 1];
    let f = actFacts({ act: gym, acts: [gym, sauna], log, entry, goal: { n: 1, of: 2, met: false } });
    expect(f.together.other.id).toBe('sauna');
    expect(f.together.k).toBe(5);
    let l = satzLines(f, 'Gym', nameOf);
    expect(l.length).toBe(2);
    expect(l[1].kind).toBe('goal');
    f = actFacts({ act: gym, acts: [gym, sauna], log, entry });
    l = satzLines(f, 'Gym', nameOf);
    expect(l[1].text).toBe('After Gym you often tick Sauna too (on 5 of 6 days), not yet today.');
    f = actFacts({ act: gym, acts: [gym, sauna], log: [...log, e('sauna', TODAY)], entry });
    expect(f.together).toBe(null);
  });

  it('knows the first time ever', () => {
    const one = e('gym', TODAY);
    const f = actFacts({ act: gym, acts: [gym], log: [one], entry: one });
    expect(satzLines(f, 'Gym', nameOf)[0]).toEqual({ kind: 'first', text: 'Gym: the first time you tick this.' });
  });
});
