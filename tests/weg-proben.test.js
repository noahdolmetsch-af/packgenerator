// «Weg zum Ziel» › Probefahrten (Noah 05.11.2026 «3a»): milestones 50 / 100 / 200 km that tick from the rides.
import { describe, it, expect } from 'vitest';
import proben, { MILESTONES, ridesFor, bestKm, milestones, kmOf, WINDOW } from '../src/lib/weg/types/proben.js';
import { TYPES, suggestions, typeOf } from '../src/lib/weg/types/index.js';
import { newGoal, addSteps, applyAuto, setDone } from '../src/lib/weg/weg.js';
import DE from '../src/lib/i18n/de/weg-proben.js';

const today = '2027-03-01';
const goal = (kind = 'race', start = '2027-05-15') => newGoal({ title: 'Rennen im Mai', kind, start }, { id: 'g1', now: '2027-01-01T00:00:00Z' });
const withSteps = (kind, start) => addSteps(goal(kind, start), suggestions(goal(kind, start), [proben]), { ids: (i) => `p${i}` });
const ride = (day, km) => ({ day, km });

describe('Practice rides', () => {
  it('is registered with a German label', () => {
    expect(TYPES).toContain(proben);
    expect(typeOf('proben')).toBe(proben);
    expect(DE['Practice rides']).toBe('Probefahrten');
  });
  it('suggests 50, 100 and 200 km for a race and a trip, 50 and 100 for a free goal', () => {
    expect(proben.defaults(goal('race')).map((s) => s.key)).toEqual(['km50', 'km100', 'km200']);
    expect(proben.defaults(goal('trip')).map((s) => s.key)).toEqual(['km50', 'km100', 'km200']);
    expect(proben.defaults(goal('free', '')).map((s) => s.key)).toEqual(['km50', 'km100']);
  });
  it('has a German text for every title (the strip explains the rest, so no note)', () => {
    for (const s of proben.defaults(goal('race'))) {
      expect(DE[s.title]).toBeTruthy();
      expect(s.note).toBeUndefined();
    }
  });
  it('knows the km of a step from its key', () => {
    expect(MILESTONES.map((m) => kmOf({ key: m.key }))).toEqual([50, 100, 200]);
    expect(kmOf({ key: 'other' })).toBe(0);
    expect(kmOf({})).toBe(0);
  });
  it('counts only rides inside the window before the start, never on or after the start day', () => {
    const g = goal();
    const rides = [ride('2026-10-01', 300), ride('2027-02-01', 80), ride('2027-05-15', 250), ride('2027-05-20', 250), ride('2027-02-10', 0)];
    expect(ridesFor(g, { rides, today }).map((r) => r.km)).toEqual([80]);
    expect(WINDOW).toBe(150);
  });
  it('without a start day counts the last 150 days up to today, not the future', () => {
    const g = goal('free', '');
    const rides = [ride('2027-02-20', 60), ride('2027-03-05', 90), ride('2026-08-01', 120)];
    expect(bestKm(g, { rides, today })).toBe(60);
  });
  it('after the start day the rides before it still count', () => {
    const g = goal('race', '2027-02-01');
    expect(bestKm(g, { rides: [ride('2027-01-20', 110), ride('2027-02-10', 200)], today })).toBe(110);
  });
  it('ticks every milestone that one ride reaches, and nothing else', () => {
    const g = withSteps('race');
    const next = applyAuto(g, TYPES, { proben: { rides: [ride('2027-02-20', 120)] }, today });
    expect(next.steps.filter((s) => s.done).map((s) => [s.key, s.by])).toEqual([['km50', 'auto'], ['km100', 'auto']]);
    expect(next.steps.find((s) => s.key === 'km200').done).toBe(false);
  });
  it('adds up no rides: two rides of 30 km do not make 50', () => {
    const g = withSteps('race');
    expect(applyAuto(g, TYPES, { proben: { rides: [ride('2027-02-20', 30), ride('2027-02-21', 30)] }, today })).toBe(g);
  });
  it('never ticks again a step the user unticked', () => {
    let g = withSteps('race');
    g = applyAuto(g, TYPES, { proben: { rides: [ride('2027-02-20', 60)] }, today });
    g = setDone(g, 'p0', false);
    expect(applyAuto(g, TYPES, { proben: { rides: [ride('2027-02-20', 60)] }, today })).toBe(g);
  });
  it('builds the strip sorted by km with the longest ride', () => {
    const g = withSteps('race');
    const m = milestones(g, today, { rides: [ride('2027-02-20', 75)] });
    expect(m.best).toBe(75);
    expect(m.items.map((i) => [i.km, i.reached])).toEqual([[50, true], [100, false], [200, false]]);
    expect(m.items[0].due).toBe('2027-03-06');
  });
  it('has no strip without steps of this kind', () => {
    expect(milestones(goal(), today, {}).items).toEqual([]);
  });
});
