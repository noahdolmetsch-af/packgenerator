// Mini-Tools «Wann muss ich losfahren?» (Noah 28.10.2026, idea 10). Fictional places and people.
import { describe, it, expect } from 'vitest';
import { newMeet, wayKm, rideMinutes, minus, plan, planText, durText, cleanPlace, DETOUR } from '../src/lib/mini/abfahrt.js';

const A = { name: 'Ort A', lat: 47.0, lon: 8.0 };
const B = { name: 'Ort B', lat: 47.1, lon: 8.0 }; // about 11.1 km north of A

describe('abfahrt', () => {
  it('counts the straight line times the detour factor', () => {
    expect(wayKm(A, B)).toBeCloseTo(11.12 * DETOUR, 1);
    expect(wayKm(A, null)).toBeNull();
    expect(rideMinutes(A, B, 20)).toBe(Math.ceil(((11.12 * DETOUR) / 20) * 60));
  });

  it('goes back over midnight', () => {
    expect(minus('08:30', 45)).toEqual({ at: '07:45', prev: 0 });
    expect(minus('00:20', 30)).toEqual({ at: '23:50', prev: 1 });
  });

  it('plans the earliest first and puts people without a start last', () => {
    const m = newMeet({ title: 'Ausfahrt', place: B, time: '09:00', people: [{ name: 'Nah', from: B }, { name: 'Ohne' }, { name: 'Weit', from: A, speed: 20, buffer: 5 }] });
    const rows = plan(m);
    expect(rows.map((r) => r.name)).toEqual(['Weit', 'Nah', 'Ohne']);
    const ride = rideMinutes(A, B, 20);
    expect(rows[0].leave).toEqual(minus('09:00', ride + 5));
    expect(rows[1].leave).toEqual({ at: '08:55', prev: 0 });
    expect(rows[2].leave).toBeNull();
    const T = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
    expect(planText(m, rows, T)).toContain('Weit: leave at');
    expect(planText(m, rows, T)).not.toContain('Ohne');
  });

  it('cleans what it keeps', () => {
    expect(cleanPlace({ name: 'x', lat: 200, lon: 0 })).toBeNull();
    expect(cleanPlace({ lat: '47', lon: '8' })).toEqual({ name: '?', lat: 47, lon: 8 });
    const m = newMeet({ people: [{ name: '  ', from: A }, { name: 'X', speed: 999, buffer: -3 }] });
    expect(m.people).toEqual([{ id: 'p2', name: 'X', from: null, speed: 45, buffer: 0 }]);
    expect(durText(65)).toBe('1 h 05');
    expect(durText(35)).toBe('35 min');
  });
});
