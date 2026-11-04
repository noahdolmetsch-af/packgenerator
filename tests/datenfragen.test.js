import { describe, it, expect } from 'vitest';
import { setVal, setText, ruleVal, ruleText, resetRule, ruleChanged, dataDue, ruhepulsHit, schlafHit, stimmungHit, trainingHit, pauseHit, trainingDays, moodByDay, dataOf, setRule, ruleOn, MAX_PER_DAY, GAP_DAYS, DATA_QUESTIONS, RULES } from '../src/lib/datenfragen.js';
import { QUESTION, QUESTIONS, answerRow } from '../src/lib/abfragen.js';

const TODAY = '2026-11-03';
const add = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** n days before today with the same resting pulse, then today's. */
const health = (usual, today, n = 20) => [...Array.from({ length: n }, (_, i) => ({ date: add(TODAY, -(i + 1)), restingHr: usual })), ...(today == null ? [] : [{ date: TODAY, restingHr: today }])];

/** n days of mood answers before today (the same value), then the last three. */
const moods = (usual, last, n = 20) => [
  ...Array.from({ length: n }, (_, i) => ({ qid: 'spass.stimmung', day: add(TODAY, -(i + 3)), value: usual })),
  ...last.map((v, i) => ({ qid: 'spass.stimmung', day: add(TODAY, i - 2), value: v })),
];

