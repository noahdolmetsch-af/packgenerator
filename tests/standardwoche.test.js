// «Standardwoche» (Noah 26.11.2026): fixed places and wishes per kind of unit, and what was moved in a week comes back the week after.
// The planner, the stored setting and the log. Fictional data only.
import { describe, it, expect } from 'vitest';
import { defaultsFor, configOf, planWeek, slotsOf, slotOn, setSlot, removeSlot, moveSlot } from '../src/lib/training/wochenplan.js';
import { NOTE_TEXT, WHY_KEYS, TIME_PARTS } from '../src/lib/training/wochenplan-text.js';
import { logOf, weekLog, weekPins, backToStandard, movePin, setMode, weekFor, CARRY_WEEKS } from '../src/lib/training/wochenlog.js';

const MON = '2026-11-09'; // a Monday in winter
const NEXT = '2026-11-16';
const winter = () => defaultsFor(false);
const run = (cfg, over = {}) => planWeek(cfg, { monday: MON, ski: false, rain: false, pins: {}, sessions: [], ...over });
const of = (r, type) => r.units.filter((x) => x.type === type);

describe('slots of a kind of unit', () => {
  it('lists the fixed places by day, then the wishes in the order they were made', () => {
    const c = setSlot(setSlot(winter(), 'hockey', 5, '08:00', 'wish', false), 'hockey', 6, '09:00', 'fix', false);
    expect(slotsOf(c, 'hockey')).toEqual([
      { d: 6, t: '09:00', kind: 'fix' },
      { d: 5, t: '08:00', kind: 'wish' },
    ]);
    expect(slotOn(c, 'hockey', 5)?.kind).toBe('wish');
    expect(slotOn(c, 'hockey', 1)).toBe(null);
  });
  it('holds one slot per day and kind of unit: a new one replaces the older', () => {
    let c = setSlot(winter(), 'yoga', 4, '09:30', 'fix', false);
    c = setSlot(c, 'yoga', 4, '17:00', 'wish', false);
    expect(slotsOf(c, 'yoga').filter((s) => s.d === 4)).toEqual([{ d: 4, t: '17:00', kind: 'wish' }]);
  });
  it('a fixed place beyond the count raises it, a wish makes sure one free unit can use it', () => {
    let c = { ...winter(), counts: { ...winter().counts, gym: 0 }, fixes: {} };
    c = setSlot(c, 'gym', 2, '16:00', 'wish', false);
    expect(c.counts.gym).toBe(1);
    c = setSlot(c, 'gym', 4, '16:00', 'fix', false);
    expect(c.counts.gym).toBe(2);
    expect(c.fixes.gym).toEqual([{ d: 4, t: '16:00' }]);
  });
  it('takes a slot away, also one of the basic plan (it does not come back)', () => {
    const c = removeSlot(winter(), 'tennis', 1);
    expect(slotOn(c, 'tennis', 1)).toBe(null);
    expect(configOf(JSON.parse(JSON.stringify(c)), false).fixes.tennis.map((f) => f.d)).toEqual([3, 5]);
    expect(removeSlot(c, 'tennis', 1)).toBe(c); // nothing there: the same config comes back
  });
  it('moves a slot to another day, keeps its kind, refuses a day that is taken', () => {
    const c = setSlot(winter(), 'hockey', 5, '08:00', 'wish', false);
    const m = moveSlot(c, 'hockey', 5, 0, '08:30', false);
    expect(slotOn(m, 'hockey', 0)).toEqual({ d: 0, t: '08:30', kind: 'wish' });
    expect(slotOn(m, 'hockey', 5)).toBe(null);
    expect(moveSlot(c, 'hockey', 5, 6, null, false)).toBe(c); // Sunday holds the fixed ice hockey already
  });
  it('only the kinds that can have places get them', () => {
    const c = winter();
    expect(setSlot(c, 'sauna', 1, '10:00', 'fix', false)).toBe(c);
    expect(setSlot(c, 'gym', 9, '10:00', 'fix', false)).toBe(c);
    expect(setSlot(c, 'gym', 1, '10:00', 'maybe', false)).toBe(c);
  });
});

