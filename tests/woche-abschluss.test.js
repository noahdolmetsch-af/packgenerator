// «Planen 2b» Wochen-Abschluss am Sonntag (Noah 05.11.2026): the rules of src/lib/woche/abschluss.js. Fictional data only.
import { describe, it, expect } from 'vitest';
import { weekClose, moveItems, isSunday } from '../src/lib/woche/abschluss.js';
import de from '../src/lib/i18n/de/index.js';

const e = (id, kind, done, own = true, title = id) => ({ id, kind, title, done, own });
const days = [
  { day: '2026-11-02', entries: [e('tr:1', 'sport', true, false), e('t1', 'todo', true)] },
  { day: '2026-11-04', entries: [e('t2', 'todo', false), e('b1', 'bike', false), e('d1', 'date', false), e('g1', 'todo', false, false)] },
  { day: '2026-11-06', entries: [e('tr:2', 'sport', false, false)] },
  { day: '2026-11-08', entries: [e('tr:3', 'sport', false, false), e('away', 'away', false, false)] },
];

describe('the Sunday wrap-up', () => {
  it('knows Sundays', () => {
    expect(isSunday('2026-11-08')).toBe(true);
    expect(isSunday('2026-11-05')).toBe(false);
  });
  it('counts what is done and what stayed open, only sessions and tasks', () => {
    const c = weekClose(days, '2026-11-02', '2026-11-08');
    expect(c.done).toEqual({ sessions: 1, tasks: 1, n: 2 });
    expect(c.open).toEqual({ sessions: 2, tasks: 3, n: 5 }); // two open sessions, t2, b1 and the outside task g1
  });
  it('a session of a day still to come is not «open» yet', () => {
    const c = weekClose(days, '2026-11-02', '2026-11-05');
    expect(c.open.sessions).toBe(0);
  });
  it('only your own open to-dos and bike jobs can slide; the next Monday is a week later', () => {
    const c = weekClose(days, '2026-11-02', '2026-11-08');
    expect(c.move.map((x) => x.id)).toEqual(['t2', 'b1']);
    expect(c.next).toBe('2026-11-09');
  });
  it('moves only the chosen ones, keeps their time, leaves the rest', () => {
    const items = [{ id: 'a', day: '2026-11-04', time: '09:00' }, { id: 'b', day: '2026-11-05' }, { id: 'c', day: null }];
    const out = moveItems(items, ['a'], '2026-11-09');
    expect(out[0]).toEqual({ id: 'a', day: '2026-11-09', time: '09:00' });
    expect(out[1]).toBe(items[1]);
    expect(moveItems(items, [], '2026-11-09')).toEqual(items);
  });
  it('an empty week counts nothing', () => {
    expect(weekClose([], '2026-11-02', '2026-11-08')).toMatchObject({ done: { n: 0 }, open: { n: 0 }, move: [] });
  });
  it('has German for its words', () => {
    for (const k of ['Week wrap-up', 'Show the week wrap-up', 'Done|wrap', 'Still open', 'Slides to next week', '{n} task', '{n} tasks', 'Move {n} task to Monday', 'Move {n} tasks to Monday', '{n} task moved to Monday.', '{n} tasks moved to Monday.', 'Plan next week', 'Show next week']) expect(de[k], k).toBeTruthy();
  });
});
