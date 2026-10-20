// HG1 «Begrüssung auf Heute» (approved 14.10.2026; 1a 2b 3 4b, 1a 2a): the Swiss greeting by time of day
// at every boundary, with and without a name, the night text, and the answer of the sheet in the ONE
// history of «Deine Abfragen». Fictional data only (the name «Lena»).
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { greetFor, helloPart, helloTitle, HELLO_NIGHT, HELLO_WORDS, HELLO_ASK, HELLO_QUESTIONS, MOODS, PLANS, NAME_ASKED_KEY } from '../src/lib/home/hallo.js';
import { greeting } from '../src/lib/home/heute.js';
import { QUESTION, QUESTIONS, mergeHistory, numberOf } from '../src/lib/abfragen.js';
import { helloRows, saveHello, saveUserName, nameAsked } from '../src/lib/home/hallo-save.js';
import { rowText, valueText } from '../src/lib/abfragen/words.js';
import { db } from '../src/lib/db.js';
import { lang } from '../src/lib/i18n.svelte.js';

const ASK = HELLO_ASK;

// v0.144.0 RE «Eine Tagesuhr» (Noah 4a): the morning starts at 06:00 like everywhere (was 05:00)
describe('the greeting by time of day (4b) and the night (3)', () => {
  const cases = [
    [4, 'night'],
    [5, 'night'],
    [6, 'morning'],
    [10, 'morning'],
    [11, 'day'],
    [17, 'day'],
    [18, 'evening'],
    [21, 'evening'],
    [22, 'night'],
    [0, 'night'],
  ];
  it('the parts at every boundary (05:59, 06:00, 10:59, 11:00, 17:59, 18:00, 21:59, 22:00)', () => {
    for (const [h, part] of cases) expect(helloPart(h), `${h}:00`).toBe(part);
  });
  it('with a name', () => {
    expect(greetFor(5, 'Lena')).toBe(HELLO_NIGHT); // 05:59
    expect(greetFor(6, 'Lena')).toBe(`Guete Morge Lena, ${ASK}`); // 06:00
    expect(greetFor(10, 'Lena')).toBe(`Guete Morge Lena, ${ASK}`); // 10:59
    expect(greetFor(11, 'Lena')).toBe(`Hoi Lena, ${ASK}`); // 11:00
    expect(greetFor(17, 'Lena')).toBe(`Hoi Lena, ${ASK}`); // 17:59
    expect(greetFor(18, 'Lena')).toBe(`Guete Abig Lena, ${ASK}`); // 18:00
    expect(greetFor(21, 'Lena')).toBe(`Guete Abig Lena, ${ASK}`); // 21:59
    expect(greetFor(22, 'Lena')).toBe(HELLO_NIGHT); // 22:00
  });
  it('without a name', () => {
    expect(greetFor(5, '')).toBe(HELLO_NIGHT);
    expect(greetFor(6, '')).toBe(`Guete Morge, ${ASK}`);
    expect(greetFor(10, '  ')).toBe(`Guete Morge, ${ASK}`);
    expect(greetFor(11, null)).toBe(`Hoi, ${ASK}`);
    expect(greetFor(17)).toBe(`Hoi, ${ASK}`);
    expect(greetFor(18, '')).toBe(`Guete Abig, ${ASK}`);
    expect(greetFor(21, '')).toBe(`Guete Abig, ${ASK}`);
    expect(greetFor(22, '')).toBe(HELLO_NIGHT);
  });
  it('exactly the approved words; the night has no name and no question', () => {
    expect(HELLO_ASK).toBe('wi gahts?'); // UI-Ziele #15 (Noah 20.10.2026 «freigabe»): short, the plan became the goal chips
    expect(HELLO_NIGHT).toBe('Guät Nacht, Nachtülä');
    expect(HELLO_WORDS).toEqual({ morning: 'Guete Morge', day: 'Hoi', evening: 'Guete Abig' });
    expect(greetFor(23, 'Lena')).not.toContain('Lena');
  });
  it('always Swiss German, whatever the app language (1a); heute.js greeting() is the same', () => {
    lang.v = 'en';
    expect(greeting(11, 'Lena')).toBe(`Hoi Lena, ${ASK}`);
    lang.v = 'de';
    expect(greeting(11, 'Lena')).toBe(`Hoi Lena, ${ASK}`);
    lang.v = 'en';
  });
  it('the sheet title', () => {
    expect(helloTitle('Lena')).toBe('Hoi Lena');
    expect(helloTitle('')).toBe('Hoi');
  });
});

