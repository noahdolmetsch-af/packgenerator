// «Der Titel fliegt mit» (Paket A Seitenwechsel 2): the logic of src/lib/nav/vtitle.js with a stand-in window
import { describe, it, expect, vi } from 'vitest';
import { installTitleFlight, NAME } from '../src/lib/nav/vtitle.js';

function fake({ vt = true, motionOff = false } = {}) {
  const listeners = {};
  const el = { style: { viewTransitionName: '' }, closest: (s) => (s === 'a[data-vt-title]' ? el : null) };
  const calls = { start: 0, hash: [] };
  let resolveFinished;
  const doc = {
    documentElement: { dataset: motionOff ? { motion: 'off' } : {} },
    querySelector: () => ({}),
    ...(vt ? { startViewTransition: (cb) => { calls.start++; const done = Promise.resolve(cb()); return { finished: new Promise((r) => (resolveFinished = () => done.then(r))) }; } } : {}),
  };
  let t = 0;
  const win = {
    document: doc,
    performance: { now: () => t },
    setTimeout: () => 1,
    clearTimeout() {},
    requestAnimationFrame: (f) => f(),
    matchMedia: () => ({ matches: false }),
    HashChangeEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init); } },
    addEventListener: (type, f) => (listeners[type] = [...(listeners[type] ?? []), f]),
    removeEventListener: (type, f) => (listeners[type] = (listeners[type] ?? []).filter((x) => x !== f)),
    dispatchEvent: (e) => { for (const f of [...(listeners[e.type] ?? [])]) { if (e.stopped) break; f(e); } },
  };
  const app = (e) => calls.hash.push(e);
  return { win, el, calls, doc, tap: (init = {}) => win.dispatchEvent({ type: 'click', target: el, button: 0, ...init }), hash: () => { const e = { type: 'hashchange', oldURL: 'a', newURL: 'b', stopImmediatePropagation() { this.stopped = true; } }; win.dispatchEvent(e); return e; }, app, listeners, now: (n) => (t = n), finish: () => resolveFinished() };
}

describe('installTitleFlight', () => {
  it('holds the address change back, runs a transition, and then passes the event to the app', async () => {
    const f = fake();
    installTitleFlight(f.win);
    f.win.addEventListener('hashchange', f.app); // the app, listening after this file
    f.tap();
    expect(f.el.style.viewTransitionName).toBe(NAME);
    const e = f.hash();
    expect(e.stopped).toBe(true);
    expect(f.calls.start).toBe(1);
    expect(f.doc.documentElement.dataset.vt).toBe('');
    await Promise.resolve();
    await Promise.resolve();
    expect(f.calls.hash.length).toBe(1); // the app heard it once, from the transition
    expect(f.calls.hash[0].newURL).toBe('b');
    f.finish();
    await new Promise((r) => setTimeout(r, 0));
    expect(f.doc.documentElement.dataset.vt).toBeUndefined();
    expect(f.el.style.viewTransitionName).toBe('');
  });
  it('does nothing without a tap on a marked link, with a modifier key, or with less motion', () => {
    for (const setup of [
      (f) => {},
      (f) => f.tap({ ctrlKey: true }),
      (f) => f.tap({ button: 1 }),
    ]) {
      const f = fake();
      installTitleFlight(f.win);
      f.win.addEventListener('hashchange', f.app);
      setup(f);
      const e = f.hash();
      expect(e.stopped).toBeUndefined();
      expect(f.calls.start).toBe(0);
      expect(f.calls.hash.length).toBe(1);
    }
    const f = fake({ motionOff: true });
    installTitleFlight(f.win);
    f.win.addEventListener('hashchange', f.app);
    f.tap();
    expect(f.hash().stopped).toBeUndefined();
    expect(f.calls.start).toBe(0);
  });
  it('a tap that is too old does not count', () => {
    const f = fake();
    installTitleFlight(f.win);
    f.tap();
    f.now(5000);
    expect(f.hash().stopped).toBeUndefined();
    expect(f.calls.start).toBe(0);
  });
  it('leaves everything alone in a browser without View Transitions, and can be removed', () => {
    const f = fake({ vt: false });
    installTitleFlight(f.win);
    expect(f.listeners.hashchange).toBeUndefined();
    const g = fake();
    const off = installTitleFlight(g.win);
    off();
    expect(g.listeners.hashchange).toEqual([]);
  });
});
