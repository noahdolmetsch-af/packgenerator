import { describe, it, expect } from 'vitest';
import { TRIAL_KEY, MAX_KINDS, isTrial, hasTrial, canAddTrial, trialPrice, withTrial, withoutTrial, trialSlots, isTrialBooking, samePerson, earlierTrial } from '../src/lib/booking/trial.js';
import { invoiceDraft } from '../src/lib/booking/model.js';

const offer = () => ({
  id: 'tennis-a1',
  title: 'Tennis lesson',
  types: [{ key: 'one', label: 'Single', places: 1, price: 6000 }, { key: 'group', label: 'Group', places: 4, price: 2500 }],
  slots: [{ id: 's1', at: '2026-11-09T18:00', type: 'one' }],
});
const withT = () => withTrial(offer());
const bk = (id, name, slot, at, extra = {}) => ({ id, name, contact: '', slot, at, ...extra });

describe('Probestunde: the trial kind of an offer', () => {
  it('adds a kind «trial» with one place and half the price of the first kind', () => {
    const o = withT();
    expect(o.types).toHaveLength(3);
    expect(o.types[2]).toEqual({ key: TRIAL_KEY, label: 'Trial lesson', places: 1, price: 3000 });
    expect(hasTrial(o)).toBe(true);
    expect(isTrial(o.types[2])).toBe(true);
  });
  it('rounds half the price to 50 Rappen and uses the translator for the name', () => {
    const o = { types: [{ key: 'one', label: 'Single', places: 1, price: 7500 }] };
    expect(trialPrice(o)).toBe(3750);
    expect(withTrial(o, (s) => `de:${s}`).types[1].label).toBe('de:Trial lesson');
    expect(trialPrice({ types: [{ key: 'one', label: 'x', places: 1, price: 6030 }] })).toBe(3000);
  });
  it('adds it only once and only while the server allows more kinds', () => {
    expect(withTrial(withT())).toEqual(withT());
    expect(canAddTrial(offer())).toBe(true);
    expect(canAddTrial(withT())).toBe(false);
    const full = { ...offer(), types: Array.from({ length: MAX_KINDS }, (_, i) => ({ key: `k${'abcd'[i]}`, label: 'x', places: 1, price: 0 })) };
    expect(canAddTrial(full)).toBe(false);
    expect(withTrial(full)).toBe(full);
  });
  it('removing it moves its times to the first other kind and loses none', () => {
    const o = { ...withT(), slots: [{ id: 's1', at: '2026-11-09T18:00', type: 'one' }, { id: 's2', at: '2026-11-10T18:00', type: 'trial' }] };
    expect(trialSlots(o)).toHaveLength(1);
    const back = withoutTrial(o);
    expect(back.types.map((x) => x.key)).toEqual(['one', 'group']);
    expect(back.slots.map((s) => s.type)).toEqual(['one', 'one']);
    expect(back.slots).toHaveLength(2);
    expect(withoutTrial(offer())).toEqual(offer());
  });
  it('the invoice draft uses the trial price even for a customer with an own price', () => {
    const o = withT();
    const slot = { id: 's9', at: '2026-11-11T17:00', type: 'trial' };
    const b = bk('b1', 'Mia Muster', 's9', slot.at);
    expect(invoiceDraft(o, slot, b, 'Mi', 8000).amount).toBe('30');
    const normal = { id: 's1', at: '2026-11-09T18:00', type: 'one' };
    expect(invoiceDraft(o, normal, bk('b2', 'Mia Muster', 's1', normal.at), 'Mo', 8000).amount).toBe('80');
  });
});

describe('Probestunde: once per person', () => {
  const o = {
    ...withT(),
    slots: [
      { id: 'n1', at: '2026-11-09T18:00', type: 'one' },
      { id: 't1', at: '2026-11-10T17:00', type: 'trial' },
      { id: 't2', at: '2026-11-17T17:00', type: 'trial' },
    ],
  };
  it('knows which bookings are for a trial time', () => {
    expect(isTrialBooking(o, bk('a', 'Mia', 't1', '2026-11-10T17:00'))).toBe(true);
    expect(isTrialBooking(o, bk('a', 'Mia', 'n1', '2026-11-09T18:00'))).toBe(false);
  });
  it('same person: same name (any case, spaces) or the same phone or e-mail', () => {
    expect(samePerson({ name: 'Mia  Muster' }, { name: ' mia muster ' })).toBe(true);
    expect(samePerson({ name: 'Mia', contact: '079 000 00 00' }, { name: 'M.', contact: '0790000000' })).toBe(true);
    expect(samePerson({ name: 'Mia', contact: 'MIA@example.test' }, { name: 'Anna', contact: 'mia@example.test' })).toBe(true);
    expect(samePerson({ name: 'Mia', contact: '123' }, { name: 'Anna', contact: '123' })).toBe(false);
    expect(samePerson({ name: 'Mia' }, { name: 'Anna' })).toBe(false);
    expect(samePerson({ name: '' }, { name: '' })).toBe(false);
  });
  it('a request from someone with a confirmed trial lesson points at it', () => {
    const first = bk('a', 'Mia Muster', 't1', '2026-11-10T17:00');
    const ask = bk('b', 'mia muster', 't2', '2026-11-17T17:00', { status: 'requested' });
    expect(earlierTrial(o, [first, ask], ask)).toBe(first);
  });
  it('an open request or a declined one of the same person is no used trial', () => {
    const open = bk('a', 'Mia Muster', 't1', '2026-11-10T17:00', { status: 'requested' });
    const declined = bk('c', 'Mia Muster', 't1', '2026-11-10T17:00', { status: 'declined' });
    const ask = bk('b', 'Mia Muster', 't2', '2026-11-17T17:00', { status: 'requested' });
    expect(earlierTrial(o, [open, declined, ask], ask)).toBeNull();
  });
  it('of two held trial bookings only the later one is flagged', () => {
    const first = bk('a', 'Mia Muster', 't1', '2026-11-10T17:00');
    const second = bk('b', 'Mia Muster', 't2', '2026-11-17T17:00');
    expect(earlierTrial(o, [first, second], first)).toBeNull();
    expect(earlierTrial(o, [first, second], second)).toBe(first);
  });
  it('another person, a normal lesson or another time of a normal kind is not flagged', () => {
    const first = bk('a', 'Mia Muster', 't1', '2026-11-10T17:00');
    expect(earlierTrial(o, [first], bk('b', 'Leo Muster', 't2', '2026-11-17T17:00'))).toBeNull();
    expect(earlierTrial(o, [first], bk('b', 'Mia Muster', 'n1', '2026-11-09T18:00'))).toBeNull();
    expect(earlierTrial(o, [bk('x', 'Mia Muster', 'n1', '2026-11-09T18:00')], bk('b', 'Mia Muster', 't2', '2026-11-17T17:00'))).toBeNull();
  });
});
