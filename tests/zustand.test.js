import { describe, it, expect } from 'vitest';
import { zustandRows } from '../src/lib/home/zustand.js';

describe('Today: «Is everything in order?»', () => {
  it('is silent when everything is fine', () => {
    expect(zustandRows({ storage: { used: 10, quota: 100 }, keep: 'kept', sync: { on: true, error: null }, hasData: true })).toEqual([]);
    expect(zustandRows()).toEqual([]);
  });
  it('says it when the space is nearly full', () => {
    const r = zustandRows({ storage: { used: 85, quota: 100 } });
    expect(r.map((x) => x.key)).toEqual(['z:space']);
    expect(r[0].act.href).toBe('#/me/data');
  });
  it('asks to keep the data only when there is data', () => {
    expect(zustandRows({ keep: 'not', hasData: false })).toEqual([]);
    expect(zustandRows({ keep: 'not', hasData: true }).map((x) => x.key)).toEqual(['z:keep']);
    expect(zustandRows({ keep: 'unknown', hasData: true })).toEqual([]);
  });
  it('shows a failed sync only while the sync is on', () => {
    expect(zustandRows({ sync: { on: false, error: 'x' } })).toEqual([]);
    const calls = [];
    const r = zustandRows({ sync: { on: true, error: 'x' } }, { syncNow: () => calls.push(1) });
    r[0].act.run();
    expect(calls).toEqual([1]);
  });
});
