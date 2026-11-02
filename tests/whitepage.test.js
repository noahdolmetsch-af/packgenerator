// «Nie eine weisse Seite» (Noah 2.11.2026): a card appears when an error leaves #app empty. Plain fakes, no DOM.
import { describe, it, expect } from 'vitest';
import { watchWhitePage } from '../src/lib/ui/whitepage.js';

const el = () => ({ children: [], style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, append(...c) { this.children.push(...c); }, addEventListener() {}, querySelector(q) { return this.children.find((c) => q.includes('white-card') && 'data-white-card' in c.attrs) ?? null; } });
const rig = (children = []) => {
  const handlers = {};
  const win = { addEventListener: (k, f) => (handlers[k] = f), removeEventListener() {} };
  const target = { ...el(), children };
  target.querySelector = (q) => (q.includes('white-card') ? target.children.find((c) => c.attrs && 'data-white-card' in c.attrs) ?? null : null);
  return { handlers, win, target, doc: { createElement: el } };
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe('never a white page', () => {
  it('draws a card when an error leaves the app empty', async () => {
    const { handlers, win, target, doc } = rig();
    watchWhitePage(target, { wait: 5, win, doc });
    handlers.error();
    await wait(30);
    expect(target.children.length).toBe(1);
    expect(target.children[0].attrs['data-white-card']).toBeDefined();
  });
  it('leaves a working app alone', async () => {
    const { handlers, win, target, doc } = rig([{ attrs: {} }]);
    watchWhitePage(target, { wait: 5, win, doc });
    handlers.error();
    await wait(30);
    expect(target.children.length).toBe(1);
    expect(target.children[0].attrs['data-white-card']).toBeUndefined();
  });
});
