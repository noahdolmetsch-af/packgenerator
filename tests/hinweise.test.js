// «Die App meldet sich von selbst» (UI-Prüfung 07.11.2026, Rang 12–20): the nine hints «Du könntest jetzt …». Fictional data only.
import { describe, it, expect } from 'vitest';
import { hinweise, isAway, putAway, switchOff, HINWEIS_IDS, MAX_HINWEISE, LATER_DAYS } from '../src/lib/hinweise/regeln.js';
import DE from '../src/lib/i18n/de/index.js';

const TODAY = '2026-11-10'; // a Tuesday
const full = {
  nextTrip: { name: 'Jura', day: '2026-11-12', km: 118, missing: ['Rain jacket'] },
  rain: { day: '2026-11-11', fromHour: 15 },
  week: [{ day: '2026-11-10', hard: true }, { day: '2026-11-11', hard: true }, { day: '2026-11-13', free: true }],
  goal: { missingKm: 52.4 },
  window: { day: '2026-11-14', from: '09:00', to: '12:00' },
  loose: [{ id: 's1', day: '2026-11-08', km: 118.2 }],
  trips: [{ id: 't1', name: 'Jura', day: '2026-11-08' }],
  breaks: [{ planMin: 30, rideMin: 65 }, { planMin: 20, rideMin: 55 }, { planMin: 25, rideMin: 60 }],
  hardRun: 3,
  rhr: { days: 4, low: 52, high: 58 },
  wear: { part: 'chain', kmLeft: 120, bike: 'b1' },
  waiting: [{ src: 'fitbit', name: 'Fitbit', href: '#/me/fitbit', n: 6 }],
};
const only = (c, id) => hinweise(c, TODAY, {}, {}, 99).find((h) => h.id === id);

describe('the nine hints', () => {
  it('there are nine, each with its own id', () => {
    expect(HINWEIS_IDS).toHaveLength(9);
    expect(new Set(HINWEIS_IDS).size).toBe(9);
  });
  it('with nothing known, no hint appears', () => {
    expect(hinweise({}, TODAY, {}, {}, 99)).toEqual([]);
    expect(hinweise(undefined, TODAY)).toEqual([]);
  });
  it('rain before a trip in 1–3 days with a missing item', () => {
    const h = only(full, 'h.rainpack');
    expect(h.params).toEqual({ day: '2026-11-11', hour: 15, item: 'Rain jacket' });
    expect(only({ ...full, nextTrip: { ...full.nextTrip, day: '2026-11-20' } }, 'h.rainpack')).toBeUndefined();
    expect(only({ ...full, nextTrip: { ...full.nextTrip, missing: [] } }, 'h.rainpack')).toBeUndefined();
  });
  it('a rest day needs two hard days and a free day still to come', () => {
    expect(only(full, 'h.restday').params).toEqual({ day: '2026-11-13', n: 2 });
    expect(only({ ...full, week: [{ day: '2026-11-10', hard: true }, { day: '2026-11-13', free: true }] }, 'h.restday')).toBeUndefined();
  });
  it('a ride is planned into a free dry window when km are missing', () => {
    expect(only(full, 'h.planride').params).toEqual({ day: '2026-11-14', from: '09:00', to: '12:00', km: 52 });
    expect(only({ ...full, goal: { missingKm: 0 } }, 'h.planride')).toBeUndefined();
  });
  it('a loose ride on the day of a trip is offered to that trip', () => {
    expect(only(full, 'h.assignride').params).toEqual({ day: '2026-11-08', name: 'Jura', km: 118 });
    expect(only({ ...full, trips: [] }, 'h.assignride')).toBeUndefined();
  });
  it('longer breaks only from three trips and at least ten minutes', () => {
    expect(only(full, 'h.longerbreaks').params.min).toBe(35);
    expect(only({ ...full, breaks: full.breaks.slice(0, 2) }, 'h.longerbreaks')).toBeUndefined();
    expect(only({ ...full, breaks: [{ planMin: 30, rideMin: 33 }, { planMin: 30, rideMin: 33 }, { planMin: 30, rideMin: 33 }] }, 'h.longerbreaks')).toBeUndefined();
  });
  it('the body hints are observation only and appear last', () => {
    const all = hinweise(full, TODAY, {}, {}, 99);
    expect(all.filter((h) => h.health).map((h) => h.id)).toEqual(['h.easyday', 'h.restingpulse']);
    const firstHealth = all.findIndex((h) => h.health);
    expect(all.slice(firstHealth).every((h) => h.health)).toBe(true);
    expect(only({ ...full, hardRun: 2 }, 'h.easyday')).toBeUndefined();
    expect(only({ ...full, rhr: { days: 3, low: 52, high: 58 } }, 'h.restingpulse')).toBeUndefined();
    for (const h of all.filter((x) => x.health)) expect(h.text).toMatch(/hint|observation/);
  });
  it('a worn part is due within the next trip', () => {
    expect(only(full, 'h.chain').params).toEqual({ part: 'chain', day: '2026-11-12', left: 120, km: 118 });
    expect(only({ ...full, wear: { part: 'chain', kmLeft: 900 } }, 'h.chain')).toBeUndefined();
  });
  it('a missing source is connected from the empty tiles', () => {
    expect(only(full, 'h.connect').params).toEqual({ source: 'Fitbit', n: 6 });
    expect(only({ ...full, waiting: [] }, 'h.connect')).toBeUndefined();
  });
  it('shows at most three, never more than asked', () => {
    expect(MAX_HINWEISE).toBe(3);
    expect(hinweise(full, TODAY)).toHaveLength(3);
    expect(hinweise(full, TODAY, {}, {}, 1)).toHaveLength(1);
    expect(hinweise(full, TODAY, {}, {}, 0)).toEqual([]);
  });
});

