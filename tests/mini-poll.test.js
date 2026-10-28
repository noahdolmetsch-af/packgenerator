// Mini-Tools «Mini-Umfrage» (Noah 28.10.2026, idea 2): the survey, answers, counting and the summary without AI.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { pollQuestion, readPoll, cleanPollAnswer, countPoll, summarize, frequentWords, QS_MAX, TEMPLATES } from '../src/lib/mini/poll.js';

const T = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
const poll = pollQuestion({
  title: 'Herbsttour',
  qs: [
    { type: 'one', text: 'Wohin?', opts: ['Jura', 'Schwarzwald', 'Tessin', 'Jura'] },
    { type: 'many', text: 'Was mitnehmen?', opts: ['Zelt', 'Kocher'] },
    { type: 'scale', text: 'Wie lang?' },
    { type: 'yesno', text: 'Mit Zug?' },
    { type: 'text', text: 'Wichtig?' },
    { type: 'one', text: 'Ohne Optionen', opts: ['nur eine'] },
    { type: 'text', text: '' },
  ],
});

describe('the survey', () => {
  it('drops questions that cannot be answered, doubles in options, and numbers the questions', () => {
    expect(poll.qs.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
    expect(poll.qs[0].opts).toEqual(['Jura', 'Schwarzwald', 'Tessin']);
    expect(pollQuestion({ title: '', qs: poll.qs })).toBeNull();
    expect(pollQuestion({ title: 'X', qs: [] })).toBeNull();
    expect(pollQuestion({ title: 'X', qs: Array.from({ length: 14 }, () => ({ type: 'yesno', text: 'Q' })) }).qs).toHaveLength(QS_MAX);
    expect(readPoll({ ...poll, pk: 'k' }).pk).toBe('k');
    expect(readPoll({ ...poll, kind: 'date', pk: 'k' })).toBeNull();
    for (const tpl of TEMPLATES.filter((x) => x.title)) expect(pollQuestion(tpl)).not.toBeNull();
  });

  it('keeps only answers that fit, and no name when anonymous', () => {
    const a = cleanPollAnswer({ name: 'Test', r: { q1: 1, q2: [1, 0, 5, 1], q3: 9, q4: 1, q5: '  gutes   Essen ', q9: 1 } }, poll);
    expect(a).toEqual({ name: 'Test', r: { q1: 1, q2: [0, 1], q4: 1, q5: 'gutes Essen' } });
    expect(cleanPollAnswer({ name: 'Test', r: {} }, { ...poll, anon: true }).name).toBe('');
  });
});

describe('counting and summary', () => {
  const rows = [
    { name: 'A', r: { q1: 1, q2: [0], q3: 3, q4: 1, q5: 'gutes Essen, keine Hektik' } },
    { name: 'B', r: { q1: 1, q2: [0, 1], q3: 4, q4: 0, q5: 'Essen und Ruhe' } },
    { name: 'C', r: { q1: 0, q3: 4, q5: 'keine Hektik bitte' } },
  ];
  it('counts per question', () => {
    const c = countPoll(poll, rows);
    expect(c[0].counts).toEqual([1, 2, 0]);
    expect(c[1].counts).toEqual([2, 1]);
    expect(c[1].n).toBe(2);
    expect(c[2].avg).toBe(3.7);
    expect(c[3].counts).toEqual([1, 1]);
    expect(c[4].words.map((w) => w.word)).toEqual(['essen', 'hektik']);
  });
  it('writes one sentence per question', () => {
    const s = summarize(countPoll(poll, rows), T);
    expect(s[0]).toBe('Wohin?: most chose «Schwarzwald» (2 of 3).');
    expect(s[2]).toBe('Wie lang?: on average 3.7 of 5.');
    expect(s[3]).toBe('Mit Zug?: 1 yes, 1 no.');
    expect(s[4]).toContain('«essen»');
    expect(summarize(countPoll(poll, []), T)).toEqual([]);
  });
  it('frequent words need two people', () => {
    expect(frequentWords(['Velo Velo Velo'])).toEqual([]);
  });
});
