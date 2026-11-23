// «Rhythmus und Vergleiche» (Noah 22.11.2026 «1a 2a 3a 4a 5a», Schritt C und H): the pure rules of lib/weekrhythm.js.
// Fictional data only (test_data_gtp_); calendar days, never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { dayDots, usualWeek, lastYearWeek, answerLines, USUAL, MIN_ANSWERS } from '../src/lib/weekrhythm.js';
import { weekCalc } from '../src/lib/weekcalc.js';
import { shiftDay } from '../src/lib/training.js';

const P = 'test_data_gtp_';
const MON = '2026-10-12';
const act = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '08:00', name: `${P}Runde ${id}`, type: 'Ride', kind: 'bike', km: 40, hm: 500, movingS: 3600, ...f });
const ans = (qid, day, value, f = {}) => ({ id: `${P}${qid}-${day}-${value}`, qid, area: qid.split('.')[0], day, kind: 'scale', value, ...f });

describe('dayDots: a dot for each day with something', () => {
  const calc = weekCalc({ acts: [act('a', MON), act('b', '2026-10-14')] }, MON);
  it('marks the days, and the days to come are grey', () => {
    const d = dayDots(calc, MON, '2026-10-15');
    expect(d.dots.map((x) => x.active)).toEqual([true, false, true, false, false, false, false]);
    expect(d.dots.map((x) => x.future)).toEqual([false, false, false, false, true, true, true]);
    expect(d.dots[3].today).toBe(true);
    expect(d).toMatchObject({ active: 2, of: 4 });
  });
  it('a finished week counts all seven days', () => {
    expect(dayDots(calc, MON, '2026-10-19')).toMatchObject({ active: 2, of: 7 });
  });
});

describe('usualWeek: the mean of the weeks before', () => {
  const acts = [];
  for (let w = 1; w <= USUAL; w++) acts.push(act(`a${w}`, shiftDay(MON, -7 * w + 1)), act(`b${w}`, shiftDay(MON, -7 * w + 4), { km: 20, movingS: 1800 }));
  it('the mean of the four weeks, same rule as the week itself', () => {
    expect(usualWeek({ acts }, MON)).toMatchObject({ secs: 5400, km: 60, n: 2, days: 2, weeks: 4 });
  });
  it('weeks without anything are left out, fewer than two weeks give no usual week', () => {
    const some = acts.filter((a) => a.day >= shiftDay(MON, -14));
    expect(usualWeek({ acts: some }, MON)).toMatchObject({ weeks: 2 });
    expect(usualWeek({ acts: acts.filter((a) => a.day >= shiftDay(MON, -7)) }, MON)).toBeNull();
  });
  it('a running week meets the same days of the weeks before', () => {
    const more = [...acts, act('late', shiftDay(MON, -7 + 5), { km: 100 })]; // Saturday of the week before
    expect(usualWeek({ acts: more }, MON, shiftDay(MON, 2)).km).toBeLessThan(usualWeek({ acts: more }, MON).km);
  });
});

describe('lastYearWeek: the same week one year before', () => {
  it('52 weeks back, the same weekday', () => {
    const acts = [act('y', shiftDay(MON, -364 + 2), { km: 55 })];
    expect(lastYearWeek({ acts }, MON)).toMatchObject({ monday: '2025-10-13', km: 55, n: 1, days: 1 });
  });
  it('nothing that year: nothing to compare', () => {
    expect(lastYearWeek({ acts: [act('z', MON)] }, MON)).toBeNull();
  });
});

describe('answerLines: «Wi gaht\'s?» of the week', () => {
  const answers = [
    ans('erholung.schlaf', MON, 6), ans('erholung.schlaf', shiftDay(MON, 1), 8), ans('erholung.schlaf', shiftDay(MON, 2), 7),
    ans('erholung.akku', MON, 5),
    ans('spass.stimmung', MON, 7), ans('spass.stimmung', shiftDay(MON, 3), 9),
    ans('erholung.schlaf', shiftDay(MON, -7), 4), ans('erholung.schlaf', shiftDay(MON, -6), 4), ans('erholung.schlaf', shiftDay(MON, -5), 4),
    { id: `${P}t`, qid: 'spass.text', area: 'spass', day: MON, kind: 'text', value: 'gut' },
  ];
  const r = answerLines(answers, MON);
  it('one line per area from three answers, with the week before', () => {
    expect(r.areas).toEqual([{ area: 'erholung', n: 4, mean: 6.5, prev: 4 }]);
  });
  it('every scale question on its own, also with one or two answers (no mean then)', () => {
    expect(r.questions.map((q) => [q.qid, q.n, q.few])).toEqual([['erholung.schlaf', 3, false], ['spass.stimmung', 2, true], ['erholung.akku', 1, true]]);
    expect(r.questions.find((q) => q.qid === 'spass.stimmung').mean).toBeNull();
    expect(r.questions[0]).toMatchObject({ mean: 7, prev: 4 });
  });
  it('on how many days there was any answer', () => {
    expect(r).toMatchObject({ days: 4, of: 7 });
    expect(answerLines(answers, MON, shiftDay(MON, 1))).toMatchObject({ days: 2, of: 2 });
  });
  it('text answers are not a number', () => {
    expect(r.questions.some((q) => q.qid === 'spass.text')).toBe(false);
    expect(MIN_ANSWERS).toBe(3);
  });
  it('nothing answered: empty lists', () => {
    expect(answerLines([], MON)).toEqual({ areas: [], questions: [], days: 0, of: 7 });
  });
});
