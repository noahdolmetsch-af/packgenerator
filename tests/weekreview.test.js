// «Wochenrückblick» W1–W6 (Noah 15.10.2026 «1-5 a»): the pure rules of lib/weekreview.js.
// Fictional data only (test_data_gtp_); calendar days, never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { defaultMonday, weekParam, weekHref, weekSums, weekFive, weekStrip, weekNotes, weekHighs, weekAhead, diffText, dayValues, trainStreak, baseShare, hasAnything, summaryText, SLEEP_Q, MOOD_Q, MAX_NOTES } from '../src/lib/weekreview.js';
import { DEFAULT_BOUNDS, shiftDay } from '../src/lib/training.js';
import { normAct } from '../src/lib/flow.js';

const P = 'test_data_gtp_';
const MON = '2026-10-12'; // a Monday
const TODAY = '2026-10-18'; // its Sunday
const act = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '08:00', name: `${P}Runde ${id}`, type: 'Ride', kind: 'bike', km: 40, hm: 500, movingS: 5400, ...f });
const ACTS = [normAct({ id: 'bike', name: 'Bike', icon: 'bike', ring: 'move', goals: [{ id: 'g', count: 2, days: 7 }] }), normAct({ id: 'yoga', name: 'Yoga', icon: 'yoga', ring: 'move', goals: [{ id: 'g', count: 1, days: 7 }] }), normAct({ id: 'sauna', name: 'Sauna', icon: 'sauna', ring: 'rest', goals: [{ id: 'g', count: 1, days: 7 }] }), normAct({ id: 'meditation', name: 'Meditation', icon: 'lotus', ring: 'mind', goals: [{ id: 'g', count: 1, days: 1 }] })];
const entry = (actId, day, f = {}) => ({ id: `${P}${actId}-${day}`, actId, day, at: `${day}T10:00:00.000Z`, n: 1, ...f });

describe('which week', () => {
  it('on a Monday the week just finished, from Tuesday the running one', () => {
    expect(defaultMonday('2026-10-19')).toBe('2026-10-12');
    expect(defaultMonday('2026-10-20')).toBe('2026-10-19');
    expect(defaultMonday('2026-10-18')).toBe('2026-10-12'); // Sunday
  });
  it('?w= picks the week of any day, never a future week, else the default', () => {
    expect(weekParam('2026-10-07', TODAY)).toBe('2026-10-05');
    expect(weekParam('2026-12-01', TODAY)).toBe(MON);
    expect(weekParam('kaputt', '2026-10-19')).toBe(MON);
    expect(weekParam(null, '2026-10-21')).toBe('2026-10-19');
  });
  it('the default week has no ?w=', () => {
    expect(weekHref('2026-10-19', '2026-10-21')).toBe('#/flow/review');
    expect(weekHref(MON, '2026-10-21')).toBe('#/flow/review?w=2026-10-12');
  });
});

describe('W1 five numbers', () => {
  const data = {
    acts: [act('a', MON), act('b', '2026-10-15', { km: 55.5, hm: 900, movingS: 7200 }), act('c', '2026-10-07', { km: 30, hm: 300, movingS: 3600 })],
    log: [entry('bike', MON), entry('yoga', '2026-10-14'), entry('bike', '2026-10-14', { via: 'trip' })],
    flowActs: ACTS,
    tripDays: [],
  };
  it('sums hours, km, Hm; a ticked ride on a Strava day counts once, yoga counts as a session', () => {
    expect(weekSums(data, MON)).toEqual({ secs: 12600, km: 95.5, hm: 1400, n: 3 });
  });
  it('each number with its change against the week before, goals from Aktiv', () => {
    const five = weekFive(data, MON, TODAY);
    expect(five.map((f) => f.key)).toEqual(['hours', 'km', 'hm', 'n', 'goals']);
    expect(five[0]).toMatchObject({ value: 12600, prev: 3600, diff: 9000 });
    expect(five[1]).toMatchObject({ value: 95.5, prev: 30, diff: 65.5 });
    expect(five[3]).toMatchObject({ value: 3, prev: 1, diff: 2 });
    expect(five[4].of).toBe(4);
  });
  it('no goals row without Aktiv activities', () => {
    expect(weekFive({ ...data, flowActs: [] }, MON, TODAY).map((f) => f.key)).toEqual(['hours', 'km', 'hm', 'n']);
  });
  it('a change as people read it, neutral', () => {
    expect(diffText(4800, { seconds: true })).toBe('+1:20');
    expect(diffText(-12, { fmt: (x) => `${x}` })).toBe('−12');
    expect(diffText(0)).toBe('±0');
  });
});

