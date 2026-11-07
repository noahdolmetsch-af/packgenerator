// «Weg zum Ziel», kind of step «GPS tracker»: five steps counted back from the start, German texts, links that lead
// somewhere, ticking by itself from the race paperwork only, and no login stored. Fictional data.
import { describe, it, expect } from 'vitest';
import { newGoal, addSteps, applyAuto, dueOf, timeline, setDone, typeProgress } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import tracker, { GPS_STEPS } from '../src/lib/weg/types/tracker.js';
import { FEATURES, featureHref } from '../src/lib/features.js';
import DE from '../src/lib/i18n/de/index.js';

const today = '2027-04-01';
const goal = (extra = {}) => newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-05-15', ...extra }, { id: 'g1', now: 'x' });
const ids = () => { let n = 0; return () => `s${++n}`; };
const withSteps = (g) => addSteps(g, suggestions(g, [tracker]), { ids: ids() });

describe('registry', () => {
  it('is in the registry and found by its id', () => {
    expect(TYPES.map((t) => t.type)).toContain('tracker');
    expect(typeOf('tracker')).toBe(tracker);
    expect(tracker).toMatchObject({ type: 'tracker', label: 'GPS tracker' });
  });
});

describe('the five steps', () => {
  it('suggests all five for a race, a trip and a free goal, in time order', () => {
    for (const kind of ['race', 'trip', 'free']) {
      const s = suggestions(goal({ kind }), [tracker]);
      expect(s.map((x) => x.key)).toEqual(['plan', 'charge', 'test', 'family', 'battery']);
      expect(s.every((x) => x.type === 'tracker' && x.title && x.note)).toBe(true);
      expect(s.map((x) => x.offset)).toEqual([...s.map((x) => x.offset)].sort((a, b) => b - a));
    }
  });
  it('counts back from the start; a free goal gets days once it has a start', () => {
    const g = withSteps(goal());
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-04-03', '2027-04-24', '2027-05-01', '2027-05-03', '2027-05-05']);
    expect(g.steps.every((s) => s.key)).toBe(true); // the store keeps the key
    const free = withSteps(goal({ kind: 'free', start: '' }));
    expect(free.steps.map((s) => dueOf(free, s))).toEqual(['', '', '', '', '']);
    expect(dueOf({ ...free, start: '2027-06-01' }, free.steps[1])).toBe('2027-05-11');
  });
  it('shows up in the timeline and in the strip «x of 5 sorted»', () => {
    let g = withSteps(goal());
    expect(timeline(g, '2027-04-10').map((r) => r.state)).toEqual(['late', 'open', 'open', 'open', 'open']);
    g = setDone(g, 's1', true);
    expect(typeProgress(g, 'tracker', today)).toMatchObject({ done: 1, total: 5 });
  });
  it('the login is never part of a step: the note points to the password manager', () => {
    expect(GPS_STEPS[0].note).toMatch(/password manager/);
    const all = JSON.stringify(GPS_STEPS).toLowerCase();
    expect(all).not.toMatch(/password:|passwort:|pin code/);
  });
});

describe('German', () => {
  it('has a German text for the label, every title and every note', () => {
    const keys = ['GPS tracker', ...GPS_STEPS.flatMap((s) => [s.title, s.note])];
    expect(keys.filter((k) => !(k in DE))).toEqual([]);
  });
});

describe('links', () => {
  it('every link leads to a page of the app; a step without a key has none', () => {
    const g = withSteps(goal());
    const known = new Set(FEATURES.map((f) => featureHref(f, { bikeId: '<id>' })).filter(Boolean));
    const links = g.steps.map((s) => tracker.link(g, s));
    expect(links.every((l) => l.startsWith('#/'))).toBe(true);
    for (const l of links) expect(known.has(l), l).toBe(true);
    expect(tracker.link(g, { type: 'tracker', title: 'x' })).toBe('');
    expect(tracker.link(g, undefined)).toBe('');
  });
});

describe('ticking by itself', () => {
  const g = withSteps(goal());
  it('«plan» ticks when the race paperwork has the tracker done; nothing else ticks', () => {
    const r = applyAuto(g, TYPES, { tracker: { papers: [{ id: 'pp-signup', done: true }, { id: 'pp-tracker', done: true }] } });
    expect(r.steps.map((s) => s.done)).toEqual([true, false, false, false, false]);
    expect(r.steps[0].by).toBe('auto');
  });
  it('stays quiet without paperwork, with the tracker open, or after the user unticked it', () => {
    expect(applyAuto(g, TYPES, {})).toBe(g);
    expect(applyAuto(g, TYPES, { tracker: { papers: [{ id: 'pp-tracker', done: false }] } })).toBe(g);
    const ticked = applyAuto(g, TYPES, { tracker: { papers: [{ id: 'pp-tracker', done: true }] } });
    const unticked = setDone(ticked, 's1', false);
    expect(applyAuto(unticked, TYPES, { tracker: { papers: [{ id: 'pp-tracker', done: true }] } }).steps[0].done).toBe(false);
    expect(tracker.auto(g, { type: 'tracker', key: 'test' }, { tracker: { papers: [{ id: 'pp-tracker', done: true }] } })).toBeNull();
    expect(tracker.auto(g, g.steps[0], { tracker: { papers: 'broken' } })).toBeNull();
  });
});
