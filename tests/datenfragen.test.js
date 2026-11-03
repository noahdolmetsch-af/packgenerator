import { describe, it, expect } from 'vitest';
import { dataDue, ruhepulsHit, dataOf, setRule, ruleOn, MAX_PER_DAY, GAP_DAYS, DATA_QUESTIONS, RULES } from '../src/lib/datenfragen.js';
import { QUESTION, QUESTIONS, answerRow } from '../src/lib/abfragen.js';

const TODAY = '2026-11-03';
const add = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** n days before today with the same resting pulse, then today's. */
const health = (usual, today, n = 20) => [...Array.from({ length: n }, (_, i) => ({ date: add(TODAY, -(i + 1)), restingHr: usual })), ...(today == null ? [] : [{ date: TODAY, restingHr: today }])];

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
    expect(dataOf(null)).toEqual({ off: [] });
    expect(dataOf({ off: ['ruhepuls', 'ruhepuls', 'nope', 3] })).toEqual({ off: ['ruhepuls'] });
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
});
