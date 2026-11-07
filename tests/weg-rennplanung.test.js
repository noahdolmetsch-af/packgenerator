// «Weg zum Ziel», Schrittart «Rennplanung»: four steps that point to the Rennen-Check and tick by themselves when the
// sheet is filled in. Fictional data.
import { describe, it, expect } from 'vitest';
import { newGoal, addSteps, applyAuto, setDone, dueOf, typeProgress, templateOf } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import rennplanung, { STEPS, checkDone } from '../src/lib/weg/types/rennplanung.js';
import { withValue, DAY_BEFORE } from '../src/lib/race/check-lib.js';
import DE from '../src/lib/i18n/de/weg-rennplanung.js';

const today = '2027-03-01';
const ids = (p) => { let n = 0; return () => `${p}${++n}`; };
const race = (extra = {}) => newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-05-15', tripId: 'trip1', ...extra }, { id: 'g1', now: 'x' });
const withSteps = (g) => addSteps(g, suggestions(g, [rennplanung]), { ids: ids('s') });
const fill = (check, pairs) => pairs.reduce((c, [k, v]) => withValue(c, k, v, 'x'), check);
const byKey = (g, key) => g.steps.find((s) => s.key === key);

describe('suggestions', () => {
  it('is in the registry, after the own step', () => {
    expect(TYPES.map((t) => t.type)).toEqual(['own', 'rennplanung']);
    expect(typeOf('rennplanung')).toBe(rennplanung);
  });
  it('a race gets the four steps, counted back from the start; every other goal gets none', () => {
    const g = withSteps(race());
    expect(g.steps.map((s) => s.key).sort()).toEqual(['liste', 'schlaf', 'setup', 'vorher']);
    expect(g.steps.every((s) => s.type === 'rennplanung' && !s.done)).toBe(true);
    expect(g.steps.map((s) => dueOf(g, s)).sort()).toEqual(['2027-03-20', '2027-04-03', '2027-04-10', '2027-05-14']);
    expect(rennplanung.defaults(race({ kind: 'trip' }))).toEqual([]);
    expect(rennplanung.defaults(newGoal({ title: 'Frei' }))).toEqual([]);
  });
  it('the offsets fall in a sensible order and the day before is one day', () => {
    const o = (k) => STEPS.find((s) => s.key === k).offset;
    expect(o('schlaf')).toBeGreaterThan(o('liste'));
    expect(o('liste')).toBeGreaterThan(o('setup'));
    expect(o('vorher')).toBe(1);
  });
});

