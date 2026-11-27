// src/lib/swupdate.js: an app left open asks for a new version when it comes back, and loads it
// only while it is in the background (27.11.2026), never on a visible page.
import { describe, it, expect, vi } from 'vitest';
import { watchUpdates } from '../src/lib/swupdate.js';

function fake({ controller = true } = {}) {
  const on = {};
  const add = (target) => (name, f) => ((target[name] ??= []).push(f));
  const reg = { update: vi.fn(async () => {}) };
  const docEv = {};
  const w = {
    navigator: { serviceWorker: { controller, getRegistration: async () => reg, addEventListener: add(on) } },
    document: { visibilityState: 'visible', activeElement: null, addEventListener: add(docEv) },
    location: { reload: vi.fn() },
    setInterval: vi.fn(),
    setTimeout: (f) => f(),
  };
  const fire = (ev, name) => (ev[name] ?? []).forEach((f) => f());
  return { w, reg, swFire: (n) => fire(on, n), docFire: (n) => fire(docEv, n) };
}

describe('watchUpdates', () => {
  it('asks for a new version when the app comes back to the screen, and every hour', async () => {
    const f = fake();
    watchUpdates(f.w);
    f.docFire('visibilitychange');
    await new Promise((r) => setTimeout(r, 0));
    expect(f.reg.update).toHaveBeenCalledTimes(1);
    expect(f.w.setInterval).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
  });

  it('a new version taking over never reloads a visible page, only a hidden one', () => {
    const f = fake();
    const u = watchUpdates(f.w);
    f.swFire('controllerchange');
    expect(f.w.location.reload).not.toHaveBeenCalled();
    expect(u.reloadPending()).toBe(true);
    f.w.document.visibilityState = 'hidden';
    f.docFire('visibilitychange');
    expect(f.w.location.reload).toHaveBeenCalledTimes(1);
  });

  it('the first worker of a first visit is no update: no reload', () => {
    const f = fake({ controller: false });
    watchUpdates(f.w);
    f.swFire('controllerchange');
    expect(f.w.location.reload).not.toHaveBeenCalled();
  });

  it('a waiting new version is switched on when the app goes to the background, never while visible', async () => {
    const f = fake();
    const waiting = { postMessage: vi.fn() };
    f.reg.waiting = waiting;
    watchUpdates(f.w);
    f.docFire('visibilitychange'); // visible: only asks for a version
    await new Promise((r) => setTimeout(r, 0));
    expect(waiting.postMessage).not.toHaveBeenCalled();
    f.w.document.visibilityState = 'hidden';
    f.docFire('visibilitychange');
    await new Promise((r) => setTimeout(r, 0));
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('a waiting version does not show the behind bar and is not switched on during a ride', async () => {
    const f = fake();
    f.reg.waiting = { postMessage: vi.fn() };
    const behind = vi.fn(async () => {});
    watchUpdates(f.w, { behind, held: () => true });
    f.docFire('visibilitychange');
    await new Promise((r) => setTimeout(r, 0));
    expect(behind).not.toHaveBeenCalled();
    f.w.document.visibilityState = 'hidden';
    f.docFire('visibilitychange');
    await new Promise((r) => setTimeout(r, 0));
    expect(f.reg.waiting.postMessage).not.toHaveBeenCalled();
  });

  it('does nothing without service workers', () => {
    expect(watchUpdates({ navigator: {} })).toBe(null);
  });
});
