// «Ausprobieren»: a tap on another line stops the run that is still waiting for its element, so an old run never lights
// a spot of a page the user has already left (the cause of the flaky tests/e2e/ausprobieren.spec.js on the pins line).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const el = (name) => ({
  name,
  parentElement: null,
  dataset: {},
  style: {},
  clicks: 0,
  click() { this.clicks++; },
  getClientRects: () => [1],
  getBoundingClientRect: () => ({ top: 10, bottom: 50, height: 40 }),
  scrollIntoView() {},
  animate: () => ({ finished: new Promise(() => {}) }),
});
let shown;
beforeEach(() => {
  vi.useFakeTimers();
  shown = {};
  globalThis.innerHeight = 800;
  globalThis.scrollBy = () => {};
  globalThis.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.document = {
    querySelectorAll: (sel) => (shown[sel] ? [shown[sel]] : []),
    querySelector: () => null,
    createElement: () => ({ append() {}, setAttribute() {}, style: {}, dataset: {}, classList: { add() {} } }),
    body: { append() {} },
  };
});
afterEach(() => {
  vi.useRealTimers();
  delete globalThis.document;
});

describe('showSteps', () => {
  it('an older run that is still waiting never lights its element after a newer run started', async () => {
    const { showSteps } = await import('../src/lib/know/spot.js');
    const late = el('late');
    const now = el('now');
    const a = showSteps([{ sel: '.late' }], 'news');
    await vi.advanceTimersByTimeAsync(400); // run A waits for «.late», which is not there yet
    shown['.now'] = now;
    const b = showSteps([{ sel: '.now' }], 'news');
    await vi.advanceTimersByTimeAsync(800);
    expect(now.dataset.spotOn).toBe('news');
    shown['.late'] = late; // the element of the old run shows up later
    await vi.advanceTimersByTimeAsync(2000);
    expect(late.dataset.spotOn).toBeUndefined();
    expect(await a).toBe(false);
    expect(await b).toBe(true);
  });
  it('a single run still lights its element', async () => {
    const { showSteps } = await import('../src/lib/know/spot.js');
    const one = el('one');
    shown['.one'] = one;
    const r = showSteps([{ sel: '.one' }], 'news');
    await vi.advanceTimersByTimeAsync(800);
    expect(one.dataset.spotOn).toBe('news');
    expect(await r).toBe(true);
  });
});