describe('Fragen aus deinen Daten', () => {
  it('asks when the resting pulse is 5 or more above the usual', () => {
    expect(ruhepulsHit(health(52, 57), TODAY)).toEqual({ v: 57, normal: 52 });
    expect(ruhepulsHit(health(52, 61), TODAY)).toEqual({ v: 61, normal: 52 });
    expect(ruhepulsHit(health(52, 56), TODAY)).toBeNull();
    expect(ruhepulsHit(health(52, 45), TODAY)).toBeNull(); // lower is never asked about
  });
  it('needs today and at least 7 days before', () => {
    expect(ruhepulsHit(health(52, null), TODAY)).toBeNull();
    expect(ruhepulsHit(health(52, 70, 6), TODAY)).toBeNull();
    expect(ruhepulsHit(health(52, 70, 7), TODAY)).not.toBeNull();
  });
  it('gives the question with its reason', () => {
    const [d] = dataDue({ health: health(52, 61), today: TODAY });
    expect(d.q.id).toBe('daten.ruhepuls');
    expect(d.data).toBe(true);
    expect(d.why.vars).toEqual({ v: 61, normal: 52 });
    expect(d.slot).toBe(`${TODAY}T07:00`);
  });
  it('is quiet without a standout value, when switched off, put away today, or answered lately', () => {
    expect(dataDue({ health: health(52, 53), today: TODAY })).toEqual([]);
    expect(dataDue({ health: health(52, 61), today: TODAY, cfg: setRule(null, 'ruhepuls', false) })).toEqual([]);
    expect(dataDue({ health: health(52, 61), today: TODAY, snooze: { 'daten.ruhepuls': `${TODAY}T23:59` } })).toEqual([]);
    expect(dataDue({ health: health(52, 61), today: TODAY, snooze: { 'daten.ruhepuls': `${add(TODAY, -1)}T23:59` } })).toHaveLength(1);
    const answered = (n) => [{ qid: 'daten.ruhepuls', day: add(TODAY, -n) }];
    for (let n = 0; n < GAP_DAYS; n++) expect(dataDue({ health: health(52, 61), today: TODAY, answers: answered(n) })).toEqual([]);
    expect(dataDue({ health: health(52, 61), today: TODAY, answers: answered(GAP_DAYS) })).toHaveLength(1);
  });
  it('never asks more than the day allows', () => {
    expect(MAX_PER_DAY).toBe(3);
    expect(dataDue({ health: health(52, 61), today: TODAY }).length).toBeLessThanOrEqual(MAX_PER_DAY);
  });
  it('keeps the switches safe', () => {
    expect(dataOf(null)).toEqual({ off: [], vals: {}, texts: {} });
    expect(dataOf({ off: ['ruhepuls', 'ruhepuls', 'nope', 3] }).off).toEqual(['ruhepuls']);
    expect(ruleOn(setRule(null, 'ruhepuls', false), 'ruhepuls')).toBe(false);
    expect(ruleOn(setRule({ off: ['ruhepuls'] }, 'ruhepuls', true), 'ruhepuls')).toBe(true);
  });
  it('every rule has its question, German-ready texts, and an answer that reaches the history', () => {
    for (const r of RULES) {
      const q = DATA_QUESTIONS[r.qid];
      expect(q).toBeTruthy();
      expect(QUESTION[q.id]).toBe(q);
      expect(QUESTIONS.some((x) => x.id === q.id)).toBe(false); // not in the list of the page «Deine Abfragen»
    }
    const q = DATA_QUESTIONS['daten.ruhepuls'];
    const row = answerRow(q, ['alcohol', 'stress'], { at: `${TODAY}T07:10`, slot: `${TODAY}T07:00` });
    expect(row).toMatchObject({ qid: 'daten.ruhepuls', day: TODAY, value: ['alcohol', 'stress'], kind: 'chips' });
    expect(answerRow(q, null, { at: `${TODAY}T07:10`, note: 'Spätes Training' }).note).toBe('Spätes Training');
  });

  it('short night: asks under 6 hours asleep, nothing without a value', () => {
    const night = (asleepMin) => [{ date: TODAY, sleep: asleepMin == null ? undefined : { asleepMin } }];
    expect(schlafHit(night(300), TODAY)).toEqual({ h: 5, m: 0 });
    expect(schlafHit(night(345), TODAY)).toEqual({ h: 5, m: 45 });
    expect(schlafHit(night(360), TODAY)).toBeNull();
    expect(schlafHit(night(null), TODAY)).toBeNull();
    expect(schlafHit([], TODAY)).toBeNull();
    const [d] = dataDue({ health: night(300), today: TODAY });
    expect(d.q.id).toBe('daten.schlaf');
    expect(d.why.vars).toEqual({ h: 5, m: 0 });
  });
  it('low mood: three days in a row clearly below the usual', () => {
    expect(stimmungHit(moods(7, [5, 5, 5]), [], TODAY)).toEqual({ a: 5, b: 5, c: 5, usual: 7 });
    expect(stimmungHit(moods(7, [5, 8, 5]), [], TODAY)).toBeNull(); // a good day in between
    expect(stimmungHit(moods(7, [6.5, 6, 6]), [], TODAY)).toBeNull(); // not clearly below
    expect(stimmungHit(moods(7, [5, 5]), [], TODAY)).toBeNull(); // only two days answered
    expect(stimmungHit(moods(7, [5, 5, 5], 6), [], TODAY)).toBeNull(); // too few days for a usual
    const [d] = dataDue({ answers: moods(7, [4, 5, 4]), today: TODAY });
    expect(d.q.id).toBe('daten.stimmung');
    expect(d.why.vars.usual).toBe(7);
  });
  it('the mood also reads the old daily check, averaged with an answer of the same day', () => {
    const checks = [{ day: TODAY, mood: 4 }];
    expect(moodByDay([{ qid: 'spass.stimmung', day: TODAY, value: 6 }], checks)[TODAY]).toBe(5);
    expect(moodByDay([{ qid: 'koerper.waage', day: TODAY, value: 72 }], [])[TODAY]).toBeUndefined();
  });
  it('the day allows 3, and an answered one counts', () => {
    const hr = health(52, 61);
    const sleep = [{ date: TODAY, restingHr: 61, sleep: { asleepMin: 300 } }, ...hr.slice(0, -1)];
    const all = dataDue({ health: sleep, answers: moods(7, [4, 5, 4]), today: TODAY });
    expect(all.map((x) => x.q.id)).toEqual(['daten.ruhepuls', 'daten.schlaf', 'daten.stimmung']);
    const left = dataDue({ health: sleep, answers: [...moods(7, [4, 5, 4]), { qid: 'daten.ruhepuls', day: TODAY }, { qid: 'daten.schlaf', day: TODAY }], today: TODAY });
    expect(left.map((x) => x.q.id)).toEqual(['daten.stimmung']);
  });

  it('thresholds and texts: set, kept inside their limits, back to standard', () => {
    let c = setVal(null, 'ruhepuls', 8);
    expect(ruleVal(c, 'ruhepuls')).toBe(8);
    expect(ruleChanged(c, 'ruhepuls')).toBe(true);
    expect(ruleVal(setVal(c, 'ruhepuls', 99), 'ruhepuls')).toBe(5); // outside its limits: the default counts
    expect(ruleVal(setVal(c, 'ruhepuls', ''), 'ruhepuls')).toBe(5);
    expect(ruleVal(setVal(c, 'ruhepuls', 5), 'ruhepuls')).toBe(5);
    expect(ruleVal(setVal(null, 'schlaf', 6.5), 'schlaf')).toBe(6.5);
    c = setText(c, 'ruhepuls', '  Was war gestern los?  ');
    expect(ruleText(c, 'ruhepuls')).toBe('Was war gestern los?');
    expect(ruleText(setText(c, 'ruhepuls', '   '), 'ruhepuls')).toBeNull();
    expect(ruleText(setText(c, 'ruhepuls', DATA_QUESTIONS['daten.ruhepuls'].text), 'ruhepuls')).toBeNull();
    const off = setRule(c, 'ruhepuls', false);
    expect(dataOf(off).vals.ruhepuls).toBe(8); // the switch keeps the settings
    const back = resetRule(off, 'ruhepuls');
    expect(ruleChanged(back, 'ruhepuls')).toBe(false);
    expect(dataOf(back).off).toEqual(['ruhepuls']); // reset does not switch it back on
  });
  it('the engine uses the threshold and the wording of the person', () => {
    expect(dataDue({ health: health(52, 56), today: TODAY })).toEqual([]);
    const c = setText(setVal(null, 'ruhepuls', 3), 'ruhepuls', 'Was war gestern anders?');
    const [d] = dataDue({ health: health(52, 56), today: TODAY, cfg: c });
    expect(d.q.text).toBe('Was war gestern anders?');
    expect(d.q.edited).toBe(true);
    expect(d.q.id).toBe('daten.ruhepuls');
    expect(schlafHit([{ date: TODAY, sleep: { asleepMin: 380 } }], TODAY)).toBeNull();
    expect(schlafHit([{ date: TODAY, sleep: { asleepMin: 380 } }], TODAY, 7)).toEqual({ h: 6, m: 20 });
    const four = [...Array.from({ length: 20 }, (_, i) => ({ qid: 'spass.stimmung', day: add(TODAY, -(i + 4)), value: 7 })), ...[5, 5, 5, 5].map((v, i) => ({ qid: 'spass.stimmung', day: add(TODAY, i - 3), value: v }))];
    expect(stimmungHit(four, [], TODAY, 4)).toMatchObject({ days: 4, usual: 7 });
    const two = [...Array.from({ length: 20 }, (_, i) => ({ qid: 'spass.stimmung', day: add(TODAY, -(i + 2)), value: 7 })), ...[5, 5].map((v, i) => ({ qid: 'spass.stimmung', day: add(TODAY, i - 1), value: v }))];
    expect(stimmungHit(two, [], TODAY, 2)).toMatchObject({ days: 2 });
  });

  it('a long day yesterday asks about the legs, with the time as the reason', () => {
    const acts = [{ day: add(TODAY, -1), movingS: 2 * 3600 }, { day: add(TODAY, -1), movingS: 1.5 * 3600 }];
    expect(trainingHit(acts, TODAY)).toEqual({ h: 3, m: 30 });
    expect(trainingHit([{ day: add(TODAY, -1), movingS: 2 * 3600 }], TODAY)).toBeNull(); // under 3 h
    expect(trainingHit([{ day: TODAY, movingS: 5 * 3600 }, { day: add(TODAY, -2), movingS: 5 * 3600 }], TODAY)).toBeNull(); // only yesterday counts
    expect(trainingHit(acts, TODAY, 2)).toEqual({ h: 3, m: 30 });
    expect(trainingHit([{ day: add(TODAY, -1) }], TODAY, 1)).toBeNull(); // no time: nothing
    const [d] = dataDue({ acts, today: TODAY });
    expect(d.q.id).toBe('daten.training');
    expect(d.why.vars).toEqual({ h: 3, m: 30 });
    expect(dataDue({ acts, today: TODAY, cfg: setRule(null, 'training', false) })).toEqual([]);
    expect(RULES.map((r) => r.id)).toContain('training');
  });
  describe('Pause vom Training', () => {
    const act = (n) => ({ id: `a${n}`, day: add(TODAY, n), movingS: 3600 });
    it('asks when no training was logged for 4 days or more, counted from the last one', () => {
      expect(pauseHit([act(-4)], [], TODAY)).toEqual({ n: 4 });
      expect(pauseHit([act(-3)], [], TODAY)).toBeNull();
      expect(pauseHit([act(-9), act(-6)], [], TODAY)).toEqual({ n: 6 });
      expect(pauseHit([act(-9)], [], TODAY, 10)).toBeNull();
      expect(pauseHit([], [], TODAY)).toBeNull(); // nothing to count from
      expect(pauseHit([act(0)], [], TODAY)).toBeNull();
    });
    it('a tennis game or lesson counts as training, other sport items do not', () => {
      const played = (n) => ({ sport: 'act:tennis', kind: 'played', day: add(TODAY, n) });
      expect(pauseHit([act(-8)], [played(-2)], TODAY)).toBeNull();
      expect(pauseHit([act(-8)], [{ sport: 'act:tennis', kind: 'slot', day: add(TODAY, -1) }, { sport: 'act:run', kind: 'played', day: add(TODAY, -1) }], TODAY)).toEqual({ n: 8 });
      expect([...trainingDays([act(-1)], [played(-2)])].sort()).toEqual([add(TODAY, -2), add(TODAY, -1)]);
    });
    it('gives the question with its reason and respects the switch', () => {
      const [d] = dataDue({ acts: [act(-6)], today: TODAY });
      expect(d.q.id).toBe('daten.pause');
      expect(d.why.vars).toEqual({ n: 6 });
      expect(dataDue({ acts: [act(-6)], today: TODAY, cfg: setRule(null, 'pause', false) })).toEqual([]);
      expect(RULES.map((r) => r.id)).toContain('pause');
    });
  });
});
