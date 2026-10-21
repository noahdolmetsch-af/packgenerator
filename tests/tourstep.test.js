import { describe, it, expect } from 'vitest';
import { countdownOf, sayOf, missingOf, missingText, kpisShown, hasSteps } from '../src/lib/touren/tourstep.js';
import { nextQuestion, shown, answer, skipToday, neverAsk, askState, ASK_MAX } from '../src/lib/touren/lernfrage.js';
import { stepsOf, tabsOf, tabHref, TAB_NAMES } from '../src/lib/tabs.js';
import DE from '../src/lib/i18n/de/index.js';

// «Eine Tour, eine Seite» (UI-Ziele #5, #8, #10, #18). Fictional trips only.
const trip = (o = {}) => ({ id: 'tr1', title: 'Testtour', startDate: '2026-10-22', days: 3, bikeId: 'b1', entries: [], ...o });

describe('the countdown chip (#10)', () => {
  it('planned without a date, tomorrow, in 5 days', () => {
    expect(countdownOf(trip({ startDate: null }), '2026-10-20')).toEqual({ key: 'No date yet', vars: {} });
    expect(countdownOf(trip({ startDate: '2026-10-21' }), '2026-10-20').key).toBe('Tomorrow|tour');
    expect(countdownOf(trip({ startDate: '2026-10-25' }), '2026-10-20')).toEqual({ key: 'In {n} days|tour', vars: { n: 5 } });
  });
  it('on the way: day 2 of 3; a day ride: today', () => {
    expect(countdownOf(trip(), '2026-10-23')).toEqual({ key: 'Day {n} of {m}|tour', vars: { n: 2, m: 3 } });
    expect(countdownOf(trip({ days: 1 }), '2026-10-22').key).toBe('Today|tour');
  });
  it('back: since yesterday, for 2 days; ended early counts from that day', () => {
    expect(countdownOf(trip(), '2026-10-25').key).toBe('Back since yesterday');
    expect(countdownOf(trip(), '2026-10-26')).toEqual({ key: 'Back for {n} days', vars: { n: 2 } });
    expect(countdownOf(trip({ finished: true }), '2026-10-23').key).toBe('Back since today');
  });
  it('one source with Today: byDate counts only the dates', () => {
    expect(countdownOf(trip({ finished: true }), '2026-10-23', { byDate: true })).toEqual({ key: 'Day {n} of {m}|tour', vars: { n: 2, m: 3 } });
  });
  it('one sentence with a number', () => {
    expect(sayOf(trip({ startDate: '2026-10-25' }), '2026-10-20', { items: 30, open: 12 })).toEqual({ key: '{open} of {n} things still to pack.', vars: { open: 12, n: 30 } });
    expect(sayOf(trip(), '2026-10-26', { km: 182.4 })).toEqual({ key: '{km} km behind you.', vars: { km: 182 } });
    expect(sayOf(trip(), '2026-10-26')).toBeNull();
  });
  it('every text has a German entry', () => {
    const keys = ['No date yet', 'Tomorrow|tour', 'In {n} days|tour', 'Day {n} of {m}|tour', 'Today|tour', 'Back since today', 'Back since yesterday', 'Back for {n} days', '{open} of {n} things still to pack.', '{km} km are waiting for you.', '{km} km on this tour.', '{km} km behind you.', 'Weather|missing', 'Route|missing', '{n} weights|missing', 'That can also come later.', 'Both can also come later.', 'All of it can also come later.', 'Still missing:', 'Analysis|stage'];
    expect(keys.filter((k) => !DE[k])).toEqual([]);
  });
});

describe('Planen: «Fehlt noch» (#5)', () => {
  it('weather and route; both can come later', () => {
    const keys = missingOf(trip(), { unweighed: 0 });
    expect(keys).toEqual(['weather', 'route']);
    expect(missingText(keys).close).toBe('Both can also come later.');
  });
  it('with weather, a route and 4 things without weight', () => {
    const keys = missingOf(trip({ wx: { min: 8, max: 16 }, route: { km: 120 } }), { unweighed: 4 });
    expect(keys).toEqual(['weights']);
    expect(missingText(keys, { unweighed: 4 })).toEqual({ parts: [{ key: '{n} weights|missing', vars: { n: 4 } }], close: 'That can also come later.' });
  });
  it('a trip without a bike needs no route; nothing missing → null', () => {
    expect(missingOf(trip({ wx: { min: 1, max: 5 } }), { bike: false })).toEqual([]);
    expect(missingText([])).toBeNull();
  });
});

