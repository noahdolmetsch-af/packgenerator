// «Form und Erholung klüger» (Noah 23.11.2026 «ja»): the answer for today from all values, and «Was auffällt» for HRV and sleep.
// Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { dayAnswer } from '../src/lib/flow/form/tagesantwort.js';
import { readiness } from '../src/lib/form.js';
import { valueAlert, valueAlerts } from '../src/lib/flow/form/auffaellt-werte.js';
import { answerWhy } from '../src/lib/flow/form/words.js';
import { addDays } from '../src/lib/health.js';

const TODAY = '2026-11-23';
const part = (key, points, extra = {}) => ({ key, v: 0, delta: 0, points, ...extra });
/** A readiness the way readiness() builds it, from parts and a form. */
const ready = (parts, form = 10, fit = 13) => {
  const series = [{ day: TODAY, load: 40, fit, fat: fit - form, form }];
  return readiness({ series, parts });
};

describe('dayAnswer', () => {
  it('the day of the page: good form, but HRV −42 % and 3 h 55 sleep → rest, not «you are fresh»', () => {
    const r = ready([part('rhr', 0), part('hrv', -20, { delta: -42 }), part('sleep', -18, { v: 235 })]);
    expect(r.scoreLevel).toBe('easy'); // the score alone said «easy»
    expect(r.level).toBe('rest'); // readiness() already carries the answer, so every place that reads the level agrees
    const a = dayAnswer(r);
    expect(a.level).toBe('rest');
    expect(a.adjusted).toBe(true);
    expect(a.reasons.map((p) => p.key)).toEqual(['hrv', 'sleep']);
    expect(a.good).toBe(true); // the form is fresh, the page says the low values weigh more
  });
  it('two low values on a «normal» day take it down to «easy»', () => {
    const a = dayAnswer({ level: 'normal', score: 60, formPts: 0, form: 0, parts: [part('rhr', -9), part('energy', -9)] });
    expect(a.level).toBe('easy');
    expect(a.good).toBe(false);
  });
  it('one very low value takes «ready» back to «normal»; a mild one does not', () => {
    expect(dayAnswer({ level: 'hard', score: 80, formPts: 10, form: 8, parts: [part('sleep', -16)] }).level).toBe('normal');
    expect(dayAnswer({ level: 'hard', score: 80, formPts: 10, form: 8, parts: [part('sleep', -10)] }).level).toBe('hard');
  });
  it('never raises the level, and leaves a clean day as it is', () => {
    const a = dayAnswer({ level: 'rest', score: 20, formPts: -30, form: -20, parts: [part('hrv', -9)] });
    expect(a.level).toBe('rest');
    expect(a.adjusted).toBe(false);
    const b = dayAnswer({ level: 'hard', score: 85, formPts: 15, form: 12, parts: [part('hrv', 8, { delta: 14 }), part('sleep', 7)] });
    expect(b.level).toBe('hard');
    expect(b.reasons.map((p) => p.key)).toEqual(['form', 'hrv']); // the two that help most
  });
  it('a tired day without low recovery values names the form', () => {
    const a = dayAnswer({ level: 'easy', score: 45, formPts: -20, form: -14, parts: [part('rhr', 0)] });
    expect(a.level).toBe('easy');
    expect(a.reasons.map((p) => p.key)).toEqual(['form']);
  });
  it('no readiness, no answer', () => {
    expect(dayAnswer(null)).toBeNull();
  });
  it('the sentences are the ones of «What counts today»', () => {
    const r = ready([part('hrv', -20, { delta: -42 }), part('sleep', -18, { v: 235 })]);
    const lines = answerWhy(dayAnswer(r));
    expect(lines.length).toBe(3); // HRV, sleep, and that the form does not outweigh them
  });
});

