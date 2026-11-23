// Nachtträume: the sentence of the morning question lands in the Tagebuch with the tag «Traum». Fictional texts only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { db } from '../src/lib/db.js';
import { saveAnswers } from '../src/lib/abdb.js';
import { dreamEntry, dreamId, DREAM_Q, DREAM_TAG } from '../src/lib/tagebuch/traum.js';
import { QUESTION, ON_AT_START, answerRow } from '../src/lib/abfragen.js';
import { KIND } from '../src/lib/tagebuch/journal.js';

const row = (note, extra = {}) => ({ id: 'ab-1', qid: DREAM_Q, day: '2026-11-20', at: '2026-11-20T07:12', value: ['nice'], note, ...extra });

describe('dreamEntry', () => {
  it('a sentence makes one entry for the day with the tag «Traum»', () => {
    const e = dreamEntry(row('Ich bin über den See geflogen.'));
    expect(e).toMatchObject({ id: dreamId('2026-11-20'), kind: KIND, day: '2026-11-20', time: '07:12', text: 'Ich bin über den See geflogen.', tags: [DREAM_TAG] });
  });
  it('without a sentence nothing is written', () => {
    expect(dreamEntry(row(''))).toBe(null);
    expect(dreamEntry(row(null))).toBe(null);
  });
  it('a changed sentence changes the same entry and keeps its tags and time', () => {
    const first = dreamEntry(row('Erster Satz'));
    const next = dreamEntry(row('Zweiter Satz', { at: '2026-11-20T09:00' }), { ...first, tags: ['Traum', 'Eigenes'] }, 'Erster Satz');
    expect(next).toMatchObject({ id: first.id, text: 'Zweiter Satz', time: '07:12', tags: ['Traum', 'Eigenes'] });
  });
  it('an entry changed in the Tagebuch stays as it is', () => {
    const first = dreamEntry(row('Erster Satz'));
    expect(dreamEntry(row('Zweiter Satz'), { ...first, text: 'Im Tagebuch umgeschrieben' }, 'Erster Satz')).toBe(null);
  });
});

describe('the question', () => {
  it('is on at the start, asks in the morning and has chips with a sentence', () => {
    const q = QUESTION[DREAM_Q];
    expect(ON_AT_START.has(DREAM_Q)).toBe(true);
    expect(q).toMatchObject({ area: 'erholung', every: { kind: 'daily', time: '07:00' }, form: { kind: 'chips', multi: true, note: true } });
  });
  it('a sentence alone counts as an answer', () => {
    expect(answerRow(QUESTION[DREAM_Q], null, { day: '2026-11-20', at: '2026-11-20T07:12', note: 'Nur ein Satz' })).toMatchObject({ qid: DREAM_Q, note: 'Nur ein Satz' });
  });
});

describe('saveAnswers', () => {
  it('writes the entry once, updates it on the next save and leaves other answers alone', async () => {
    await saveAnswers([row('Ein Traum vom Velo', { id: 'ab-d1' }), { id: 'ab-x', qid: 'erholung.schlaf', day: '2026-11-20', at: '2026-11-20T07:13', value: 7 }]);
    let all = await db.frei.where('kind').equals(KIND).toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ id: 'traum-2026-11-20', text: 'Ein Traum vom Velo', tags: ['Traum'] });
    await saveAnswers([row('Ein Traum vom Velo und vom Meer', { id: 'ab-d1' })]);
    all = await db.frei.where('kind').equals(KIND).toArray();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('Ein Traum vom Velo und vom Meer');
    expect(await db.abAnswers.get('ab-d1')).toMatchObject({ note: 'Ein Traum vom Velo und vom Meer' });
  });
});
