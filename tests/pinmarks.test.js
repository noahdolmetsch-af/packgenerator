// «Quick Links» Schritt 2 (Noah 28.10.2026 «1a 2a»): which functions a page shows and where their pin sits.
import { describe, it, expect } from 'vitest';
import { HOME, GAPS } from '../src/lib/know/heimat.js';
import { FEATURE } from '../src/lib/features.js';
import { homeMatches, featuresOn, cleanName, textFits, placePin } from '../src/lib/quick/pinmarks.js';

describe('pins on the cards', () => {
  it('matches a home page with its placeholders and queries', () => {
    expect(homeMatches('#/', '#/')).toBe(true);
    expect(homeMatches('#/', '')).toBe(true);
    expect(homeMatches('#/', '#/trips')).toBe(false);
    expect(homeMatches('#/race/:race', '#/race/r-1')).toBe(true);
    expect(homeMatches('#/race/:race', '#/race/r-1/map')).toBe(false);
    expect(homeMatches('#/bikes?tab=care', '#/bikes?tab=care&x=1')).toBe(true);
    expect(homeMatches('#/bikes?tab=care', '#/bikes')).toBe(false);
    expect(homeMatches('#/bikes', '#/bikes?tab=care')).toBe(true);
  });

  it('a page offers the functions whose home it is, never one in GAPS or outside the catalogue', () => {
    const ids = featuresOn('#/');
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => FEATURE[id] && !GAPS[id] && homeMatches(HOME[id], '#/'))).toBe(true);
    expect(featuresOn('#/nowhere-at-all')).toEqual([]);
  });

  it('compares names like the robot test: brackets, «» and stars do not count; whole words only', () => {
    expect(cleanName('«Wetter» (für eine Fahrt) ★')).toBe('wetter');
    expect(textFits('Wetter für eine Fahrt ›', 'Wetter für eine Fahrt')).toBe(true);
    expect(textFits('Kette nach Regen', 'Kette')).toBe(true);
    expect(textFits('Kettenlehre', 'Kette')).toBe(false);
    expect(textFits('Pflege', '')).toBe(false);
  });

  it('a pin sits on the top right corner of its card, else after the title, else nowhere; never off the page', () => {
    const card = { top: 100, right: 380, height: 200 };
    const title = { top: 120, right: 200, height: 24 };
    expect(placePin(card, title, 390)).toEqual({ x: 346, y: 86 });
    const notCorner = (b) => b.y !== 86;
    expect(placePin(card, title, 390, notCorner)).toEqual({ x: 202, y: 110 });
    expect(placePin(card, title, 390, () => false)).toBe(null);
    expect(placePin({ top: 0, right: 400, height: 10 }, title, 390).x).toBe(346);
  });
});
