// v0.127.0 «Tages-Check» 2 (mockups T3, T4): the balance of the 9 categories, the switches of the 15
// questions, question 15 on Sundays and the line of «Deine 15 Fragen». Pure rules. Fictional data only;
// days are calendar days (Europe/Zurich), counted with addDays.
import { describe, it, expect } from 'vitest';
import { balance, ringPaths, CATS, CAT, POOL_CAT, AREA_CAT, answerSignals } from '../src/lib/balance.js';
import { AREAS as AB_AREAS, QUESTION, MIRROR, answerRow } from '../src/lib/abfragen.js';
import { QUESTIONS, offOf, isOn, switchQuestion, poolFor, rotatingFor, eveningTurnFor, eveningTurn, isSunday, daysToSunday, visionToday, answeredToday, checkOf, checkPart, SEED_QUESTIONS } from '../src/lib/flowcheck.js';
import { addDays } from '../src/lib/flow.js';

const T = '2026-10-15'; // a Thursday
const SUN = '2026-10-18';
const ACTS = [
  { id: 'meditation', ring: 'mind' },
  { id: 'yoga', ring: 'move' },
  { id: 'sauna', ring: 'rest' },
];

describe('the balance of the last 7 days', () => {
  it('without any answer or data every category is empty: nothing is invented', () => {
    const b = balance({ today: T });
    expect(b.cats.map((c) => c.key)).toEqual(CATS.map((c) => c.key));
    expect(b.cats.every((c) => c.value == null && c.n === 0)).toBe(true);
    expect(b.mean).toBeNull();
    expect(b.least).toBeNull();
  });
  it('the 9 categories of Noah, each with an English key and a suggestion', () => {
    expect(CATS.map((c) => c.key)).toEqual(['fun', 'rest', 'sport', 'mind', 'friends', 'nature', 'vision', 'goals', 'done']);
    for (const c of CATS) expect(c.label && c.tip).toBeTruthy();
    // every question of the catalogue counts for one of them
    for (const q of QUESTIONS) expect(CAT[q.cat], `question ${q.n}`).toBeTruthy();
    for (const k of Object.values(POOL_CAT)) expect(CAT[k]).toBeTruthy();
  });
  it('a scale 1–10 counts (v − 1) / 9; sleep and energy make Erholung, mood Spass', () => {
    const b = balance({ today: T, checks: [{ day: T, sleep: 10, energy: 1, mood: 10 }] });
    const v = Object.fromEntries(b.cats.map((c) => [c.key, c.value]));
    expect(v.rest).toBe(50);
    expect(v.fun).toBe(100);
    // a morning without a goal counts 0 for Ziele
    expect(v.goals).toBe(0);
    expect(v.sport).toBeNull();
    expect(v.vision).toBeNull();
  });
  it('choices count by their step; highlights count for their category', () => {
    const b = balance({
      today: T,
      checks: [
        { day: T, sat: 10, goal: { id: 'ride' }, goalDone: 'part', outside: 'gt90', people: 'short', best: ['friends', 'done'], mindful: 'yes' },
        { day: addDays(T, -1), outside: '0', people: 'no', mindful: 'no' },
      ],
    });
    const v = Object.fromEntries(b.cats.map((c) => [c.key, c.value]));
    expect(v.done).toBe(83); // 1, 0.5 and the highlight 1
    expect(v.goals).toBe(100);
    expect(v.nature).toBe(50);
    expect(v.friends).toBe(50); // 0.5, 0 and the highlight 1
    expect(v.mind).toBe(50);
  });
  it('the rotating question counts for its category (body → Sport, calm → Achtsamkeit), others not', () => {
    const b = balance({ today: T, checks: [{ day: T, q: 'body', extra: 10 }, { day: addDays(T, -1), q: 'calm', extra: 1 }, { day: addDays(T, -2), q: 'food', extra: 10 }] });
    const v = Object.fromEntries(b.cats.map((c) => [c.key, c.value]));
    expect(v.sport).toBe(100);
    expect(v.mind).toBe(0);
  });
  it('only the last 7 days count, today included, nothing after today', () => {
    const b = balance({ today: T, checks: [{ day: addDays(T, -7), mood: 10 }, { day: addDays(T, -6), mood: 1 }, { day: addDays(T, 1), mood: 10 }] });
    expect(b.cats.find((c) => c.key === 'fun').value).toBe(0);
  });
  it('what the app knows by itself: meditation, Aktiv ticks and rides, as a share of a calm week', () => {
    const log = [
      ...[0, 1, 2, 3, 4].map((i) => ({ actId: 'meditation', day: addDays(T, -i) })),
      { actId: 'meditation', day: T }, // twice on a day counts once
      { actId: 'yoga', day: T },
      { actId: 'sauna', day: addDays(T, -10) }, // too old
    ];
    const rides = [{ date: addDays(T, -1), km: 36, movingH: 2 }];
    const b = balance({ today: T, log, acts: ACTS, rides });
    const v = Object.fromEntries(b.cats.map((c) => [c.key, c.value]));
    expect(v.mind).toBe(100); // 5 of 5 days
    expect(v.sport).toBe(67); // yoga today and the ride yesterday: 2 of 3 days
    expect(v.rest).toBeNull(); // the sauna is older than a week
    // the ride of a day without a check says the time outside (120 min → over 90) and counts once a week
    expect(v.nature).toBe(67); // (1 + 1/3) / 2
  });
  it('Q11 answered wins over the ride of that day', () => {
    const b = balance({ today: T, checks: [{ day: T, outside: '0' }], rides: [{ date: T, km: 20 }] });
    expect(b.cats.find((c) => c.key === 'nature').value).toBe(17); // 0 and the week's ride 1/3
  });
  it('question 15 makes Visionen; the mean and the least category', () => {
    const b = balance({ today: SUN, checks: [{ day: SUN, vision: 10, mood: 1, sleep: 10, energy: 10, goal: { text: 'Fictional goal' } }] });
    const v = Object.fromEntries(b.cats.map((c) => [c.key, c.value]));
    expect(v.vision).toBe(100);
    expect(b.least).toBe('fun');
    expect(b.mean).toBe(Math.round((100 + 0 + 100 + 100) / 4));
    // with fewer than 3 categories known there is no «least»
    expect(balance({ today: T, checks: [{ day: T, mood: 1 }] }).least).toBeNull();
  });
  it('the ring: 9 segments, an inner wedge only where there is a value', () => {
    const b = balance({ today: T, checks: [{ day: T, mood: 5 }] });
    const p = ringPaths(b.cats, 200);
    expect(p).toHaveLength(9);
    expect(p.filter((x) => x.fg).map((x) => x.key)).toEqual(['fun', 'goals']);
    for (const x of p) expect(x.bg).toMatch(/^M [\d.]+ [\d.]+ L/);
  });
});

