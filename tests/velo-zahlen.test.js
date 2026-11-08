// «Velo-Zahlen als Wege» (UI-Prüfung 07.11.2026, V1): the km of a bike lead to Analyse › Velos, a page of the app can be the way of a number.
import { describe, it, expect } from 'vitest';
import { numHref } from '../src/lib/analyse/zahlweg.js';
import { velosHref, tabOfHash } from '../src/lib/analyse/jump.js';
import { bikesHash } from '../src/lib/bikes.js';

const TABS = ['ueberblick', 'diagramm', 'vergleiche', 'rekorde', 'velos', 'werte'];

describe('Velo-Zahlen als Wege', () => {
  it('the km lead to the part «Velos» of Analyse, and Analyse reads it back', () => {
    expect(velosHref()).toBe('#/auswerten/analyse?tab=velos');
    expect(tabOfHash(velosHref(), TABS)).toBe('velos');
  });
  it('a part that does not exist is ignored', () => {
    expect(tabOfHash('#/auswerten/analyse?tab=nix', TABS)).toBeNull();
    expect(tabOfHash('#/auswerten/analyse', TABS)).toBeNull();
    expect(tabOfHash(undefined, TABS)).toBeNull();
  });
  it('a page of the app can be the way of a number (`to`), and wins over the others', () => {
    const year = bikesHash({ tab: 'care', bike: 'b1', view: 'year' });
    expect(year).toContain('view=year');
    expect(numHref({ to: year })).toBe(year);
    expect(numHref({ to: year, key: 'rhr' })).toBe(year);
    expect(numHref({ key: 'rhr' })).toBe('#/auswerten/analyse/rhr');
  });
});
