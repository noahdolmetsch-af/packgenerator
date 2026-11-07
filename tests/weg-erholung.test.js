// «Weg zum Ziel» › Erholung (Noah 05.11.2026 «4e»): four steps for the last week, nothing ticks by itself.
import { describe, it, expect } from 'vitest';
import erholung, { REST_STEPS } from '../src/lib/weg/types/erholung.js';
import { TYPES, suggestions, typeOf } from '../src/lib/weg/types/index.js';
import { newGoal, addSteps, applyAuto, dueOf } from '../src/lib/weg/weg.js';
import DE from '../src/lib/i18n/de/weg-erholung.js';

const goal = (kind = 'race') => newGoal({ title: 'Rennen im Mai', kind, start: '2027-05-15' }, { id: 'g1', now: '2027-01-01T00:00:00Z' });

describe('Recovery steps', () => {
  it('is registered', () => {
    expect(TYPES).toContain(erholung);
    expect(typeOf('erholung')).toBe(erholung);
  });
  it('suggests the same four steps for every kind of goal, all in the last week', () => {
    for (const kind of ['race', 'trip', 'free']) expect(erholung.defaults(goal(kind)).map((s) => s.key)).toEqual(['sleep', 'stretch', 'food', 'check']);
    expect(Math.max(...REST_STEPS.map((s) => s.offset))).toBeLessThanOrEqual(7);
  });
  it('has a German text for every title and note', () => {
    for (const s of REST_STEPS) {
      expect(DE[s.title]).toBeTruthy();
      expect(DE[s.note]).toBeTruthy();
    }
  });
  it('counts back from the start day', () => {
    const g = addSteps(goal(), suggestions(goal(), [erholung]), { ids: (i) => `e${i}` });
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-05-09', '2027-05-11', '2027-05-12', '2027-05-13']);
  });
  it('never ticks by itself', () => {
    const g = addSteps(goal(), suggestions(goal(), [erholung]), { ids: (i) => `e${i}` });
    expect(applyAuto(g, TYPES, { today: '2027-05-14' })).toBe(g);
  });
  it('leads the first two steps to Aktiv, the last one to the bikes, the food one nowhere', () => {
    const l = (key) => erholung.link(goal(), { key });
    expect([l('sleep'), l('stretch'), l('food'), l('check')]).toEqual(['#/routine', '#/flow/rest', '', '#/velos']);
  });
});