/** Normal HRV 50 and sleep 7 h 30 for 40 days, then the given last days (newest last, ending today). */
function table(last = [], { hrv = 50, sleep = 450, days = 40 } = {}) {
  const t = new Map();
  for (let i = days; i >= 1; i--) t.set(addDays(TODAY, -(last.length - 1) - i), { hrv: hrv + (i % 2), sleep: sleep + (i % 3) * 5 });
  last.forEach((v, i) => t.set(addDays(TODAY, -(last.length - 1 - i)), v));
  return t;
}

describe('valueAlert: HRV', () => {
  it('in the normal: nothing', () => {
    expect(valueAlert({ table: table([{ hrv: 49 }, { hrv: 51 }, { hrv: 50 }]), today: TODAY, key: 'hrv' }).state).toBe('none');
  });
  it('the last three days 15 % under the normal: «low» with the days in a row', () => {
    const r = valueAlert({ table: table([{ hrv: 40 }, { hrv: 41 }, { hrv: 40 }]), today: TODAY, key: 'hrv' });
    expect(r.state).toBe('low');
    expect(r.n).toBe(3);
    expect(r.pct).toBeGreaterThanOrEqual(15);
    expect(r.from).toBe('2026-11-21');
  });
  it('only the newest value far under it (−42 %): «lowNow»', () => {
    const r = valueAlert({ table: table([{ hrv: 50 }, { hrv: 50 }, { hrv: 29 }]), today: TODAY, key: 'hrv' });
    expect(r.state).toBe('lowNow');
    expect(r.pct).toBeGreaterThanOrEqual(40);
    expect(r.from).toBe(TODAY);
  });
  it('a marker on the newest day: nothing is judged; marked days stay out of the normal', () => {
    expect(valueAlert({ table: table([{ hrv: 20 }]), today: TODAY, key: 'hrv', marked: new Set([TODAY]) }).state).toBe('marked');
  });
  it('too few values for a normal, or none lately', () => {
    expect(valueAlert({ table: table([{ hrv: 30 }], { days: 5 }), today: TODAY, key: 'hrv' }).state).toBe('few');
    expect(valueAlert({ table: new Map(), today: TODAY, key: 'hrv' }).state).toBe('old');
  });
});

describe('valueAlert: sleep', () => {
  it('a night of 3 h 55 after a normal week: «lowNow»', () => {
    const r = valueAlert({ table: table([{ sleep: 450 }, { sleep: 440 }, { sleep: 235 }]), today: TODAY, key: 'sleep' });
    expect(r.state).toBe('lowNow');
    expect(r.value).toBe(235);
  });
  it('three short nights an hour under the normal: «low»', () => {
    const r = valueAlert({ table: table([{ sleep: 380 }, { sleep: 370 }, { sleep: 375 }]), today: TODAY, key: 'sleep' });
    expect(r.state).toBe('low');
    expect(r.gap).toBeGreaterThanOrEqual(60);
  });
  it('a good night: nothing', () => {
    expect(valueAlert({ table: table([{ sleep: 440 }, { sleep: 460 }, { sleep: 450 }]), today: TODAY, key: 'sleep' }).state).toBe('none');
  });
  it('valueAlerts gives HRV, then sleep', () => {
    expect(valueAlerts({ table: table([{ hrv: 29, sleep: 235 }]), today: TODAY }).map((v) => [v.key, v.state])).toEqual([['hrv', 'lowNow'], ['sleep', 'lowNow']]);
  });
});

describe('readiness() carries the answer in its level', () => {
  it('the same low values as the page: level «rest», the score and the level of the score stay', () => {
    const r = ready([part('rhr', 0), part('hrv', -20, { delta: -42 }), part('sleep', -18, { v: 235 })]);
    expect(r.score).toBe(42);
    expect(r.scoreLevel).toBe('easy');
    expect(r.level).toBe('rest');
    expect(dayAnswer(r).level).toBe('rest'); // asking again gives the same answer
    expect(dayAnswer(r).adjusted).toBe(true);
  });
  it('a day without low values keeps the level of the score', () => {
    const r = ready([part('rhr', 2), part('hrv', 5), part('sleep', 3)]);
    expect(r.level).toBe(r.scoreLevel);
  });
});
