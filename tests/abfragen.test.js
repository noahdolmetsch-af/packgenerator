// AB «Deine Abfragen» (Noah 14.10.2026 «freigabe», AB1–AB6): the 50 questions, the 31 on at the start,
// switching on and off, intervals (several a day too), own questions, what is due, the old daily checks
// in the one history, and the analyses. Fictional data only; days by calendar arithmetic.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import 'fake-indexeddb/auto';
import {
  AREAS, QUESTIONS, QUESTION, ON_AT_START, AB_KEY, configOf, settingOf, setOn, setEvery, putOwn, dropOwn, newOwn, counts,
  everyOf, lastSlot, nextSlot, pendingSlot, dueList, snoozeAll, LATER_KEY, laterStamp, valueOf, numberOf, answerRow, fromChecks, mergeHistory,
  lastAnswer, filterHistory, byDay, dowOf, timeOf, CHECK_MAP, MIRROR,
  ROUNDS, roundsOf, setRounds, roundTime, roundEvery, partOf, isEveningRound, perDay, BUSY_DAY,
} from '../src/lib/abfragen.js';
import { redirectOf, pageOf, CHECK_PAGES } from '../src/lib/nav.js';
import { ownNormal, withWithout, feltMeasured, areaWeek, observation, sourceCounts, weekOf, dailyValues, MIN_GROUP } from '../src/lib/abauswertung.js';
import { addDays } from '../src/lib/flow.js';
import DE from '../src/lib/i18n/de/index.js';
import AB_DE from '../src/lib/i18n/de/abfragen.js';
import { createDb, DATA_TABLES, SCHEMA_VERSION } from '../src/lib/db.js';

const D0 = '2026-10-09'; // a Friday
const d = (n) => addDays(D0, n);

describe('the 50 questions', () => {
  it('10 areas with 5 questions each (Paket P adds 4 evening questions), every one with an answer form and an interval', () => {
    expect(AREAS).toHaveLength(10);
    // Noah 20.10.2026: plus 50 sample questions, 5 per area, all off at the start
    expect(QUESTIONS).toHaveLength(104);
    expect(AREAS.map((a) => QUESTIONS.filter((q) => q.area === a.key).length)).toEqual([11, 10, 10, 10, 12, 10, 10, 11, 10, 10]);
    expect(AREAS.map((a) => QUESTIONS.filter((q) => q.area === a.key && q.sample).length)).toEqual(Array(10).fill(5));
    expect(QUESTIONS.filter((q) => q.sample).some((q) => ON_AT_START.has(q.id))).toBe(false);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(104);
    for (const q of QUESTIONS) {
      expect(['scale', 'chips', 'yesno', 'number', 'text']).toContain(q.form.kind);
      if (q.form.kind === 'chips' || q.form.kind === 'yesno') expect(q.form.options.length).toBeGreaterThan(1);
      expect(everyOf(q.every).kind).not.toBe('off');
      expect(q.src.length).toBeGreaterThan(0);
    }
  });

  it('every question, area, earlier question and chip has a German text (Swiss spelling, no ß)', () => {
    const keys = [...QUESTIONS.flatMap((q) => [q.text, q.was, ...(q.form.options ?? []).map((o) => o.label)]), ...AREAS.map((a) => a.name)].filter(Boolean);
    const words = keys.filter((k) => !/^[\d–\s]+$/.test(k) && !/\p{Extended_Pictographic}/u.test(k));
    const missing = words.filter((k) => !DE[k]);
    expect(missing).toEqual([]);
    for (const q of QUESTIONS) expect(AB_DE[q.text]).toBeTruthy(); // each question in the new file
    expect(Object.values(AB_DE).filter((v) => /ß/.test(v))).toEqual([]);
    expect(DE['How full is your battery right now?']).toBe('Wie voll ist dein Akku gerade?');
    expect(DE['How happy are you with the day: the best of both worlds?']).toBe('Wie zufrieden bist du mit dem Tag: Fünfer und Weggli?');
  });

  it('31 are on at the start, as in AB5 (4·4·3·3·2·3·2·3·4·3), plus the 4 evening questions of Paket P; the other 19 can be switched on', () => {
    expect(ON_AT_START.size).toBe(35);
    for (const id of ON_AT_START) expect(QUESTION[id]).toBeTruthy();
    const n = counts(null);
    expect(n).toMatchObject({ all: 104, on: 35 });
    expect(AREAS.map((a) => n.per[a.key].on)).toEqual([5, 4, 3, 3, 4, 3, 2, 4, 4, 3]);
    expect(settingOf(null, QUESTION['erholung.sofa']).on).toBe(false); // AB5: Sofa oder Sattel is off
    expect(settingOf(null, QUESTION['erholung.akku']).every).toEqual({ kind: 'times', times: ['08:00', '13:00', '20:00'] });
  });

  it('the daily check lives on in the questions (nothing falls away)', () => {
    for (const qid of Object.values(CHECK_MAP)) expect(QUESTION[qid]?.form.kind).toBe('scale');
    for (const qid of Object.keys(MIRROR)) expect(QUESTION[qid]).toBeTruthy();
  });
});

