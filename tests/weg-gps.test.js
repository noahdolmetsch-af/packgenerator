// «Weg zum Ziel», Schrittart «GPS-Tracker»: five steps by hand, and never a login or password. Fictional data.
import { describe, it, expect } from 'vitest';
import { newGoal, addSteps, applyAuto, setDone, dueOf, typeProgress, templateOf } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import gps, { STEPS, ACCESS_HINT, looksLikeSecret } from '../src/lib/weg/types/gps.js';
import DE from '../src/lib/i18n/de/weg-gps.js';

const today = '2027-03-01';
const ids = (p) => { let n = 0; return () => `${p}${++n}`; };
const goal = (extra = {}) => newGoal({ title: 'Test Rennen', kind: 'race', start: '2027-05-15', tripId: 'trip1', ...extra }, { id: 'g1', now: 'x' });
const withSteps = (g) => addSteps(g, suggestions(g, [gps]), { ids: ids('s') });
const byKey = (g, key) => g.steps.find((s) => s.key === key);

describe('suggestions', () => {
  it('is in the registry', () => {
    expect(TYPES.map((t) => t.type)).toContain('gps');
    expect(typeOf('gps')).toBe(gps);
  });
  it('a race and a trip get the five steps, counted back from the start; a free goal gets none', () => {
    for (const kind of ['race', 'trip']) {
      const g = withSteps(goal({ kind }));
      expect(g.steps.map((s) => s.key).sort()).toEqual(['abo', 'akku', 'familie', 'laden', 'probe']);
      expect(g.steps.every((s) => s.type === 'gps' && !s.done)).toBe(true);
    }
    const g = withSteps(goal());
    expect(dueOf(g, byKey(g, 'abo'))).toBe('2027-03-31');
    expect(dueOf(g, byKey(g, 'akku'))).toBe('2027-05-01');
    expect(gps.defaults(newGoal({ title: 'Frei' }))).toEqual([]);
  });
  it('the order makes sense: subscription, charge, test ride, family, 24 hours', () => {
    const o = STEPS.map((s) => s.offset);
    expect(o).toEqual([...o].sort((a, b) => b - a));
    expect(STEPS.map((s) => s.key)).toEqual(['abo', 'laden', 'probe', 'familie', 'akku']);
  });
});

describe('ticking', () => {
  it('nothing ticks by itself; the user ticks and unticks', () => {
    const g = withSteps(goal());
    expect(applyAuto(g, [gps], { races: { trip1: { check: {} } } })).toBe(g);
    expect(gps.auto(g, g.steps[0], {})).toBeNull();
    const t = setDone(g, 's1', true);
    expect(typeProgress(t, 'gps', today)).toMatchObject({ done: 1, total: 5 });
    expect(typeProgress(setDone(t, 's1', false), 'gps', today)).toMatchObject({ done: 0, total: 5 });
  });
});

describe('never a login or a password', () => {
  it('no step, note or hint holds one', () => {
    for (const s of STEPS) expect(looksLikeSecret(`${s.title} ${s.note}`), s.key).toBe(false);
    expect(looksLikeSecret(ACCESS_HINT)).toBe(false);
    expect(looksLikeSecret('Zugang liegt im Passwortmanager')).toBe(false);
  });
  it('notes with a deadline, cost and account name are fine', () => {
    expect(looksLikeSecret('Frist 1. April, 49 Franken im Jahr, Konto «Familie»')).toBe(false);
    expect(looksLikeSecret('')).toBe(false);
    expect(looksLikeSecret(null)).toBe(false);
  });
  it('a note that looks like a login or a password is caught', () => {
    for (const bad of ['Passwort: abc123', 'password = hunter2', 'Login: anna', 'user: anna pw: x1', 'pin: 1234', 'Das Passwort ist blau42', 'Benutzername: test', 'pw=geheim']) {
      expect(looksLikeSecret(bad), bad).toBe(true);
    }
  });
  it('a hint plus a real password is still caught', () => {
    expect(looksLikeSecret('Zugang liegt im Passwortmanager. Passwort: abc')).toBe(true);
  });
});

describe('link, texts, template', () => {
  it('the links lead to the race, the live map and the departure sheet', () => {
    const g = goal();
    expect(gps.link(g, { key: 'abo' })).toBe('#/race/trip1');
    expect(gps.link(goal({ tripId: 'a b' }), { key: 'laden' })).toBe('#/race/a%20b');
    expect(gps.link(g, { key: 'probe' })).toBe('#/live');
    expect(gps.link(g, { key: 'akku' })).toBe('#/live');
    expect(gps.link(g, { key: 'familie' })).toBe('#/ride/abfahrt');
    expect(gps.link(goal({ kind: 'trip', tripId: '' }), { key: 'abo' })).toBe('#/ride/abfahrt');
    expect(gps.link(g, undefined)).toBe('#/race/trip1');
  });
  it('every title, note, the label and the hint have German', () => {
    for (const s of STEPS) {
      expect(DE[s.title], s.title).toBeTruthy();
      expect(DE[s.note], s.note).toBeTruthy();
    }
    expect(DE[gps.label]).toBe('GPS-Tracker');
    expect(DE[ACCESS_HINT]).toBe('Zugang liegt im Passwortmanager');
  });
  it('the steps stay in a template (offsets), and no tick is carried over', () => {
    const t = templateOf(setDone(withSteps(goal()), 's1', true));
    expect(t).toHaveLength(5);
    expect(t.every((x) => x.type === 'gps' && Number.isFinite(x.offset))).toBe(true);
  });
});
