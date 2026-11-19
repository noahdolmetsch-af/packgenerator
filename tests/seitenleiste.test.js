// «Ganze App neu denken» Schritt 10 (Noah 18.11.2026 «1a 2a»): the sidebar has seven places plus «Ich».
// Quick Links (Z1) and Ausrüstung (Z2) are no rows of their own, Inspiration (Z3) is a tab of Touren.
import { describe, it, expect } from 'vitest';
import { SIDE_PLACES, BAR_PLACES, PLACE_TABS, sidePlaceOf, placeOf, tabOf, EQUIPMENT } from '../src/lib/nav.js';

describe('the sidebar of the new order', () => {
  it('has seven rows: Heute, Planen, Touren, Aktiv, Auswerten, Velos, Material (Ich is the card below)', () => {
    expect(SIDE_PLACES.map((p) => p.key)).toEqual(['today', 'week', 'trips', 'active', 'analysis', 'bikes', 'gear']);
  });
  it('lights Material for Ausrüstung and Heute for Quick Links', () => {
    expect(sidePlaceOf(placeOf('equipment'))).toBe('gear');
    expect(placeOf('equipment')).toBe('gear');
    expect(sidePlaceOf(placeOf('quick'))).toBe('today');
    expect(sidePlaceOf('trips')).toBe('trips');
    expect(SIDE_PLACES.map((p) => p.key)).not.toContain(EQUIPMENT.key);
  });
  it('keeps the page Ausrüstung as the tab «Sets» of Material', () => {
    expect(PLACE_TABS.gear.some((x) => x.key === 'sets' && x.href === '#/equipment')).toBe(true);
    expect(tabOf('gear', '#/equipment')).toBe('sets');
    expect(tabOf('gear', '#/gear')).toBe('all');
  });
  it('moves Inspiration to Touren, after the first four tabs (one more tap to the Rückblick pages breaks tippzahl.spec)', () => {
    expect(placeOf('inspiration')).toBe('trips');
    expect(tabOf('trips', '#/inspiration')).toBe('inspiration');
    expect(PLACE_TABS.week.map((x) => x.key)).not.toContain('inspiration');
    const keys = PLACE_TABS.trips.map((x) => x.key);
    expect(keys.slice(0, 4)).toEqual(['overview', 'dreams', 'templates', 'lookback']);
    expect(keys.indexOf('inspiration')).toBe(4);
  });
  it('leaves the bottom bar of a phone as it was (step 15 changes it)', () => {
    expect(BAR_PLACES.map((p) => p.key)).toEqual(['today', 'week', 'trips', 'active', 'bikes', 'quick']);
  });
});
