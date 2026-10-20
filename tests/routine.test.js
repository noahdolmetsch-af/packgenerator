// Routine «Das tut mir gut» (mockups D1 + D2, Noah 12.10.2026 «d1-d5 freigeben»): src/lib/routine.js.
// Fictional data only; days are calendar days (2026-10-15 is a Thursday).
import { describe, it, expect } from 'vitest';
import { seedItems, routineOf, normItem, weekdayOf, addDays, isFor, itemsFor, listFor, extraOn, toggleTick, setFelt, feltOf, weekDots, weekDays, isDone, isAuto, countFor, streakOf, nextMilestone, newItem, addItem, removeItem, renameItem, patchItem, moveItem, stepItem, toggleDay, hm, recordOf, SUGGESTIONS, WEEKDAYS, STEPS } from '../src/lib/routine.js';
import DE from '../src/lib/i18n/de/index.js';

const THU = '2026-10-15';
const r0 = () => routineOf(null);
const tickDays = (r, id, days) => days.reduce((x, d) => toggleTick(x, id, d), r);
const back = (n) => Array.from({ length: n }, (_, i) => addDays(THU, -i));

describe('days', () => {
  it('weekday 0 = Monday … 6 = Sunday, on the calendar', () => {
    expect(weekdayOf('2026-10-12')).toBe(0);
    expect(weekdayOf(THU)).toBe(3);
    expect(weekdayOf('2026-10-18')).toBe(6);
    // over the change to winter time (25.10.2026 in Zurich) a day is still a day
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(hm('05:55')).toBe('5:55');
    expect(hm('22:30')).toBe('22:30');
  });
});

describe('the record', () => {
  it('starts with seven examples, every day except yoga on Thursday', () => {
    const r = r0();
    expect(r.items).toHaveLength(7);
    expect(r.items.find((x) => x.id === 'yoga').days).toEqual([3]);
    expect(r.items.find((x) => x.id === 'meditate').link).toBe('meditation');
    expect(r.items.find((x) => x.id === 'wake').time).toBe('05:55');
    expect(r.ticks).toEqual({});
  });
  it('makes a stored record safe', () => {
    const r = routineOf({ items: [{ id: 'a', name: 'Read', days: [9, 1, 1], time: '25:00', link: 'x' }, { id: 'a', name: 'twice' }, null, { id: 'b', name: 'Walk', days: [0, 1, 2, 3, 4, 5, 6] }], ticks: { a: ['2026-10-14', 'bad', '2026-10-14'], gone: ['2026-10-14'] } });
    expect(r.items).toEqual([{ id: 'a', name: 'Read', days: [1], link: null, time: null }, { id: 'b', name: 'Walk', days: null, link: null, time: null }]);
    expect(r.ticks).toEqual({ a: ['2026-10-14'] });
    expect(routineOf({ items: [] }).items).toEqual([]);
    expect(normItem({ id: 'x', name: 'n', days: [] }).days).toBeNull();
  });
  it('every example and suggestion has a German text, and the weekdays too', () => {
    for (const x of [...seedItems(), ...SUGGESTIONS]) expect(DE[x.name], x.name).toBeTruthy();
    for (const w of WEEKDAYS) expect(DE[w], w).toBeTruthy();
    // Noah 18.10.2026: the five to add with one tap
    expect(SUGGESTIONS.map((x) => DE[x.name].replace('{time}', '22:30'))).toEqual(expect.arrayContaining(['Jemanden einladen', 'Alles aufgeräumt', 'Familie besuchen', '2 Liter trinken', 'Vor 22:30 im Bett']));
  });
});

