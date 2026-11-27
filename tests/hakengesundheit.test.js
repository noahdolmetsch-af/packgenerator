// «Was Bewegung mit dir macht» (Noah 27.11.2026 «4a», Paket B): src/lib/flow/hakengesundheit.js
import { describe, it, expect } from 'vitest';
import { weeksOf, shownWeeks, relation } from '../src/lib/flow/hakengesundheit.js';

const TODAY = '2026-11-25'; // a Wednesday, the running week starts Mon 23.11.
const day = (monday, i) => new Date(Date.parse(`${monday}T12:00:00Z`) + i * 864e5).toISOString().slice(0, 10);

/** A table with `weeks` full weeks before the running one: azm 100 × k per week and the resting pulse of the next week fall with it. */
function table(weeks, pulse = (k) => 60 - k) {
  const t = new Map();
  const first = '2026-11-16';
  for (let k = 0; k < weeks; k++) {
    const monday = new Date(Date.parse(`${first}T12:00:00Z`) - k * 7 * 864e5).toISOString().slice(0, 10);
    const a = (k % 10) + 1; // more minutes in some weeks
    for (let i = 0; i < 7; i++) t.set(day(monday, i), { azm: a * 20, rhr: pulse(a), hrv: 40 });
  }
  return t;
}

describe('Gesundheit: weeks', () => {
  it('adds the active zone minutes of a week and means the others, only with enough days', () => {
    const t = new Map([['2026-11-16', { azm: 10, rhr: 50 }], ['2026-11-17', { azm: 20, rhr: 52 }], ['2026-11-18', { azm: 30, rhr: 54 }], ['2026-11-19', { azm: 40 }]]);
    const w = weeksOf(t).get('2026-11-16');
    expect(w.azm).toBe(100);
    expect(w.rhr).toBe(52);
    expect(w.hrv).toBeNull();
    expect(weeksOf(new Map([['2026-11-16', { azm: 10 }]])).get('2026-11-16').azm).toBeNull(); // 1 day is no week
  });

  it('shows at least 12 weeks, the running one last, and empty weeks stay null', () => {
    const w = shownWeeks(new Map(), TODAY, 10);
    expect(w).toHaveLength(12);
    expect(w.at(-1)).toMatchObject({ key: '2026-11-23', current: true, azm: null });
    expect(shownWeeks(new Map(), TODAY, 365)).toHaveLength(52);
  });
});

describe('Gesundheit: relation', () => {
  it('needs 20 weeks', () => {
    expect(relation(table(15), TODAY, 'rhr')).toBeNull();
  });

  it('finds a lower resting pulse after weeks with more active zone minutes', () => {
    // the pulse of week k belongs to azm of the same k, so the next week (k-1 in time) has its own azm; build the link on the week before
    const t = new Map();
    for (let k = 0; k < 40; k++) {
      const monday = new Date(Date.parse('2026-11-16T12:00:00Z') - k * 7 * 864e5).toISOString().slice(0, 10);
      const a = ((k * 7) % 10) + 1;
      for (let i = 0; i < 7; i++) t.set(day(monday, i), { azm: a * 20, rhr: 60 - ((((k + 1) * 7) % 10) + 1) });
    }
    const r = relation(t, TODAY, 'rhr');
    expect(r).not.toBeNull();
    expect(r.n).toBeGreaterThanOrEqual(20);
    expect(r.high).toBeLessThan(r.low);
    expect(r.verdict).toBe('better');
    expect(r.direction).toBe('lower');
  });

  it('says nothing when the metric does not move', () => {
    const t = new Map();
    for (let k = 0; k < 40; k++) {
      const monday = new Date(Date.parse('2026-11-16T12:00:00Z') - k * 7 * 864e5).toISOString().slice(0, 10);
      for (let i = 0; i < 7; i++) t.set(day(monday, i), { azm: (k % 10 + 1) * 20, rhr: 52 });
    }
    expect(relation(t, TODAY, 'rhr').verdict).toBe('none');
  });

  it('does not use the running week', () => {
    const t = table(30);
    t.set('2026-11-24', { azm: 9999, rhr: 99 });
    t.set('2026-11-23', { azm: 9999, rhr: 99 });
    t.set('2026-11-25', { azm: 9999, rhr: 99 });
    t.set('2026-11-26', { azm: 9999, rhr: 99 });
    const r = relation(t, TODAY, 'rhr');
    expect(r.high).toBeLessThan(70);
  });

  it('knows only its three values', () => {
    expect(relation(table(30), TODAY, 'weight')).toBeNull();
  });
});