describe('switching and intervals', () => {
  it('a question switched off and on again asks from its next time on', () => {
    let c = configOf({ since: `${d(-10)}T08:00` });
    c = setOn(c, 'spass.gelacht', true, `${D0}T20:30`);
    expect(settingOf(c, QUESTION['spass.gelacht'])).toMatchObject({ on: true, since: `${D0}T20:30` });
    expect(counts(c).on).toBe(36);
    c = setOn(c, 'erholung.akku', false, `${D0}T09:00`);
    expect(settingOf(c, QUESTION['erholung.akku']).on).toBe(false);
    expect(counts(c).on).toBe(35);
  });

  it('own interval per question, several times a day sorted and without doubles', () => {
    const c = setEvery(null, 'erholung.kaffee', { kind: 'times', times: ['18:00', '9:30', '18:00'] });
    expect(settingOf(c, QUESTION['erholung.kaffee']).every).toEqual({ kind: 'times', times: ['09:30', '18:00'] });
    expect(everyOf({ kind: 'times', times: ['07:00'] })).toEqual({ kind: 'daily', time: '07:00' });
    expect(everyOf({ kind: 'times', times: [] })).toEqual({ kind: 'off' });
    expect(everyOf({ kind: 'weekly', dow: 9, time: 'x' })).toEqual({ kind: 'weekly', dow: 0, time: '19:00' });
    expect(timeOf('7:05')).toBe('07:05');
    expect(timeOf('25:00')).toBe(null);
  });

  it('the last and the next time of an interval', () => {
    const three = { kind: 'times', times: ['08:00', '13:00', '20:00'] };
    expect(lastSlot(three, `${D0}T09:00`)).toBe(`${D0}T08:00`);
    expect(lastSlot(three, `${D0}T07:59`)).toBe(`${d(-1)}T20:00`);
    expect(nextSlot(three, `${D0}T13:00`)).toBe(`${D0}T20:00`);
    expect(nextSlot(three, `${D0}T20:00`)).toBe(`${d(1)}T08:00`);
    expect(dowOf(D0)).toBe(5);
    const fri = { kind: 'weekly', dow: 5, time: '08:00' };
    expect(lastSlot(fri, `${D0}T09:00`)).toBe(`${D0}T08:00`);
    expect(lastSlot(fri, `${D0}T07:00`)).toBe(`${d(-7)}T08:00`);
    const sun = { kind: 'weekly', dow: 0, time: '19:00' };
    expect(lastSlot(sun, `${D0}T09:00`)).toBe(`${d(-5)}T19:00`);
    expect(nextSlot(sun, `${d(-5)}T19:00`)).toBe(`${d(2)}T19:00`);
    expect(lastSlot({ kind: 'monthly', time: '19:00' }, `${D0}T09:00`)).toBe('2026-10-01T19:00');
    expect(lastSlot({ kind: 'monthly', time: '19:00' }, '2026-10-01T10:00')).toBe('2026-09-01T19:00');
    expect(nextSlot({ kind: 'monthly', time: '19:00' }, '2026-12-01T19:00')).toBe('2027-01-01T19:00');
    expect(lastSlot({ kind: 'off' }, `${D0}T09:00`)).toBe(null);
  });
});

