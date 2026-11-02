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

import { mergeAnswers, cleanManual } from '../src/lib/mini/termin.js';
const OPTS = [{ d: '2026-11-14', t: '' }, { d: '2026-11-15', t: '' }];
describe('Termin finden: von Hand eintragen', () => {
  it('merges server answers, typed ones, changed and deleted', () => {
    const server = [{ a: 'a1', name: 'Anna', picks: { '2026-11-14': 'y' } }, { a: 'a2', name: 'Berta', picks: { '2026-11-14': 'n' } }, { a: 'a3', name: 'Carlo', picks: {} }];
    const manual = [{ id: 'm1', name: 'Anna', picks: { '2026-11-14': 'm' }, over: 'a1' }, { id: 'm2', name: 'Dora', picks: { '2026-11-15': 'y' } }];
    const rows = mergeAnswers(server, manual, ['a3']);
    expect(rows.map((r) => r.key)).toEqual(['s:a2', 'm:m1', 'm:m2']);
    expect(rows.find((r) => r.key === 'm:m1').picks['2026-11-14']).toBe('m');
  });
  it('needs a name and one answer for a typed answer', () => {
    expect(cleanManual({ name: '', picks: { '2026-11-14': 'y' } }, OPTS)).toBeNull();
    expect(cleanManual({ name: 'Dora', picks: {} }, OPTS)).toBeNull();
    expect(cleanManual({ name: 'Dora', picks: { '2026-11-14': 'y', '2030-01-01': 'y' } }, OPTS)).toEqual({ name: 'Dora', picks: { '2026-11-14': 'y' }, note: '' });
  });
});

import { newAnswers } from '../src/lib/mini/store.js';
describe('Mini-Tools: neue Antworten', () => {
  it('counts what the server has beyond the copy on this device', () => {
    expect(newAnswers({ answers: [{}, {}] }, 3)).toBe(1);
    expect(newAnswers({ answers: [{}] }, 1)).toBe(0);
    expect(newAnswers({}, 2)).toBe(2);
    expect(newAnswers({ answers: [{}] }, undefined)).toBe(0);
    expect(newAnswers({ answers: [{}, {}] }, 1)).toBe(0);
  });
});
