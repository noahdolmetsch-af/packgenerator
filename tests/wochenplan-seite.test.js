// «Wochenplan» Teil 2 (Noah 09.11.2026): the words of the page. The planner gives codes; every code the planner can give
// has a text, and every text has German. Fictional settings only.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { TYPES, GOAL_TYPES, planOf, planWeek, defaultsFor, isSummer, setHours, MIN_HOURS, MAX_HOURS, stepCount, setFixTime, toggleFix, FIXABLE } from '../src/lib/training/wochenplan.js';
import { UNIT_NAME, UNIT_HINT, LOAD_WORD, NOTE_TEXT, WARN_TEXT, whyOf, timeChoices, WHY_KEYS, lengthOf, hoursOf, reachedPct, EXAMPLE_MONDAY } from '../src/lib/training/wochenplan-text.js';
import { mondayOf } from '../src/lib/training.js';

describe('Wochenplan: the words', () => {
  it('every unit of the planner has a name', () => {
    for (const type of Object.keys(TYPES)) expect(UNIT_NAME[type], type).toBeTruthy();
    for (const type of GOAL_TYPES) expect(UNIT_NAME[type], type).toBeTruthy();
  });

  it('every text of the tables has German', () => {
    const all = [...Object.values(UNIT_NAME), ...Object.values(UNIT_HINT), ...Object.values(LOAD_WORD), ...Object.values(NOTE_TEXT), ...Object.values(WARN_TEXT)];
    for (const text of all) expect(DE[text], text).toBeTruthy();
    expect(DE['{h} h|plan']).toBe('{h} Std');
  });

  it('every note and warning the planner gives in all weeks of a season has a text', () => {
    const keys = new Set();
    for (const summer of [false, true]) {
      for (let hours = MIN_HOURS; hours <= MAX_HOURS; hours++) {
        const cfg = setHours(defaultsFor(summer), hours, summer);
        for (const monday of summer ? ['2027-05-03', '2027-05-10'] : ['2027-01-04', '2027-01-11']) {
          const w = planWeek(cfg, { monday });
          for (const n of w.notes) keys.add(`note:${n.key}`);
          for (const x of w.warnings) keys.add(`warn:${x.key}`);
        }
      }
    }
    // a unit count of zero everywhere and many gym units without the sauna give the notes that are rare
    const cfg = stepCount(stepCount(defaultsFor(false), 'gym', -2, false), 'sauna', 1, false);
    for (const n of planWeek(cfg, { monday: '2027-01-04' }).notes) keys.add(`note:${n.key}`);
    for (const k of keys) {
      const [kind, key] = k.split(':');
      expect((kind === 'note' ? NOTE_TEXT : WARN_TEXT)[key], k).toBeTruthy();
    }
  });

  it('the example Mondays are Mondays in their own season', () => {
    for (const [season, day] of Object.entries(EXAMPLE_MONDAY)) {
      expect(mondayOf(day), season).toBe(day);
      expect(isSummer(day), season).toBe(season === 'summer');
    }
  });

  it('writes minutes and hours, and the share of the goal', () => {
    expect(lengthOf(45)).toEqual({ text: '{n} min', vars: { n: 45 } });
    expect(lengthOf(120)).toEqual({ text: '{h} h|plan', vars: { h: 2 } });
    expect(lengthOf(150).vars.h).toBe(2.5);
    expect(hoursOf(750)).toBe(12.5);
    expect(reachedPct(450, 15)).toBe(50);
    expect(reachedPct(5000, 15)).toBe(100);
    expect(reachedPct(0, 0)).toBe(0);
  });

  it('a stored value that is nothing still gives a full plan', () => {
    const p = planOf(null);
    expect(p.winter.hours).toBeGreaterThan(0);
    expect(planWeek(p.winter, { monday: '2027-01-04' }).units.length).toBeGreaterThan(5);
  });
});

describe('Wochenplan: why here, wish time (part 4)', () => {
  const MON = '2026-11-09';
  it('every reason the planner gives in every kind of week has a text with German', () => {
    const seen = new Set();
    for (const summer of [false, true])
      for (let hours = MIN_HOURS; hours <= MAX_HOURS; hours += 2)
        for (const ctx of [{}, { ski: true }, { rain: true }]) {
          const monday = summer ? '2027-05-03' : MON;
          const week = planWeek(setHours(defaultsFor(summer), hours, summer), { monday, ...ctx });
          for (const u of week.units) {
            seen.add(u.why.key);
            const w = whyOf(u.why);
            expect(DE[w.text], `${u.id}: ${w.text}`).toBeTruthy();
            for (const x of [w.a, w.b].filter(Boolean)) expect(DE[x], x).toBeTruthy();
          }
        }
    for (const key of seen) expect(WHY_KEYS, key).toContain(key);
  });
  it('the reasons of a free unit name what is true', () => {
    expect(whyOf({ key: 'best', empty: true, calm: true }).text).toBe('Here, because {a} and {b}.');
    expect(whyOf({ key: 'best', empty: false, calm: true })).toEqual({ text: 'Here, because {a}.', a: 'no hard day is next to it' });
    expect(whyOf({ key: 'best', empty: false, calm: false }).text).toBe('The best free place.');
    expect(whyOf({ key: 'nonsense' }).text).toBe('The best free place.');
    expect(whyOf(undefined).text).toBe('The best free place.');
  });
  it('offers half hours from 6 to 21:30 and keeps an odd current time', () => {
    const list = timeChoices('10:00');
    expect(list[0]).toBe('06:00');
    expect(list.at(-1)).toBe('21:30');
    expect(list).toHaveLength(32);
    expect(timeChoices('15:55')).toContain('15:55');
    expect(timeChoices('15:55')).toEqual([...timeChoices('15:55')].sort());
  });
  it('a wish time changes only the fixed day it names', () => {
    const cfg = defaultsFor(false);
    const next = setFixTime(cfg, 'tennis', 1, '17:30');
    expect(next.fixes.tennis.find((f) => f.d === 1).t).toBe('17:30');
    expect(next.fixes.tennis.find((f) => f.d === 3).t).toBe(cfg.fixes.tennis.find((f) => f.d === 3).t);
    expect(next.custom.tennis).toBe(true);
    expect(setFixTime(cfg, 'tennis', 2, '17:30')).toBe(cfg); // not a fixed day
    expect(setFixTime(cfg, 'tennis', 1, '25:00')).toBe(cfg); // not a time
    expect(setFixTime(cfg, 'sauna', 1, '17:30')).toBe(cfg); // not a fixable goal
    const week = planWeek(next, { monday: MON });
    expect(week.units.find((u) => u.id === 'tennis@1').t).toBe('17:30');
  });
  it('a fixed day set on the page lands in the week at its usual time', () => {
    const cfg = toggleFix(defaultsFor(false), 'yoga', 5, false);
    expect(cfg.counts.yoga).toBe(3);
    const u = planWeek(cfg, { monday: MON }).units.find((x) => x.id === 'yoga@5');
    expect(u.fixed).toBe(true);
    expect(FIXABLE).toContain('yoga');
  });
});
