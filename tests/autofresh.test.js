// src/lib/autofresh.js (Noah 27.10.2026 «1-5 a», question 4): a newer online version that has not arrived is
// loaded fresh once per version, never while typing, during a ride or in the background.
import { describe, it, expect, vi } from 'vitest';
import { autoFresh, KEY } from '../src/lib/autofresh.js';

function win(live, { visible = true, active = null, ls = true } = {}) {
  const store = new Map();
  return {
    navigator: { onLine: true },
    fetch: vi.fn(async () => ({ ok: true, json: async () => ({ version: live }) })),
    document: { visibilityState: visible ? 'visible' : 'hidden', activeElement: active },
    localStorage: ls ? { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) } : undefined,
    store,
  };
}
const opts = (o = {}) => ({ running: '0.235.0', base: '/', reload: vi.fn(async () => {}), held: () => false, ...o });

describe('autofresh', () => {
  it('loads fresh once when a newer version is online, then not again for that version', async () => {
    const w = win('0.236.0');
    const o = opts();
    expect(await autoFresh(w, o)).toBe(true);
    expect(o.reload).toHaveBeenCalledTimes(1);
    expect(w.store.get(KEY)).toBe('0.236.0');
    expect(await autoFresh(w, o)).toBe(false);
    expect(o.reload).toHaveBeenCalledTimes(1);
    // a still newer version gets its own one try
    w.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ version: '0.237.0' }) }));
    expect(await autoFresh(w, o)).toBe(true);
  });

  it('does nothing when up to date or offline', async () => {
    const o = opts();
    expect(await autoFresh(win('0.235.0'), o)).toBe(false);
    expect(await autoFresh({ ...win('0.236.0'), navigator: { onLine: false } }, o)).toBe(false);
    expect(o.reload).not.toHaveBeenCalled();
  });

  it('waits while typing, during a ride, in the background or without storage', async () => {
    const o = opts();
    expect(await autoFresh(win('0.236.0', { active: { tagName: 'INPUT' } }), o)).toBe(false);
    expect(await autoFresh(win('0.236.0'), { ...o, held: () => true })).toBe(false);
    expect(await autoFresh(win('0.236.0', { visible: false }), o)).toBe(false);
    expect(await autoFresh(win('0.236.0', { ls: false }), o)).toBe(false);
    expect(o.reload).not.toHaveBeenCalled();
  });
});
