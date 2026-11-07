import { describe, it, expect } from 'vitest';
import { setVal, setText, ruleVal, ruleText, resetRule, ruleChanged, dataDue, noteSkip, clearSkips, setGap, ruleGap, fewerOffer, SKIP_OFFER, FEWER_GAP, ruhepulsHit, schlafHit, stimmungHit, trainingHit, pauseHit, trainingDays, spielHit, platzHit, grauHit, draussenHit, eveningBusy, todoHit, vermutungHit, randomPick, randomOn, setRandom, neverAgain, bringBack, neverCount, moodByDay, dataOf, setRule, ruleOn, MAX_PER_DAY, GAP_DAYS, DATA_QUESTIONS, RULES, VALUES, valueNow, customRule, customHit, condOf, ruleList, moveRule, setRuleName, ruleName, dropRule, restoreRule, goneRules } from '../src/lib/datenfragen.js';
import { QUESTION, QUESTIONS, answerRow, newOwn, putOwn, allQuestions, settingOf, dueList, counts, configOf, deleteQuestion } from '../src/lib/abfragen.js';

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
    expect(dataOf(null)).toEqual({ off: [], vals: {}, texts: {}, gaps: {}, skips: {}, names: {}, gone: [], order: [], zufall: { off: false, never: [], day: '' } });
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
  describe('Tennis', () => {
    const played = (n, min = 90) => ({ sport: 'act:tennis', kind: 'played', day: add(TODAY, n), min });
    const slot = (n, answer) => ({ sport: 'act:tennis', kind: 'slot', day: add(TODAY, n), answer });
    it('after a game: asks the day after, for a game of 30 minutes or more', () => {
      expect(spielHit([played(-1)], TODAY)).toEqual({ min: 90 });
      expect(spielHit([played(-1, 20)], TODAY)).toBeNull();
      expect(spielHit([played(-1, 20)], TODAY, 15)).toEqual({ min: 20 });
      expect(spielHit([played(0)], TODAY)).toBeNull();
      expect(spielHit([played(-2)], TODAY)).toBeNull();
      expect(spielHit([{ ...played(-1), sport: 'act:run' }], TODAY)).toBeNull();
      expect(spielHit([], TODAY)).toBeNull();
      const [d] = dataDue({ sport: [played(-1, 60)], today: TODAY });
      expect(d.q.id).toBe('daten.spiel');
      expect(d.why.vars).toEqual({ min: 60 });
    });
    it('court time that did not happen: «not played» in the last 2 days, no game that day', () => {
      expect(platzHit([slot(-1, 'skipped')], TODAY)).toEqual({ day: add(TODAY, -1) });
      expect(platzHit([slot(-2, 'skipped')], TODAY)).not.toBeNull();
      expect(platzHit([slot(-3, 'skipped')], TODAY)).toBeNull();
      expect(platzHit([slot(-3, 'skipped')], TODAY, 3)).not.toBeNull();
      expect(platzHit([slot(-1, 'played')], TODAY)).toBeNull();
      expect(platzHit([slot(-1, null)], TODAY)).toBeNull(); // still open: «Gespielt?» on the tennis page asks first
      expect(platzHit([slot(-1, 'skipped'), played(-1)], TODAY)).toBeNull(); // played another time that day
      expect(platzHit([slot(0, 'skipped')], TODAY)).toBeNull();
      const [d] = dataDue({ sport: [slot(-1, 'skipped')], today: TODAY });
      expect(d.q.id).toBe('daten.platz');
      expect(dataDue({ sport: [slot(-1, 'skipped')], today: TODAY, cfg: setRule(null, 'platz', false) })).toEqual([]);
    });
  });
  describe('Wiederholungsschutz', () => {
    const sleepAndPulse = [{ date: TODAY, restingHr: 61, sleep: { asleepMin: 300 } }, ...health(52, null)];
    const trainAndPause = (n) => [{ id: 'a', day: add(TODAY, -n), movingS: 5 * 3600 }];
    it('never two questions from the same group on a day, answered or put away ones count', () => {
      // training (sport) and pause (sport): a long day yesterday AND a pause is not possible, so use rule order with two sport hits via a stale activity day
      const acts = [{ id: 'a', day: add(TODAY, -1), movingS: 4 * 3600 }];
      expect(dataDue({ acts, today: TODAY }).map((x) => x.q.id)).toEqual(['daten.training']);
      // the group sport is used by the answered pause question: no second sport question
      const answered = [{ qid: 'daten.pause', day: TODAY }];
      expect(dataDue({ acts, answers: answered, today: TODAY }).map((x) => x.q.id)).toEqual([]);
      // a skipped one keeps its group used for today
      expect(dataDue({ acts, snooze: { 'daten.pause': `${TODAY}T23:59` }, today: TODAY })).toEqual([]);
      // different groups still come together
      expect(dataDue({ health: sleepAndPulse, today: TODAY }).map((x) => x.q.id)).toEqual(['daten.ruhepuls', 'daten.schlaf']);
    });
    it('counts skips once a day and offers to ask less often after three', () => {
      let c = null;
      c = noteSkip(c, 'ruhepuls', add(TODAY, -2));
      c = noteSkip(c, 'ruhepuls', add(TODAY, -2));
      expect(dataOf(c).skips.ruhepuls).toEqual({ n: 1, day: add(TODAY, -2) });
      c = noteSkip(noteSkip(c, 'ruhepuls', add(TODAY, -1)), 'ruhepuls', TODAY);
      expect(dataOf(c).skips.ruhepuls.n).toBe(SKIP_OFFER);
      expect(fewerOffer(c, 'ruhepuls')).toBe(true);
      expect(fewerOffer(c, 'schlaf')).toBe(false);
      const [d] = dataDue({ health: health(52, 61), cfg: c, today: TODAY });
      expect(d.fewer).toBe(true);
      // an answer or «keep it» ends the count
      expect(fewerOffer(clearSkips(c, 'ruhepuls'), 'ruhepuls')).toBe(false);
    });
    it('«less often» makes the gap longer for that rule only; back to standard resets it', () => {
      const c = setGap(null, 'ruhepuls', FEWER_GAP);
      expect(ruleGap(c, 'ruhepuls')).toBe(FEWER_GAP);
      expect(ruleGap(c, 'schlaf')).toBe(GAP_DAYS);
      expect(ruleChanged(c, 'ruhepuls')).toBe(true);
      const answered = (n) => [{ qid: 'daten.ruhepuls', day: add(TODAY, -n) }];
      expect(dataDue({ health: health(52, 61), cfg: c, answers: answered(GAP_DAYS), today: TODAY })).toEqual([]);
      expect(dataDue({ health: health(52, 61), cfg: c, answers: answered(FEWER_GAP), today: TODAY })).toHaveLength(1);
      expect(fewerOffer(setGap(noteSkip(noteSkip(noteSkip(c, 'ruhepuls', 'x'), 'ruhepuls', add(TODAY, -1)), 'ruhepuls', TODAY), 'ruhepuls', FEWER_GAP), 'ruhepuls')).toBe(false); // already asking less often
      const back = resetRule(c, 'ruhepuls');
      expect(ruleGap(back, 'ruhepuls')).toBe(GAP_DAYS);
      expect(dataOf({ gaps: { ruhepuls: 99, schlaf: 2 }, skips: { ruhepuls: { n: 0, day: 'x' } } })).toMatchObject({ gaps: {}, skips: {} });
    });
  });
  describe('Wetter', () => {
    const wx = (o = {}) => ({ date: TODAY, min: 8, max: 19, rainMm: 0, rainPct: 10, ...o });
    const ev = (start, end, o = {}) => ({ id: start, day: start.slice(0, 10), start, end, ...o });
    it('grey day: rain likely and the latest mood clearly below the usual', () => {
      const m = [...moods(7, []), { qid: 'spass.stimmung', day: add(TODAY, -1), value: 5 }];
      expect(grauHit(wx({ rainPct: 80 }), m, [], TODAY)).toEqual({ mood: 5, usual: 7 });
      expect(grauHit(wx({ rainPct: 50 }), m, [], TODAY)).toBeNull();
      expect(grauHit(wx({ rainPct: 50 }), m, [], TODAY, 40)).not.toBeNull();
      expect(grauHit(wx({ rainMm: 6, rainPct: 10 }), m, [], TODAY)).not.toBeNull(); // 5 mm or more is a rainy day by itself
      expect(grauHit(wx({ rainPct: 80 }), [...moods(7, []), { qid: 'spass.stimmung', day: add(TODAY, -1), value: 6.5 }], [], TODAY)).toBeNull(); // not clearly below
      expect(grauHit(wx({ rainPct: 80, date: add(TODAY, 1) }), m, [], TODAY)).toBeNull(); // forecast of another day
      expect(grauHit(null, m, [], TODAY)).toBeNull();
      expect(grauHit(wx({ rainPct: 80 }), moods(7, []), [], TODAY)).toBeNull(); // no recent mood
    });
    it('grey day: today\'s mood wins over yesterday\'s', () => {
      const m = [...moods(7, []), { qid: 'spass.stimmung', day: add(TODAY, -1), value: 4 }, { qid: 'spass.stimmung', day: TODAY, value: 7 }];
      expect(grauHit(wx({ rainPct: 80 }), m, [], TODAY)).toBeNull();
    });
    it('evening: only a busy appointment between 17 and 22 (Zurich) counts', () => {
      const d = TODAY; // 3 November: winter time, UTC+1
      expect(eveningBusy([ev(`${d}T17:30:00Z`, `${d}T18:30:00Z`)], d)).toBe(true); // 18:30–19:30 local
      expect(eveningBusy([ev(`${d}T08:00:00Z`, `${d}T09:00:00Z`)], d)).toBe(false);
      expect(eveningBusy([ev(`${d}T21:30:00Z`, `${d}T22:30:00Z`)], d)).toBe(false); // starts 22:30 local
      expect(eveningBusy([ev(`${d}T15:00:00Z`, `${d}T16:00:00Z`)], d)).toBe(false); // 16:00–17:00 local ends at 17:00: not busy
      expect(eveningBusy([ev(`${d}T15:00:00Z`, `${d}T16:30:00Z`)], d)).toBe(true); // until 17:30 local
      expect(eveningBusy([ev(`${d}T17:30:00Z`, `${d}T18:30:00Z`, { allDay: true })], d)).toBe(false);
      expect(eveningBusy([ev(`${d}T17:30:00Z`, `${d}T18:30:00Z`, { busy: false })], d)).toBe(false);
      expect(eveningBusy([], d)).toBe(false);
    });
    it('fine weather: dry, warm and a free evening in a calendar that is in use', () => {
      const cal = { used: true, events: [] };
      expect(draussenHit(wx(), cal, TODAY)).toEqual({ max: 19 });
      expect(draussenHit(wx({ max: 12 }), cal, TODAY)).toBeNull();
      expect(draussenHit(wx({ max: 12 }), cal, TODAY, 10)).not.toBeNull();
      expect(draussenHit(wx({ rainPct: 40 }), cal, TODAY)).toBeNull();
      expect(draussenHit(wx({ rainMm: 1 }), cal, TODAY)).toBeNull();
      expect(draussenHit(wx(), { used: false, events: [] }, TODAY)).toBeNull(); // no calendar: we cannot know the evening
      expect(draussenHit(wx(), { used: true, events: [ev(`${TODAY}T18:00:00Z`, `${TODAY}T19:00:00Z`)] }, TODAY)).toBeNull();
      expect(draussenHit(wx(), null, TODAY)).toBeNull();
    });
    it('both ask through dataDue, with their reason and their switch', () => {
      const m = [...moods(7, []), { qid: 'spass.stimmung', day: add(TODAY, -1), value: 5 }];
      const [a] = dataDue({ wx: wx({ rainPct: 90 }), answers: m, today: TODAY });
      expect(a.q.id).toBe('daten.grau');
      expect(a.why.vars).toEqual({ mood: 5, usual: 7 });
      const [b] = dataDue({ wx: wx(), cal: { used: true, events: [] }, today: TODAY });
      expect(b.q.id).toBe('daten.draussen');
      expect(dataDue({ wx: wx(), cal: { used: true, events: [] }, today: TODAY, cfg: setRule(null, 'draussen', false) })).toEqual([]);
      expect(RULES.map((r) => r.id)).toEqual(expect.arrayContaining(['grau', 'draussen']));
    });
  });

  describe('To-Dos: ein festgefahrenes To-Do', () => {
    const task = (due, extra = {}) => ({ id: `t${due}`, list: 'l', title: 'test_data_gtp_ Steuern', due, done: false, ...extra });
    const tasks = (...open) => ({ used: true, open });
    it('takes the open to-do that is longest past its date, from 5 days on', () => {
      expect(todoHit(tasks(task(add(TODAY, -5))), TODAY)).toEqual({ title: 'test_data_gtp_ Steuern', days: 5 });
      expect(todoHit(tasks(task(add(TODAY, -4))), TODAY)).toBeNull();
      expect(todoHit(tasks(task(add(TODAY, -4))), TODAY, 3)).toEqual({ title: 'test_data_gtp_ Steuern', days: 4 });
      expect(todoHit(tasks(task(add(TODAY, -6), { title: 'a' }), task(add(TODAY, -20), { title: 'b' })), TODAY)).toEqual({ title: 'b', days: 20 });
    });
    it('counts neither done, dated-in-future or undated nor sub-tasks', () => {
      expect(todoHit(tasks(task(add(TODAY, -9), { done: true })), TODAY)).toBeNull();
      expect(todoHit(tasks(task(add(TODAY, -9), { parent: 'p' })), TODAY)).toBeNull();
      expect(todoHit(tasks(task(add(TODAY, 3))), TODAY)).toBeNull();
      expect(todoHit(tasks(task(TODAY)), TODAY)).toBeNull();
      expect(todoHit(tasks(task('')), TODAY)).toBeNull();
    });
    it('needs Google tasks on this device', () => {
      expect(todoHit({ used: false, open: [] }, TODAY)).toBeNull();
      expect(todoHit(null, TODAY)).toBeNull();
    });
    it('asks through dataDue with its reason, with and without a title, and has a switch', () => {
      const [a] = dataDue({ tasks: tasks(task(add(TODAY, -7))), today: TODAY });
      expect(a.q.id).toBe('daten.todo');
      expect(a.why.vars).toEqual({ title: 'test_data_gtp_ Steuern', days: 7 });
      expect(a.why.text).toContain('{title}');
      const [b] = dataDue({ tasks: tasks(task(add(TODAY, -7), { title: '' })), today: TODAY });
      expect(b.why.text).not.toContain('{title}');
      expect(dataDue({ tasks: tasks(task(add(TODAY, -7))), today: TODAY, cfg: setRule(null, 'todo', false) })).toEqual([]);
    });
  });

  describe('Zufallsfrage', () => {
    const pool = ['a.eins', 'a.zwei', 'b.drei', 'c.vier'].map((id) => ({ id, area: id[0] === 'a' ? 'erholung' : 'spass', text: id, sample: true }));
    it('picks one question for the day, the same all day, another one on other days', () => {
      const p = randomPick(pool, [], null, TODAY);
      expect(pool.map((x) => x.id)).toContain(p.id);
      expect(randomPick(pool, [], null, TODAY).id).toBe(p.id);
      const ids = new Set(Array.from({ length: 12 }, (_, i) => randomPick(pool, [], null, add(TODAY, i)).id));
      expect(ids.size).toBeGreaterThan(1);
      expect(randomPick([], [], null, TODAY)).toBeNull();
    });
    it('leaves out «never again» questions and ones answered in the last 30 days', () => {
      const p = randomPick(pool, [], null, TODAY);
      const c = neverAgain(null, p.id, add(TODAY, -5));
      expect(neverCount(c)).toBe(1);
      expect(randomPick(pool, [], c, TODAY).id).not.toBe(p.id);
      const answered = pool.slice(1).map((x) => ({ qid: x.id, day: add(TODAY, -10) }));
      expect(randomPick(pool, answered, null, TODAY).id).toBe('a.eins');
      expect(randomPick(pool, pool.map((x) => ({ qid: x.id, day: add(TODAY, -10) })), null, TODAY)).toBeNull();
      expect(randomPick(pool, pool.map((x) => ({ qid: x.id, day: add(TODAY, -31) })), null, TODAY)).not.toBeNull();
      expect(neverCount(bringBack(c))).toBe(0);
    });
    it('comes last through dataDue, counts toward the three a day and respects the groups', () => {
      const p = randomPick(pool, [], null, TODAY);
      const [r] = dataDue({ pool, today: TODAY });
      expect(r).toMatchObject({ q: { id: p.id }, rule: 'zufall', random: true, data: true });
      // after the rules: a rule from data comes first
      const withRule = dataDue({ health: health(52, 61), pool, today: TODAY }).map((x) => x.q.id);
      expect(withRule[0]).toBe('daten.ruhepuls');
      // the three a day: two answered data questions leave room for one, three leave none
      const done = (...ids) => ids.map((qid) => ({ qid, day: TODAY }));
      expect(dataDue({ pool: [{ id: 'z.x', area: 'natur' }], answers: done('daten.ruhepuls', 'daten.schlaf'), today: TODAY })).toHaveLength(1);
      expect(dataDue({ pool: [{ id: 'z.x', area: 'natur' }], answers: done('daten.ruhepuls', 'daten.schlaf', 'daten.pause'), today: TODAY })).toEqual([]);
      // the answered random question counts, too
      expect(dataDue({ pool: [{ id: 'z.x', area: 'natur' }], answers: done('daten.ruhepuls', 'daten.schlaf', 'z.x'), today: TODAY })).toEqual([]);
      // the group of the pick is used: no random question from a group already asked today
      expect(dataDue({ pool: [{ id: 'z.x', area: 'koerper' }], answers: done('daten.ruhepuls'), today: TODAY })).toEqual([]);
    });
    it('stays away after skip, «never again» and the switch', () => {
      const one = [{ id: 'z.x', area: 'natur' }];
      expect(dataDue({ pool: one, snooze: { 'z.x': `${TODAY}T23:59` }, today: TODAY })).toEqual([]);
      const gone = neverAgain(null, 'z.x', TODAY);
      expect(dataDue({ pool: [...one, { id: 'z.y', area: 'natur' }], cfg: gone, today: TODAY })).toEqual([]); // no other one today
      expect(dataDue({ pool: [...one, { id: 'z.y', area: 'natur' }], cfg: gone, today: add(TODAY, 1) })[0].q.id).toBe('z.y');
      expect(randomOn(null)).toBe(true);
      expect(dataDue({ pool: one, cfg: setRandom(null, false), today: TODAY })).toEqual([]);
      expect(randomOn(setRandom(setRandom(null, false), true))).toBe(true);
    });
  });

  describe('Vermutung testen', () => {
    const hint = { id: 'sleep-mood', x: 'sleepH', y: 'mood', rho: 0.45, sentence: 'On days with more than 6 h of sleep, your mood was 8 on average, otherwise 5.' };
    it('asks when the hint is strong enough, with the sentence as the reason', () => {
      expect(vermutungHit(hint)).toEqual({ sentence: hint.sentence });
      expect(vermutungHit({ ...hint, rho: 0.29 })).toBeNull();
      expect(vermutungHit({ ...hint, rho: -0.5 })).not.toBeNull(); // a hint against counts as well
      expect(vermutungHit(hint, 50)).toBeNull();
      expect(vermutungHit(null)).toBeNull();
      expect(vermutungHit({ ...hint, sentence: '' })).toBeNull();
      const [d] = dataDue({ hint, today: TODAY });
      expect(d.q.id).toBe('daten.vermutung');
      expect(d.why.vars).toEqual({ sentence: hint.sentence });
    });
    it('has its switch, its threshold and its group', () => {
      expect(dataDue({ hint, today: TODAY, cfg: setRule(null, 'vermutung', false) })).toEqual([]);
      expect(dataDue({ hint, today: TODAY, cfg: setVal(null, 'vermutung', 50) })).toEqual([]);
      expect(ruleVal(null, 'vermutung')).toBe(30);
      expect(DATA_QUESTIONS['daten.vermutung'].form.multi).toBe(false);
      // not twice in the gap, and the group (achtsamkeit) is used once a day
      expect(dataDue({ hint, today: TODAY, answers: [{ qid: 'daten.vermutung', day: add(TODAY, -1) }] })).toEqual([]);
      expect(dataDue({ hint, today: TODAY, answers: [{ qid: 'daten.vermutung', day: add(TODAY, -3) }] })).toHaveLength(1);
    });
  });

  describe('Eigene Regeln', () => {
    const sleepHealth = (min) => [{ date: TODAY, sleep: { asleepMin: min } }];
    const make = (fields = {}) => newOwn({ text: 'What would help you?', form: { kind: 'text' }, rule: { title: 'Short night', conds: [{ v: 'sleep', op: 'under', n: 6 }] }, ...fields }, new Date(1e12));
    it('has a value for every entry of the list, with limits', () => {
      expect(VALUES.map((v) => v.id)).toEqual(['sleep', 'rhr', 'mood', 'hours', 'pause', 'rain', 'temp', 'todo']);
      for (const v of VALUES) expect(v.min < v.max && v.def >= v.min && v.def <= v.max).toBe(true);
    });
    it('reads the values from the data and gives null when the data is missing', () => {
      expect(valueNow('sleep', { health: sleepHealth(330), today: TODAY })).toBe(5.5);
      expect(valueNow('sleep', { health: [], today: TODAY })).toBeNull();
      expect(valueNow('rhr', { health: health(52, 58), today: TODAY })).toBe(6);
      expect(valueNow('rhr', { health: health(52, 49), today: TODAY })).toBe(-3);
      expect(valueNow('mood', { answers: moods(7, [6, 5, 4]), today: TODAY })).toBe(4);
      expect(valueNow('hours', { acts: [{ day: add(TODAY, -1), movingS: 5400 }, { day: add(TODAY, -1), movingS: 1800 }], today: TODAY })).toBe(2);
      expect(valueNow('hours', { acts: [], today: TODAY })).toBeNull();
      expect(valueNow('pause', { acts: [{ day: add(TODAY, -5) }], today: TODAY })).toBe(5);
      expect(valueNow('rain', { wx: { date: TODAY, rainPct: 70 }, today: TODAY })).toBe(70);
      expect(valueNow('rain', { wx: { date: add(TODAY, -1), rainPct: 70 }, today: TODAY })).toBeNull();
      expect(valueNow('temp', { wx: { date: TODAY, max: 18 }, today: TODAY })).toBe(18);
      expect(valueNow('todo', { tasks: { used: true, open: [{ title: 'a', due: add(TODAY, -8) }] }, today: TODAY })).toBe(8);
      expect(valueNow('todo', { tasks: { used: true, open: [] }, today: TODAY })).toBe(0);
      expect(valueNow('todo', { tasks: null, today: TODAY })).toBeNull();
      expect(valueNow('nope', { today: TODAY })).toBeNull();
    });
    it('makes a rule safe: 1 or 2 known conditions, a number within the limits', () => {
      expect(customRule(null)).toBeNull();
      expect(customRule({ conds: [] })).toBeNull();
      expect(customRule({ conds: [{ v: 'nope', op: 'over', n: 1 }] })).toBeNull();
      expect(customRule({ title: '  Mine  ', conds: [{ v: 'sleep', op: 'under', n: 99 }] })).toEqual({ title: 'Mine', conds: [{ v: 'sleep', op: 'under', n: 12 }] });
      expect(condOf({ v: 'sleep', op: 'weird', n: 'x' })).toEqual({ v: 'sleep', op: 'over', n: 6 });
      expect(customRule({ conds: [{ v: 'sleep', n: 5 }, { v: 'rain', n: 50 }, { v: 'temp', n: 9 }] }).conds).toHaveLength(2);
    });
    it('fits when every condition fits, and says what it saw', () => {
      const rule = { conds: [{ v: 'sleep', op: 'under', n: 6 }] };
      expect(customHit(rule, { health: sleepHealth(330), today: TODAY })).toEqual({ facts: [{ text: 'You slept {v} hours last night.', vars: { v: 5.5 } }] });
      expect(customHit(rule, { health: sleepHealth(360), today: TODAY })).toBeNull(); // «under» is strictly under
      expect(customHit(rule, { health: [], today: TODAY })).toBeNull(); // no value: no question
      const two = { conds: [{ v: 'sleep', op: 'under', n: 6 }, { v: 'rain', op: 'over', n: 50 }] };
      expect(customHit(two, { health: sleepHealth(300), wx: { date: TODAY, rainPct: 70 }, today: TODAY }).facts).toHaveLength(2);
      expect(customHit(two, { health: sleepHealth(300), wx: { date: TODAY, rainPct: 20 }, today: TODAY })).toBeNull();
      expect(customHit(two, { health: sleepHealth(300), today: TODAY })).toBeNull();
    });
    it('is an own question that the clock never asks and the list does not count', () => {
      const q = make();
      expect(q.rule.conds).toHaveLength(1);
      expect(q.every).toEqual({ kind: 'off' });
      const cfg = putOwn(null, q, '2026-11-03T08:00');
      expect(settingOf(cfg, q).on).toBe(false);
      expect(dueList(cfg, [], '2026-11-04T20:00').some((x) => x.q.id === q.id)).toBe(false);
      expect(counts(cfg).all).toBe(counts(null).all);
      expect(allQuestions(cfg).some((x) => x.id === q.id && x.rule)).toBe(true);
      // without a valid condition it is an ordinary own question
      expect(make({ rule: { conds: [] } }).rule).toBeUndefined();
    });
    it('asks through dataDue with its text, its reason and its group', () => {
      const q = make({ area: 'koerper' });
      const list = dataDue({ health: sleepHealth(300), custom: [q], today: TODAY });
      const d = list.find((x) => x.custom);
      expect(d.q.id).toBe(q.id);
      expect(d.rule).toBe(q.id);
      expect(d.why.vars).toEqual({ title: 'Short night' });
      expect(d.why.facts).toHaveLength(1);
      expect(dataDue({ health: sleepHealth(420), custom: [q], today: TODAY }).some((x) => x.custom)).toBe(false);
    });
    it('has its switch, its gap, the group rule and the daily limit like the others', () => {
      const q = make({ area: 'koerper' });
      const ctx = { health: sleepHealth(300), custom: [q], today: TODAY };
      expect(dataDue({ ...ctx, cfg: setRule(null, q.id, false) }).some((x) => x.custom)).toBe(false);
      expect(ruleOn(setRule(null, q.id, false), q.id)).toBe(false);
      expect(dataDue({ ...ctx, answers: [{ qid: q.id, day: add(TODAY, -1) }] }).some((x) => x.custom)).toBe(false);
      expect(dataDue({ ...ctx, answers: [{ qid: q.id, day: add(TODAY, -3) }] }).some((x) => x.custom)).toBe(true);
      expect(ruleGap(setGap(null, q.id, 7), q.id)).toBe(7);
      expect(noteSkip(null, q.id, TODAY).skips[q.id]).toEqual({ n: 1, day: TODAY });
      // the group (koerper) is used once a day: an answered question of the same group keeps the rule away
      expect(dataDue({ ...ctx, answers: [{ qid: 'daten.ruhepuls', day: TODAY }] }).some((x) => x.custom)).toBe(false);
      // an answer of the rule today counts to the three a day
      const areas = ['koerper', 'spass', 'sport', 'achtsamkeit'];
      const many = areas.map((area, i) => ({ ...make({ area }), id: `own-x${i}` }));
      const out = dataDue({ health: sleepHealth(300), custom: many, today: TODAY, answers: [{ qid: 'own-x0', day: TODAY }] });
      expect(out).toHaveLength(MAX_PER_DAY - 1);
      expect(out.filter((x) => x.custom).map((x) => x.rule)).toEqual(['own-x1']);
    });
    it('keeps the settings safe: ids of own rules stay, others go', () => {
      expect(dataOf({ off: ['own-abc', 'nope', 'ruhepuls'] }).off).toEqual(['own-abc', 'ruhepuls']);
      expect(dataOf({ gaps: { 'own-abc': 7, 'own-': 9, nope: 7 } }).gaps).toEqual({ 'own-abc': 7 });
    });
    it('renames, takes away and brings back a rule of the app, with its own order', () => {
      expect(ruleName(null, 'schlaf')).toBeNull();
      const named = setRuleName(null, 'schlaf', '  Kurze Nacht  ');
      expect(ruleName(named, 'schlaf')).toBe('Kurze Nacht');
      expect(ruleName(setRuleName(named, 'schlaf', ''), 'schlaf')).toBeNull();
      expect(ruleChanged(named, 'schlaf')).toBe(true);
      expect(ruleName(resetRule(named, 'schlaf'), 'schlaf')).toBeNull();
      const dropped = dropRule(null, 'schlaf');
      expect(ruleList(dropped).some((x) => x.id === 'schlaf')).toBe(false);
      expect(goneRules(dropped).map((r) => r.id)).toEqual(['schlaf']);
      expect(dataDue({ health: sleepHealth(300), today: TODAY, cfg: dropped }).some((x) => x.rule === 'schlaf')).toBe(false);
      expect(ruleList(restoreRule(dropped, 'schlaf')).some((x) => x.id === 'schlaf')).toBe(true);
      expect(dropRule(null, 'own-abc')).toEqual(dataOf(null)); // only a rule of the app is taken away this way
    });
    it('moves a rule: the order is the priority', () => {
      const q = make({ area: 'koerper' });
      const base = ruleList(null, [q]);
      expect(base.at(-1).id).toBe(q.id);
      const up = moveRule(null, [q], base.length - 1, 0);
      expect(ruleList(up, [q])[0].id).toBe(q.id);
      expect(ruleList(up, [q]).map((x) => x.id).sort()).toEqual(base.map((x) => x.id).sort());
      expect(moveRule(null, [q], 0, 99)).toEqual(dataOf(null)); // outside the list: nothing moves
      // the first that fits asks first: both fit, the same group, so only the first asks
      const rule = { title: 'x', conds: [{ v: 'sleep', op: 'under', n: 8 }] };
      const mine = make({ area: 'koerper', rule });
      const ctx = { health: sleepHealth(300), custom: [mine], today: TODAY };
      expect(dataDue({ ...ctx, cfg: moveRule(null, [mine], ruleList(null, [mine]).length - 1, 0) })[0].rule).toBe(mine.id);
      expect(dataDue(ctx)[0].rule).toBe('schlaf');
    });
    it('gives a deleted rule back its place only through Undo (the question is gone from the settings)', () => {
      const q = make();
      const cfg = putOwn(null, q, '2026-11-03T08:00');
      expect(configOf(deleteQuestion(cfg, q.id)).own.some((x) => x.id === q.id)).toBe(false);
    });
  });
});