describe('own questions (AB2)', () => {
  it('added, changed and removed; its answers stay in the history', () => {
    const own = newOwn({ text: ' Kaffee ', form: { kind: 'number', unit: 'Tassen' }, every: { kind: 'times', times: ['12:00', '18:00'] } }, new Date(Date.UTC(2026, 9, 9, 10)));
    expect(own).toMatchObject({ text: 'Kaffee', area: 'eigene', form: { kind: 'number', unit: 'Tassen' }, own: true, src: ['only'] });
    let c = putOwn(null, own, `${D0}T10:00`);
    expect(c.own).toHaveLength(1);
    expect(counts(c)).toMatchObject({ all: 105, on: 36 });
    expect(settingOf(c, c.own[0])).toMatchObject({ on: true, since: `${D0}T10:00`, every: { kind: 'times', times: ['12:00', '18:00'] } });
    c = putOwn(c, { ...own, text: 'Espresso', every: { kind: 'off' } }, `${D0}T11:00`);
    expect(c.own[0].text).toBe('Espresso');
    expect(settingOf(c, c.own[0]).on).toBe(false);
    c = dropOwn(c, own.id);
    expect(c.own).toEqual([]);
    expect(c.q[own.id]).toBeUndefined();
    expect(newOwn({ text: '  ' })).toBe(null);
  });
});

