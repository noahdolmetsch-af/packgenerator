import { describe, it, expect } from 'vitest';
import { seedBags, bagsOf, packsOf, nextDate, packDay, packedIds, togglePacked, packAll, settle, often, addThing, removeThing, addBag, removeBag, reminders, OFTEN } from '../src/lib/flowbag.js';
import { fixedList } from '../src/lib/flowweek.js';

// Tuesday 13 Oct 2026; fictional fixed dates: Yoga Thursday 07:00, Tennis Wednesday 18:00 and Tuesday 19:00
const TODAY = '2026-10-13';
const at = (hm) => Date.parse(`${TODAY}T${hm}:00+02:00`);
const fixed = fixedList([{ actId: 'yoga', wd: 4, time: '07:00' }, { actId: 'tennis', wd: 3, time: '18:00' }, { actId: 'tennis', wd: 2, time: '19:00' }]);
const bags = seedBags();
const yoga = bags.find((b) => b.actId === 'yoga');
const tennis = bags.find((b) => b.actId === 'tennis');

describe('the sport bag (AK3)', () => {
  it('starts with five bags of fictional things', () => {
    expect(bags.map((b) => b.id)).toEqual(['bag-yoga', 'bag-tennis', 'bag-gym', 'bag-hockey', 'bag-commute']);
    expect(bags.every((b) => b.items.length >= 5 && b.items.every((x) => x.forgot === 0))).toBe(true);
    expect(bagsOf(null)).toEqual(bags);
    expect(bagsOf([{ id: 'x', items: [{ id: 'a', forgot: '3' }, {}] }, {}])).toEqual([{ id: 'x', actId: null, name: '', icon: 'heart', items: [{ id: 'a', name: '', forgot: 3 }] }]);
    expect(packsOf([])).toEqual({});
  });

  it('finds the next fixed date, today only while its time is ahead', () => {
    expect(nextDate(yoga, fixed, TODAY, at('09:00'))).toEqual({ day: '2026-10-15', time: '07:00' });
    expect(nextDate(tennis, fixed, TODAY, at('09:00'))).toEqual({ day: TODAY, time: '19:00' });
    expect(nextDate(tennis, fixed, TODAY, at('20:00'))).toEqual({ day: '2026-10-14', time: '18:00' });
    expect(nextDate(bags[2], fixed, TODAY, at('09:00'))).toBeNull();
    expect(packDay(bags[2], fixed, TODAY, at('09:00'))).toBe(TODAY);
  });

  it('packs things for a day, all at once, and starts empty for another day', () => {
    let p = togglePacked({}, yoga.id, '2026-10-15', 'mat');
    expect(packedIds(p, yoga.id, '2026-10-15')).toEqual(['mat']);
    p = togglePacked(p, yoga.id, '2026-10-15', 'mat');
    expect(packedIds(p, yoga.id, '2026-10-15')).toEqual([]);
    p = packAll(p, yoga, '2026-10-15');
    expect(packedIds(p, yoga.id, '2026-10-15')).toHaveLength(yoga.items.length);
    expect(packedIds(p, yoga.id, '2026-10-22')).toEqual([]);
  });

  it('counts what stayed out after a packed day, and from 2 times it is often forgotten', () => {
    const packs = { [yoga.id]: { day: '2026-10-12', ids: ['mat', 'bottle', 'shirt', 'keys'] }, [tennis.id]: { day: '2026-10-12', ids: [] }, 'bag-gym': { day: TODAY, ids: ['shoes'] } };
    const s = settle(bags, packs, TODAY);
    expect(s.changed).toBe(true);
    expect(Object.keys(s.packs)).toEqual(['bag-gym']);
    const towel = s.bags.find((b) => b.id === yoga.id).items.find((x) => x.id === 'towel');
    expect(towel.forgot).toBe(1);
    expect(s.bags.find((b) => b.id === tennis.id).items.every((x) => x.forgot === 0)).toBe(true);
    expect(often({ forgot: OFTEN })).toBe(true);
    expect(often(towel)).toBe(false);
    expect(settle(bags, {}, TODAY).changed).toBe(false);
  });

  it('adds and removes things and bags', () => {
    let b = addThing(bags, yoga.id, '  Block ');
    expect(b.find((x) => x.id === yoga.id).items.at(-1)).toMatchObject({ name: 'Block', forgot: 0 });
    expect(addThing(bags, yoga.id, '  ')).toBe(bags);
    b = removeThing(b, yoga.id, 'mat');
    expect(b.find((x) => x.id === yoga.id).items.some((x) => x.id === 'mat')).toBe(false);
    b = addBag(b, { name: 'Climbing', actId: 'climb', icon: 'climb' });
    expect(b.at(-1)).toMatchObject({ name: 'Climbing', actId: 'climb', items: [] });
    expect(removeBag(b, b.at(-1).id)).toHaveLength(bags.length);
  });

  it('reminds the evening before a fixed date, not before 17:00, not when packed or off', () => {
    const wed = '2026-10-14';
    const r = reminders({ bags, fixed, packs: {}, today: wed, now: Date.parse(`${wed}T20:00:00+02:00`) });
    expect(r.map((x) => [x.bag.id, x.day, x.time, x.n, x.of])).toEqual([['bag-yoga', '2026-10-15', '07:00', 0, 5]]);
    expect(reminders({ bags, fixed, packs: {}, today: wed, now: Date.parse(`${wed}T16:30:00+02:00`) })).toEqual([]);
    expect(reminders({ bags, fixed, packs: packAll({}, yoga, '2026-10-15'), today: wed, now: Date.parse(`${wed}T20:00:00+02:00`) })).toEqual([]);
    expect(reminders({ bags, fixed, packs: {}, today: wed, now: Date.parse(`${wed}T20:00:00+02:00`), on: false })).toEqual([]);
  });
});
