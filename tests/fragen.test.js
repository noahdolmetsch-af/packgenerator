// «Fragen» (Plan 4a): the six answers of src/lib/fragen/fragen.js. Fictional data, calendar-day arithmetic only.
import { describe, it, expect } from 'vitest';
import { QUESTIONS, answerOf, allFew, MIN_SIDE, MIN_NIGHTS } from '../src/lib/fragen/fragen.js';
import { addDays } from '../src/lib/analyse.js';

const today = '2026-11-09';
/** A getter from a table { key: { day: value } } or { key: (day) => value }. */
const getter = (table) => (key) => (d) => {
  const x = table[key];
  return typeof x === 'function' ? x(d) : x?.[d] ?? null;
};
const back = (n) => addDays(today, -n);
const range = (from, to, f) => Object.fromEntries(Array.from({ length: from - to + 1 }, (_, i) => [back(from - i), f(from - i)]));

describe('the six questions', () => {
  it('are six, one per group, and an unknown one is «few»', () => {
    expect(QUESTIONS.map((q) => q.key)).toEqual(['koerper', 'tempo', 'tour', 'zusammen', 'velo', 'jahr']);
    expect(new Set(QUESTIONS.map((q) => q.group)).size).toBe(6);
    expect(answerOf('nope', { today, get: getter({}) }).state).toBe('few');
  });
  it('with no data at all every question says «few» and nothing throws', () => {
    const ctx = { today, get: getter({}), trips: [], endOf: () => null, bikes: [], dueOf: () => [] };
    const all = QUESTIONS.map((q) => answerOf(q.key, ctx));
    expect(all.every((a) => a.state === 'few')).toBe(true);
    expect(allFew(all)).toBe(true);
  });
});

describe('koerper: resting pulse against your usual range', () => {
  const rhr = (high) => range(59, 0, (n) => 52 + (n % 7) + (high && n < 4 ? 12 : 0));
  it('under 14 days with a value: few, with the count', () => {
    const a = answerOf('koerper', { today, get: getter({ rhr: range(9, 0, () => 55) }) });
    expect(a).toMatchObject({ state: 'few', n: 10, need: 14 });
  });
  it('in the range: the range and the 7-day mean, no run', () => {
    const a = answerOf('koerper', { today, get: getter({ rhr: rhr(false), sleep: range(6, 0, () => 400) }) });
    expect(a.state).toBe('ok');
    expect(a.run).toBe(null);
    expect(a.low).toBeLessThan(a.high);
    expect(a.sleep7).toBe(400);
  });
  it('4 days above the usual up to today: the run is named', () => {
    const a = answerOf('koerper', { today, get: getter({ rhr: rhr(true) }) });
    expect(a.run).toEqual({ side: 'above', n: 4 });
  });
  it('a run that ended a week ago is not «now»', () => {
    const old = range(59, 0, (n) => 52 + (n % 7) + (n >= 10 && n < 14 ? 12 : 0));
    expect(answerOf('koerper', { today, get: getter({ rhr: old }) }).run).toBe(null);
  });
});

describe('tempo: the last 90 days against the 90 before', () => {
  it('needs 5 ride days on each side', () => {
    expect(answerOf('tempo', { today, get: getter({ spd: range(30, 0, () => 25) }) })).toMatchObject({ state: 'few', nPrev: 0, need: MIN_SIDE });
  });
  it('says the difference of the means', () => {
    const spd = { ...range(80, 0, (n) => (n % 10 === 0 ? 26 : null)), ...range(170, 100, (n) => (n % 10 === 0 ? 24 : null)) };
    const a = answerOf('tempo', { today, get: getter({ spd }) });
    expect(a.state).toBe('ok');
    expect(a.diff).toBeCloseTo(2, 5);
  });
});

