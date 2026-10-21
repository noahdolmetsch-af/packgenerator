// «Englische Namen auf Deutsch» (Noah 21.10.2026 «1a»): the offline dictionary of src/lib/namesde.js.
// Fictional names only.
import { describe, it, expect } from 'vitest';
import { suggestDe, looksEnglish, openNames, dictionaryTexts, dictionarySize, SKIP_KEY } from '../src/lib/namesde.js';

describe('suggestDe', () => {
  it('the examples of the idea', () => {
    expect(suggestDe('Food pouch left')).toBe('Verpflegungstasche links');
    expect(suggestDe('Hip bag')).toBe('Hüfttasche');
    expect(suggestDe('Daily ride')).toBe('Tägliche Fahrt');
  });

  it('phrases first', () => {
    expect(suggestDe('Frame bag')).toBe('Rahmentasche');
    expect(suggestDe('Top tube bag')).toBe('Oberrohrtasche');
    expect(suggestDe('Rain jacket')).toBe('Regenjacke');
    expect(suggestDe('Sleeping bag')).toBe('Schlafsack');
    expect(suggestDe('Training ride')).toBe('Trainingsfahrt');
    expect(suggestDe('First aid kit')).toBe('Erste-Hilfe-Set');
    expect(suggestDe('Bar bag')).toBe('Lenkertasche');
  });

  it('word by word: nouns join, adjectives bend, left and right go to the end', () => {
    expect(suggestDe('Spare tube')).toBe('Ersatzschlauch');
    expect(suggestDe('Bike lock')).toBe('Veloschloss');
    expect(suggestDe('Small seat bag')).toBe('Kleine Satteltasche');
    expect(suggestDe('Warm sleeping bag')).toBe('Warmer Schlafsack');
    expect(suggestDe('Light jacket')).toBe('Leichte Jacke');
    expect(suggestDe('Front light')).toBe('Frontlicht');
    expect(suggestDe('Bottle cage right')).toBe('Flaschenhalter rechts');
    expect(suggestDe('Frame bag small')).toBe('Rahmentasche klein');
    expect(suggestDe('Long sleeve jersey')).toBe('Langarmtrikot');
    expect(suggestDe('Rain cover for seat bag')).toBe('Regenhülle für Satteltasche');
  });

  it('plurals, numbers and brand words stay as they are', () => {
    expect(suggestDe('2 spare tubes')).toBe('2 Ersatzschläuche');
    expect(suggestDe('Wool socks (black)')).toBe('Wollsocken (schwarz)');
    expect(suggestDe('Testbrand mount')).toBe('Testbrand Halterung');
    expect(suggestDe('Testbrand Seat-Pack 16.5L')).toBe('Testbrand Satteltasche 16.5L');
    expect(suggestDe('Water bottle 750 ml')).toBe('Trinkflasche 750 ml');
  });

  it('nothing known or nothing changed: no suggestion', () => {
    expect(suggestDe('')).toBeNull();
    expect(suggestDe(null)).toBeNull();
    expect(suggestDe('Testbrand X9')).toBeNull();
    expect(suggestDe('Tarp')).toBeNull();
  });

  it('Swiss spelling: «ss», never «ß»; a few hundred entries', () => {
    expect(dictionaryTexts().filter((s) => s.includes('ß'))).toEqual([]);
    expect(suggestDe('Big bag')).toBe('Grosse Tasche');
    expect(suggestDe('White helmet')).toBe('Weisser Helm');
    expect(dictionarySize()).toBeGreaterThan(300);
  });
});

describe('looksEnglish', () => {
  it('English names: yes', () => {
    for (const n of ['Food pouch left', 'Hip bag', 'Daily ride', 'Spare tube', 'Testbrand mount', 'Mini pump']) expect(looksEnglish(n), n).toBe(true);
  });
  it('German names, umlauts, names without known words: no', () => {
    for (const n of ['Regenjacke', 'Tasche links', 'Velo', 'Helm', 'Hüfttasche', 'Werkzeug', 'Testbrand X9', 'Shirt', 'Tour', '', null]) expect(looksEnglish(n), String(n)).toBe(false);
  });
});

describe('openNames', () => {
  const items = [
    { id: 'test_nd_1', name: 'Hip bag' },
    { id: 'test_nd_2', name: 'Rain jacket', nameDe: 'Regenjacke' },
    { id: 'test_nd_3', name: 'Rahmentasche' },
    { id: 'test_nd_4', name: 'Food pouch left' },
    { id: 'test_nd_5', name: 'Spare tube', ownership: 'gone' },
    { id: 'test_nd_6', name: 'Bike lock' },
  ];
  it('only English names without a German name, not gone, not dismissed, by name', () => {
    expect(openNames(items, ['test_nd_6'])).toEqual([
      { id: 'test_nd_4', name: 'Food pouch left', suggestion: 'Verpflegungstasche links' },
      { id: 'test_nd_1', name: 'Hip bag', suggestion: 'Hüfttasche' },
    ]);
    expect(openNames(items).map((r) => r.id)).toContain('test_nd_6');
    expect(openNames()).toEqual([]);
  });
  it('the dismissed ones live in settings', () => {
    expect(SKIP_KEY).toBe('namesde.skip');
  });
});
