// «Was auffällt» (Noah 21.11.2026, K3): fictional resting pulse days only.
import { describe, it, expect } from 'vitest';
import { restingAlert, cleanSettings, DEFAULTS } from '../src/lib/flow/form/auffaellt.js';
import { addDays } from '../src/lib/health.js';

const TODAY = '2026-11-20';
/** Normal 48 for 40 days, then the given values for the last days (newest last). */
function table(last = [], normal = 48, days = 60) {
  const t = new Map();
  for (let i = days; i >= 1; i--) t.set(addDays(TODAY, -(last.length - 1) - i), { rhr: normal + (i % 2) });
  last.forEach((v, i) => v != null && t.set(addDays(TODAY, -(last.length - 1 - i)), { rhr: v }));
  return t;
}

describe('restingAlert', () => {
  it('nothing stands out within the normal', () => {
    const r = restingAlert({ table: table([48, 49, 48]), today: TODAY });
    expect(r.state).toBe('none');
    expect(r.normal).toBeCloseTo(48.5, 0);
  });
  it('three days three beats and more above: «up», with the days in a row', () => {
    const r = restingAlert({ table: table([52, 53, 54]), today: TODAY });
    expect(r.state).toBe('up');
    expect(r.above).toBeGreaterThanOrEqual(3);
    expect(r.n).toBe(3);
    expect(r.to).toBe(TODAY);
    expect(r.from).toBe('2026-11-18');
  });
  it('counts the days in a row further back than the three looked at', () => {
    const r = restingAlert({ table: table([51, 52, 53, 54, 55]), today: TODAY });
    expect(r.state).toBe('up');
    expect(r.n).toBe(5);
  });
  it('two days are enough when the third has no value', () => {
    const r = restingAlert({ table: table([null, 54, 55]), today: TODAY });
    expect(r.state).toBe('up');
    expect(r.n).toBe(2);
  });
  it('the limit can be changed', () => {
    expect(restingAlert({ table: table([50, 51, 51]), today: TODAY }).state).toBe('none');
    expect(restingAlert({ table: table([50, 51, 51]), today: TODAY, settings: { delta: 2 } }).state).toBe('up');
  });
  it('marked days: not a trigger, not part of the normal', () => {
    const t = table([52, 53, 54]);
    expect(restingAlert({ table: t, today: TODAY, marked: new Set([TODAY]) }).state).toBe('marked');
    // an earlier illness of 20 days at 58 would lift the normal; marked, it does not
    const tt = table([52, 53, 54]);
    for (let i = 4; i <= 23; i++) tt.set(addDays(TODAY, -i), { rhr: 58 });
    const marked = new Set(Array.from({ length: 20 }, (_, i) => addDays(TODAY, -(i + 4))));
    expect(restingAlert({ table: tt, today: TODAY }).state).not.toBe('up');
    expect(restingAlert({ table: tt, today: TODAY, marked }).state).toBe('up');
  });
  it('too few values for the normal: «few»', () => {
    expect(restingAlert({ table: table([52, 53, 54], 48, 5), today: TODAY }).state).toBe('few');
  });
  it('no value for days: «old»', () => {
    expect(restingAlert({ table: new Map([['2026-11-10', { rhr: 50 }]]), today: TODAY }).state).toBe('old');
  });
  it('settings stay in range', () => {
    expect(cleanSettings({ delta: 4 })).toEqual({ delta: 4 });
    expect(cleanSettings({ delta: 40 })).toEqual(DEFAULTS);
    expect(cleanSettings(null)).toEqual(DEFAULTS);
  });
});
