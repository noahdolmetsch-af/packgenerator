// «Fahrtechnik-Tagebuch» (Persönliches Lernen Idee 3): answers on the debrief, the overview and the wishes.
import { describe, it, expect } from 'vitest';
import { TECH_STD, skillsOf, skillToggle, skillSay, overview, notesOf, noteChange, wanted, PLACE_MAX } from '../src/lib/technik.js';

const d = (skills, doneAt = '2026-10-01T10:00:00Z') => ({ skills, doneAt });

describe('the answers of a debrief', () => {
  it('starts with suggestions', () => {
    expect(TECH_STD.map((e) => e.id)).toEqual(['hairpins', 'braking', 'climbs', 'descents', 'wet', 'gravel', 'group', 'standing']);
  });
  it('keeps known techniques with a known kind only', () => {
    expect(skillsOf(d({ hairpins: 'good', nothing: 'good', braking: 'weird', 'own-1': 'unsure' }))).toEqual({ hairpins: 'good', 'own-1': 'unsure' });
    expect(skillsOf(null)).toEqual({});
  });
  it('a tap puts a technique on «tried», another tap takes it away; an empty set is null', () => {
    expect(skillToggle({}, 'hairpins')).toEqual({ hairpins: 'tried' });
    expect(skillToggle(d({ hairpins: 'good' }), 'hairpins')).toBe(null);
    expect(skillToggle(d({ hairpins: 'tried' }), 'wet')).toEqual({ hairpins: 'tried', wet: 'tried' });
  });
  it('says how it went, and the same answer again goes back to «tried»', () => {
    expect(skillSay(d({ wet: 'tried' }), 'wet', 'unsure')).toEqual({ wet: 'unsure' });
    expect(skillSay(d({ wet: 'unsure' }), 'wet', 'unsure')).toEqual({ wet: 'tried' });
    expect(skillSay(d({ wet: 'unsure' }), 'wet', 'good')).toEqual({ wet: 'good' });
    expect(skillSay({}, 'wet', 'good')).toBe(null);
  });
});

describe('over all debriefs', () => {
  it('counts per technique, the latest first, with the last answer', () => {
    const o = overview([d({ hairpins: 'unsure', wet: 'tried' }, '2026-08-01T10:00:00Z'), d({ hairpins: 'good' }, '2026-09-01T10:00:00Z'), d({ hairpins: 'good' }, '2026-10-01T10:00:00Z'), d(null)]);
    expect(o.map((r) => r.id)).toEqual(['hairpins', 'wet']);
    expect(o[0]).toEqual({ id: 'hairpins', count: 3, good: 2, unsure: 1, last: { day: '2026-10-01', kind: 'good' } });
    expect(o[1].count).toBe(1);
    expect(overview(null)).toEqual([]);
  });
});

describe('the wish and the place', () => {
  it('keeps what is set and drops the empty', () => {
    expect(notesOf({ wet: { want: true, place: '  Parkplatz Süd ' }, braking: {}, gravel: { want: false } })).toEqual({ wet: { want: true, place: 'Parkplatz Süd' } });
    expect(notesOf('x')).toEqual({});
  });
  it('changes one technique, drops it when nothing is left, and cuts a long place', () => {
    expect(noteChange(null, 'wet', { want: true })).toEqual({ wet: { want: true } });
    expect(noteChange({ wet: { want: true } }, 'wet', { want: false })).toBe(null);
    expect(noteChange({ wet: { want: true } }, 'wet', { place: 'Hof' })).toEqual({ wet: { want: true, place: 'Hof' } });
    expect(noteChange(null, 'wet', { place: 'x'.repeat(100) }).wet.place).toHaveLength(PLACE_MAX);
  });
  it('lists the wanted ones', () => {
    expect(wanted({ wet: { want: true }, gravel: { place: 'Kiesgrube' }, climbs: { want: true } }).sort()).toEqual(['climbs', 'wet']);
  });
});
