// src/lib/swupdate.js: an app left open asks for a new version when it comes back, and loads it,
// but never while the person types.
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

  it('a new version taking over loads the page anew', () => {
    const f = fake();
    watchUpdates(f.w);
    f.swFire('controllerchange');
    expect(f.w.location.reload).toHaveBeenCalledTimes(1);
  });

  it('the first worker of a first visit is no update: no reload', () => {
    const f = fake({ controller: false });
    watchUpdates(f.w);
    f.swFire('controllerchange');
    expect(f.w.location.reload).not.toHaveBeenCalled();
  });

  it('while typing it waits until the field is left or the app goes to the background', () => {
    const f = fake();
    const field = { tagName: 'TEXTAREA', isContentEditable: false };
    f.w.document.activeElement = field;
    const u = watchUpdates(f.w);
    f.swFire('controllerchange');
    expect(f.w.location.reload).not.toHaveBeenCalled();
    expect(u.reloadPending()).toBe(true);
    f.docFire('focusout'); // still in the field (focus moved to another field)
    expect(f.w.location.reload).not.toHaveBeenCalled();
    f.w.document.visibilityState = 'hidden';
    f.docFire('visibilitychange');
    expect(f.w.location.reload).toHaveBeenCalledTimes(1);
  });

  it('does nothing without service workers', () => {
    expect(watchUpdates({ navigator: {} })).toBe(null);
  });
});