// WG «Wi gaht's?» takes over the daily check (Noah 14.10.2026 «a) ja, alle drei übernehmen»): the two fixed rounds
describe('WG: the two fixed rounds 07:00 and 20:30', () => {
  it('on by default with 07:00 and 20:30; a stored record keeps them, broken values fall back', () => {
    expect(ROUNDS).toEqual({ on: true, morning: '07:00', evening: '20:30' });
    expect(configOf({}).rounds).toEqual(ROUNDS);
    expect(configOf({ since: null, q: {}, own: [] }).rounds).toEqual(ROUNDS); // a record of before
    expect(roundsOf({ on: false, morning: '6:30', evening: '21:00' })).toEqual({ on: false, morning: '06:30', evening: '21:00' });
    expect(roundsOf({ on: 'yes', morning: '25:00', evening: 'x' })).toEqual(ROUNDS);
    const c = setRounds({ since: `${d(-1)}T06:00` }, { evening: '21:15' });
    expect(c.rounds).toEqual({ on: true, morning: '07:00', evening: '21:15' });
    expect(setRounds(c, { on: false }).rounds).toEqual({ on: false, morning: '07:00', evening: '21:15' });
    expect(c.since).toBe(`${d(-1)}T06:00`);
  });

  // v0.144.0 RE «Eine Tagesuhr»: the borders of the one day clock (the morning ends at 11:00, was 12:00)
  it('the boundaries: before 11:00 the morning time, from 18:00 the evening time, 11:00-17:59 its own', () => {
    expect(roundTime('08:00', ROUNDS)).toBe('07:00');
    expect(roundTime('10:59', ROUNDS)).toBe('07:00');
    expect(roundTime('11:00', ROUNDS)).toBe('11:00');
    expect(roundTime('11:59', ROUNDS)).toBe('11:59');
    expect(roundTime('12:00', ROUNDS)).toBe('12:00');
    expect(roundTime('17:59', ROUNDS)).toBe('17:59');
    expect(roundTime('18:00', ROUNDS)).toBe('20:30');
    expect(roundTime('23:30', ROUNDS)).toBe('20:30');
    expect(roundTime('05:00', ROUNDS)).toBe('07:00');
  });

  it('switched off every question keeps its own time; own round times move them there', () => {
    const off = { on: false, morning: '07:00', evening: '20:30' };
    expect(roundTime('08:00', off)).toBe('08:00');
    expect(roundTime('20:00', off)).toBe('20:00');
    const own = { on: true, morning: '06:15', evening: '21:45' };
    expect(roundTime('09:00', own)).toBe('06:15');
    expect(roundTime('19:00', own)).toBe('21:45');
    expect(roundTime('13:00', own)).toBe('13:00');
  });

  it('daily, several times, weekly and monthly alike; off stays off', () => {
    expect(roundEvery({ kind: 'daily', time: '08:00' }, ROUNDS)).toEqual({ kind: 'daily', time: '07:00' });
    expect(roundEvery({ kind: 'times', times: ['08:00', '13:00', '20:00'] }, ROUNDS)).toEqual({ kind: 'times', times: ['07:00', '13:00', '20:30'] });
    // two morning times become one: asked once
    expect(roundEvery({ kind: 'times', times: ['08:00', '09:00'] }, ROUNDS)).toEqual({ kind: 'daily', time: '07:00' });
    expect(roundEvery({ kind: 'weekly', dow: 0, time: '19:00' }, ROUNDS)).toEqual({ kind: 'weekly', dow: 0, time: '20:30' });
    expect(roundEvery({ kind: 'monthly', time: '19:00' }, ROUNDS)).toEqual({ kind: 'monthly', time: '20:30' });
    expect(roundEvery({ kind: 'off' }, ROUNDS)).toEqual({ kind: 'off' });
    expect(roundEvery({ kind: 'daily', time: '08:00' }, { on: false })).toEqual({ kind: 'daily', time: '08:00' });
  });

  it('dueList asks at the round times: the morning questions at 07:00, the evening ones at 20:30', () => {
    const c = { since: `${D0}T06:00` };
    const ids = (now, cfg = c) => dueList(cfg, [], now).map((x) => x.q.id);
    // 07:00: sleep (7:00) and battery (8:00 → 7:00) and the goal (8:00 → 7:00) together
    expect(ids(`${D0}T06:59`)).toEqual([]);
    expect(ids(`${D0}T07:00`)).toEqual(expect.arrayContaining(['erholung.schlaf', 'erholung.akku', 'ziele.ziel']));
    expect(dueList(c, [], `${D0}T07:00`).every((x) => x.slot === `${D0}T07:00`)).toBe(true);
    // 13:00 keeps its own time; 20:00 waits for 20:30
    expect(dueList(c, [{ qid: 'erholung.akku', at: `${D0}T07:05` }], `${D0}T13:00`).find((x) => x.q.id === 'erholung.akku').slot).toBe(`${D0}T13:00`);
    expect(ids(`${D0}T20:29`)).not.toContain('erreicht.zufrieden');
    expect(dueList(c, [], `${D0}T20:30`).find((x) => x.q.id === 'erreicht.zufrieden').slot).toBe(`${D0}T20:30`);
    // switched off: the own times again
    const offC = setRounds(c, { on: false });
    expect(ids(`${D0}T07:00`, offC)).toEqual(['erholung.schlaf', 'koerper.ruhepuls']);
    expect(dueList(offC, [], `${D0}T20:00`).find((x) => x.q.id === 'erreicht.zufrieden').slot).toBe(`${D0}T20:00`);
  });

  it('the part of an answer and the evening round', () => {
    expect(partOf({ slot: `${D0}T07:00`, at: `${D0}T09:10` }, ROUNDS)).toBe('morning');
    expect(partOf({ slot: `${D0}T20:30`, at: `${D0}T21:00` }, ROUNDS)).toBe('evening');
    expect(partOf({ slot: `${D0}T13:00` }, ROUNDS)).toBe('day');
    expect(partOf({ at: `${D0}T19:00` }, ROUNDS)).toBe('evening'); // no question time: the time it was given
    expect(partOf({ slot: `${D0}T17:30` }, { on: true, morning: '07:00', evening: '17:30' })).toBe('evening');
    expect(partOf({}, ROUNDS)).toBe(null);
    expect(isEveningRound(`${D0}T20:29`, ROUNDS)).toBe(false);
    expect(isEveningRound(`${D0}T20:30`, ROUNDS)).toBe(true);
    expect(isEveningRound(`${D0}T19:00`, { evening: '19:00' })).toBe(true);
  });

  it('the daily-check pages are pages of Heute again (Noah 18.10.2026 «1 a und b»); any other #/check leads to «Wi gaht\'s?»', () => {
    for (const h of CHECK_PAGES) {
      expect(redirectOf(h)).toBe(null);
      expect(pageOf(h)).toBe('check');
    }
    for (const h of ['#/check', '#/check/other']) {
      expect(redirectOf(h)).toEqual({ hash: '#/me/abfragen', spot: '', old: null });
      expect(pageOf(h)).toBe('abfragen');
    }
    expect(redirectOf('#/me/checks')).toBe(null);
    expect(redirectOf('#/checklist')).toBe(null);
  });
});

