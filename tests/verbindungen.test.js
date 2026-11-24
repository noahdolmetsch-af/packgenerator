// «Verbindungen» (Noah 23.11.2026 «3b»): the sentence questions offer what the app knows. Fictional data only.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { CONNECT, LABELS, sourcesOf, groupsFor, withLink } from '../src/lib/abfragen/verbindungen.js';
import { QUESTION } from '../src/lib/abfragen.js';

const TODAY = '2026-11-20';
const raw = {
  merken: [
    { id: 'a', text: 'Kette ölen', due: TODAY, created: '2026-11-18T08:00:00Z', doneAt: null },
    { id: 'b', text: 'Steuer ordnen', due: '2026-11-10', created: '2026-11-01T08:00:00Z', doneAt: null },
    { id: 'c', text: 'Irgendwann aufräumen', due: null, created: '2026-11-02T08:00:00Z', doneAt: null },
    { id: 'd', text: 'Im Dezember planen', due: '2026-12-15', created: '2026-11-03T08:00:00Z', doneAt: null },
    { id: 'e', text: 'Wartet auf Post', due: TODAY, wait: { on: 'Post' }, doneAt: null },
    { id: 'f', text: 'Reifen wechseln', due: TODAY, doneAt: `${TODAY}T10:00:00` },
    { id: 'g', text: 'Gestern erledigt', due: TODAY, doneAt: '2026-11-19T10:00:00' },
  ],
  weekGoals: [{ id: 'km', kind: 'km', of: 150 }, { id: 'act:med', kind: 'act', actId: 'med', of: 2 }, { id: 'act:gone', kind: 'act', actId: 'gone', of: 3 }],
  acts: [
    { id: 'med', name: 'Meditation', order: 2 },
    { id: 'gym', name: 'Gym', order: 1 },
    { id: 'old', name: 'Alte Sache', order: 0, paused: true },
  ],
  people: [{ id: 'p1', name: 'Anna', seen: '2026-11-01' }, { id: 'p2', name: 'Ben', seen: null }, { id: 'p3', name: 'Cleo', seen: '2026-10-01', off: true }],
  notes: [
    { id: 'n1', title: 'Alpenpässe fahren', form: { key: 'vision', values: { where: 'Alpen' } }, updatedAt: '2026-11-10T08:00:00Z' },
    { id: 'n2', title: '', form: { key: 'vision', values: { where: 'Ein Jahr unterwegs' } }, updatedAt: '2026-11-15T08:00:00Z' },
    { id: 'n3', title: 'Einkaufsliste', form: { key: 'shop' }, updatedAt: '2026-11-16T08:00:00Z' },
  ],
  stars: [
    { id: 's1', msId: 'x.early', star: 1, day: '2026-11-19' },
    { id: 's2', msId: 'x.early', star: 2, day: '2026-11-18' },
    { id: 's3', msId: 'gym.sessions', star: 1, day: '2026-11-17' },
    { id: 's4', msId: 'x.outdoor', star: 1, day: '2026-10-01' },
    { id: 's5', msId: 'unknown.id', star: 1, day: '2026-11-19' },
  ],
};
const src = sourcesOf(raw, TODAY, { actName: (a) => a.name });

describe('sourcesOf', () => {
  it('to-dos: overdue and today first, then without a date; later ones, waiting ones and done ones stay out', () => {
    expect(src.todos).toEqual(['Steuer ordnen', 'Kette ölen', 'Irgendwann aufräumen']);
  });
  it('done today: only what was ticked today', () => {
    expect(src.done).toEqual(['Reifen wechseln']);
  });
  it('goals of the week: only the ones whose activity is still there', () => {
    expect(src.goals).toEqual(['150 Bike km', '2× Meditation']);
  });
  it('activities: the live ones in their order; friends: not off, the longest unseen first', () => {
    expect(src.acts).toEqual(['Gym', 'Meditation']);
    expect(src.friends).toEqual(['Ben', 'Anna']);
  });
  it('stars: the last 7 days, one per milestone, newest first, with a known name', () => {
    expect(src.stars).toEqual(['Early start', 'Gym · Times done']);
  });
  it('visions: the notes with the template «Vision», newest first, with their title or where to', () => {
    expect(src.visions).toEqual(['Ein Jahr unterwegs', 'Alpenpässe fahren']);
    expect(groupsFor('visionen.naeher', src)[0]).toMatchObject({ kind: 'visions', items: ['Ein Jahr unterwegs', 'Alpenpässe fahren'] });
  });
  it('empty or broken records give empty lists', () => {
    expect(sourcesOf({}, TODAY)).toEqual({ todos: [], goals: [], acts: [], friends: [], stars: [], done: [], visions: [] });
    expect(sourcesOf({ merken: 'x', weekGoals: 5, people: {}, acts: null, stars: 3 }, TODAY).todos).toEqual([]);
  });
});

describe('groupsFor', () => {
  it('a question offers its kinds in order and leaves empty ones out', () => {
    expect(groupsFor('ziele.ziel', src).map((g) => g.kind)).toEqual(['todos', 'goals', 'acts']);
    expect(groupsFor('ziele.liegen', src)[0].items).toEqual(['Steuer ordnen', 'Kette ölen', 'Irgendwann aufräumen']);
    expect(groupsFor('freunde.bald', src)[0].items).toEqual(['Ben', 'Anna']);
    expect(groupsFor('ziele.ziel', { todos: [], goals: ['2× Meditation'] }).map((g) => g.kind)).toEqual(['goals']);
  });
  it('a question without connections and an empty app offer nothing', () => {
    expect(groupsFor('erholung.schlaf', src)).toEqual([]);
    expect(groupsFor('ziele.ziel', null)).toEqual([]);
  });
  it('at most five per kind, nothing twice', () => {
    const many = { todos: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], goals: ['a', 'x'], acts: [] };
    const g = groupsFor('ziele.ziel', many);
    expect(g[0].items).toHaveLength(5);
    expect(g[1].items).toEqual(['x']);
  });
  it('every connected question exists, is a sentence question and every label has a German text', () => {
    for (const qid of Object.keys(CONNECT)) {
      expect(QUESTION[qid], qid).toBeTruthy();
      expect(QUESTION[qid].form.kind, qid).toBe('text');
    }
    for (const l of Object.values(LABELS)) expect(DE[l], l).toBeTruthy();
    expect(DE['This morning: «{goal}»']).toBeTruthy();
  });
});

describe('withLink', () => {
  it('an empty field takes the words, a filled one gets them after a dot, never twice', () => {
    expect(withLink('', 'Kette ölen')).toBe('Kette ölen');
    expect(withLink('  ', 'Kette ölen')).toBe('Kette ölen');
    expect(withLink('Velo', 'Kette ölen')).toBe('Velo · Kette ölen');
    expect(withLink('Velo · Kette ölen', 'Kette ölen')).toBe('Velo · Kette ölen');
    expect(withLink('x'.repeat(498), 'abc')).toHaveLength(500);
  });
});
