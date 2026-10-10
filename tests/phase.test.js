// v0.67.0 «Übergänge 1»: the phase of a trip and the one main button of each trip page (phase.js).
// Dates in calendar days (Europe/Zurich is the app's clock; here plain YYYY-MM-DD strings).
import { describe, it, expect } from 'vitest';
import { tripPhase, currentStep, stepOf, mainStep, afterPacking, endNeedsAsk, canReopen, eveningBefore, lastEvening, parseBetween, betweenHref, addDays, daysFrom, packedAll } from '../src/lib/phase.js';
import { pageOf, placeOf } from '../src/lib/nav.js';

const D0 = '2026-10-14';
const day = (n) => addDays(D0, n);
const es = (n, packed = 0) => Array.from({ length: n }, (_, k) => ({ itemId: `i${k}`, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (extra = {}) => ({ id: 'test_data_gtp_alp', title: 'test_data_gtp_ Alpenrunde', domain: 'bikepacking', bikeId: 'b1', startDate: day(4), days: 3, entries: es(10), ready: [], status: 'planned', ...extra });
const hike = (extra = {}) => trip({ domain: 'ski', bikeId: null, packs: [{ key: 'p1', name: 'Backpack' }], ...extra });

describe('calendar days', () => {
  it('adds and counts days across the end of the summer time', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(daysFrom('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysFrom(D0, day(-3))).toBe(-3);
  });
});

describe('tripPhase: by the date, not by the tab', () => {
  it('before, during, after, done, skipped', () => {
    expect(tripPhase(trip(), D0)).toBe('before');
    expect(tripPhase(trip(), day(4))).toBe('during');
    expect(tripPhase(trip(), day(6))).toBe('during');
    expect(tripPhase(trip(), day(7))).toBe('after');
    expect(tripPhase(trip({ finished: day(4) }), day(4))).toBe('after');
    expect(tripPhase(trip(), day(8), { debriefDone: true })).toBe('done');
    expect(tripPhase(trip({ skipped: true }), D0)).toBe('skipped');
  });
});

describe('currentStep: where «Weitermachen» and «Tour öffnen» lead (U007)', () => {
  it('an empty list: Plan; a list: Plan; two days before or once packing started: Pack', () => {
    expect(currentStep(trip({ entries: [] }), D0)).toBe('plan');
    expect(currentStep(trip(), D0)).toBe('plan');
    expect(currentStep(trip(), day(2))).toBe('pack');
    expect(currentStep(trip({ entries: es(10, 3) }), D0)).toBe('pack');
  });
  it('packed: the waiting state On the way; under way On the way; after: Debrief', () => {
    expect(currentStep(trip({ entries: es(10, 10) }), D0)).toBe('ride');
    expect(currentStep(trip(), day(5))).toBe('ride');
    expect(currentStep(trip(), day(9))).toBe('debrief');
  });
  it('a trip without a bike has three steps: under way it is Pack', () => {
    expect(stepOf(hike(), day(5))).toMatchObject({ key: 'pack', n: 2, total: 3, href: '#/pack?day' });
    expect(stepOf(trip({ entries: es(10, 2) }), D0)).toMatchObject({ key: 'pack', n: 2, total: 4 });
    expect(stepOf(trip(), day(9))).toMatchObject({ key: 'debrief', n: 4, href: `#/debrief/${trip().id}` });
  });
});

describe('mainStep: the one main button follows the phase (U001–U004, U008, U009, U013, U014)', () => {
  it('an empty list never says «Alles gepackt»: Plan adds material, the other tabs lead to Plan', () => {
    expect(mainStep(trip({ entries: [] }), D0, 'plan')).toMatchObject({ kind: 'add', label: 'Add material' });
    expect(mainStep(trip({ entries: [], days: 1 }), D0, 'plan').kind).toBe('add');
    expect(mainStep(trip({ entries: [] }), D0, 'pack')).toMatchObject({ kind: 'go', href: '#/pack' });
  });
  it('before the start, not packed: Plan → Pack, Pack → «Packen abschliessen», On the way → Pack (no loop)', () => {
    expect(mainStep(trip(), D0, 'plan')).toMatchObject({ kind: 'go', label: 'Continue to Pack', href: '#/pack?day' });
    expect(mainStep(trip(), D0, 'pack')).toMatchObject({ kind: 'finish', label: 'Finish packing' });
    expect(mainStep(trip(), D0, 'ride')).toMatchObject({ kind: 'go', href: '#/pack?day' });
    expect(mainStep(trip({ days: 1 }), D0, 'plan').kind).toBe('packgo');
  });
  it('packed before the start: «Packen abschliessen» once, then the waiting state «Zur Startseite» (U001, U002, U013)', () => {
    const p = trip({ entries: es(10, 10) });
    expect(mainStep(p, D0, 'pack').kind).toBe('finish');
    const done = { ...p, packedAt: D0 };
    for (const tab of ['plan', 'pack', 'ride', 'debrief']) expect(mainStep(done, D0, tab), tab).toMatchObject({ kind: 'go', label: 'To the start page', href: '#/' });
    expect(mainStep(hike({ entries: es(4, 4), packedAt: D0 }), D0, 'debrief').href).toBe('#/');
  });
  it('the start day, not packed yet: packing is still the step (a day ride made this morning)', () => {
    const t0 = trip({ startDate: D0, days: 1 });
    expect(currentStep(t0, D0)).toBe('pack');
    expect(mainStep(t0, D0, 'plan')).toMatchObject({ kind: 'packgo' });
    expect(mainStep(t0, D0, 'pack').kind).toBe('finish');
    expect(mainStep(t0, D0, 'ride').kind).toBe('last'); // on the ride page the day can always be finished
    expect(mainStep(trip({ startDate: D0, entries: es(4, 4) }), D0, 'plan')).toMatchObject({ href: '#/ride' });
  });
  it('the start day, packed: On the way (U009)', () => {
    expect(mainStep(trip({ entries: es(10, 10), packedAt: D0 }), day(4), 'plan')).toMatchObject({ label: 'Continue to On the way', href: '#/ride' });
  });
  it('under way: Plan and Pack lead to On the way (U008); On the way has no «Weiter: Rückblick» before the last day (U004)', () => {
    expect(mainStep(trip(), day(5), 'plan')).toMatchObject({ href: '#/ride' });
    expect(mainStep(trip(), day(5), 'pack')).toMatchObject({ href: '#/ride' });
    expect(mainStep(trip(), day(4), 'ride').kind).toBe(null);
    expect(mainStep(trip(), day(6), 'ride')).toMatchObject({ kind: 'last', label: 'Finish the last day' });
    expect(mainStep(trip({ days: 1, startDate: D0 }), D0, 'ride')).toMatchObject({ kind: 'last', label: 'Finish the trip' });
  });
  it('a trip without a bike under way: Pack ends it (asking before its last day)', () => {
    expect(mainStep(hike(), day(5), 'pack')).toMatchObject({ kind: 'end', label: 'End the trip …' });
    expect(mainStep(hike(), day(6), 'pack')).toMatchObject({ kind: 'end', label: 'Finish the trip' });
    expect(mainStep(hike(), day(5), 'plan')).toMatchObject({ href: '#/pack?day' });
  });
  it('after the trip: the debrief; done: back to Trips; skipped: the start page', () => {
    expect(mainStep(trip(), day(8), 'ride')).toMatchObject({ label: 'Continue to Debrief', href: `#/debrief/${trip().id}` });
    expect(mainStep(trip(), day(8), 'debrief').kind).toBe('save');
    expect(mainStep(trip(), day(8), 'plan', { debriefDone: true })).toMatchObject({ href: '#/trips' });
    expect(mainStep(trip({ skipped: true }), D0, 'plan')).toMatchObject({ href: '#/' });
  });
});

describe('the interstitials (Ü3a, Ü5a)', () => {
  it('own addresses, read back; the page and its place', () => {
    const h = betweenHref(trip(), 'packed');
    expect(h).toBe('#/trip/test_data_gtp_alp/packed');
    expect(parseBetween(h)).toEqual({ id: 'test_data_gtp_alp', kind: 'packed' });
    expect(parseBetween('#/trip/a%20b/ended')).toEqual({ id: 'a b', kind: 'ended' });
    expect(parseBetween('#/trip/x/other')).toBe(null);
    expect(parseBetween('#/trips')).toBe(null);
    expect(pageOf(h)).toBe('between');
    expect(pageOf('#/trips')).toBe('trips');
    expect(placeOf('between')).toBe('trips');
  });
  it('after packing: «Gepackt» for a trip of several days; a day ride goes straight on (Ü5a)', () => {
    expect(afterPacking(trip(), D0)).toBe('#/trip/test_data_gtp_alp/packed');
    expect(afterPacking(trip({ days: 1 }), D0)).toBe('#/ride');
    expect(afterPacking(hike({ days: 1 }), D0)).toBe('#/');
  });
});

describe('ending a trip (U004, U005)', () => {
  it('asks before the last day and while the last day is still ahead (a day ride at 08:00)', () => {
    expect(endNeedsAsk(trip(), day(4), '20:00')).toBe(true);
    expect(endNeedsAsk(trip(), day(6), '20:00')).toBe(false);
    expect(endNeedsAsk(trip({ days: 1, startDate: D0 }), D0, '08:00', '15:30')).toBe(true);
    expect(endNeedsAsk(trip({ days: 1, startDate: D0 }), D0, '16:00', '15:30')).toBe(false);
    expect(endNeedsAsk(trip({ days: 1, startDate: D0 }), D0, '10:00')).toBe(true);
  });
  it('can be reopened until the next day, not after the debrief', () => {
    expect(canReopen(trip({ finished: day(4) }), day(4))).toBe(true);
    expect(canReopen(trip({ finished: day(4) }), day(5))).toBe(true);
    expect(canReopen(trip({ finished: day(4) }), day(6))).toBe(false);
    expect(canReopen(trip({ finished: day(4), status: 'done' }), day(4))).toBe(false);
    expect(canReopen(trip(), day(4))).toBe(false);
  });
});

describe('the evening (Ü6a, U21a, U22b)', () => {
  it('the evening before the start, from 18:00, unless the reminder is off', () => {
    expect(eveningBefore(trip(), day(3), 18)).toBe(true);
    expect(eveningBefore(trip(), day(3), 17)).toBe(false);
    expect(eveningBefore(trip(), day(2), 20)).toBe(false);
    expect(eveningBefore(trip({ remindEve: false }), day(3), 20)).toBe(false);
  });
  it('the last evening of a trip under way, not when it is ended or its debrief is done', () => {
    expect(lastEvening(trip(), day(6), 18)).toBe(true);
    expect(lastEvening(trip(), day(6), 12)).toBe(false);
    expect(lastEvening(trip(), day(5), 19)).toBe(false);
    expect(lastEvening(trip({ finished: day(6) }), day(6), 19)).toBe(false);
    expect(lastEvening(trip({ days: 1, startDate: D0 }), D0, 19)).toBe(true);
  });
  it('packedAll: an empty list is not packed', () => {
    expect(packedAll(trip({ entries: [] }))).toBe(false);
    expect(packedAll(trip({ entries: es(2, 2) }))).toBe(true);
  });
});
