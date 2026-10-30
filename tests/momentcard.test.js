// «Heute als Begleiter» PR 4 (Noah 28.10.2026 «1a 2a 3a»): the card «Your moment» on Today: the next step, the strip of the
// trip loop, how the trip stands, and the wall that gets the card once. Fictional trips; calendar days.
import { describe, it, expect } from 'vitest';
import { stepFor, whenOf, stripOf, momentName } from '../src/lib/home/momentcard.js';
import { MOMENTS } from '../src/lib/moment.js';
import { READY, TILE, wallOf, wallRecord, withMoment, HEAD_N2 } from '../src/lib/home/tiles.js';
import { SECTION_OF } from '../src/lib/home/sections.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (w) => w.map((x) => x.id);
const trip = { id: 'test_data_gtp_t1', title: 'test_data_gtp_ Jura', startDate: '2026-10-30' };

describe('the next step', () => {
  it('every moment has one step with a German label, the trip ones carry their trip', () => {
    for (const k of [...MOMENTS, 'app']) {
      const s = stepFor(k, trip, { inbox: 0 });
      expect(s.href, k).toMatch(/^#\//);
      expect(DE[s.label], s.label).toBeTruthy();
    }
    expect(stepFor('packen', trip).trip).toBe(trip.id);
    expect(stepFor('zurueck', trip).href).toBe('#/debrief/test_data_gtp_t1');
    expect(stepFor('alltag', null, { inbox: 2 }).href).toBe('#/inbox');
    expect(stepFor('alltag', null, { inbox: 0 }).href).toBe('#/calendar');
  });
  it('every moment has a German name', () => {
    for (const k of [...MOMENTS, 'app']) expect(DE[momentName(k)], k).toBeTruthy();
  });
});

describe('how the trip stands, and the strip', () => {
  it('counts calendar days', () => {
    expect(whenOf(trip, '2026-10-30')).toEqual({ key: 'starts today' });
    expect(whenOf(trip, '2026-10-29')).toEqual({ key: 'starts tomorrow' });
    expect(whenOf(trip, '2026-10-27')).toEqual({ key: 'starts in {n} days', vars: { n: 3 } });
    expect(whenOf(trip, '2026-11-01')).toEqual({ key: 'on the way now' });
    expect(whenOf(null, '2026-10-30')).toBeNull();
  });
  it('shows the five steps of the loop with done, now and next; none outside the loop', () => {
    expect(stripOf('packen').map((s) => s.state)).toEqual(['done', 'done', 'now', 'next', 'next']);
    expect(stripOf('lust').map((s) => s.state)).toEqual(['now', 'next', 'next', 'next', 'next']);
    expect(stripOf('velo')).toBeNull();
    for (const s of stripOf('zurueck')) expect(DE[s.name], s.name).toBeTruthy();
  });
});

describe('the tile on the wall', () => {
  it('is in the catalog, in the first area, right under the habits on the ready wall and in the head', () => {
    expect(TILE.moment.sizes).toContain(TILE.moment.size);
    expect(SECTION_OF.moment).toBe('now');
    expect(ids(READY).slice(0, 2)).toEqual(['meditation', 'moment']);
    expect(HEAD_N2).toContain('moment');
    expect(DE[TILE.moment.label]).toBeTruthy();
    expect(DE[TILE.moment.pitch]).toBeTruthy();
  });
  it('a wall of before (v 14) gets it once under the habits (else on top); taken away it stays away', () => {
    expect(ids(wallOf({ v: 14, tiles: [{ id: 'meditation', size: 'long' }, { id: 'week', size: 'l' }] }))).toEqual(['meditation', 'moment', 'week']);
    expect(ids(withMoment([{ id: 'week', size: 'l' }]))).toEqual(['moment', 'week']);
    expect(ids(wallOf(wallRecord([{ id: 'week', size: 'l' }])))).toEqual(['week']);
  });
});