describe('the stored setting', () => {
  it('keeps wishes in their order, drops doubles, bad days and bad times, and never puts a wish on a fixed day', () => {
    const raw = { winter: { hours: 15, counts: { hockey: 1 }, fixes: { hockey: [{ d: 6, t: '08:00' }] }, custom: { hockey: true }, wishes: { hockey: [{ d: 5, t: '08:00' }, { d: 5, t: '10:00' }, { d: 6, t: '07:00' }, { d: 9, t: '07:00' }, { d: 0, t: 'x' }] } } };
    const c = configOf(raw.winter, false);
    expect(c.wishes.hockey).toEqual([{ d: 5, t: '08:00' }, { d: 0, t: '08:00' }]);
  });
  it('an old setting without wishes still reads, and the basic plan has none', () => {
    expect(configOf({ hours: 15, counts: {} }, false).wishes).toEqual({});
    expect(defaultsFor(true).wishes).toEqual({});
  });
});

describe('the planner and wishes', () => {
  const wishCfg = (days) => {
    let c = { ...winter(), counts: { ...winter().counts, hockey: 1 }, fixes: { ...winter().fixes, hockey: undefined }, custom: { hockey: true } };
    delete c.fixes.hockey;
    for (const [d, t] of days) c = setSlot(c, 'hockey', d, t, 'wish', false);
    return c;
  };
  it('puts a free unit on its first wish when the place is free', () => {
    const r = run(wishCfg([[5, '08:00'], [6, '08:00']]));
    const h = of(r, 'hockey');
    expect(h.length).toBe(1);
    expect([h[0].d, h[0].t, h[0].why.key, h[0].fixed]).toEqual([5, '08:00', 'wish', false]);
  });
  it('takes the next wish when the first is not free (a ski tour takes Saturday)', () => {
    const r = run(wishCfg([[5, '08:00'], [6, '08:00']]), { ski: true });
    expect(of(r, 'hockey').length ? of(r, 'hockey')[0].d : -1).not.toBe(5);
  });
  it('takes the best other place and says so when no wish fits', () => {
    // a rest day of TrainingPeaks takes the only wished day: nothing free there
    const sessions = [{ rest: true, day: '2026-11-14' }];
    const r = run(wishCfg([[5, '08:00']]), { sessions });
    expect(of(r, 'hockey').length).toBe(1);
    expect(of(r, 'hockey')[0].d).not.toBe(5);
    expect(r.notes.some((n) => n.key === 'wish-missed' && n.type === 'hockey')).toBe(true);
  });
  it('says nothing when every wish was used', () => {
    const r = run(wishCfg([[5, '08:00']]));
    expect(r.notes.some((n) => n.key === 'wish-missed')).toBe(false);
  });
  it('is the same week every time, and a fixed place always stands', () => {
    const c = setSlot(wishCfg([[5, '08:00']]), 'gym', 3, '16:00', 'fix', false);
    expect(run(c).units).toEqual(run(c).units);
    const g = of(run(c), 'gym').find((x) => x.id === 'gym@3');
    expect([g.d, g.t, g.fixed]).toEqual([3, '16:00', true]);
  });
  it('a move of the person still wins over a wish', () => {
    const r = run(wishCfg([[5, '08:00']]), { pins: { 'hockey#1': { d: 1, t: '18:00' } } });
    expect(of(r, 'hockey')[0]).toMatchObject({ d: 1, t: '18:00', pinned: true });
  });
  it('a wish comes before what the planner places on its own (the rest block waits for it)', () => {
    // the rest block likes Friday afternoon; a gym wish on Friday 16:00 must still get it
    let c = setSlot(winter(), 'gym', 4, '16:00', 'wish', false);
    c = configOf(JSON.parse(JSON.stringify(c)), false);
    const r = run(c);
    expect(of(r, 'gym').find((x) => x.id === 'gym#1')).toMatchObject({ d: 4, t: '16:00' });
    expect(r.notes.some((n) => n.key === 'wish-missed')).toBe(false);
  });
  it('a wish of the rest block is used, too', () => {
    const c = configOf(JSON.parse(JSON.stringify(setSlot(winter(), 'rest', 5, '14:00', 'wish', false))), false);
    expect(of(run(c), 'rest')[0]).toMatchObject({ d: 5, t: '14:00' });
  });
  it('the texts exist for the new notes and reasons', () => {
    expect(NOTE_TEXT['wish-missed']).toBeTruthy();
    expect(WHY_KEYS).toEqual(expect.arrayContaining(['wish', 'carried']));
    expect(TIME_PARTS.map((p) => p.t)).toEqual(['08:00', '12:30', '16:00', '19:00']);
  });
});

