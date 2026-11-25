import { describe, it, expect } from 'vitest';
import { templatesOf, patternOf, saveTemplate, putTemplate, repeatItems } from '../src/lib/tag/vorlage.js';

let n = 0;
const newId = () => `n${++n}`;
const ITEMS = [
  { id: 'a', kind: 'date', title: 'Mittagsrunde', day: '2026-11-24', time: '12:15', mins: 60, done: true },
  { id: 'b', kind: 'todo', title: 'Mails', day: '2026-11-24', time: '', done: false },
  { id: 'c', kind: 'date', title: 'Team', day: '2026-11-24', time: '09:00', mins: 30 },
  { id: 'd', kind: 'date', title: 'Anderer Tag', day: '2026-11-25', time: '10:00' },
  { id: 'e', kind: 'bike', title: 'Kette ölen', day: '2026-11-24', time: '' },
];

describe('patternOf', () => {
  it('takes the own dates and to-dos of the day in time order, without bike care and without done flags', () => {
    const p = patternOf(ITEMS, '2026-11-24');
    expect(p.map((x) => x.title)).toEqual(['Team', 'Mittagsrunde', 'Mails']);
    expect(p[1]).toEqual({ kind: 'date', title: 'Mittagsrunde', time: '12:15', mins: 60 });
    expect(p[0].done).toBeUndefined();
  });
});

describe('templates', () => {
  it('are kept safe, saved by name and replaced by the same name', () => {
    expect(templatesOf('x')).toEqual([]);
    expect(templatesOf([{ name: '', items: [{ title: 'a', kind: 'todo' }] }, { name: 'Leer', items: [] }])).toEqual([]);
    const list = saveTemplate([], 'Arbeitstag', patternOf(ITEMS, '2026-11-24'), newId);
    expect(list).toHaveLength(1);
    expect(templatesOf(list)[0].items).toHaveLength(3);
    const again = saveTemplate(list, 'arbeitstag', [{ kind: 'todo', title: 'Neu', time: '' }], newId);
    expect(again).toHaveLength(1);
    expect(again[0].items[0].title).toBe('Neu');
    expect(again[0].id).toBe(list[0].id);
    expect(saveTemplate(list, 'Name', [], newId)).toEqual(list);
  });
  it('put on days as ordinary own entries, not twice', () => {
    const tpl = saveTemplate([], 'Arbeitstag', patternOf(ITEMS, '2026-11-24'), newId)[0];
    const made = putTemplate(tpl, ['2026-11-26', '2026-11-27'], [], newId);
    expect(made).toHaveLength(6);
    expect(made.every((x) => !x.done && x.id)).toBe(true);
    expect(made.filter((x) => x.day === '2026-11-26').map((x) => x.time)).toEqual(['09:00', '12:15', '']);
    const again = putTemplate(tpl, ['2026-11-26'], made, newId);
    expect(again).toEqual([]);
  });
});

describe('repeatItems', () => {
  const base = { id: 'r1', kind: 'date', title: 'Chor', day: '2026-11-24', time: '19:00', mins: 90, done: true };
  it('copies the entry to the same weekday of the next weeks, open, with a ref', () => {
    const c = repeatItems(base, 4, [], newId);
    expect(c.map((x) => x.day)).toEqual(['2026-12-01', '2026-12-08', '2026-12-15', '2026-12-22']);
    expect(c.every((x) => x.done === false && x.ref === 'rep:r1' && x.time === '19:00' && x.mins === 90)).toBe(true);
  });
  it('does not double copies and ignores other numbers of weeks', () => {
    const first = repeatItems(base, 4, [], newId);
    expect(repeatItems(base, 8, [base, ...first], newId).map((x) => x.day)).toEqual(['2026-12-29', '2027-01-05', '2027-01-12', '2027-01-19']);
    expect(repeatItems(base, 3, [], newId)).toEqual([]);
    expect(repeatItems({ ...base, day: null }, 4, [], newId)).toEqual([]);
  });
});
