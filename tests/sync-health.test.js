// Noah 21.11.2026 «1-5a»: the dot at «Ich» and the line on Heute say how the sync stands. Fictional data only.
import { describe, it, expect } from 'vitest';
import { syncHealth, LATE_MS, ALONE_MS } from '../src/lib/sync/health.js';
import { zustandRows } from '../src/lib/home/zustand.js';

const now = Date.parse('2026-11-21T13:00:00Z');
const ago = (ms) => new Date(now - ms).toISOString();

describe('syncHealth', () => {
  it('says nothing without data, in the demo, or when «only one device» was chosen', () => {
    expect(syncHealth({ on: false, hasData: false, now }).state).toBe('none');
    expect(syncHealth({ on: false, hasData: true, demo: true, now }).state).toBe('none');
    expect(syncHealth({ on: false, hasData: true, hide: true, now }).state).toBe('none');
  });
  it('off with data and nobody said «only here»: off', () => {
    expect(syncHealth({ on: false, hasData: true, now }).state).toBe('off');
  });
  it('on and a round in the last 10 minutes: ok', () => {
    expect(syncHealth({ on: true, hasData: true, last: ago(60_000), now })).toMatchObject({ state: 'ok', dirty: 0 });
  });
  it('on but the last round failed, is too old or never happened: late, with the changes not sent', () => {
    expect(syncHealth({ on: true, hasData: true, last: ago(60_000), error: 'offline', dirty: 3, now })).toMatchObject({ state: 'late', dirty: 3 });
    expect(syncHealth({ on: true, hasData: true, last: ago(LATE_MS + 1000), now }).state).toBe('late');
    expect(syncHealth({ on: true, hasData: true, last: null, now }).state).toBe('late');
  });
});

describe('«alone»: the sync runs but no other device ever wrote into it', () => {
  const base = { on: true, hasData: true, last: ago(60_000), peerWatch: true, peerSeen: false, startedAt: ago(ALONE_MS + 1000), now };
  it('alone after ALONE_MS without a second device; not before; not for a sync started before the check existed', () => {
    expect(syncHealth(base).state).toBe('alone');
    expect(syncHealth({ ...base, startedAt: ago(60_000) }).state).toBe('ok');
    expect(syncHealth({ ...base, peerWatch: false }).state).toBe('ok');
  });
  it('a second device seen, or «only one device»: ok / quiet', () => {
    expect(syncHealth({ ...base, peerSeen: true }).state).toBe('ok');
    expect(syncHealth({ ...base, hide: true }).state).toBe('ok');
  });
  it('a failing round counts first: late', () => {
    expect(syncHealth({ ...base, error: 'offline' }).state).toBe('late');
  });
  it('Heute: one line with «Pair» and a quiet «Only one device»', () => {
    const calls = [];
    const r = zustandRows({ health: { state: 'alone', dirty: 0 }, hasData: true }, { onlyOne: () => calls.push(1) });
    expect(r.map((x) => x.key)).toEqual(['z:alone']);
    expect(r[0].act.href).toBe('#/me/data');
    r[0].act2.run();
    expect(calls).toHaveLength(1);
  });
});

describe('the lines on Heute (zustand.js)', () => {
  it('off: one line with «Switch on»; ok: nothing', () => {
    const off = zustandRows({ health: { state: 'off', dirty: 0 }, hasData: true });
    expect(off.map((r) => r.key)).toEqual(['z:syncoff']);
    expect(off[0].act.href).toBe('#/me/data');
    expect(zustandRows({ health: { state: 'ok', dirty: 0 }, hasData: true })).toEqual([]);
    expect(zustandRows({ health: { state: 'none', dirty: 0 }, hasData: true })).toEqual([]);
  });
  it('changes not sent: «{n} changes …» with «Try now»; the plain error line does not come twice', () => {
    const calls = [];
    const r = zustandRows({ health: { state: 'late', dirty: 3 }, sync: { on: true, error: 'offline' }, hasData: true }, { syncNow: () => calls.push(1) });
    expect(r.map((x) => x.key)).toEqual(['z:unsent']);
    expect(r[0].text).toContain('3');
    r[0].act.run();
    expect(calls).toHaveLength(1);
    // late without waiting changes: the old error line
    expect(zustandRows({ health: { state: 'late', dirty: 0 }, sync: { on: true, error: 'offline' } }).map((x) => x.key)).toEqual(['z:sync']);
  });
});
