import { describe, it, expect } from 'vitest';
import { toneOf, pick, SAYINGS, NUDGES, stageKey, familyOf, FAMILY_STAGES } from '../src/lib/flow/tone.js';

describe('Ton der App (Meilensteine aktiver machen PR 3)', () => {
  it('starts on funny and ignores unknown values', () => {
    expect(toneOf(undefined)).toBe('funny');
    expect(toneOf({ tone: 'calm' })).toBe('calm');
    expect(toneOf({ tone: 'off' })).toBe('off');
    expect(toneOf({ tone: 'x' })).toBe('funny');
  });
  it('a saying is steady for a seed and empty for off', () => {
    expect(pick(SAYINGS, 'funny', 's1')).toBe(pick(SAYINGS, 'funny', 's1'));
    expect(SAYINGS.funny).toContain(pick(SAYINGS, 'funny', 's2'));
    expect(pick(SAYINGS, 'off', 's1')).toBe('');
    expect(NUDGES.calm).toContain(pick(NUDGES, 'calm', 'a'));
  });
  it('fitting stage names for sports, none for the rest', () => {
    expect(Object.values(FAMILY_STAGES).every((l) => l.length === 7)).toBe(true);
    expect(familyOf({ icon: 'bike' })).toBe('ride');
    expect(stageKey({ icon: 'bike' }, 1)).toBe('First pedal|stage ride');
    expect(stageKey({ icon: 'bike' }, 9)).toBe('Endless road|stage ride');
    expect(stageKey({ icon: 'lotus' }, 2)).toBeNull();
  });
});
