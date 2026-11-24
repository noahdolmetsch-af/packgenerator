// «Ganze App neu denken» Schritt 10 (Noah 18.11.2026 «1a 2a»): the sidebar has seven places plus «Ich».
// Quick Links (Z1) and Ausrüstung (Z2) are no rows of their own, Inspiration (Z3) is a tab of Touren.
import { describe, it, expect } from 'vitest';
import { SIDE_PLACES, BAR_PLACES, PLACE_TABS, sidePlaceOf, placeOf, tabOf, EQUIPMENT } from '../src/lib/nav.js';

describe('the sidebar of the new order', () => {
  it('V5 (Noah 21.11.2026): has six rows: Heute, Woche, Touren, Velos und Material, Auswerten, Wetter (W1a, Noah 22.11.2026; Ich is the card below)', () => {
    expect(SIDE_PLACES.map((p) => p.key)).toEqual(['today', 'week', 'trips', 'bikes', 'analysis', 'weather']);
  });
  it('lights Velos und Material for Ausrüstung and Heute for Quick Links', () => {
    expect(sidePlaceOf(placeOf('equipment'))).toBe('bikes');
    expect(placeOf('equipment')).toBe('bikes');
    expect(sidePlaceOf(placeOf('quick'))).toBe('today');
    expect(sidePlaceOf('trips')).toBe('trips');
    expect(SIDE_PLACES.map((p) => p.key)).not.toContain(EQUIPMENT.key);
  });
  it('keeps the page Ausrüstung as a chip of the tab «Sets» of Velos und Material', () => {
    expect(PLACE_TABS.bikes.find((x) => x.key === 'sets').subs.some((x) => x.key === 'sets' && x.href === '#/equipment')).toBe(true);
    expect(tabOf('bikes', '#/equipment')).toBe('sets');
    expect(tabOf('bikes', '#/gear')).toBe('gear');
    expect(PLACE_TABS.bikes.map((x) => x.key)).toEqual(['bikes', 'care', 'gear', 'sets']);
  });
  it('moves Inspiration to Touren, after the first four tabs (one more tap to the Rückblick pages breaks tippzahl.spec)', () => {
    expect(placeOf('inspiration')).toBe('trips');
    expect(tabOf('trips', '#/inspiration')).toBe('inspiration');
    expect(PLACE_TABS.week.map((x) => x.key)).not.toContain('inspiration');
    const keys = PLACE_TABS.trips.map((x) => x.key);
    expect(keys.slice(0, 4)).toEqual(['overview', 'dreams', 'races', 'lookback']);
    expect(keys.indexOf('templates')).toBe(4);
    expect(keys.indexOf('inspiration')).toBe(5);
  });
  it('V4a: the bottom bar of a phone has the five places Heute, Woche, Touren, Velos und Material, Auswerten', () => {
    expect(BAR_PLACES.map((p) => p.key)).toEqual(['today', 'week', 'trips', 'bikes', 'analysis']);
  });
});
