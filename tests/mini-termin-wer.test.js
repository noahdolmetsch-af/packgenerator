import { describe, it, expect } from 'vitest';
import { cleanInvited, whoAnswered, reminderText } from '../src/lib/mini/termin.js';

describe('Termin finden: wer hat geantwortet', () => {
  it('cleans the names: trim, no double, no empty', () => {
    expect(cleanInvited([' Anna ', 'anna', '', 'Berta'])).toEqual(['Anna', 'Berta']);
    expect(cleanInvited(null)).toEqual([]);
  });
  it('splits answered, missing and others', () => {
    const r = whoAnswered(['Anna', 'Berta', 'Carlo'], [{ name: 'anna', picks: { '2026-11-14': 'y' } }, { name: 'Dora', picks: { '2026-11-14': 'n' } }, { name: 'Carlo', picks: {} }]);
    expect(r.answered).toEqual(['Anna']);
    expect(r.missing).toEqual(['Berta', 'Carlo']);
    expect(r.others).toEqual(['Dora']);
  });
  it('writes the reminder with names and link', () => {
    const T = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
    expect(reminderText('Tour', ['Berta', 'Carlo'], 'https://x', T)).toBe('Tour: still missing an answer from Berta, Carlo. Tap your answer here: https://x');
  });
});
