// «Seite nicht gefunden» (Gesamttest 19.11.2026, Noah «a»): welche Adressen Heute sind und welche keine Seite haben.
import { describe, it, expect } from 'vitest';
import { isUnknown, pageOf } from '../src/lib/nav.js';

describe('isUnknown', () => {
  it('Heute und seine Adressen sind bekannt', () => {
    for (const h of ['', '#', '#/', '#/?sheet=wear', '#/?x=1']) expect(isUnknown(h), h).toBe(false);
  });
  it('bekannte Seiten und alte Adressen mit Weiterleitung sind bekannt', () => {
    for (const h of ['#/me/mini', '#/timer', '#/bikes?tab=care', '#/care', '#/review', '#/check/foo', '#/trips/fuel', '#/me/agenda']) expect(isUnknown(h), h).toBe(false);
  });
  it('eine unbekannte Adresse ist unbekannt', () => {
    for (const h of ['#/does-not-exist', '#/x/y?open=1', '#/velos', '#/agenda']) expect(isUnknown(h), h).toBe(true);
  });
  it('jede Seite, die pageOf kennt, ist nie unbekannt', () => {
    for (const h of ['#/gear', '#/wardrobe', '#/week', '#/quick', '#/me', '#/assistent']) {
      expect(pageOf(h), h).not.toBe('home');
      expect(isUnknown(h), h).toBe(false);
    }
  });
});
