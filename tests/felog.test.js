// «Fehler-Melder» (Noah 21.11.2026 «a»): what is noted, what is left out, and that it never grows without end.
import { describe, it, expect } from 'vitest';
import { recordError, list, count, takeErrors, clear, textOf, pageOf, copyText, watchErrors, MAX, TEXT_MAX, KEY } from '../src/lib/fehler/felog.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), raw: m };
};

describe('Fehler-Melder', () => {
  it('notes the text, the page without parameters, the time and the version', () => {
    const s = memory();
    const e = recordError(new Error('Cannot read properties of undefined'), { page: pageOf('#/trip/abc?x=1'), now: 1000, store: s });
    expect(e).toMatchObject({ message: 'Cannot read properties of undefined', page: '#/trip/abc', at: 1000 });
    expect(typeof e.version).toBe('string');
    expect(list(s)).toHaveLength(1);
    expect(pageOf('')).toBe('#/');
  });
  it('keeps typed text out: long quoted pieces and web addresses are cut', () => {
    expect(textOf(new Error('Unexpected token "Mein ganz persönlicher Notizentext von heute" in JSON'))).toBe('Unexpected token … in JSON');
    expect(textOf('Failed to load https://noahdolmetsch-af.github.io/packgenerator/assets/Pack-DwrLxqqq.js?v=1 now')).toBe('Failed to load Pack-DwrLxqqq.js now');
    expect(textOf('x'.repeat(500)).length).toBe(TEXT_MAX);
  });
  it('ignores harmless noise: no network, cancelled, the browser\'s own warning', () => {
    const s = memory();
    for (const m of ['Failed to fetch', 'ResizeObserver loop completed with undelivered notifications.', 'Script error.', 'AbortError: The operation was aborted', 'Load failed']) expect(recordError(m, { store: s })).toBeNull();
    expect(count(s)).toBe(0);
  });
  it('notes the same error on the same page once a minute, a different page or a later time again', () => {
    const s = memory();
    expect(recordError('boom', { page: '#/a', now: 0, store: s })).not.toBeNull();
    expect(recordError('boom', { page: '#/a', now: 30_000, store: s })).toBeNull();
    expect(recordError('boom', { page: '#/b', now: 30_000, store: s })).not.toBeNull();
    expect(recordError('boom', { page: '#/a', now: 90_000, store: s })).not.toBeNull();
    expect(count(s)).toBe(3);
  });
  it('keeps only the newest ones', () => {
    const s = memory();
    for (let i = 0; i < MAX + 10; i++) recordError(`error ${i}`, { page: '#/', now: i * 100_000, store: s });
    const l = list(s);
    expect(l).toHaveLength(MAX);
    expect(l.at(-1).message).toBe(`error ${MAX + 9}`);
    expect(l[0].message).toBe('error 10');
  });
  it('takeErrors hands over and empties (the Logbuch takes them), clear empties', () => {
    const s = memory();
    recordError('a', { page: '#/', now: 1, store: s });
    recordError('b', { page: '#/x', now: 2, store: s });
    const got = takeErrors(s);
    expect(got.map((e) => e.message)).toEqual(['a', 'b']);
    expect(got[0]).toEqual(expect.objectContaining({ message: 'a', page: '#/', at: 1, version: expect.any(String) }));
    expect(count(s)).toBe(0);
    expect(s.raw.has(KEY)).toBe(false);
    recordError('c', { page: '#/', now: 3, store: s });
    clear(s);
    expect(count(s)).toBe(0);
  });
  it('survives broken storage and a broken note', () => {
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => {} };
    expect(() => recordError('x', { store: broken })).not.toThrow();
    const bad = memory();
    bad.setItem(KEY, '{not json');
    expect(list(bad)).toEqual([]);
    expect(recordError('x', { page: '#/', now: 1, store: bad })).not.toBeNull();
  });
  it('copy text: newest first, one line each', () => {
    const t = copyText([{ message: 'first', page: '#/', at: Date.UTC(2026, 10, 21, 8, 0), version: '0.9.1' }, { message: 'second', page: '#/flow', at: Date.UTC(2026, 10, 21, 9, 30), version: '0.9.1' }]);
    expect(t.split('\n')).toEqual(['2026-11-21 09:30 UTC · 0.9.1 · #/flow · second', '2026-11-21 08:00 UTC · 0.9.1 · #/ · first']);
  });
  it('watches the window and stops watching', () => {
    const handlers = {};
    const win = { addEventListener: (n, f) => (handlers[n] = f), removeEventListener: (n) => delete handlers[n] };
    const off = watchErrors(win);
    expect(Object.keys(handlers).sort()).toEqual(['error', 'unhandledrejection']);
    off();
    expect(Object.keys(handlers)).toEqual([]);
  });
});