describe('what is due now (AB3)', () => {
  // WG: these check the own times of the questions, so the fixed rounds (on by default) are off here;
  // the rounds have their own tests below
  const OWN = { rounds: { on: false } };
  const start = { since: `${d(-3)}T06:00`, ...OWN };

  it('every question on whose time has come and that is not answered since, oldest time first', () => {
    const due = dueList(start, [], `${D0}T09:00`);
    const ids = due.map((x) => x.q.id);
    expect(ids).toContain('erholung.schlaf'); // daily 7:00
    expect(ids).toContain('erholung.akku'); // 8:00
    expect(ids).toContain('koerper.waage'); // Friday 8:00
    expect(ids).not.toContain('erholung.sofa'); // off
    // Noah 2a: missed times stay; the card names the first one missed, «last» is the latest
    expect(due.find((x) => x.q.id === 'erholung.akku')).toMatchObject({ slot: `${d(-3)}T08:00`, last: `${D0}T08:00` });
    expect(due.map((x) => x.slot)).toEqual([...due.map((x) => x.slot)].sort());
    // answered after its time: gone; the next time it comes again
    const ans = [{ qid: 'erholung.akku', at: `${D0}T08:30` }];
    expect(dueList(start, ans, `${D0}T09:00`).map((x) => x.q.id)).not.toContain('erholung.akku');
    expect(dueList(start, ans, `${D0}T13:05`).find((x) => x.q.id === 'erholung.akku').slot).toBe(`${D0}T13:00`);
  });

  it('several times a day: each time asks once', () => {
    const c = { since: `${D0}T06:00`, q: {}, ...OWN };
    const at = (hm, ans = []) => dueList(c, ans, `${D0}T${hm}`).find((x) => x.q.id === 'erholung.kaffee')?.slot ?? null;
    expect(at('11:00')).toBe(null);
    expect(at('12:10')).toBe(`${D0}T12:00`);
    expect(at('18:10', [{ qid: 'erholung.kaffee', at: `${D0}T12:15` }])).toBe(`${D0}T18:00`);
    expect(at('17:00', [{ qid: 'erholung.kaffee', at: `${D0}T12:15` }])).toBe(null);
  });

  it('a new start asks nothing that was before it; «Jetzt nicht» hides until the next time', () => {
    expect(dueList({ since: `${D0}T09:00` }, [], `${D0}T09:00`)).toEqual([]);
    const later = dueList({ since: `${D0}T09:00` }, [], `${D0}T13:00`).map((x) => x.q.id);
    expect(later).toEqual(expect.arrayContaining(['erholung.akku', 'spass.stimmung', 'achtsamkeit.kopf']));
    const due = dueList(start, [], `${D0}T09:00`);
    const snooze = snoozeAll({}, due);
    expect(dueList(start, [], `${D0}T09:30`, snooze)).toEqual([]);
    expect(dueList(start, [], `${D0}T13:00`, snooze).map((x) => x.q.id)).toContain('erholung.akku');
  });

  // Noah 19.10.2026: the window of the round with «Später» (one hour) and «Heute nicht»
  it('«Später» is one hour later, over midnight and month ends too; it never hides a question by itself', () => {
    expect(laterStamp('2026-10-19T07:05')).toBe('2026-10-19T08:05');
    expect(laterStamp('2026-10-31T23:30')).toBe('2026-11-01T00:30');
    const due = dueList(start, [], `${D0}T09:00`);
    expect(dueList(start, [], `${D0}T09:00`, { [LATER_KEY]: laterStamp(`${D0}T09:00`) })).toEqual(due);
    // «Heute nicht» keeps a waiting «Später»
    expect(snoozeAll({ [LATER_KEY]: 'x' }, due)[LATER_KEY]).toBe('x');
  });

  // Noah 14.10. 00:52:22 1a 2a 3b 4ab
  it('2a: a missed question stays until it is answered or tapped away', () => {
    expect(pendingSlot({ kind: 'daily', time: '07:00' }, `${d(-5)}T00:00`, `${D0}T09:00`)).toBe(`${d(-5)}T07:00`);
    expect(pendingSlot({ kind: 'daily', time: '07:00' }, `${D0}T08:00`, `${D0}T09:00`)).toBe(null);
    const c = { since: `${d(-2)}T21:00`, ...OWN };
    const wait = (ans, snooze = {}, now = `${D0}T09:00`) => dueList(c, ans, now, snooze).find((x) => x.q.id === 'spass.emoji') ?? null;
    expect(wait([]).slot).toBe(`${d(-1)}T20:00`); // yesterday evening, still there this morning
    expect(wait([], {}, `${d(1)}T09:00`).slot).toBe(`${d(-1)}T20:00`); // and the day after
    expect(wait([{ qid: 'spass.emoji', at: `${D0}T08:59` }])).toBe(null); // answered
    const tapped = snoozeAll({}, [wait([])]);
    expect(wait([], tapped)).toBe(null); // tapped away
    expect(wait([], tapped, `${D0}T20:00`).slot).toBe(`${D0}T20:00`); // back at its next time
  });

  it('1a: several due questions come in one list together, oldest first', () => {
    const due = dueList({ since: `${d(-1)}T06:00` }, [], `${D0}T09:00`);
    expect(due.length).toBeGreaterThan(1);
    expect(new Set(due.map((x) => x.q.id)).size).toBe(due.length); // each question once
  });

  it('3b: a value that comes from Fitbit leaves its question on until you switch it off (0.171: tag «Fitbit», no «later»)', () => {
    expect(QUESTIONS.filter((q) => q.src.includes('later'))).toEqual([]);
    const later = QUESTIONS.filter((q) => q.src.includes('fitbit'));
    expect(later.map((q) => q.id)).toEqual(expect.arrayContaining(['erholung.schlaf', 'koerper.ruhepuls']));
    const c = { since: `${d(-1)}T06:00` };
    expect(dueList(c, [], `${D0}T09:00`).map((x) => x.q.id)).toContain('koerper.ruhepuls');
    expect(dueList(setOn(c, 'koerper.ruhepuls', false, `${D0}T09:00`), [], `${D0}T09:00`).map((x) => x.q.id)).not.toContain('koerper.ruhepuls');
  });

  it('4ab: the analysis is the same component on Ich › Daten › Auswertung and on «Deine Abfragen»', () => {
    const read = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    for (const f of ['pages/Auswertung.svelte', 'pages/Abfragen.svelte']) expect(read(f)).toMatch(/import Auswertung from '\.\.\/lib\/abfragen\/Auswertung\.svelte'/);
    expect(read('lib/nav.js')).toMatch(/#\/me\/analysis'\)\) return 'analysis'/);
  });
});

describe('answers', () => {
  it('stored plainly: 1–10, chips as keys, ja/nein as 1 · 0.5 · 0, numbers, sentences', () => {
    const Q = QUESTION;
    expect(valueOf(Q['erholung.akku'].form, 6)).toBe(6);
    expect(valueOf(Q['erholung.akku'].form, 11)).toBe(null);
    expect(valueOf(Q['natur.wetter'].form, ['sun', 'wind', 'sun', 'x'])).toEqual(['sun', 'wind']);
    expect(valueOf(Q['spass.emoji'].form, 'cool')).toBe('cool');
    expect(valueOf(Q['koerper.waage'].form, '72,4')).toBe(72.4);
    expect(valueOf(Q['ziele.ziel'].form, '  ')).toBe(null);
    expect(numberOf(Q['erreicht.ziel'].form, 'partly')).toBe(0.5);
    expect(numberOf(Q['freunde.zeit'].form, 'much')).toBe(1);
    expect(numberOf(Q['natur.wetter'].form, ['sun'])).toBe(null);
    const row = answerRow(Q['achtsamkeit.dank'], 7, { at: `${D0}T20:05`, slot: `${D0}T20:00`, note: 'test_data_gtp_ Znüni' });
    expect(row).toMatchObject({ qid: 'achtsamkeit.dank', area: 'achtsamkeit', day: D0, at: `${D0}T20:05`, value: 7, note: 'test_data_gtp_ Znüni', src: 'hand' });
    expect(answerRow(Q['erholung.akku'], null, { at: `${D0}T08:00` })).toBe(null);
  });
});

describe('the old daily checks in the one history (never lost)', () => {
  const pool = [{ id: 'own1', text: 'test_data_gtp_ How many stairs?' }];
  const checks = [
    { day: d(-1), sleep: 6, energy: 5, mood: 7, q: 'food', extra: 8 },
    { day: d(-2), sleep: 4, energy: null, mood: 6, q: 'own1', extra: 3 },
    { day: d(-3), sleep: 0, energy: 12 },
  ];

  it('each answered field becomes a history row of its question', () => {
    const rows = fromChecks(checks, pool);
    expect(rows.filter((r) => r.day === d(-1)).map((r) => [r.qid, r.value])).toEqual([['erholung.schlaf', 6], ['erholung.akku', 5], ['spass.stimmung', 7], ['koerper.essen', 8]]);
    const own = rows.find((r) => r.qid === 'tc.own1');
    expect(own).toMatchObject({ value: 3, from: 'check', label: { text: 'test_data_gtp_ How many stairs?' } });
    expect(rows.filter((r) => r.day === d(-3))).toEqual([]); // nothing valid that day
  });

  it('read together with the answers; an answer of the same day and question wins', () => {
    const answers = [answerRow(QUESTION['erholung.schlaf'], 8, { at: `${d(-1)}T07:10` }), answerRow(QUESTION['erholung.akku'], 6, { at: `${D0}T08:10` })];
    const all = mergeHistory(answers, checks, pool);
    expect(all[0].day).toBe(D0);
    expect(all.filter((r) => r.day === d(-1) && r.qid === 'erholung.schlaf').map((r) => r.value)).toEqual([8]);
    expect(all.filter((r) => r.from === 'check')).toHaveLength(6);
    expect(lastAnswer(all, 'erholung.schlaf').value).toBe(8);
    expect(filterHistory(all, { qid: 'erholung.akku' }).map((r) => r.value)).toEqual([6, 5]);
    expect(byDay(all).map((g) => g.day)).toEqual([D0, d(-1), d(-2)]);
  });
});

describe('the database (schema 9): answers next to the daily checks', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`ab-${Math.random()}`);
    await db.open();
  });

  it('a new table abAnswers in the backup; flowChecks stay untouched', async () => {
    expect(SCHEMA_VERSION).toBe(19); // Paket T «Freie Zeit»: version 19 adds frei; «Velo-Inspektion»: version 18 adds inspections; Paket O: version 17 adds sportItems; Paket S «Reise-Spur» adds tracks as 16; «Timer» (Z5) adds the timer log as version 11, P3b the documents as 12, Fitbit healthDays as 13, Google gEvents and gTasks as 15
    expect(DATA_TABLES).toContain('abAnswers');
    await db.flowChecks.put({ day: d(-1), sleep: 6, energy: 5, mood: 7, q: null, extra: null });
    await db.abAnswers.put(answerRow(QUESTION['erholung.akku'], 6, { at: `${D0}T08:10` }));
    await db.settings.put({ key: AB_KEY, value: { since: `${D0}T08:00`, q: {}, own: [] } });
    const rows = mergeHistory(await db.abAnswers.toArray(), await db.flowChecks.toArray());
    expect(rows.map((r) => [r.day, r.qid, r.value])).toEqual([[D0, 'erholung.akku', 6], [d(-1), 'erholung.akku', 5], [d(-1), 'erholung.schlaf', 6], [d(-1), 'spass.stimmung', 7]]);
    expect(await db.abAnswers.where('qid').equals('erholung.akku').count()).toBe(1);
  });
});

