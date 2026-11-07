// «Doppeltipp-Schutz» (Durchklick Etappe 4, Noah 06.11.2026 «5a»): the shared block swallows the second tap only
import { describe, it, expect } from 'vitest';
import { isDoubleTap, installDoubleTapGuard, GAP_MS, GUARDED } from '../src/lib/ui/doubletap.js';

describe('isDoubleTap', () => {
  const a = {};
  const b = {};
  it('the second tap on the same button within the gap is swallowed', () => {
    expect(isDoubleTap({ el: a, time: 1000 }, a, 1000 + 20)).toBe(true);
    expect(isDoubleTap({ el: a, time: 1000 }, a, 1000 + GAP_MS - 1)).toBe(true);
  });
  it('a later tap, another button or the first tap is not', () => {
    expect(isDoubleTap({ el: a, time: 1000 }, a, 1000 + GAP_MS)).toBe(false);
    expect(isDoubleTap({ el: a, time: 1000 }, b, 1010)).toBe(false);
    expect(isDoubleTap(null, a, 1000)).toBe(false);
  });
  it('only save-like buttons are guarded, not steppers or tabs', () => {
    expect(GUARDED).toContain('button[type="submit"]');
    expect(GUARDED).not.toContain('button,');
    expect(GUARDED).not.toMatch(/\.btn\b/);
  });
});

describe('installDoubleTapGuard', () => {
  // a tiny stand-in for the document: it only keeps the capture handlers
  const make = () => {
    const h = {};
    const root = { addEventListener: (type, fn) => (h[type] = [...(h[type] ?? []), fn]) };
    installDoubleTapGuard(root);
    const save = {};
    const other = {};
    const btn = (el, guarded) => ({ closest: () => (guarded ? el : null) });
    const click = (el, guarded, timeStamp) => {
      const e = { target: btn(el, guarded), timeStamp, stopped: false, stopImmediatePropagation() { this.stopped = true; }, preventDefault() {} };
      h.click.forEach((fn) => fn(e));
      return e.stopped;
    };
    const fire = (type) => h[type].forEach((fn) => fn({}));
    return { save, other, click, fire };
  };
  it('two quick taps on Save: the second is swallowed', () => {
    const { save, click } = make();
    expect(click(save, true, 1000)).toBe(false);
    expect(click(save, true, 1030)).toBe(true);
  });
  it('typing or another button between two taps on Save: both count', () => {
    const a = make();
    expect(a.click(a.save, true, 1000)).toBe(false);
    a.fire('input');
    expect(a.click(a.save, true, 1040)).toBe(false);
    const b = make();
    expect(b.click(b.save, true, 1000)).toBe(false);
    expect(b.click(b.other, false, 1010)).toBe(false);
    expect(b.click(b.save, true, 1040)).toBe(false);
  });
});
