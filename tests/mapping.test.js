import { describe, it, expect } from 'vitest';
import { mapItem, appliesTo, isoDate, hhmm } from '../tools/import-excel/mapping.js';

const t = (s) => ({ 'Gefüllt gerechnet': 'Counted full' })[s] ?? s;

// A made-up Master row (column A = index 0), not real data.
function row(overrides = {}) {
  const r = Array(28).fill(null);
  Object.assign(r, { 0: 'XX01', 1: 'Elektronik', 2: 'Testkabel', 4: 30, 5: 1, 7: 'Logbuch', 9: 'Gepäck', 11: 'Vorhanden', 12: 'Kern', 17: 'x', 21: 'x', 25: 'Standard pack', 26: 'Base' }, overrides);
  return r;
}

describe('Excel mapping', () => {
  it('maps a Master row to an item', () => {
    const lib = ['XX01', 'elec', 'Test cable', '', 30, null, 'o', '', 'base', 'top', 'core', 'Learning EN', 'Note EN'];
    expect(mapItem(row(), lib, t, 'high')).toMatchObject({
      id: 'XX01', name: 'Test cable', nameDe: 'Testkabel', category: 'elec', weightG: 30, weightStatus: 'logbook',
      carry: 'luggage', defaultBag: 'top', ownership: 'owned', rating: 'core', role: 'standard', sets: ['base'],
      kits: ['U', 'O'], learning: 'Learning EN', wishPriority: 'high', domains: ['bikepacking'],
    });
  });

  it('marks items without weight as "missing" (To weigh)', () => {
    expect(mapItem(row({ 4: null, 7: 'Logbuch' }), null, t).weightStatus).toBe('missing');
  });

  it('translates texts without a prototype row', () => {
    const item = mapItem(row({ 8: 'Gefüllt gerechnet', 1: 'Schlafen' }), null, t);
    expect(item).toMatchObject({ name: 'Testkabel', weightNote: 'Counted full', category: 'sleep' });
  });

  it('reads kit scopes, dates and times', () => {
    expect(appliesTo('U/S/O', t)).toEqual(['U', 'S', 'O']);
    expect(appliesTo('Alle', t)).toEqual(['all']);
    expect(isoDate('18.6.2026')).toBe('2026-06-18');
    expect(isoDate('unbekannt')).toBe(null);
    expect(hhmm(new Date('1899-12-30T06:01:00Z'))).toBe('06:01');
  });
});
