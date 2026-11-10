// «Wochenplan» Teil 2 (Noah 09.11.2026): the words of the page. The planner gives codes; every code the planner can give
// has a text, and every text has German. Fictional settings only.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { TYPES, GOAL_TYPES, planOf, planWeek, defaultsFor, isSummer, setHours, MIN_HOURS, MAX_HOURS, stepCount } from '../src/lib/training/wochenplan.js';
import { UNIT_NAME, UNIT_HINT, LOAD_WORD, NOTE_TEXT, WARN_TEXT, lengthOf, hoursOf, reachedPct, EXAMPLE_MONDAY } from '../src/lib/training/wochenplan-text.js';
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