describe('the answer in the ONE history of «Deine Abfragen» (2b)', () => {
  beforeEach(async () => {
    await db.open();
    await db.abAnswers.clear();
    await db.flowChecks.clear();
    await db.settings.clear();
  });
  it('the two questions are known to the history, but not among the 50 that ask on their own', () => {
    for (const q of HELLO_QUESTIONS) {
      expect(QUESTION[q.id]).toBe(q);
      expect(QUESTIONS.find((x) => x.id === q.id)).toBeUndefined();
      expect(q.every.kind).toBe('off');
    }
    expect(MOODS.map((m) => m.label)).toEqual(['Müed', 'Gaht so', 'Okay', 'Guet', 'Super']);
    expect(PLANS.map((m) => m.label)).toEqual(['Tour', 'Training', 'Ruhetag', 'Arbeit']);
  });
  it('rows: the mood, the plans with the text as note; nothing chosen gives no rows', () => {
    const at = '2026-10-09T08:10';
    const rows = helloRows({ mood: 'guet', plans: ['training', 'arbeit'], text: ' Kurze Runde ' }, at);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ qid: 'hallo.gaht', day: '2026-10-09', at, kind: 'chips', value: 'guet', src: 'hand' });
    expect(rows[1]).toMatchObject({ qid: 'hallo.vor', value: ['training', 'arbeit'], note: 'Kurze Runde' });
    expect(helloRows({ text: 'nur Text' }, at)).toMatchObject([{ qid: 'hallo.vor', value: null, note: 'nur Text' }]);
    expect(helloRows({}, at)).toEqual([]);
    expect(helloRows({ mood: 'unknown' }, at)).toEqual([]);
    // the history shows them like any answer (its words are the Swiss ones, the same in both languages)
    expect(rowText(rows[0])).toBe("Wie gaht's?");
    expect(valueText(rows[0], QUESTION['hallo.gaht'])).toBe('Guet');
    expect(valueText(rows[1], QUESTION['hallo.vor'])).toBe('Training · Arbeit');
    expect(numberOf(QUESTION['hallo.gaht'].form, 'guet')).toBe(0.75);
  });
  it('saveHello writes into abAnswers, read back by the one history', async () => {
    const n = await saveHello({ mood: 'okay', plans: ['ruhetag'], text: '' }, '2026-10-09T19:30');
    expect(n).toBe(2);
    const answers = await db.abAnswers.toArray();
    expect(answers.map((r) => r.qid).sort()).toEqual(['hallo.gaht', 'hallo.vor']);
    const hist = mergeHistory(answers, await db.flowChecks.toArray());
    expect(hist.filter((r) => r.day === '2026-10-09')).toHaveLength(2);
    // no daily check is touched (only sleep, energy and mood of the 50 mirror there)
    expect(await db.flowChecks.count()).toBe(0);
    expect(await saveHello({}, '2026-10-09T19:31')).toBe(0);
    expect(await db.abAnswers.count()).toBe(2);
  });
  it('the name: saved and asked once; «Nicht jetzt» only marks it asked', async () => {
    await nameAsked();
    expect((await db.settings.get(NAME_ASKED_KEY)).value).toBe(true);
    expect(await db.settings.get('userName')).toBeUndefined();
    await saveUserName('  Lena ');
    expect((await db.settings.get('userName')).value).toBe('Lena');
  });
});
