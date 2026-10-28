// src/lib/behind.js: a device stuck on an old offline copy hears about it, but only after the normal
// update had its time (WAIT, 2 minutes since 27.10.2026).
import { describe, it, expect, vi } from 'vitest';
import { newer, checkBehind, WAIT, KEY } from '../src/lib/behind.js';

function win(live, { online = true, ok = true } = {}) {
  const store = new Map();
  return {
    navigator: { onLine: online },
    fetch: vi.fn(async () => ({ ok, json: async () => ({ version: live }) })),
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
    store,
  };
}

describe('behind', () => {
  it('compares versions by number', () => {
    expect(newer('0.165.0', '0.157.0')).toBe(true);
    expect(newer('0.157.0', '0.165.0')).toBe(false);
    expect(newer('0.165.0', '0.165.0')).toBe(false);
    expect(newer('1.0.0', '0.999.9')).toBe(true);
  });

  it('says nothing at first, then after WAIT still behind', async () => {
    const w = win('0.165.0');
    const o = { running: '0.157.0', base: '/packgenerator/' };
    expect(await checkBehind(w, { ...o, now: 1000 })).toBe(null);
    expect(w.fetch.mock.calls[0][0]).toBe('/packgenerator/version.json?t=1000');
    expect(w.fetch.mock.calls[0][1]).toEqual({ cache: 'no-store' });
    expect(await checkBehind(w, { ...o, now: 1000 + WAIT - 1 })).toBe(null);
    expect(await checkBehind(w, { ...o, now: 1000 + WAIT })).toBe('0.165.0');
  });

  it('up to date: nothing, and the note is cleared', async () => {
    const w = win('0.165.0');
    await checkBehind(w, { running: '0.157.0', base: '/', now: 0 });
    expect(w.store.has(KEY)).toBe(true);
    expect(await checkBehind(w, { running: '0.165.0', base: '/', now: WAIT * 2 })).toBe(null);
    expect(w.store.has(KEY)).toBe(false);
  });

  it('offline, a failed answer or no fetch: nothing', async () => {
    expect(await checkBehind(win('9.0.0', { online: false }), { running: '0.1.0', base: '/', now: 0 })).toBe(null);
    expect(await checkBehind(win('9.0.0', { ok: false }), { running: '0.1.0', base: '/', now: 0 })).toBe(null);
    expect(await checkBehind({ navigator: {} }, { running: '0.1.0', base: '/', now: 0 })).toBe(null);
  });

  it('a newer version again starts its own WAIT', async () => {
    const w = win('0.165.0');
    const o = { running: '0.157.0', base: '/' };
    await checkBehind(w, { ...o, now: 0 });
    w.fetch.mockImplementation(async () => ({ ok: true, json: async () => ({ version: '0.166.0' }) }));
    expect(await checkBehind(w, { ...o, now: WAIT })).toBe(null);
    expect(await checkBehind(w, { ...o, now: 2 * WAIT })).toBe('0.166.0');
  });
});
