// v0.73.0 «Ruhige Startseite»: the pure rules of the calmer Today page (fictional data).
import { describe, it, expect } from 'vitest';
import { tripToday, sameAsCard, actionsFirst } from '../src/lib/home/ruhig.js';
import { SECTIONS } from '../src/lib/home/heute.js';

const trip = (id, startDate, extra = {}) => ({ id, title: id, startDate, days: 1, bikeId: 'b1', ...extra });

describe('a trip today', () => {
  it('is a trip on one of its days, not skipped or finished', () => {
    expect(tripToday([trip('a', '2026-10-10')], '2026-10-10')).toBe(true);
    expect(tripToday([trip('a', '2026-10-08', { days: 3 })], '2026-10-10')).toBe(true);
    expect(tripToday([trip('a', '2026-10-11')], '2026-10-10')).toBe(false);
    expect(tripToday([trip('a', '2026-10-10', { skipped: true })], '2026-10-10')).toBe(false);
    expect(tripToday([trip('a', '2026-10-10', { finished: true })], '2026-10-10')).toBe(false);
    expect(tripToday([{ id: 'x' }], '2026-10-10')).toBe(false);
  });
});

describe('«Weitermachen» beside the trip card (Noah 2a)', () => {
  it('is hidden only for the same trip', () => {
    expect(sameAsCard('a', 'a')).toBe(true);
    expect(sameAsCard('a', 'b')).toBe(false);
    expect(sameAsCard('a', null)).toBe(false);
    expect(sameAsCard(null, null)).toBe(false);
  });
});

describe('a phone: the buttons right after the trip card', () => {
  it('moves «Im Flow» behind the buttons only when it stands directly before them', () => {
    expect(actionsFirst(SECTIONS)).toEqual(['greeting', 'trip', 'actions', 'flow', 'today', 'bikes', 'year']);
    expect(actionsFirst(['greeting', 'flow', 'trip', 'actions'])).toEqual(['greeting', 'flow', 'trip', 'actions']);
    expect(actionsFirst(['actions', 'flow'])).toEqual(['actions', 'flow']);
    expect(actionsFirst([])).toEqual([]);
  });
});