describe('weekdays', () => {
  it('an item for Thursday shows on Thursday only', () => {
    const r = r0();
    expect(itemsFor(r.items, THU).map((x) => x.id)).toContain('yoga');
    expect(itemsFor(r.items, addDays(THU, 1)).map((x) => x.id)).not.toContain('yoga');
    expect(itemsFor(r.items, addDays(THU, 1))).toHaveLength(6);
    expect(isFor({ days: null }, THU)).toBe(true);
  });
  it('the editor chips: every day, a weekday, and «Do · +1»', () => {
    const r = r0();
    expect(listFor(r.items, 'all')).toHaveLength(6);
    expect(listFor(r.items, 3)).toHaveLength(7);
    expect(extraOn(r.items, 3)).toBe(1);
    expect(extraOn(r.items, 4)).toBe(0);
  });
  it('toggling a weekday chip; all or none is every day', () => {
    expect(toggleDay(null, 3)).toEqual([0, 1, 2, 4, 5, 6]);
    expect(toggleDay([3], 3)).toBeNull();
    expect(toggleDay([3], 0)).toEqual([0, 3]);
    expect(toggleDay([0, 1, 2, 4, 5, 6], 3)).toBeNull();
  });
});

describe('ticks and counts', () => {
  it('a tap ticks, a second tap takes it back', () => {
    let r = toggleTick(r0(), 'walk', THU);
    expect(isDone(r, r.items.find((x) => x.id === 'walk'), THU)).toBe(true);
    r = toggleTick(r, 'walk', THU);
    expect(r.ticks.walk).toBeUndefined();
  });
  it('counts the items of the day; a meditation in Im Flow ticks itself', () => {
    let r = toggleTick(r0(), 'walk', THU);
    const auto = { meditation: new Set([THU]) };
    expect(countFor(r, THU, auto)).toEqual({ n: 2, of: 7 });
    expect(countFor(r, addDays(THU, 1), auto)).toEqual({ n: 0, of: 6 });
    const med = r.items.find((x) => x.id === 'meditate');
    expect(isAuto(r, med, THU, auto)).toBe(true);
    expect(isAuto(r, r.items.find((x) => x.id === 'walk'), THU, auto)).toBe(false);
    r = toggleTick(r, 'banana', THU);
    expect(countFor(r, THU, auto).n).toBe(3);
  });
});

describe('days in a row', () => {
  const walk = (r) => r.items.find((x) => x.id === 'walk');
  it('counts back from today; today not yet ticked does not break it', () => {
    const r = tickDays(r0(), 'walk', back(12));
    expect(streakOf(r, walk(r), THU)).toBe(12);
    const y = tickDays(r0(), 'walk', back(5).slice(1));
    expect(streakOf(y, walk(y), THU)).toBe(4);
    // a day with something else ticked but not the walk breaks the row
    const gap = tickDays(tickDays(r0(), 'walk', [THU, addDays(THU, -2)]), 'banana', [addDays(THU, -1)]);
    expect(streakOf(gap, walk(gap), THU)).toBe(1);
    expect(streakOf(r0(), walk(r0()), THU)).toBe(0);
  });
  it('an empty day (nothing ticked at all) breaks the row like any other day (Noah 18.10.2026 «6b»)', () => {
    const r = tickDays(r0(), 'walk', [THU, addDays(THU, -1), addDays(THU, -3), addDays(THU, -4)]);
    expect(streakOf(r, walk(r), THU)).toBe(2);
    // today still open: not ticked yet, the row of the days before stays
    const open = tickDays(r0(), 'walk', [addDays(THU, -1), addDays(THU, -2)]);
    expect(streakOf(open, walk(open), THU)).toBe(2);
  });
  it('an item of one weekday counts its weekdays only', () => {
    const r = tickDays(r0(), 'yoga', [THU, addDays(THU, -7), addDays(THU, -14)]);
    expect(streakOf(r, r.items.find((x) => x.id === 'yoga'), THU)).toBe(3);
  });
  it('a linked item counts the days of Im Flow', () => {
    const r = r0();
    const auto = { meditation: new Set(back(31)) };
    expect(streakOf(r, r.items.find((x) => x.id === 'meditate'), THU, auto)).toBe(31);
  });
  it('the milestones are 7, 14, 30, 60, 100 and 365 days (Noah 18.10.2026)', () => {
    expect(STEPS).toEqual([7, 14, 30, 60, 100, 365]);
  });
  it('the nearest milestone; without a streak 14 days', () => {
    expect(nextMilestone(r0(), THU)).toEqual({ item: null, streak: 0, goal: 14, left: 14 });
    let r = tickDays(r0(), 'walk', back(10));
    r = tickDays(r, 'banana', back(5));
    const m = nextMilestone(r, THU);
    expect(m.item.id).toBe('banana');
    expect([m.streak, m.goal, m.left]).toEqual([5, 7, 2]);
  });
});

