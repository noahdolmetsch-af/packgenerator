// «Rundgang» (Noah 15.10.2026 «1a … 5a»): the steps of every tour, the run state and where the card goes.
import { describe, it, expect } from 'vitest';
import { TOURS, TOUR_NAMES, stepCount, stepAt, runOf, nextRun, backRun, navSelector, cardSpot } from '../src/lib/tour.js';
import { PLACES } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

const de = (k) => DE[k] ?? DE[k.replace(/\|[a-z]+$/, '')];

describe('the tours', () => {
  it('the app tour: six places, then the end card', () => {
    expect(stepCount('app')).toBe(6);
    expect(TOURS.app.at(-1).end).toBe(true);
    const places = PLACES.map((p) => p.key);
    for (const s of TOURS.app.filter((x) => !x.end)) expect(places, s.href).toContain(s.place);
  });
  it('a small tour per place, short', () => {
    for (const id of ['aktiv', 'touren', 'material']) {
      expect(stepCount(id), id).toBeGreaterThanOrEqual(3);
      expect(stepCount(id), id).toBeLessThanOrEqual(5);
    }
  });
  it('every step opens a page in the app and has German words', () => {
    for (const [id, steps] of Object.entries(TOURS)) {
      expect(de(TOUR_NAMES[id]), id).toBeTruthy();
      for (const s of steps) {
        expect(s.href, id).toMatch(/^#\//);
        expect(Array.isArray(s.target), id).toBe(true);
        expect(de(s.title), s.title).toBeTruthy();
        expect(de(s.text), s.text).toBeTruthy();
      }
    }
  });
});

describe('the run', () => {
  it('reads only runs that fit a tour', () => {
    expect(runOf(null)).toBe(null);
    expect(runOf({ id: 'nope', step: 0 })).toBe(null);
    expect(runOf({ id: 'app', step: 99 })).toEqual({ id: 'app', step: 0, play: false });
    expect(runOf({ id: 'aktiv', step: 2, play: 1 })).toEqual({ id: 'aktiv', step: 2, play: true });
  });
  it('Next goes on and ends after the last step; Back never goes before the first', () => {
    expect(nextRun({ id: 'aktiv', step: 0, play: false })).toEqual({ id: 'aktiv', step: 1, play: false });
    expect(nextRun({ id: 'aktiv', step: TOURS.aktiv.length - 1, play: false })).toBe(null);
    expect(backRun({ id: 'aktiv', step: 0, play: false }).step).toBe(0);
    expect(stepAt('app', -1)).toBe(null);
    expect(stepAt('app', 0).place).toBe('today');
  });
  it('marks the place on the phone, the computer, and Me', () => {
    expect(navSelector('trips')).toContain('nav.bottom a[data-place="trips"]');
    expect(navSelector('trips')).toContain('nav.places li[data-place="trips"] > a');
    expect(navSelector('me')).toBe('a.me');
  });
});

describe('where the card goes', () => {
  it('phone at the bottom, computer below or above the part, without a part in the middle', () => {
    expect(cardSpot(null, { width: 390, height: 844, phone: true })).toEqual({ mode: 'middle' });
    expect(cardSpot({ x: 16, y: 200, width: 358, height: 200 }, { width: 390, height: 844, phone: true }).mode).toBe('bottom');
    expect(cardSpot({ x: 300, y: 100, width: 600, height: 200 }, { width: 1440, height: 900, phone: false })).toEqual({ mode: 'below', top: 318, left: 300 });
    expect(cardSpot({ x: 300, y: 500, width: 600, height: 300 }, { width: 1440, height: 900, phone: false, card: 240 }).mode).toBe('above');
  });
});
