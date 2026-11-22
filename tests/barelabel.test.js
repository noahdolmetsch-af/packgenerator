// «Werkstatt-Quittung:» (Noah 05.11.2026): a label with a colon and nothing after it is no note and no learning.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bareLabel } from '../src/lib/barelabel.js';
import { learningsFor } from '../src/lib/debrief.js';
import { sparkOf } from '../src/lib/clear/spark.js';

describe('bareLabel', () => {
  it('knows a start that nobody finished', () => {
    expect(bareLabel('Workshop receipt: ')).toBe(true);
    expect(bareLabel('Werkstatt-Quittung:')).toBe(true);
    expect(bareLabel('  Idee:  ')).toBe(true);
  });
  it('a note with words after the colon, a plain text and nothing at all are not a bare label', () => {
    expect(bareLabel('Werkstatt-Quittung: Service Velo Muster')).toBe(false);
    expect(bareLabel('Hinterbremse quietscht')).toBe(false);
    expect(bareLabel('')).toBe(false);
    expect(bareLabel(null)).toBe(false);
  });
});

describe('learnings without content stay off Heute and the empty places', () => {
  const real = { id: 1, topic: 'Quick note', rule: 'Regenjacke immer griffbereit', priority: 'medium', itemIds: [], createdAt: '2026-10-01T08:00:00Z' };
  const bare = { id: 2, topic: 'Quick note', rule: 'Werkstatt-Quittung:', priority: 'high', itemIds: [], createdAt: '2026-11-04T08:00:00Z' };
  it('learningsFor skips the bare one, even when it is the newest', () => {
    expect(learningsFor({ startDate: '2026-11-10' }, [real, bare], 3).map((l) => l.id)).toEqual([1]);
  });
  it('the spark of an empty place never shows it', () => {
    expect(sparkOf({ learnings: [bare] }, '2026-11-05')).toBeNull();
    expect(sparkOf({ learnings: [bare, real] }, '2026-11-05').text).toBe(real.rule);
  });
});

describe('the quick note', () => {
  const src = readFileSync(new URL('../src/lib/QuickNote.svelte', import.meta.url), 'utf8');
  it('does not save a bare start by itself and not with «Save» (without photo)', () => {
    expect(src).toMatch(/const written = \(\) => \(bareLabel\(text\) \? '' : text\.trim\(\)\)/);
    expect(src).toMatch(/autoKeep\(\{ name: written\(\)/);
    expect(src).toMatch(/if \(!written\(\) && !photo/);
  });
});