describe('what was moved last week comes back (Noah «3a»)', () => {
  const moved = (log, monday, id, d, t) => movePin(log, monday, id, d, t, monday);
  it('carries a move into the next week and marks it as taken over', () => {
    const log = moved(logOf(null), MON, 'gym@2', 2, '16:00');
    const wp = weekPins(log, NEXT);
    expect(wp.pins['gym@2']).toEqual({ d: 2, t: '16:00' });
    expect(wp.carried).toEqual(['gym@2']);
    const r = run(winter(), { monday: NEXT, pins: wp.pins, carried: wp.carried });
    const g = of(r, 'gym').find((x) => x.id === 'gym@2');
    expect([g.t, g.pinned, g.carried, g.why.key]).toEqual(['16:00', true, true, 'carried']);
  });
  it('a move made in the week itself wins and is not marked as taken over', () => {
    let log = moved(logOf(null), MON, 'gym@2', 2, '16:00');
    log = moved(log, NEXT, 'gym@2', 3, '07:00');
    const wp = weekPins(log, NEXT);
    expect(wp.pins['gym@2']).toEqual({ d: 3, t: '07:00' });
    expect(wp.carried).toEqual([]);
  });
  it('goes on week after week until the person goes back, and stops there', () => {
    const log = moved(logOf(null), MON, 'gym@2', 2, '16:00');
    expect(weekPins(log, '2026-11-23').carried).toEqual(['gym@2']);
    const back = backToStandard(log, NEXT, NEXT);
    expect(weekPins(back, NEXT).pins).toEqual({});
    expect(weekPins(back, '2026-11-23').pins).toEqual({}); // the weeks after start from the standard week, too
    expect(weekLog(back, NEXT).mode.std).toBe(true);
  });
  it('forgets a move nobody repeats for a long time', () => {
    const log = moved(logOf(null), MON, 'gym@2', 2, '16:00');
    let far = MON;
    for (let i = 0; i <= CARRY_WEEKS; i++) {
      const d = new Date(`${far}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 7);
      far = d.toISOString().slice(0, 10);
    }
    expect(weekPins(log, far).pins).toEqual({});
  });
  it('a past week can not be set back, and setting it back twice changes nothing', () => {
    const log = moved(logOf(null), MON, 'gym@2', 2, '16:00');
    expect(backToStandard(log, MON, '2026-12-30')).toBe(log);
    const once = backToStandard(log, NEXT, NEXT);
    expect(backToStandard(once, NEXT, NEXT)).toBe(once);
  });
  it('the mode std is stored and cleaned like the others', () => {
    expect(setMode(logOf(null), NEXT, { std: true }, NEXT).weeks[NEXT].mode).toEqual({ std: true });
  });
  it('weekFor takes the carried ids into the plan (Heute and the next unit see the same time)', () => {
    const log = moved(logOf(null), MON, 'gym@2', 2, '16:00');
    const wp = weekPins(log, NEXT);
    const r = weekFor(null, NEXT, wp.pins, {}, [], wp.carried);
    expect(r.week.units.find((x) => x.id === 'gym@2')).toMatchObject({ t: '16:00', carried: true });
  });
});
