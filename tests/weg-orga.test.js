// «Weg zum Ziel» › Organisation (Noah 05.11.2026 «1d»): five suggested steps, the strip «x von y geregelt», nothing ticks by itself.
import { describe, it, expect } from 'vitest';
import orga, { ORGA_OFFSETS } from '../src/lib/weg/types/orga.js';
import { TYPES, suggestions, typeOf } from '../src/lib/weg/types/index.js';
import { newGoal, addSteps, applyAuto, setDone, typeProgress, dueOf, templateOf } from '../src/lib/weg/weg.js';
import DE from '../src/lib/i18n/de/weg-orga.js';

const today = '2026-11-07';
const goal = (kind) => newGoal({ title: 'Rennen im Mai', kind, start: '2027-05-15' }, { id: 'g1', now: '2026-11-01T00:00:00Z' });
const withOrga = (kind) => addSteps(goal(kind), suggestions(goal(kind), [orga]).map((s, i) => ({ ...s })), { ids: (i) => `o${i}` });

describe('Organisation', () => {
  it('is registered and has its own label', () => {
    expect(TYPES).toContain(orga);
    expect(typeOf('orga')).toBe(orga);
    expect(DE.Organisation).toBe('Organisation');
  });
  it('suggests five steps for a race, four for a trip, two for a free goal', () => {
    expect(orga.defaults(goal('race')).map((s) => s.key)).toEqual(['register', 'leave', 'stay', 'train', 'contact']);
    expect(orga.defaults(goal('trip')).map((s) => s.key)).toEqual(['leave', 'stay', 'train', 'contact']);
    expect(orga.defaults(goal('free')).map((s) => s.key)).toEqual(['leave', 'contact']);
  });
  it('puts every step before the start, each with an English key that has a German text', () => {
    for (const s of orga.defaults(goal('race'))) {
      expect(s.offset).toBe(ORGA_OFFSETS[s.key]);
      expect(DE[s.title]).toBeTruthy();
      if (s.note) expect(DE[s.note]).toBeTruthy();
    }
  });
  it('never ticks by itself and never takes a tick back', () => {
    const g = withOrga('race');
    expect(applyAuto(g, TYPES, { today })).toBe(g);
    expect(orga.auto(g, g.steps[0], {})).toBeNull();
  });
  it('counts the steps of its kind for the strip and names the soonest open one', () => {
    let g = withOrga('race');
    g = setDone(g, 'o1', true); // leave
    const p = typeProgress(g, 'orga', today);
    expect(p).toMatchObject({ done: 1, total: 5 });
    // the first open step by day is «Sign up» (day 120 before), then «Stay» (90)
    expect(p.soon.row.step.key).toBe('register');
    expect(p.soon.days).toBe(Math.round((Date.parse(`${dueOf(g, p.soon.row.step)}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5));
  });
  it('shows a deadline in the past as negative days (the strip says «late»)', () => {
    const g = addSteps(goal('race'), [{ type: 'orga', key: 'register', title: 'Sign up for the race', due: '2026-11-01' }], { ids: () => 'x1' });
    expect(typeProgress(g, 'orga', today).soon.days).toBe(-6);
  });
  it('a template keeps the key of a step', () => {
    expect(templateOf(withOrga('race')).map((s) => s.key)).toEqual(['register', 'leave', 'stay', 'train', 'contact']);
  });
});
