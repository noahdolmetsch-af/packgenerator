// Velos aufräumen (23.11.2026): shoe/cleat jobs are no bike work; imported English part names read German.
import './setup/de.js';
import { describe, it, expect, afterEach } from 'vitest';
import { lang, bagName, importText } from '../src/lib/i18n.svelte.js';
import { isGearWork } from '../src/lib/care/gearwork.js';
import { taskBike } from '../src/lib/care.js';

afterEach(() => (lang.v = 'en'));

describe('isGearWork', () => {
  it('a cleat or shoe job is gear work, a brake shoe is bike work', () => {
    expect(isGearWork({ task: 'Cleat linker Schuh' })).toBe(true);
    expect(isGearWork({ task: 'Schuhplatten wechseln' })).toBe(true);
    expect(isGearWork({ task: 'Brake shoes tauschen' })).toBe(false);
    expect(isGearWork({ task: 'Kette wechseln' })).toBe(false);
    expect(isGearWork(null)).toBe(false);
  });
  it('the field gear wins over the text (Zum Velo sets false)', () => {
    expect(isGearWork({ task: 'Cleat linker Schuh', gear: false })).toBe(false);
    expect(isGearWork({ task: 'Kette wechseln', gear: true })).toBe(true);
  });
  it('gear work has no bike in the care', () => {
    expect(taskBike({ task: 'Cleat linker Schuh', bikeId: 7 })).toBe(null);
    expect(taskBike({ task: 'Kette wechseln', bikeId: 7 })).toBe(7);
  });
});

describe('German names of imported parts', () => {
  it('bagName and importText translate words only in German', () => {
    expect(bagName('Bottle cage (down tube)')).toBe('Bottle cage (down tube)');
    lang.v = 'de';
    expect(bagName('Bottle cage (down tube)')).toBe('Flaschenhalter (Unterrohr)');
    expect(bagName('Tool bag')).toBe('Werkzeugtasche');
    expect(bagName('Mein Liebling')).toBe('Mein Liebling');
    expect(importText('Newly ordered (October 2026)')).toContain('Oktober 2026');
    expect(importText('Eigener Text')).toBe('Eigener Text');
  });
});
