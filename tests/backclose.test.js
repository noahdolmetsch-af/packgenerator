// src/lib/ui/backclose.js (fix 27.10.2026, abfragen AB3): a dialog that opens by itself (no tap) must not
// leave the page when it closes. Chrome marks the page's entry as skippable when an entry is added without
// a tap, so history.back() would skip the page too. Such a dialog clears its entry in place instead.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { backClose } from '../src/lib/ui/backclose.js';

const URL = 'https://x.test/#/';

function fakeBrowser(isActive) {
  const stack = [{ state: null, url: URL }];
  let i = 0;
  const history = {
    get state() {
      return stack[i].state;
    },
    pushState: vi.fn((state, _t, url) => {
      stack.splice(i + 1);
      stack.push({ state, url });
      i++;
    }),
    replaceState: vi.fn((state, _t, url) => (stack[i] = { state, url })),
    back: vi.fn(() => i > 0 && i--),
  };
  vi.stubGlobal('history', history);
  vi.stubGlobal('location', {
    get href() {
      return stack[i].url;
    },
  });
  vi.stubGlobal('navigator', { userActivation: { isActive } });
  vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal(
    'MutationObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  return { history, stack };
}

function fakeDialog() {
  const on = {};
  return {
    open: true,
    addEventListener: (n, f) => ((on[n] ??= []).push(f)),
    removeEventListener() {},
    close() {
      this.open = false;
      (on.close ?? []).forEach((f) => f());
    },
  };
}

describe('backClose', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('a dialog opened by a tap takes its entry back with history.back()', () => {
    const b = fakeBrowser(true);
    const d = fakeDialog();
    backClose(d);
    expect(b.history.pushState).toHaveBeenCalledTimes(1);
    d.close();
    vi.runAllTimers();
    expect(b.history.back).toHaveBeenCalledTimes(1);
  });

  it('a dialog that opened by itself clears its entry in place and stays on the page', () => {
    const b = fakeBrowser(false);
    const d = fakeDialog();
    backClose(d);
    expect(b.history.pushState).toHaveBeenCalledTimes(1);
    d.close();
    vi.runAllTimers();
    expect(b.history.back).not.toHaveBeenCalled();
    expect(b.history.state).toBeNull();
    expect(location.href).toBe(URL);
  });

  it('an entry left over from before a reload is taken over and cleared in place, not with back', () => {
    const b = fakeBrowser(true);
    b.stack[0].state = { pgDialog: 'd999' };
    const d = fakeDialog();
    backClose(d);
    expect(b.history.pushState).not.toHaveBeenCalled();
    d.close();
    vi.runAllTimers();
    expect(b.history.back).not.toHaveBeenCalled();
    expect(b.history.state).toBeNull();
  });
});
