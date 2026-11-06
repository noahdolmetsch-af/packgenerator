// Durchklick Etappe 2, Frage 2a (Noah 05.11.2026): the path line never says a name twice (src/lib/nav/pathlast.js).
import { describe, it, expect } from 'vitest';
import { pathLast } from '../src/lib/nav/pathlast.js';

const steps = (...labels) => labels.map((label) => ({ label, href: '#/x' }));

describe('pathLast', () => {
  it('leaves out a title that is the name of the place', () => {
    expect(pathLast(steps('Touren', 'Übersicht'), 'Touren')).toBe('');
    expect(pathLast(steps('Material', 'Alles'), 'Material')).toBe('');
  });
  it('leaves out a title that is the name of the tab', () => {
    expect(pathLast(steps('Planen', 'Woche'), 'Woche')).toBe('');
  });
  it('keeps a title that is new', () => {
    expect(pathLast(steps('Touren', 'Übersicht'), 'Herbsttour')).toBe('Herbsttour');
  });
  it('gives nothing for an empty title', () => {
    expect(pathLast(steps('Touren'), '')).toBe('');
    expect(pathLast(steps('Touren'), undefined)).toBe('');
  });
  it('ignores spaces around the names', () => {
    expect(pathLast(steps('Touren', 'Übersicht'), '  Touren ')).toBe('');
  });
});