describe('ticking by itself from the race check', () => {
  const g = withSteps(race());
  const ctx = (check) => ({ races: { trip1: check === undefined ? {} : { check } } });
  const doneKeys = (goal) => goal.steps.filter((s) => s.done).map((s) => s.key).sort();

  it('nothing is ticked while the check is empty or the race has none', () => {
    expect(applyAuto(g, [rennplanung], ctx(undefined))).toBe(g);
    expect(applyAuto(g, [rennplanung], ctx({ values: {}, at: 'x' }))).toBe(g);
  });
  it('a weight on a bag ticks «target setup»; a word on sheet 3 ticks «basic list»; a word on sheet 4 «sleep»', () => {
    let c = fill({}, [['setup.0.g', '450']]);
    expect(doneKeys(applyAuto(g, [rennplanung], ctx(c)))).toEqual(['setup']);
    c = fill(c, [['liste.1.v', '1 rain jacket']]);
    expect(doneKeys(applyAuto(g, [rennplanung], ctx(c)))).toEqual(['liste', 'setup']);
    c = fill(c, [['schlaf.rule', '4 h a night']]);
    const r = applyAuto(g, [rennplanung], ctx(c));
    expect(doneKeys(r)).toEqual(['liste', 'schlaf', 'setup']);
    expect(r.steps.filter((s) => s.done).every((s) => s.by === 'auto')).toBe(true);
  });
  it('«day before» needs every point ticked off, not just some', () => {
    const some = fill({}, DAY_BEFORE.slice(0, -1).map((_, i) => [`vorher.${i}.done`, true]));
    expect(byKey(applyAuto(g, [rennplanung], ctx(some)), 'vorher').done).toBe(false);
    const all = fill({}, DAY_BEFORE.map((_, i) => [`vorher.${i}.done`, true]));
    expect(byKey(applyAuto(g, [rennplanung], ctx(all)), 'vorher')).toMatchObject({ done: true, by: 'auto' });
  });
  it('text written on a sheet that is not meant for the step does not tick it', () => {
    const c = fill({}, [['liste.0.v', 'bib shorts'], ['nacht.0', 'x']]);
    expect(doneKeys(applyAuto(g, [rennplanung], ctx(c)))).toEqual(['liste']);
  });
  it('a tick is not taken back when the answer is deleted; an untick by the user stays', () => {
    const ticked = applyAuto(g, [rennplanung], ctx(fill({}, [['setup.0.g', '450']])));
    expect(applyAuto(ticked, [rennplanung], ctx({ values: {} }))).toBe(ticked);
    const unticked = setDone(ticked, byKey(ticked, 'setup').id, false);
    expect(byKey(applyAuto(unticked, [rennplanung], ctx(fill({}, [['setup.0.g', '450']]))), 'setup').done).toBe(false);
  });
  it('without a trip, without that race, a renamed step or a broken record nothing ticks and nothing throws', () => {
    const c = fill({}, [['setup.0.g', '450']]);
    expect(applyAuto(withSteps(race({ tripId: '' })), [rennplanung], ctx(c)).steps.some((s) => s.done)).toBe(false);
    expect(applyAuto(g, [rennplanung], { races: { other: { check: c } } })).toBe(g);
    expect(applyAuto(g, [rennplanung], {})).toBe(g);
    expect(applyAuto(g, [rennplanung], { races: { trip1: 'kaputt' } })).toBe(g);
    expect(rennplanung.auto(g, { type: 'rennplanung' }, ctx(c))).toBeNull();
    expect(checkDone('nope', c)).toBeNull();
    expect(checkDone('setup', null)).toBeNull();
  });
  it('a renamed or moved step keeps ticking, because the key stays', () => {
    const renamed = { ...g, steps: g.steps.map((s) => (s.key === 'setup' ? { ...s, title: 'Meine Taschen', due: '2027-01-01' } : s)) };
    expect(byKey(applyAuto(renamed, [rennplanung], ctx(fill({}, [['setup.0.g', '450']]))), 'setup').done).toBe(true);
  });
  it('the strip «x of 4 sorted» counts the four steps', () => {
    const r = applyAuto(g, [rennplanung], ctx(fill({}, [['setup.0.g', '450'], ['schlaf.rule', 'x']])));
    expect(typeProgress(r, 'rennplanung', today)).toMatchObject({ done: 2, total: 4 });
  });
});

describe('link, texts, template', () => {
  it('the link leads to the check of the race, else to the list of races', () => {
    expect(rennplanung.link(race())).toBe('#/racecheck/trip1');
    expect(rennplanung.link(race({ tripId: 'a b' }))).toBe('#/racecheck/a%20b');
    expect(rennplanung.link(race({ tripId: '' }))).toBe('#/racecheck');
  });
  it('every title, note and the label has German', () => {
    for (const s of STEPS) {
      expect(DE[s.title], s.title).toBeTruthy();
      expect(DE[s.note], s.note).toBeTruthy();
    }
    expect(DE[rennplanung.label]).toBe('Rennplanung');
  });
  it('the steps stay in a template (offsets), and no tick is carried over', () => {
    const t = templateOf(setDone(withSteps(race()), 's1', true));
    expect(t).toHaveLength(4);
    expect(t.every((x) => x.type === 'rennplanung' && Number.isFinite(x.offset))).toBe(true);
  });
});