describe('W2 the strip', () => {
  it('training, recovery and meditation per day; sleep and mood from the answers, else the daily check', () => {
    const data = {
      acts: [act('a', MON)],
      log: [entry('sauna', '2026-10-13'), entry('meditation', '2026-10-13'), entry('yoga', '2026-10-15')],
      flowActs: ACTS,
      tripDays: ['2026-10-17'],
      answers: [{ qid: SLEEP_Q, day: MON, value: 7 }, { qid: SLEEP_Q, day: MON, value: 8 }, { qid: MOOD_Q, day: '2026-10-13', value: 6 }],
      checks: [{ day: MON, sleep: 3 }, { day: '2026-10-14', sleep: 5, mood: 9 }],
    };
    const s = weekStrip(data, MON, '2026-10-16');
    expect(s.map((d) => d.kinds)).toEqual([['train'], ['rest', 'mind'], [], ['train'], [], ['train'], []]);
    expect(s.map((d) => d.sleep)).toEqual([7.5, null, 5, null, null, null, null]);
    expect(s.map((d) => d.mood)).toEqual([null, 6, 9, null, null, null, null]);
    expect(s.map((d) => d.future)).toEqual([false, false, false, false, false, true, true]);
  });
  it('dayValues ignores other questions and text answers', () => {
    expect([...dayValues({ answers: [{ qid: 'x.y', day: MON, value: 3 }, { qid: MOOD_Q, day: MON, value: 'gut' }] }, MOOD_Q)]).toEqual([]);
  });
});

