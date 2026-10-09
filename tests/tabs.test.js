import { describe, it, expect, afterEach } from 'vitest';
import { TAB_NAMES, tabsOf, tabHref, tabStatus } from '../src/lib/tabs.js';
import { STEP } from '../src/lib/today.js';
import { t, lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

// v0.29.0: fictional trips (test_data_gtp_), dates fixed.
const TODAY = '2026-10-08';
const trip = (over = {}) => ({ id: 'test_data_gtp_tour', title: 'test_data_gtp_ Tour', bikeId: 'test_data_gtp_bike', startDate: '2026-10-18', days: 2, entries: [], ready: [], ...over });
const entries = (n, packed = 0) => Array.from({ length: n }, (_, i) => ({ itemId: `test_data_gtp_i${i}`, slot: 'saddle', packed: i < packed }));

describe('the four trip tabs', () => {
  it('one name per step: Plan, Pack, On the way, Debrief (German Planen, Packen, Unterwegs, Rückblick)', () => {
    expect(Object.values(TAB_NAMES).map((k) => t(k))).toEqual(['Plan', 'Pack', 'On the way', 'Debrief']);
    lang.v = 'de';
    expect(Object.values(TAB_NAMES).map((k) => t(k))).toEqual(['Planen', 'Packen', 'Unterwegs', 'Rückblick']);
  });

  it('Today’s buttons use the same names as the tabs', () => {
    expect(STEP.plan.label).toBe(TAB_NAMES.plan);
    expect(STEP.pack.label).toBe(TAB_NAMES.pack);
    expect(STEP.ride.label).toBe(TAB_NAMES.ride);
    expect(STEP.debrief.label).toBe(TAB_NAMES.debrief);
    expect(STEP.plan.href()).toBe(tabHref('plan'));
    expect(STEP.pack.href()).toBe(tabHref('pack'));
    expect(STEP.ride.href()).toBe(tabHref('ride'));
    expect(STEP.debrief.href(trip())).toBe(tabHref('debrief', trip()));
  });

  it('the old addresses stay: #/pack, #/pack?day, #/ride, #/debrief/<id>', () => {
    expect(['plan', 'pack', 'ride', 'debrief'].map((k) => tabHref(k, trip()))).toEqual(['#/pack', '#/pack?day', '#/ride', '#/debrief/test_data_gtp_tour']);
  });

  it('a trip without a bike has no "On the way"', () => {
    expect(tabsOf(trip())).toEqual(['plan', 'pack', 'ride', 'debrief']);
    expect(tabsOf(trip({ bikeId: null, domain: 'ski', packs: [{ key: 'pack', name: 'Backpack 30 L' }] }))).toEqual(['plan', 'pack', 'debrief']);
  });

  it('before the trip: empty or open suggestions, packed count, days to go', () => {
    let s = tabStatus(trip(), { today: TODAY });
    expect(s.plan).toEqual({ text: 'empty', done: false });
    expect(s.ride.text).toBe('in 10 days');
    expect(s.debrief.text).toBe('');
    s = tabStatus(trip({ entries: entries(5, 2) }), { today: TODAY, open: 3 });
    expect(s.plan).toEqual({ text: '3 open', done: false });
    expect(s.pack).toEqual({ text: '2/5', done: false });
    s = tabStatus(trip({ entries: entries(5, 5), startDate: '2026-10-09' }), { today: TODAY });
    expect(s.plan).toEqual({ text: 'ready', done: true });
    expect(s.pack).toEqual({ text: '5/5', done: true });
    expect(s.ride.text).toBe('tomorrow');
  });

  it('during the trip: day n; after it: km and the debrief open, then saved', () => {
    expect(tabStatus(trip({ startDate: '2026-10-07' }), { today: TODAY }).ride).toEqual({ text: 'Day 2', done: false });
    const past = trip({ startDate: '2026-10-01', entries: entries(2, 2) });
    let s = tabStatus(past, { today: TODAY, km: 149.6 });
    expect(s.ride).toEqual({ text: '150 km', done: true });
    expect(s.debrief).toEqual({ text: 'open', done: false });
    // v0.40.0: after the trip planning shows only ✓, never "3 open"
    expect(tabStatus(past, { today: TODAY, open: 3 }).plan).toEqual({ text: '', done: true });
    s = tabStatus(past, { today: TODAY, debrief: { status: 'done' } });
    expect(s.ride).toEqual({ text: 'done', done: true });
    expect(s.debrief).toEqual({ text: 'saved', done: true });
  });
});