// WG «Wi gaht's?» takes over the daily check: its answers count in the ring too
describe('WG: the balance from the answers of «Wi gaht\'s?»', () => {
  /** A fictional answer row as «Wi gaht's?» saves it. */
  const ab = (qid, raw, day = T) => answerRow(QUESTION[qid], raw, { at: `${day}T07:05`, slot: `${day}T07:00` });
  const val = (answers, checks = []) => Object.fromEntries(balance({ today: T, answers, checks }).cats.map((c) => [c.key, c.value]));

  it('every area but «Körper und Werte» is one of the nine categories', () => {
    expect(AREA_CAT).toEqual({ erholung: 'rest', spass: 'fun', sport: 'sport', achtsamkeit: 'mind', freunde: 'friends', natur: 'nature', visionen: 'vision', ziele: 'goals', erreicht: 'done' });
    for (const a of AB_AREAS.filter((x) => x.key !== 'koerper')) expect(CAT[AREA_CAT[a.key]], a.key).toBeTruthy();
    expect(AREA_CAT.koerper).toBeUndefined();
  });

  it('a scale (v − 1) / 9 in the category of its area', () => {
    expect(answerSignals(ab('erholung.koerper', 10))).toEqual([['rest', 1]]);
    expect(answerSignals(ab('sport.beine', 1))).toEqual([['sport', 0]]);
    const v = val([ab('achtsamkeit.kopf', 4), ab('freunde.verbunden', 7), ab('natur.luft', 10), ab('visionen.neues', 1), ab('ziele.tempo', 10), ab('erreicht.zufrieden', 7), ab('spass.grinser', 10)]);
    expect(v).toMatchObject({ mind: 33, friends: 67, nature: 100, vision: 0, goals: 100, done: 67, fun: 100 });
    expect(v.rest).toBeNull();
    expect(v.sport).toBeNull();
  });

  it('yes/no and chips with a value count their value', () => {
    expect(answerSignals(ab('achtsamkeit.moment', 'yes'))).toEqual([['mind', 1]]);
    expect(answerSignals(ab('erreicht.ziel', 'partly'))).toEqual([['done', 0.5]]);
    expect(answerSignals(ab('spass.gelacht', 'no'))).toEqual([['fun', 0]]);
    expect(answerSignals(ab('freunde.zeit', 'short'))).toEqual([['friends', 0.5]]);
    expect(answerSignals(ab('erholung.sofa', 'ratherSaddle'))).toEqual([['rest', 0.75]]);
    expect(answerSignals(ab('sport.bewegung', 'goat'))).toEqual([['sport', 1]]);
    expect(answerSignals(ab('achtsamkeit.tabs', 'crashed'))).toEqual([['mind', 0]]);
    // chips without a value (the trophy, the emoji, the weather) say nothing
    expect(answerSignals(ab('erreicht.pokal', 'brave'))).toEqual([]);
    expect(answerSignals(ab('spass.emoji', 'cool'))).toEqual([]);
    expect(answerSignals(ab('natur.wetter', ['sun', 'wind']))).toEqual([]);
    expect(answerSignals(ab('ziele.freude', ['nature']))).toEqual([]);
  });

  it('natur.draussen in the four steps of the time outside', () => {
    expect(['m0', 'm30', 'm90', 'more'].map((k) => answerSignals(ab('natur.draussen', k))[0][1])).toEqual([0, 1 / 3, 2 / 3, 1]);
    expect(answerSignals(ab('natur.draussen', 'm90'))[0][0]).toBe('nature');
  });

  it('a sentence to the goal of the day counts Ziele 1; other sentences and plain numbers are left out', () => {
    expect(answerSignals(ab('ziele.ziel', 'Fiktive Runde am See'))).toEqual([['goals', 1]]);
    for (const [qid, raw] of [['ziele.kette', 'Kette ölen'], ['erreicht.stolz', 'Früh los'], ['visionen.tour', 'Eine fiktive Tour'], ['erholung.kaffee', 2], ['freunde.gespraeche', 3], ['koerper.waage', 70.5], ['koerper.essen', 8]]) {
      expect(answerSignals(ab(qid, raw)), qid).toEqual([]);
    }
  });

  it('the highlights of the day (spass.coolstes) count like Q9', () => {
    expect(answerSignals(ab('spass.coolstes', ['nature', 'sport', 'friends', 'calm', 'done', 'fun', 'new']))).toEqual([['nature', 1], ['sport', 1], ['friends', 1], ['rest', 1], ['done', 1]]);
  });

  it('sleep, energy and mood (MIRROR) count once, through the day\'s check', () => {
    for (const qid of Object.keys(MIRROR)) expect(answerSignals(ab(qid, 9)), qid).toEqual([]);
    // the answer and its mirror in flowChecks: the same as the check alone
    const answers = [ab('erholung.schlaf', 10), ab('erholung.akku', 1), ab('spass.stimmung', 10)];
    const checks = [{ day: T, sleep: 10, energy: 1, mood: 10 }];
    const both = balance({ today: T, answers, checks }).cats;
    const alone = balance({ today: T, checks }).cats;
    expect(both.find((c) => c.key === 'rest')).toEqual(alone.find((c) => c.key === 'rest'));
    expect(both.find((c) => c.key === 'fun')).toEqual(alone.find((c) => c.key === 'fun'));
  });

  it('the hello answers count by their area: the mood for Spass, a plan for Ziele', () => {
    expect(answerSignals(answerRow(QUESTION['hallo.gaht'], 'guet', { at: `${T}T08:00` }))).toEqual([['fun', 0.75]]);
    expect(answerSignals(answerRow(QUESTION['hallo.vor'], ['tour'], { at: `${T}T08:00` }))).toEqual([['goals', 1]]);
    expect(answerSignals(answerRow(QUESTION['hallo.vor'], [], { at: `${T}T08:00`, note: 'nur ein Satz' }))).toEqual([]);
  });

  it('only the 7 days count; a day of «Wi gaht\'s?» without a goal is not a 0 for Ziele', () => {
    expect(val([ab('natur.luft', 10, addDays(T, -7))]).nature).toBeNull();
    expect(val([ab('natur.luft', 10, addDays(T, -6))]).nature).toBe(100);
    // the mirrored check of an AB day has sleep, but the goal is asked in ziele.ziel: no 0
    expect(val([ab('erholung.schlaf', 6)], [{ day: T, sleep: 6 }]).goals).toBeNull();
    expect(val([ab('erholung.schlaf', 6), ab('ziele.ziel', 'Velo')], [{ day: T, sleep: 6 }]).goals).toBe(100);
    // an old check without «Wi gaht's?» keeps its rule
    expect(val([], [{ day: T, sleep: 6 }]).goals).toBe(0);
  });

  it('own questions and broken rows are left out', () => {
    expect(answerSignals({ qid: 'own-x', area: 'eigene', kind: 'scale', value: 7, day: T })).toEqual([]);
    expect(answerSignals({ qid: 'own-y', area: 'sport', kind: 'yesno', value: 'yes', day: T })).toEqual([['sport', 1]]);
    expect(answerSignals(null)).toEqual([]);
    expect(answerSignals({ qid: 'natur.luft', area: 'natur', kind: 'scale', value: null })).toEqual([]);
  });
});