describe('W3 the sentences', () => {
  const hist = { 100: 1800, 125: 1800, 150: 600 }; // with the default bounds: Z1 1800, Z2 1800, Z3 600 → 86 %
  const calm = { 100: 3600 }; // Z1 only → 100 %
  it('the plan: all done, or which day stayed open', () => {
    const acts = [act('a', MON)];
    const all = weekNotes({ acts, sessions: [{ day: MON, kind: 'bike', mins: 60 }], flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS);
    expect(all[0]).toMatchObject({ key: 'plan-all', kind: 'good', vars: { n: 1 } });
    const open = weekNotes({ acts, sessions: [{ day: MON, kind: 'bike', mins: 60 }, { day: '2026-10-14', kind: 'run', mins: 40 }], flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS);
    expect(open[0]).toMatchObject({ key: 'plan-open', kind: 'gap', vars: { n: 1, m: 2, day: '2026-10-14' } });
  });
  it('sleep below the own mean of the four weeks before', () => {
    const answers = [];
    for (let i = 1; i <= 20; i++) answers.push({ qid: SLEEP_Q, day: shiftDay(MON, -i), value: 7 });
    for (let i = 0; i < 4; i++) answers.push({ qid: SLEEP_Q, day: shiftDay(MON, i), value: 5 });
    expect(weekNotes({ answers, acts: [], flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS)).toEqual([{ key: 'sleep-low', kind: 'gap', vars: { a: 5, b: 7 } }]);
  });
  it('five days in a row without a day off, counted from before Monday', () => {
    const acts = ['2026-10-10', '2026-10-11', MON, '2026-10-13', '2026-10-14'].map((d, i) => act(`s${i}`, d));
    expect(trainStreak({ acts, log: [], flowActs: [] }, MON, TODAY)).toBe(5);
    expect(weekNotes({ acts, flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS).map((n) => n.key)).toContain('streak');
  });
  it('more hours than usual, and the Z1–Z2 share against its mean', () => {
    const acts = [];
    for (let w = 1; w <= 4; w++) acts.push(act(`p${w}`, shiftDay(MON, -7 * w), { movingS: 3600, hist: calm }));
    acts.push(act('now1', MON, { movingS: 7200, hist }), act('now2', '2026-10-16', { movingS: 7200, hist }));
    expect(baseShare(acts, MON, shiftDay(MON, 7), DEFAULT_BOUNDS)).toBe(86);
    const keys = weekNotes({ acts, flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS);
    expect(keys.find((n) => n.key === 'hours-more').vars).toEqual({ a: 14400, b: 3600 });
    expect(keys.find((n) => n.key === 'base-less').vars).toEqual({ n: 86, m: 100 });
  });
  it('never more than three, nothing without data', () => {
    expect(weekNotes({ acts: [], flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS)).toEqual([]);
    const acts = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', MON, '2026-10-13'].map((d, i) => act(`x${i}`, d, { movingS: i > 3 ? 20000 : 600 }));
    const answers = [];
    for (let i = 1; i <= 20; i++) answers.push({ qid: SLEEP_Q, day: shiftDay(MON, -i), value: 8 });
    for (let i = 0; i < 3; i++) answers.push({ qid: SLEEP_Q, day: shiftDay(MON, i), value: 4 });
    const out = weekNotes({ acts, answers, sessions: [{ day: '2026-10-15', kind: 'run', mins: 30 }], flowActs: [] }, MON, TODAY, DEFAULT_BOUNDS);
    expect(out.length).toBe(MAX_NOTES);
    expect(out.map((n) => n.key)).toEqual(['plan-open', 'sleep-low', 'streak']);
  });
});

describe('W4 highlights', () => {
  it('longest, best 20 minutes, most climbing and new best values against everything before', () => {
    const acts = [act('old', '2026-09-01', { km: 80, hm: 1500, movingS: 14000, wDevice: true, w20: 240 }), act('a', MON, { km: 92, hm: 900, movingS: 12000, wDevice: true, w20: 251 }), act('b', '2026-10-15', { km: 20, hm: 1200, movingS: 4000, wDevice: false, w20: 300 })];
    const h = weekHighs(acts, MON);
    expect(h.longest.id).toBe(`${P}a`);
    expect(h.w20.id).toBe(`${P}a`); // w20 without a power meter does not count
    expect(h.hm.id).toBe(`${P}b`);
    expect(h.bests.map((b) => [b.key, b.value, b.was])).toEqual([['km', 92, 80], ['w20', 251, 240]]);
  });
  it('nothing without an activity; no «new best» in the first week ever', () => {
    expect(weekHighs([], MON)).toBe(null);
    expect(weekHighs([act('a', MON)], MON).bests).toEqual([]);
  });
});

describe('W5 next week', () => {
  const weeks = (secs, extra = {}) => secs.map((s, i) => act(`w${i}`, shiftDay(MON, (i - 3) * 7), { movingS: s, ...extra }));
  it('three weeks of rising load → a calmer week', () => {
    expect(weekAhead(weeks([3600, 5400, 7200, 9000]), [], MON).key).toBe('calmer');
  });
  it('a quiet week → the usual rhythm again; otherwise keep it', () => {
    const back = weekAhead(weeks([7200, 7200, 7200, 1800]), [], MON);
    expect(back).toMatchObject({ key: 'back', usualSecs: 7200 });
    expect(weekAhead(weeks([7200, 5400, 7200, 6000]), [], MON).key).toBe('keep');
  });
  it('the load comes first (Relative Effort), and the plan of the week after', () => {
    const acts = weeks([7200, 7200, 7200, 7200]).map((a, i) => ({ ...a, effort: [40, 60, 80, 100][i] }));
    const plan = [{ day: '2026-10-20', kind: 'bike', mins: 90 }, { day: '2026-10-22', kind: 'run', mins: 30 }, { day: '2026-10-28', kind: 'run', mins: 30 }];
    const a = weekAhead(acts, plan, MON);
    expect(a.key).toBe('calmer');
    expect(a.plan).toEqual({ n: 2, mins: 120 });
    expect(a.kw).toBe(43);
  });
  it('nothing without any activity', () => {
    expect(weekAhead([], [], MON)).toBe(null);
  });
});

describe('W6 the text for Claude', () => {
  it('composes the week as plain text, with the question at the end', () => {
    const data = { acts: [act('a', MON, { km: 42.5 })], log: [], flowActs: [], answers: [{ qid: SLEEP_Q, day: MON, value: 6 }], checks: [] };
    const text = summaryText({ monday: MON, five: weekFive(data, MON, TODAY), strip: weekStrip(data, MON, TODAY), notes: [], highs: weekHighs(data.acts, MON), ahead: null });
    expect(text).toContain('My week from 2026-10-12 to 2026-10-18 (week 42):');
    expect(text).toContain('- Moving time 1:30 h (+1:30 against the week before)');
    expect(text).toContain('- Sleep (1–10): mean 6 on 1 days');
    expect(text).toContain('- Longest activity: 1:30 h, 42.5 km');
    expect(text).not.toContain(P); // no names of activities go out
    expect(text.trim().split('\n').at(-1)).toMatch(/^How was my week\?/);
  });
  it('hasAnything: an activity, an Aktiv entry or an answer', () => {
    expect(hasAnything({ acts: [], log: [], answers: [], checks: [] }, MON)).toBe(false);
    expect(hasAnything({ acts: [], log: [entry('yoga', '2026-10-14')] }, MON)).toBe(true);
  });
});