describe('the analyses (AB6), only to look at', () => {
  // fictional battery values: 30 days, a quiet pattern
  const akku = [6, 5, 7, 6, 4, 5, 6, 7, 6, 5, 6, 7, 7, 5, 4, 6, 6, 5, 7, 6, 6, 5, 6, 7, 6, 4, 6, 7, 6, 6];
  const rows = akku.map((v, i) => answerRow(QUESTION['erholung.akku'], v, { at: `${d(i - 29)}T13:00` }));

  it('own normal: day value, mean of 7 days, the band of 30 days and the direction', () => {
    const n = ownNormal(rows, 'erholung.akku', D0);
    expect(n.today).toBe(6);
    expect(n.avg7).toBe(6); // 7 · 6 · 4 · 6 · 7 · 6 · 6
    expect(n.band).toEqual([5, 7]);
    expect(n.dir).toBe('same');
    expect(n.series).toHaveLength(30);
    expect(n.n).toBe(30);
    expect(ownNormal(rows.slice(-3), 'erholung.akku', D0).band).toBe(null); // too few days
    const up = [...Array(14).keys()].map((i) => answerRow(QUESTION['erholung.akku'], i < 7 ? 4 : 7, { at: `${d(i - 13)}T13:00` }));
    expect(ownNormal(up, 'erholung.akku', D0).dir).toBe('up');
  });

  it('several answers a day are one day value', () => {
    const two = [answerRow(QUESTION['erholung.akku'], 4, { at: `${D0}T08:00` }), answerRow(QUESTION['erholung.akku'], 8, { at: `${D0}T20:00` })];
    expect(dailyValues(two, 'erholung.akku')).toEqual({ [D0]: 6 });
  });

  it('with and without: a result only from 5 days per group, always with the number of days', () => {
    const days = akku.map((_, i) => d(i - 29));
    const nature = (day) => days.indexOf(day) % 3 === 0;
    const r = withWithout(rows, 'erholung.akku', nature, days);
    expect(r.ready).toBe(true);
    expect(r.with.n + r.without.n).toBe(30);
    expect(r.with.n).toBe(10);
    const few = withWithout(rows, 'erholung.akku', (day) => (day === D0 ? true : false), days);
    expect(few).toMatchObject({ ready: false, with: { mean: null, n: 1 }, missing: { with: MIN_GROUP - 1, without: 0 } });
  });

  it('felt next to measured, day by day, without a judgement', () => {
    const felt = { [d(-1)]: 6, [D0]: 7 };
    const measured = { [D0]: 7.2 };
    expect(feltMeasured(felt, measured, D0, 3)).toEqual([{ day: d(-2), felt: null, measured: null }, { day: d(-1), felt: 6, measured: null }, { day: D0, felt: 7, measured: 7.2 }]);
  });

  it('the area value per week 0–100 (the balance ring)', () => {
    const week = weekOf(D0);
    expect(week[0]).toBe('2026-10-05');
    expect(week[6]).toBe('2026-10-11');
    const ans = [
      answerRow(QUESTION['erholung.akku'], 10, { at: `${D0}T08:00` }),
      answerRow(QUESTION['erholung.akku'], 1, { at: `${d(-1)}T08:00` }),
      answerRow(QUESTION['erreicht.ziel'], 'partly', { at: `${D0}T20:00` }),
      answerRow(QUESTION['koerper.waage'], 72, { at: `${D0}T08:00` }), // a number with a unit stays out
      answerRow(QUESTION['erholung.akku'], 10, { at: `${d(-10)}T08:00` }), // another week
    ];
    const v = Object.fromEntries(areaWeek(ans, week).map((x) => [x.area, x.value]));
    expect(v.erholung).toBe(50);
    expect(v.erreicht).toBe(50);
    expect(v.koerper).toBe(null);
    expect(areaWeek(ans, week)).toHaveLength(10);
  });

  it('an observation with its hit rate, only after about two weeks', () => {
    const days = [...Array(20).keys()].map((i) => d(i - 19));
    const short = (day) => days.indexOf(day) % 2 === 0; // nights under 6 h
    const low = (day) => days.indexOf(day) % 4 !== 2; // battery under 5
    const o = observation(days, short, low);
    expect(o).toMatchObject({ n: 10, hits: 5, ready: true });
    expect(observation(days.slice(0, 6), short, low).ready).toBe(false);
  });

  it('where the values come from', () => {
    expect(sourceCounts([{ src: 'hand' }, { src: 'hand' }, { src: 'strava' }, { src: 'x' }])).toEqual({ hand: 2, fitbit: 0, strava: 1, app: 0 });
  });
});

// Impeccable Runde 2 «Tageslast»: about how many times a day the app asks
describe('perDay', () => {
  it('counts the times of the questions that are on: 3× daily 3, daily 1, a question switched off nothing', () => {
    const at = new Date(Date.UTC(2026, 9, 9, 10));
    const base = perDay(null);
    // the 31 on at the start ask more than once a day in sum
    expect(base).toBeGreaterThan(BUSY_DAY);
    const three = putOwn(null, newOwn({ text: 'Drei', form: { kind: 'scale' }, every: { kind: 'times', times: ['08:00', '13:00', '20:00'] } }, at), `${D0}T10:00`);
    expect(perDay(three)).toBe(base + 3);
    const off = setOn(three, three.own[0].id, false, `${D0}T11:00`);
    expect(perDay(off)).toBe(base);
  });
});
