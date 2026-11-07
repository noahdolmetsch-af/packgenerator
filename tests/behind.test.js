// src/lib/behind.js: a device stuck on an old offline copy hears about it, but only after the normal
// update had its time (WAIT, 2 minutes since 27.10.2026).
import { describe, it, expect, vi } from 'vitest';
import { newer, checkBehind, WAIT, KEY, showBehind, verifyFresh } from '../src/lib/behind.js';

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

  // 07.11.2026: the bar tells honestly when «load now» did not work
  function barWin(live) {
    const made = [];
    const el = (tag) => {
      const e = { tag, style: {}, children: [], attrs: {}, disabled: false, textContent: '', setAttribute(k, v) { this.attrs[k] = v; }, append(...c) { this.children.push(...c); }, remove() { this.gone = true; } };
      made.push(e);
      return e;
    };
    const body = { children: [], appendChild(e) { this.children.push(e); } };
    const w = { ...win(live), document: { body, createElement: el, querySelector: () => (body.children.length ? body.children[0] : null) }, location: { href: 'https://x/', origin: 'https://x', pathname: '/', hash: '', reload: vi.fn(), replace: vi.fn() } };
    return { w, body, made };
  }
  it('the bar: a tap shows «Loading…»; when the page is still here after the waiting time it says so and offers another try', async () => {
    vi.useFakeTimers();
    const { w, body } = barWin('0.9.0');
    w.setTimeout = (f, ms) => setTimeout(f, ms);
    showBehind(w, '0.9.0');
    const [text, go] = body.children[0].children;
    expect(text.textContent).toContain('0.9.0');
    go.onclick();
    expect(go.disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(go.disabled).toBe(false);
    expect(text.textContent).toMatch(/could not be loaded|konnte/);
    expect(text.textContent).toContain('0.9.0');
    vi.useRealTimers();
  });
  it('after a start from «load fresh» the newest version must have arrived, else the bar says it did not work', async () => {
    const stuck = barWin('0.9.0');
    expect(await verifyFresh(stuck.w, { running: '0.1.0', base: '/' })).toBe('0.9.0');
    expect(stuck.body.children[0].children[0].textContent).toMatch(/could not be loaded|konnte/);
    const ok = barWin('0.9.0');
    expect(await verifyFresh(ok.w, { running: '0.9.0', base: '/' })).toBe(null);
    expect(ok.body.children.length).toBe(0);
  });
});
