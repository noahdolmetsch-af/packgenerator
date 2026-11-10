// Noah 10.11.2026 «sofort»: der Abgleich laeuft viel haeufiger von selbst: 2 s nach einer Aenderung, alle 20 s solange
// die App offen und vorne ist (60 s wenn nichts passiert), beim Verbergen mit Ungesendetem sofort, beim Ziehen zum
// Aktualisieren. Erfundene Daten.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshToday, SYNC_MAX } from '../src/lib/home/refresh.js';

describe('Ziehen zum Aktualisieren bringt auch den Abgleich', () => {
  const db = { settings: { get: async () => null } };
  it('starts a sync round when the sync is on, and says so', async () => {
    const syncNow = vi.fn(async () => ({ taken: 1 }));
    const r = await refreshToday({ db, loadCore: vi.fn(), fetchNow: vi.fn(), syncNow, hasSync: true });
    expect(syncNow).toHaveBeenCalledTimes(1);
    expect(r.sync).toBe(true);
  });
  it('does nothing about the sync when it is off', async () => {
    const syncNow = vi.fn();
    const r = await refreshToday({ db, loadCore: vi.fn(), fetchNow: vi.fn(), syncNow, hasSync: false });
    expect(syncNow).not.toHaveBeenCalled();
    expect(r.sync).toBeUndefined();
  });
  it('does not wait longer than SYNC_MAX for a slow round, and a failing round never throws', async () => {
    vi.useFakeTimers();
    const slow = refreshToday({ db, loadCore: vi.fn(), fetchNow: vi.fn(), syncNow: () => new Promise(() => {}), hasSync: true });
    await vi.advanceTimersByTimeAsync(SYNC_MAX + 10);
    expect((await slow).sync).toBe(true);
    vi.useRealTimers();
    const r = await refreshToday({ db, loadCore: vi.fn(), fetchNow: vi.fn(), syncNow: async () => { throw new Error('offline'); }, hasSync: true });
    expect(r.sync).toBe(true);
  });
});

describe('wann ein Abgleich von selbst laeuft (auto.svelte.js)', () => {
  let rounds;
  let cfg;
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    rounds = 0;
    cfg = { on: true, lastAt: null };
    vi.doMock('../src/lib/sync/engine.js', () => ({
      syncNow: vi.fn(async () => {
        rounds++;
        return { taken: 0, sent: 0 };
      }),
      readCfg: vi.fn(async () => cfg),
      settleAsks: vi.fn(async () => {}),
    }));
    vi.doMock('../src/lib/push/client.js', () => ({ afterSync: () => {} }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock('../src/lib/sync/engine.js');
  });

  /** A tiny stand-in for window/document: visibility and the listeners. */
  const fakeWin = (state = 'visible') => {
    const listeners = {};
    const doc = { visibilityState: state, addEventListener: (n, f) => (listeners[`doc:${n}`] = f) };
    return { document: doc, addEventListener: (n, f) => (listeners[`win:${n}`] = f), set: (s) => (doc.visibilityState = s), fire: (k) => listeners[k]?.() };
  };
  /** A database with just what watchSync asks: the sync setting and the count of changed records. */
  const fakeDb = (dirty = { n: 0 }) => ({ meta: { where: () => ({ startsWith: () => ({ filter: () => ({ count: async () => dirty.n }) }) }) } });

  it('the pause between questions is 20 s, and 60 s after ten quiet rounds', async () => {
    const { nextPollDelay, POLL_MS, QUIET_MS, QUIET_AFTER } = await import('../src/lib/sync/auto.svelte.js');
    expect(nextPollDelay(0)).toBe(POLL_MS);
    expect(nextPollDelay(QUIET_AFTER - 1)).toBe(POLL_MS);
    expect(nextPollDelay(QUIET_AFTER)).toBe(QUIET_MS);
    expect(POLL_MS).toBe(20_000);
  });

  it('asks every 20 s while in front, slows down when quiet, and does not run while hidden', async () => {
    const { watchSync, POLL_MS, QUIET_MS, QUIET_AFTER } = await import('../src/lib/sync/auto.svelte.js');
    const win = fakeWin('visible');
    watchSync(fakeDb(), win);
    await vi.advanceTimersByTimeAsync(3_100); // the round a moment after the start
    expect(rounds).toBe(1);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(rounds).toBe(2);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(rounds).toBe(3);
    // after ten quiet rounds in a row the pause is 60 s: in the next 3 minutes there are about 3 rounds, not 9
    await vi.advanceTimersByTimeAsync(POLL_MS * (QUIET_AFTER + 3));
    const before = rounds;
    await vi.advanceTimersByTimeAsync(QUIET_MS * 3);
    expect(rounds - before).toBeGreaterThanOrEqual(2);
    expect(rounds - before).toBeLessThanOrEqual(4);
    // hidden: no timer
    win.set('hidden');
    win.fire('doc:visibilitychange');
    const hiddenAt = rounds;
    await vi.advanceTimersByTimeAsync(QUIET_MS * 3);
    expect(rounds).toBe(hiddenAt);
    // back in front: a round at once, and the 20 s rhythm again
    win.set('visible');
    win.fire('doc:visibilitychange');
    await vi.advanceTimersByTimeAsync(10);
    expect(rounds).toBe(hiddenAt + 1);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(rounds).toBe(hiddenAt + 2);
  });

  it('is quiet when the sync is off (no question to the server)', async () => {
    cfg = { on: false };
    const { watchSync, POLL_MS } = await import('../src/lib/sync/auto.svelte.js');
    watchSync(fakeDb(), fakeWin('visible'));
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    // only the one round a moment after the start may look (it finds the sync off and stops at once)
    expect(rounds).toBeLessThanOrEqual(0 + 1);
  });

  it('sends at once when the app is hidden with changes not sent yet', async () => {
    const { watchSync } = await import('../src/lib/sync/auto.svelte.js');
    const win = fakeWin('visible');
    const dirty = { n: 1 };
    watchSync(fakeDb(dirty), win);
    await vi.advanceTimersByTimeAsync(300); // the watcher has seen one changed record and the sync setting
    const before = rounds;
    win.set('hidden');
    win.fire('doc:visibilitychange');
    await vi.advanceTimersByTimeAsync(10);
    expect(rounds).toBe(before + 1);
  });
});
