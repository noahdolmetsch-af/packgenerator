// Frontend-Durchklick Etappe 1 (E1-002…004): these texts showed in English in the German view (only with many entries).
import './setup/de.js';
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';

const KEYS = [
  'To the debriefs', 'Show all {n} trips', 'Show all {n} rides', '{n} of 9 fields in {year}', '{n} find', '{n} finds',
  '{n} time taken', '{n} times taken', '{n} reminder a day', '{n} reminders a day',
  '{n} reminder waits in the next 14 days', '{n} reminders wait in the next 14 days', '{n} with two roles',
];

describe('German for the Ruhige-Ansicht counts and buttons', () => {
  it('every text has a German entry with its placeholders', () => {
    const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const k of KEYS) {
      expect(DE[k], k).toBeTruthy();
      expect(ph(DE[k]), k).toBe(ph(k));
    }
  });
});
