import { describe, it, expect } from 'vitest';
import { kindsOf, lastActivity, focus } from '../src/lib/uebersicht.js';

// «Auswerten aufräumen» (Noah 07.11.2026): «Im Fokus» only for sports with an activity in the 7 days it shows
const TODAY = '2026-11-07';
const act = (kind) => ({ kind, km: 20, hm: 100, movingS: 3600, kcal: 500 });
const table = new Map([
  ['2026-10-28', { acts: [act('bike')] }],
  ['2026-10-30', { acts: [act('run')] }],
]);

describe('Im Fokus: 7 days', () => {
  it('the 28-day list still has the bike, the 7-day list does not', () => {
    expect(kindsOf(table, TODAY)).toContain('bike');
    expect(kindsOf(table, TODAY, 7)).toEqual([]);
  });
  it('a sport that is in the list has a value in the 7 days', () => {
    const t2 = new Map(table).set('2026-11-05', { acts: [act('bike')] });
    const kinds = kindsOf(t2, TODAY, 7);
    expect(kinds).toEqual(['bike']);
    expect(focus(t2, TODAY, 'bike').time).toBeGreaterThan(0);
  });
  it('the old bike ride gives the 0:00:00 card', () => {
    expect(focus(table, TODAY, 'bike').time).toBe(0);
  });
});

describe('lastActivity', () => {
  it('finds the latest day with an activity and its sport', () => {
    expect(lastActivity(table, TODAY)).toEqual({ day: '2026-10-30', kind: 'run' });
  });
  it('ignores days after today and rows without activity', () => {
    const t2 = new Map(table).set('2026-11-09', { acts: [act('bike')] }).set('2026-11-06', { acts: [] });
    expect(lastActivity(t2, TODAY)).toEqual({ day: '2026-10-30', kind: 'run' });
  });
  it('is null without any activity', () => {
    expect(lastActivity(new Map(), TODAY)).toBeNull();
  });
});