describe('putting a hint away', () => {
  it('«Not today» is gone until tomorrow, «Not this week» for seven days', () => {
    const s = putAway({}, 'h.connect', TODAY, 'today');
    expect(s.until['h.connect']).toBe('2026-11-11');
    expect(isAway(s, 'h.connect', TODAY)).toBe(true);
    expect(isAway(s, 'h.connect', '2026-11-11')).toBe(false);
    const w = putAway({}, 'h.connect', TODAY, 'week');
    expect(w.until['h.connect']).toBe('2026-11-17');
    expect(LATER_DAYS).toEqual({ today: 1, week: 7 });
  });
  it('a hint put away does not appear, the others stay; the old state is not changed', () => {
    const base = {};
    const s = putAway(base, 'h.rainpack', TODAY);
    expect(base).toEqual({});
    const ids = hinweise(full, TODAY, s, {}, 99).map((h) => h.id);
    expect(ids).not.toContain('h.rainpack');
    expect(ids).toContain('h.restday');
  });
  it('switched off for good, and «Not for me» keep a hint away; switching on brings it back', () => {
    const off = switchOff({}, 'h.restday');
    expect(hinweise(full, TODAY, off, {}, 99).map((h) => h.id)).not.toContain('h.restday');
    expect(hinweise(full, TODAY, {}, { 'h.chain': true }, 99).map((h) => h.id)).not.toContain('h.chain');
    expect(hinweise(full, TODAY, switchOff(off, 'h.restday', false), {}, 99).map((h) => h.id)).toContain('h.restday');
  });
});

describe('words and ways', () => {
  it('every sentence and every way has German, every way leads to a page of the app', () => {
    const all = hinweise(full, TODAY, {}, {}, 99);
    expect(all).toHaveLength(9);
    for (const h of all) {
      expect(DE[h.text], h.id).toBeTruthy();
      expect(h.wege.length, h.id).toBeGreaterThanOrEqual(1);
      for (const w of h.wege) {
        expect(w.href.startsWith('#/'), `${h.id} ${w.href}`).toBe(true);
        expect(DE[w.label] || w.label === 'Plan a ride' || w.label === 'Plan the week', `${h.id} ${w.label}`).toBeTruthy();
      }
      expect(['today', 'week']).toContain(h.later);
      expect(['new', 'part', 'have']).toContain(h.now);
    }
  });
});
