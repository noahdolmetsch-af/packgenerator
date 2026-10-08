// v0.34.0 (L1): the trip schedule on Today, one next step per day band. Fictional trips only.
import { describe, it, expect, afterEach } from 'vitest';
import { tripSteps, nextStep, tripSchedule, stepWords, weatherKnown, OFFSET } from '../src/lib/schedule.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const START = '2026-11-20';
const day = (n) => {
  const d = new Date(`${START}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const trip = (extra = {}) => ({
  id: 'test_data_gtp_trip', title: 'test_data_gtp_ Trip', domain: 'bikepacking', startDate: START, days: 3, bikeId: 'b1', status: 'planned',
  entries: [{ itemId: 'a', slot: 'seat', qty: 1, packed: false }, { itemId: 'b', slot: 'seat', qty: 2, packed: false }],
  ready: [{ id: 'r1', label: 'Tyres', done: false }],
  ...extra,
});
const packed = (tr) => ({ ...tr, entries: tr.entries.map((e) => ({ ...e, packed: true })) });
const checked = (tr) => ({ ...tr, ready: tr.ready.map((r) => ({ ...r, done: true })) });
// Everything open: bike due, weather unknown, 3 things to buy.
const OPEN = { service: { n: 2, late: false, href: '#/bikes?care' }, weather: { known: false, open: 0 }, shop: { total: 3, done: 0 }, debriefDone: false };
const DONE = { service: { n: 0, late: false }, weather: { known: true, open: 0 }, shop: { total: 3, done: 3 }, debriefDone: false };

describe('nextStep: one step per day band', () => {
  it('14 days before: the bike service when something is due', () => {
    expect(nextStep(trip(), OPEN, day(-14)).key).toBe('service');
    expect(nextStep(trip(), OPEN, day(-14)).late).toBe(false);
  });
  it('more than 14 days before: still the first open step, with its day ahead', () => {
    const s = nextStep(trip(), OPEN, day(-20));
    expect(s.key).toBe('service');
    expect(s.day).toBe(day(-14));
    expect(s.due).toBe(false);
  });
  it('a service that is already late is due at once', () => {
    const s = nextStep(trip(), { ...OPEN, service: { n: 1, late: true } }, day(-20));
    expect(s).toMatchObject({ key: 'service', late: true, due: true });
  });
  it('nothing due on the bike: no service step, the weather is next', () => {
    const ctx = { ...OPEN, service: { n: 0, late: false } };
    expect(nextStep(trip(), ctx, day(-14)).key).toBe('weather');
    expect(tripSteps(trip(), ctx, day(-14)).find((s) => s.key === 'service').state).toBe('skip');
  });
  it('5 days before: weather; done once fetched and nothing is open', () => {
    const ctx = { ...OPEN, service: null };
    expect(nextStep(trip(), ctx, day(-5)).key).toBe('weather');
    expect(nextStep(trip(), { ...ctx, weather: { known: true, open: 2 } }, day(-5)).key).toBe('weather');
    expect(nextStep(trip(), { ...ctx, weather: { known: true, open: 0 } }, day(-5)).key).toBe('shop');
  });
  it('2 days before: shopping (and charging when part B tells it)', () => {
    const ctx = { ...DONE, shop: { total: 3, done: 1 } };
    expect(nextStep(trip(), ctx, day(-2)).key).toBe('shop');
    expect(nextStep(trip(), DONE, day(-2)).key).toBe('pack');
    expect(nextStep(trip(), { ...DONE, charge: { total: 2, done: 1 } }, day(-2)).key).toBe('shop');
    expect(nextStep(trip(), { ...DONE, charge: { total: 2, done: 2 } }, day(-2)).key).toBe('pack');
  });
  it('nothing to buy or charge: the shop step is skipped', () => {
    const ctx = { ...DONE, shop: { total: 0, done: 0 } };
    expect(tripSteps(trip(), ctx, day(-2)).find((s) => s.key === 'shop').state).toBe('skip');
    expect(nextStep(trip(), ctx, day(-2)).key).toBe('pack');
  });
  it('1 day before: pack; all packed moves on to the ready check', () => {
    expect(nextStep(trip(), DONE, day(-1)).key).toBe('pack');
    const s = nextStep(packed(trip()), DONE, day(-1));
    expect(s.key).toBe('check');
    expect(s.due).toBe(false);
  });
  it('start day: the ready check, then On the way', () => {
    expect(nextStep(packed(trip()), DONE, day(0)).key).toBe('check');
    expect(nextStep(checked(packed(trip())), DONE, day(0)).key).toBe('way');
  });
  it('everything done before the start: All set', () => {
    expect(nextStep(checked(packed(trip())), DONE, day(-3)).key).toBe('ready');
  });
  it('an open step whose day came earlier stays the next step', () => {
    const s = nextStep(trip(), { ...DONE, weather: { known: false, open: 0 } }, day(-1));
    expect(s).toMatchObject({ key: 'weather', late: true, due: true });
  });
  it('under way (second day on): On the way, also with open steps', () => {
    expect(nextStep(trip(), OPEN, day(1)).key).toBe('way');
    expect(nextStep(trip(), OPEN, day(2)).key).toBe('way');
  });
  it('after the trip: the debrief, until it is done', () => {
    expect(nextStep(trip(), OPEN, day(3)).key).toBe('debrief');
    expect(nextStep(trip(), { ...OPEN, debriefDone: true }, day(3))).toBe(null);
    expect(nextStep(trip({ status: 'done' }), OPEN, day(5))).toBe(null);
    // ended early: the debrief from the next day
    const early = trip({ finished: day(0) });
    expect(nextStep(early, OPEN, day(1)).key).toBe('debrief');
    expect(tripSteps(early, OPEN, day(1)).at(-1).day).toBe(day(1));
  });
  it('an empty list comes first', () => {
    const empty = trip({ entries: [] });
    expect(nextStep(empty, OPEN, day(-30)).key).toBe('plan');
    expect(tripSteps(trip(), OPEN, day(-30)).some((s) => s.key === 'plan')).toBe(false);
  });
  it('a trip marked not riding has no step', () => {
    expect(nextStep(trip({ skipped: true }), OPEN, day(-1))).toBe(null);
  });
  it('a trip without a bike has no service step; no ready check: skipped', () => {
    const ski = trip({ domain: 'ski', bikeId: null, packs: [{ key: 'p1', name: 'Backpack' }], ready: [] });
    const steps = tripSteps(ski, OPEN, day(-14));
    expect(steps.map((s) => s.key)).toEqual(['weather', 'shop', 'pack', 'check', 'debrief']);
    expect(steps.find((s) => s.key === 'check').state).toBe('skip');
    expect(stepWords(nextStep(checked(packed(ski)), DONE, day(0)), ski).href).toBe('#/pack');
  });
});

describe('tripSteps: the timeline', () => {
  it('days, order and states', () => {
    const { steps, next } = tripSchedule(trip(), OPEN, day(-3));
    expect(steps.map((s) => [s.key, s.day])).toEqual([
      ['service', day(OFFSET.service)], ['weather', day(-5)], ['shop', day(-2)], ['pack', day(-1)], ['check', day(0)], ['debrief', day(3)],
    ]);
    expect(steps.filter((s) => s.late).map((s) => s.key)).toEqual(['service', 'weather']);
    expect(steps.at(-1)).toMatchObject({ state: 'open', due: false, late: false });
    expect(next.key).toBe('service');
  });
});

describe('weatherKnown', () => {
  const fc = (fetchedAt) => ({ fetchedAt, days: [{ date: START, min: 4, max: 12 }] });
  it('with a place: a forecast for the trip, fetched from 5 days before', () => {
    expect(weatherKnown(trip({ place: { name: 'X' } }))).toBe(false);
    expect(weatherKnown(trip({ place: { name: 'X' }, forecast: fc(`${day(-4)}T08:00:00Z`) }))).toBe(true);
    expect(weatherKnown(trip({ place: { name: 'X' }, forecast: fc(`${day(-9)}T08:00:00Z`) }))).toBe(false);
    expect(weatherKnown(trip({ place: { name: 'X' }, forecast: { fetchedAt: `${day(-1)}T08:00:00Z`, days: [{ date: day(-1), min: 1, max: 2 }] } }))).toBe(false);
  });
  it('without a place: the weather set by hand', () => {
    expect(weatherKnown(trip())).toBe(false);
    expect(weatherKnown(trip({ wx: { min: 5, max: 15, rain: 'none' } }))).toBe(true);
  });
});

describe('stepWords', () => {
  it('each step has one button to its place', () => {
    const tr = trip();
    const ctx = { ...OPEN, weather: { known: true, open: 2 } };
    const at = (key) => stepWords(tripSteps(tr, ctx, day(-3)).find((s) => s.key === key), tr, ctx, day(-3));
    expect(at('service')).toMatchObject({ button: 'Bike care', href: '#/bikes?care' });
    expect(at('weather')).toMatchObject({ button: 'Decide now', href: '#/pack?decide', why: '2 weather suggestions are still open.' });
    expect(at('shop')).toMatchObject({ button: 'Shopping list', href: '#/pack?shop', why: '3 of 3 still to buy.' });
    expect(at('shop').links).toEqual([{ label: 'Charge devices', href: '#/pack?charge' }]);
    expect(at('pack')).toMatchObject({ button: 'Pack', href: '#/pack?day', why: '2 of 2 still to pack.' });
    expect(at('check')).toMatchObject({ button: 'Ready check', href: '#/pack?day' });
    expect(at('debrief').href).toBe('#/debrief/test_data_gtp_trip');
    expect(stepWords(tripSteps(tr, OPEN, day(-3))[1], tr, OPEN, day(-3))).toMatchObject({ button: 'Get the forecast', href: '#/pack?weather' });
    expect(stepWords({ key: 'way' }, tr)).toMatchObject({ href: '#/ride' });
  });
  it('German', () => {
    lang.v = 'de';
    const tr = trip();
    const s = stepWords(tripSteps(tr, OPEN, day(-2)).find((x) => x.key === 'shop'), tr, OPEN, day(-2));
    expect(s.title).toBe('Einkaufen und Laden');
    expect(s.button).toBe('Einkaufsliste');
    expect(s.when).toBe('heute');
  });
});