describe('the 15 questions and their switches', () => {
  it('15 questions in three parts, numbered 1–15', () => {
    expect(QUESTIONS.map((q) => q.n)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(QUESTIONS.filter((q) => q.part === 'morning')).toHaveLength(7);
    expect(QUESTIONS.filter((q) => q.part === 'evening')).toHaveLength(7);
    expect(QUESTIONS.filter((q) => q.part === 'sunday').map((q) => q.n)).toEqual([15]);
  });
  it('the stored list is made safe; switching on and off', () => {
    expect(offOf(null)).toEqual([]);
    expect(offOf([13, '2', 2, 0, 16, 'x', 1.5])).toEqual([2, 13]);
    expect(isOn([13], 13)).toBe(false);
    expect(isOn([13], 12)).toBe(true);
    expect(switchQuestion([], 13, false)).toEqual([13]);
    expect(switchQuestion([13, 4], 13, true)).toEqual([4]);
  });
  it('questions 4 and 5 leave the rotating pool; all off → no rotating question', () => {
    const ids = poolFor(null, [4]).map((x) => x.id);
    expect(ids).not.toContain('body');
    expect(ids).toContain('calm');
    expect(poolFor(null, [4, 5]).map((x) => x.id)).not.toContain('calm');
    expect(rotatingFor(null, [], T)?.q).toBeTruthy();
    for (let i = 0; i < SEED_QUESTIONS.length; i++) expect(rotatingFor(null, [4], addDays(T, i)).q.id).not.toBe('body');
    expect(rotatingFor([{ id: 'body', text: 'Body?' }], [4], T)).toBeNull();
  });
  it('questions 12 and 13: in turn; one off → the other every day; both off → none', () => {
    expect(eveningTurnFor(T, [])).toBe(eveningTurn(T));
    for (let i = 0; i < 4; i++) {
      expect(eveningTurnFor(addDays(T, i), [12])).toBe('fun');
      expect(eveningTurnFor(addDays(T, i), [13])).toBe('people');
    }
    expect(eveningTurnFor(T, [12, 13])).toBeNull();
  });
  it('question 15 on Sundays (calendar day), when it is on', () => {
    expect(isSunday(SUN)).toBe(true);
    expect(isSunday(T)).toBe(false);
    expect(isSunday(addDays(SUN, 7))).toBe(true);
    expect(daysToSunday(T)).toBe(3);
    expect(daysToSunday(SUN)).toBe(0);
    expect(visionToday(SUN, [])).toBe(true);
    expect(visionToday(SUN, [15])).toBe(false);
    expect(visionToday(T, [])).toBe(false);
    // stored with its sentence, an old row reads without
    expect(checkOf({ day: SUN, vision: 7, visionNote: 'Fictional sentence' })).toMatchObject({ vision: 7, visionNote: 'Fictional sentence' });
    expect(checkOf({ day: T })).toMatchObject({ vision: null, visionNote: '', mAt: null });
    expect(checkOf({ day: SUN, vision: 11 }).vision).toBeNull();
  });
  it('«Deine 15 Fragen»: answered of the questions asked today', () => {
    const c = { day: T, sleep: 6, energy: 5, mood: 7, joy: ['nature'], goal: { id: 'ride' } };
    expect(answeredToday(c, { day: T })).toEqual({ part: 'morning', done: 5, of: 6 });
    expect(answeredToday(c, { day: T, off: [6, 7] })).toEqual({ part: 'morning', done: 3, of: 4 });
    // 4 and 5 off: the other pool questions still rotate; a pool of only those two → no rotating question
    expect(answeredToday(c, { day: T, off: [4, 5] }).of).toBe(6);
    expect(answeredToday(c, { day: T, off: [4, 5], pool: [{ id: 'body', text: 'Body?' }, { id: 'calm', text: 'Calm?' }] }).of).toBe(5);
    // the evening: Q10 only with a goal, Q14 found by itself, Q15 on Sundays
    const e = answeredToday({ ...c, sat: 8 }, { day: T, evening: true, mindfulAuto: true });
    expect(e).toEqual({ part: 'evening', done: 2, of: 6 });
    expect(answeredToday({ day: SUN, vision: 6 }, { day: SUN, evening: true }).of).toBe(6);
    expect(answeredToday({ day: SUN, vision: 6 }, { day: SUN, evening: true, off: [15] }).of).toBe(5);
  });
  it('the address of the catalogue', () => {
    expect(checkPart('#/check/questions')).toBe('questions');
    expect(checkPart('#/check/evening')).toBe('evening');
    expect(checkPart('#/check/morning')).toBe('morning');
  });
});