describe('the steps as tabs (#5)', () => {
  it('Auswertung is the fifth step; the four work steps stay', () => {
    expect(tabsOf(trip())).toEqual(['plan', 'pack', 'ride', 'debrief']);
    expect(stepsOf(trip())).toEqual(['plan', 'pack', 'ride', 'debrief', 'analysis']);
    expect(stepsOf(trip({ bikeId: null, domain: 'ski', packs: [{ key: 'pack', name: 'Backpack 30 L' }] }))).toEqual(['plan', 'pack', 'debrief', 'analysis']);
    expect(tabHref('analysis', trip())).toBe(`#/tour/${encodeURIComponent('t:tr1')}`);
    expect(TAB_NAMES.analysis).toBe('Analysis|stage');
  });
  it('a ride from Strava without a packing list has only Auswertung', () => {
    expect(hasSteps(trip({ fromActs: ['a1'] }))).toBe(false);
    expect(hasSteps(trip({ fromActs: ['a1'], entries: [{ itemId: 'i1' }] }))).toBe(true);
    expect(hasSteps(trip())).toBe(true);
  });
});

describe('only the values there are (#8)', () => {
  it('leaves out empty key figures', () => {
    const v = { km: 42, hm: null, dauer: 3600, hf: 0 };
    expect(kpisShown(['km', 'hm', 'dauer', 'hf'], (k) => v[k])).toEqual(['km', 'dauer']);
  });
});

describe('Lernschleife (#18)', () => {
  const items = [
    { id: 'jacket', name: 'Regenjacke', category: 'clothing', weightG: 240 },
    { id: 'tent', name: 'Zelt', category: 'sleep', weightG: 1400 },
    { id: 'bar', name: 'Riegel', category: 'food', weightG: 600 },
    { id: 'spoon', name: 'Löffel', category: 'kitchen', weightG: 15 },
  ];
  const t1 = trip({ entries: items.map((i) => ({ itemId: i.id, qty: 1 })) });
  const base = { trip: t1, items, ride: true, key: 't:tr1', today: '2026-10-26' };
  it('the heaviest thing first, no food; only after a tour with a ride', () => {
    expect(nextQuestion({ ...base, state: null })).toMatchObject({ item: { id: 'tent' }, n: 1, of: 3 });
    expect(nextQuestion({ ...base, ride: false, state: null })).toBeNull();
    expect(nextQuestion({ ...base, over: false, state: null })).toBeNull();
  });
  it('an answer moves on; a thing marked in the Rückblick is not asked', () => {
    let s = answer(null, 'tr1', 'tent', 'yes');
    expect(nextQuestion({ ...base, state: s })).toMatchObject({ item: { id: 'jacket' }, n: 2 });
    expect(nextQuestion({ ...base, state: s, debrief: { items: { jacket: 'unused' } } })).toMatchObject({ item: { id: 'spoon' } });
    s = answer(answer(s, 'tr1', 'jacket', 'no'), 'tr1', 'spoon', 'unknown');
    expect(nextQuestion({ ...base, state: s })).toBeNull();
  });
  it('at most 5 per tour', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, name: `Ding ${i}`, category: 'tools', weightG: 100 + i }));
    let s = null;
    const tr = trip({ entries: many.map((i) => ({ itemId: i.id })) });
    for (let i = 0; i < ASK_MAX; i++) {
      const q = nextQuestion({ ...base, trip: tr, items: many, state: s });
      expect(q.of).toBe(ASK_MAX);
      s = answer(s, 'tr1', q.item.id, 'yes');
    }
    expect(nextQuestion({ ...base, trip: tr, items: many, state: s })).toBeNull();
  });
  it('«Heute nicht», «Nicht fragen für dieses Teil», one card a day', () => {
    expect(nextQuestion({ ...base, state: skipToday(null, '2026-10-26') })).toBeNull();
    expect(nextQuestion({ ...base, today: '2026-10-27', state: skipToday(null, '2026-10-26') })).not.toBeNull();
    expect(nextQuestion({ ...base, state: neverAsk(null, 'tent') }).item.id).toBe('jacket');
    const other = shown(null, 't:other', '2026-10-26');
    expect(nextQuestion({ ...base, state: other })).toBeNull();
    expect(nextQuestion({ ...base, state: shown(null, 't:tr1', '2026-10-26') })).not.toBeNull();
    expect(nextQuestion({ ...base, today: '2026-10-27', state: other })).not.toBeNull();
    expect(askState(undefined)).toEqual({ day: null, key: null, skip: null, off: [], asked: {} });
  });
  it('every text has a German entry', () => {
    const keys = ['Did you use «{name}»?', 'Yes|used', 'No|used', 'Don’t know', 'Not today', 'Never ask for this thing', 'Question {n} of {m}', 'What you did not use shows as ballast the next time you pack.', 'Learn from this tour'];
    expect(keys.filter((k) => !DE[k])).toEqual([]);
  });
});
