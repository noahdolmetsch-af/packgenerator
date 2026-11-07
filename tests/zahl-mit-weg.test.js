// «Zahl mit Weg» und «Quelle-Zeile» (UI-Prüfung 07.11.2026, Rang 1): where a number and a source lead to.
import { describe, it, expect } from 'vitest';
import { numHref, sourceLink, SOURCE_PAGES } from '../src/lib/analyse/zahlweg.js';
import { valueHref, dayHref } from '../src/lib/analyse/jump.js';

describe('numHref: where a tap on a number goes', () => {
  it('leads to the value, with its period when one is given', () => {
    expect(numHref({ key: 'rhr' })).toBe(valueHref('rhr'));
    expect(numHref({ key: 'rhr', range: 'w' })).toBe('#/auswerten/analyse/rhr?zeit=w');
  });
  it('leaves out a period that does not exist', () => {
    expect(numHref({ key: 'rhr', range: 'zz' })).toBe('#/auswerten/analyse/rhr');
  });
  it('leads to the sheet of a day', () => {
    expect(numHref({ day: '2026-11-07' })).toBe(dayHref('2026-11-07'));
    expect(numHref({ day: '2026-11-07' })).toBe('#/auswerten/analyse?tag=2026-11-07');
  });
  it('a number without an analysis leads to its source page (Noah «2b»)', () => {
    expect(numHref({ src: 'fitbit' })).toBe('#/me/fitbit');
    expect(numHref({ day: '7.11.', src: 'strava' })).toBe('#/me/connections');
    expect(numHref({ key: 'rhr', src: 'fitbit' })).toBe('#/auswerten/analyse/rhr'); // the analysis wins
    expect(numHref({ src: 'body' })).toBeNull(); // an own calculation has no page
  });
  it('a value wins over a day, and a wrong day or nothing points nowhere', () => {
    expect(numHref({ key: 'sleep', day: '2026-11-07' })).toBe('#/auswerten/analyse/sleep');
    expect(numHref({ day: '7.11.' })).toBeNull();
    expect(numHref({})).toBeNull();
    expect(numHref()).toBeNull();
  });
});

describe('sourceLink: where a value comes from', () => {
  it('names the four sources with a page of the app', () => {
    expect(sourceLink('fitbit')).toEqual({ name: 'Fitbit', href: '#/me/fitbit' });
    expect(sourceLink('strava').href).toBe('#/me/connections');
    expect(sourceLink('check').href).toBe('#/me/abfragen');
    expect(sourceLink('aktiv').href).toBe('#/flow');
  });
  it('an own calculation or an unknown source has no page', () => {
    expect(sourceLink('body')).toBeNull();
    expect(sourceLink('')).toBeNull();
    expect(sourceLink(undefined)).toBeNull();
  });
  it('every page is a hash address of the app', () => {
    for (const s of Object.values(SOURCE_PAGES)) expect(s.href).toMatch(/^#\/[a-z]/);
  });
});
