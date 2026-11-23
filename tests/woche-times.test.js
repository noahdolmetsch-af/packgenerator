// «Plan my day» gives times to entries that have none (layer `week.times`). Fictional data only.
import { describe, it, expect } from 'vitest';
import { buildWeek, timesOf } from '../src/lib/woche.js';

describe('timesOf', () => {
  it('keeps well-formed times and drops the rest and the old ones', () => {
    const v = { 'tr:1@2026-11-24': '09:15', 'x@2026-11-24': '9:15', 'nokey': '10:00', 'cal:1@2026-01-01': '10:00', 'a@2026-11-25': 7 };
    expect(timesOf(v)).toEqual({ 'tr:1@2026-11-24': '09:15', 'cal:1@2026-01-01': '10:00' });
    expect(timesOf(v, '2026-11-23')).toEqual({ 'tr:1@2026-11-24': '09:15' });
    expect(timesOf(null)).toEqual({});
    expect(timesOf([])).toEqual({});
  });
});

describe('buildWeek with times', () => {
  const base = { monday: '2026-11-23', today: '2026-11-23', sessions: [{ id: 's1', day: '2026-11-24', name: 'Base', kind: 'base', mins: 60 }] };
  it('puts the time on the entry without one and marks it as planned', () => {
    const w = buildWeek({ ...base, times: { 'tr:s1@2026-11-24': '17:30' } });
    const e = w.days.find((d) => d.day === '2026-11-24').entries.find((x) => x.id === 'tr:s1');
    expect(e.time).toBe('17:30');
    expect(e.planned).toBe(true);
  });
  it('changes nothing without times, and for another day', () => {
    const none = buildWeek(base).days.find((d) => d.day === '2026-11-24').entries.find((x) => x.id === 'tr:s1');
    expect(none.time).toBe('');
    const other = buildWeek({ ...base, times: { 'tr:s1@2026-11-25': '17:30' } }).days.find((d) => d.day === '2026-11-24').entries.find((x) => x.id === 'tr:s1');
    expect(other.time).toBe('');
  });
});
