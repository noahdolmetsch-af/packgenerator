// Paket P5 «Eingang» (mockup A-J4 «Ablegen-Runde»): the pure rules of the round (src/lib/inbox/round.js).
import { describe, it, expect } from 'vitest';
import { roundMinutes, roundQueue, roundState, roundTally, otherTargets, whyWords } from '../src/lib/inbox/round.js';
import { guessTarget } from '../src/lib/inbox.js';
import de from '../src/lib/i18n/de/index.js';
import { readFileSync } from 'node:fs';

const note = (id, at, text, status = 'open') => ({ id, at, text, status });
const notes = [
  note('a', '2026-10-04T08:00:00.000Z', 'test_data_gtp_ Bremse hinten quietscht'),
  note('b', '2026-10-06T08:00:00.000Z', 'test_data_gtp_ Neue Handschuhe kaufen'),
  note('c', '2026-10-05T08:00:00.000Z', 'test_data_gtp_ schon abgelegt', 'sorted'),
  note('d', '2026-10-07T08:00:00.000Z', 'test_data_gtp_ irgendwas'),
];

describe('the sorting round', () => {
  it('takes about 7 seconds a note, at least one minute', () => {
    expect(roundMinutes(25)).toBe(3);
    expect(roundMinutes(1)).toBe(1);
    expect(roundMinutes(0)).toBe(1);
  });
  it('goes through the open notes, newest first', () => {
    expect(roundQueue(notes)).toEqual(['d', 'b', 'a']);
  });
  it('knows the current note, its place and the end', () => {
    const q = roundQueue(notes);
    let s = roundState(q, {}, notes);
    expect(s.current.id).toBe('d');
    expect([s.pos, s.total, s.over]).toEqual([1, 3, false]);
    s = roundState(q, { d: 'skipped' }, notes);
    expect([s.current.id, s.pos]).toEqual(['b', 2]);
    // a note filed elsewhere meanwhile counts as handled
    const later = notes.map((n) => (n.id === 'b' ? { ...n, status: 'sorted' } : n));
    s = roundState(q, { d: 'skipped' }, later);
    expect([s.current.id, s.pos]).toEqual(['a', 3]);
    s = roundState(q, { d: 'skipped', a: 'kept' }, later);
    expect(s.over).toBe(true);
    expect(s.current).toBe(null);
  });
  it('counts what happened', () => {
    expect(roundTally({ a: 'filed', b: 'filed', c: 'kept', d: 'deleted', e: 'skipped' })).toEqual({ filed: 2, kept: 1, deleted: 1, skipped: 1 });
    expect(roundTally()).toEqual({ filed: 0, kept: 0, deleted: 0, skipped: 0 });
  });
  it('offers three other targets, never the suggestion nor «keep»', () => {
    expect(otherTargets('problem')).toEqual(['list', 'tour', 'idea']);
    expect(otherTargets('list')).toEqual(['tour', 'idea', 'wish']);
    for (const k of ['keep', 'tour', 'idea', 'wish', 'receipt']) {
      const o = otherTargets(k);
      expect(o).toHaveLength(3);
      expect(o).not.toContain(k);
      expect(o).not.toContain('keep');
    }
  });
  it('says why: the words that led to the suggestion, at most two', () => {
    const n = notes[0];
    expect(guessTarget(n)).toBe('problem');
    expect(whyWords(n, 'problem')).toEqual(['Bremse', 'quietscht']);
    expect(whyWords({ text: 'Kette und Bremse und Kette' }, 'problem')).toEqual(['Kette', 'Bremse']);
    expect(whyWords(notes[1], 'wish')).toEqual(['Neue', 'kaufen']);
    expect(whyWords({ text: 'Café am See' }, 'tour')).toEqual(['Café', 'See']);
    expect(whyWords({ text: 'egal' }, 'keep')).toEqual([]);
    expect(whyWords(null, 'problem')).toEqual([]);
  });
  it('has German for every text of the round', () => {
    const src = readFileSync('src/lib/inbox/SortRound.svelte', 'utf8') + readFileSync('src/pages/Inbox.svelte', 'utf8');
    for (const k of ['Start the sorting round', '{n} notes are waiting', 'One after the other, with a suggestion. Takes about {n} min.', 'Note from {day}', 'because «{a}» appears', 'because «{a}» and «{b}» appear', 'File|round', 'Or somewhere else', 'Other target …', 'Round done', 'Inbox empty', '{n} filed', '{n} kept', '{n} deleted', '{n} skipped|round', 'Back to the inbox|round', 'Sorting round']) {
      expect(src.includes(`'${k}'`), k).toBe(true);
      expect(de[k], k).toBeTruthy();
    }
  });
});