describe('tour: before and after the last finished tour', () => {
  const trip = { id: 7, title: 'Jura test', startDate: back(20), days: 3 };
  const endOf = (tr) => addDays(tr.startDate, tr.days - 1);
  const vals = { sleep: (d) => (d < trip.startDate ? 420 : 380), rhr: (d) => (d < trip.startDate ? 52 : 56) };
  it('no finished tour: few, «none»', () => {
    expect(answerOf('tour', { today, get: getter(vals), trips: [{ ...trip, startDate: addDays(today, 5) }], endOf })).toMatchObject({ state: 'few', why: 'none' });
  });
  it('a tour that ended yesterday: too few days after it', () => {
    const t = { ...trip, startDate: back(3) };
    expect(answerOf('tour', { today, get: getter(vals), trips: [t], endOf })).toMatchObject({ state: 'few', why: 'recent' });
  });
  it('a finished tour: sleep and pulse before and after, and the number of tours', () => {
    const a = answerOf('tour', { today, get: getter(vals), trips: [trip, { id: 6, title: 'old', startDate: back(200), days: 1 }], endOf });
    expect(a).toMatchObject({ state: 'ok', id: 7, name: 'Jura test', tours: 2, sleep: { before: 420, after: 380 }, rhr: { before: 52, after: 56 } });
  });
});

describe('zusammen: sleep after a day with a ride', () => {
  it('needs 8 nights on each side', () => {
    const a = answerOf('zusammen', { today, get: getter({ kmAll: range(30, 1, (n) => (n % 2 ? 40 : 0)), sleep: range(30, 0, () => 400) }) });
    expect(a.state).toBe('ok'); // 15 and 15 nights
    const b = answerOf('zusammen', { today, get: getter({ kmAll: range(30, 1, () => 40), sleep: range(30, 0, () => 400) }) });
    expect(b).toMatchObject({ state: 'few', need: MIN_NIGHTS });
    expect(b.nOther).toBeLessThan(MIN_NIGHTS);
  });
  it('compares the NEXT night: a ride on day d, the sleep of day d+1', () => {
    const km = (d) => (d === back(10) ? 50 : 0);
    const sleep = (d) => (d === back(9) ? 300 : 420);
    const ride = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [back(i + 1), i % 5 === 0 ? 30 : 0]));
    const a = answerOf('zusammen', { today, get: getter({ kmAll: (d) => ride[d] ?? km(d), sleep: (d) => (ride[addDays(d, -1)] > 0 ? 330 : sleep(d) && 420) }) });
    expect(a.state).toBe('ok');
    expect(a.after).toBe(330);
    expect(a.other).toBe(420);
    expect(a.diff).toBe(-90);
  });
});

describe('velo: what is due', () => {
  it('no bike: few', () => {
    expect(answerOf('velo', { bikes: [], dueOf: () => [] })).toMatchObject({ state: 'few', n: 0 });
  });
  it('lists the bikes with due points and their total; nothing due is an answer too', () => {
    const bikes = [{ id: 'a', name: 'Gravel test' }, { id: 'b', name: 'Road test' }];
    const a = answerOf('velo', { bikes, dueOf: (b) => (b.id === 'a' ? ['Chain', 'Tyres'] : []) });
    expect(a).toMatchObject({ state: 'ok', n: 2, total: 2 });
    expect(a.due).toEqual([{ id: 'a', name: 'Gravel test', due: ['Chain', 'Tyres'] }]);
    expect(answerOf('velo', { bikes, dueOf: () => [] })).toMatchObject({ state: 'ok', total: 0, due: [] });
  });
});

describe('jahr: this year against last up to the same date', () => {
  it('needs ride days in both years', () => {
    expect(answerOf('jahr', { today, get: getter({ kmAll: range(40, 0, () => 30) }) }).state).toBe('few');
  });
  it('the running total up to the same date, with the difference', () => {
    const km = (d) => (d.startsWith('2026') ? 20 : d.startsWith('2025') ? 10 : null);
    const a = answerOf('jahr', { today: '2026-03-10', get: getter({ kmAll: km }) });
    expect(a.state).toBe('ok');
    expect(a.now).toBe(20 * 69); // 1 Jan to 10 Mar 2026: 69 days
    expect(a.prev).toBe(10 * 69);
    expect(a.diff).toBe(10 * 69);
    expect(a.year).toBe(2026);
  });
});
