// «Mein Tag»: the day as a timeline (src/lib/tag/timeline.js). Fictional data only.
import { describe, it, expect } from 'vitest';
import { layoutDay, nextBlocks, lengthOf, toMin, fmtMin, nowMin, weekOf, DAY_START, DAY_END } from '../src/lib/tag/timeline.js';
import { shiftDay } from '../src/lib/training.js';

const e = (id, kind, time, mins) => ({ id, kind, time, title: id, sub: mins ? { mins } : null });

describe('lengthOf', () => {
  it('uses the length the entry knows and says when it only guesses', () => {
    expect(lengthOf(e('a', 'todo', '10:00', 45))).toEqual({ mins: 45, guessed: false });
    expect(lengthOf({ id: 'b', kind: 'sport', mins: 90 })).toEqual({ mins: 90, guessed: false });
    expect(lengthOf(e('c', 'date', '10:00'))).toEqual({ mins: 60, guessed: true });
    expect(lengthOf(e('d', 'todo', '10:00'))).toEqual({ mins: 30, guessed: true });
  });
  it('ignores silly lengths', () => {
    expect(lengthOf(e('x', 'todo', '10:00', 2)).guessed).toBe(true);
    expect(lengthOf(e('y', 'sport', '10:00', 9999)).mins).toBe(480);
  });
});

describe('clock', () => {
  it('reads and writes HH:MM', () => {
    expect(toMin('07:30')).toBe(450);
    expect(toMin('')).toBeNull();
    expect(toMin('7:30')).toBeNull();
    expect(fmtMin(450)).toBe('07:30');
  });
  it('knows «now» only on today', () => {
    const at = new Date(2026, 10, 23, 8, 15);
    expect(nowMin('2026-11-23', '2026-11-23', at)).toBe(495);
    expect(nowMin('2026-11-24', '2026-11-23', at)).toBeNull();
  });
});

describe('layoutDay', () => {
  it('splits all-day, untimed and timed entries', () => {
    const day = layoutDay([e('trip', 'away', ''), e('todo', 'todo', ''), e('run', 'sport', '07:00', 60), e('cal', 'date', '12:00')]);
    expect(day.allDay.map((x) => x.id)).toEqual(['trip']);
    expect(day.untimed.map((x) => x.id)).toEqual(['todo']);
    expect(day.blocks.map((b) => b.e.id)).toEqual(['run', 'cal']);
    expect(day.blocks[1].guessed).toBe(true);
  });
  it('shows 06:00 to 23:00 by default and grows for entries outside', () => {
    expect(layoutDay([]).from).toBe(DAY_START);
    expect(layoutDay([]).to).toBe(DAY_END);
    const wide = layoutDay([e('early', 'sport', '05:30', 60), e('late', 'date', '23:30', 60)]);
    expect(wide.from).toBe(5 * 60);
    expect(wide.to).toBe(24 * 60);
  });
  it('puts overlapping entries side by side and leaves others alone', () => {
    const day = layoutDay([e('a', 'sport', '10:00', 120), e('b', 'date', '11:00', 60), e('c', 'todo', '11:30', 30), e('d', 'todo', '14:00', 30)]);
    const by = Object.fromEntries(day.blocks.map((b) => [b.e.id, b]));
    expect([by.a.col, by.b.col, by.c.col]).toEqual([0, 1, 2]);
    expect(by.a.cols).toBe(3);
    expect(by.b.cols).toBe(3);
    expect(by.d.cols).toBe(1);
    expect(by.d.col).toBe(0);
  });
  it('never ends after midnight', () => {
    const [b] = layoutDay([e('late', 'sport', '23:00', 120)]).blocks;
    expect(b.end).toBe(24 * 60);
  });
  it('keeps a short entry tall enough to tap', () => {
    const [b] = layoutDay([e('quick', 'todo', '09:00', 5)]).blocks;
    expect(b.end - b.start).toBeGreaterThanOrEqual(15);
  });
});

describe('weekOf', () => {
  it('lists the seven days of the week, Monday first', () => {
    const w = weekOf('2026-11-25', shiftDay);
    expect(w[0]).toBe('2026-11-23');
    expect(w[6]).toBe('2026-11-29');
    expect(weekOf('2026-11-29', shiftDay)[0]).toBe('2026-11-23');
  });
});

describe('nextBlocks', () => {
  const list = [e('trip', 'away', ''), e('run', 'sport', '07:00', 60), e('cal', 'date', '12:00', 60), e('call', 'todo', '16:00', 30), e('todo', 'todo', '')];
  it('lists what runs now, then what comes, then entries without a time', () => {
    const r = nextBlocks(list, 7 * 60 + 30, 10);
    expect(r.items.map((x) => [x.e.id, x.state])).toEqual([['run', 'now'], ['cal', 'next'], ['call', 'next'], ['todo', 'untimed']]);
    expect(r.more).toBe(0);
  });
  it('drops blocks that are over and holidays', () => {
    const r = nextBlocks(list, 13 * 60, 10);
    expect(r.items.map((x) => x.e.id)).toEqual(['call', 'todo']);
  });
  it('says how many more there are', () => {
    const r = nextBlocks(list, 6 * 60, 2);
    expect(r.items.map((x) => x.e.id)).toEqual(['run', 'cal']);
    expect(r.more).toBe(2);
  });
  it('leaves done untimed entries out and handles nothing', () => {
    expect(nextBlocks([{ ...e('t', 'todo', ''), done: true }], 600).items).toEqual([]);
    expect(nextBlocks(undefined, 600)).toEqual({ items: [], more: 0 });
  });
});