describe('the list', () => {
  it('add, rename, change, delete (ticks go along), plain to save', () => {
    let r = addItem(r0(), newItem('  Read 10 pages ', { days: [5] }));
    const x = r.items.at(-1);
    expect(x.name).toBe('Read 10 pages');
    expect(x.days).toEqual([5]);
    r = renameItem(r, x.id, 'Read');
    expect(r.items.at(-1).name).toBe('Read');
    expect(renameItem(r, x.id, '  ').items.at(-1).name).toBe('Read');
    r = patchItem(r, x.id, { time: '07:00', link: 'meditation' });
    expect(r.items.at(-1)).toMatchObject({ time: '07:00', link: 'meditation', days: [5] });
    r = toggleTick(r, x.id, THU);
    const gone = removeItem(r, x.id);
    expect(gone.items.some((y) => y.id === x.id)).toBe(false);
    expect(gone.ticks[x.id]).toBeUndefined();
    expect(recordOf(gone)).toEqual({ items: gone.items, ticks: gone.ticks, felt: {} });
  });
  it('moves an item, also one place within the shown list', () => {
    const r = r0();
    expect(moveItem(r, 'kind', 0).items[0].id).toBe('kind');
    // shown «every day» (no yoga): walk one place up jumps over the hidden yoga to before shower
    const shown = listFor(r.items, 'all').map((x) => x.id);
    const up = stepItem(r, shown, 'walk', -1).items.map((x) => x.id);
    expect(up.indexOf('walk')).toBeLessThan(up.indexOf('shower'));
    expect(stepItem(r, shown, 'wake', -1)).toBe(r);
  });
});

// Noah 19.10.2026 «4a 5a»: seven dots per item for this week; «Did it do you good?» after a tick
describe('this week and «Did it do you good?»', () => {
  const FRI = '2026-10-09'; // a Friday
  it('seven dots Monday to Sunday: done, open, today, later, off', () => {
    expect(weekDays(FRI)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    const r = toggleTick(toggleTick({ items: [normItem({ id: 'a' }), normItem({ id: 'y', days: [3] })], ticks: {}, felt: {} }, 'a', '2026-10-06'), 'y', '2026-10-08');
    expect(weekDots(r, r.items[0], FRI).map((d) => d.state)).toEqual(['open', 'done', 'open', 'open', 'today', 'later', 'later']);
    expect(weekDots(r, r.items[1], FRI).map((d) => d.state)).toEqual(['off', 'off', 'off', 'done', 'off', 'off', 'off']);
  });
  it('an answer is kept with the record, cleaned when read, and goes with an untick or a delete', () => {
    let r = toggleTick(routineOf({ items: [{ id: 'a', name: 'A walk' }], ticks: {} }), 'a', FRI);
    r = setFelt(r, 'a', FRI, 2);
    expect(feltOf(r, 'a', FRI)).toBe(2);
    expect(routineOf(recordOf(r)).felt).toEqual({ a: { [FRI]: 2 } });
    expect(routineOf({ items: [{ id: 'a' }], felt: { a: { [FRI]: 5, nope: 1 }, gone: { [FRI]: 1 } } }).felt).toEqual({});
    expect(feltOf(toggleTick(r, 'a', FRI), 'a', FRI)).toBe(null);
    expect(removeItem(r, 'a').felt).toEqual({});
  });
});
