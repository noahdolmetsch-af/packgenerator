// Wächter «Dateigrösse» and «Seiten später laden» (Tempo, 19.10.2026): see scripts/size-guard.mjs, src/lib/nav/lazy.js.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { oversize, heavyStatic, MAX_JS_BYTES, HEAVY } from '../scripts/size-guard.mjs';
import { loadPage, loadedOf } from '../src/lib/nav/lazy.js';

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

describe('size guard', () => {
  it('flags a JavaScript file over 3 MB, nothing else', () => {
    expect(MAX_JS_BYTES).toBe(3_000_000);
    const files = [
      { name: 'assets/start-a.js', bytes: 2_900_000 },
      { name: 'assets/big-b.js', bytes: 3_100_000 },
      { name: 'assets/style.css', bytes: 4_000_000 },
    ];
    expect(oversize(files).map((f) => f.name)).toEqual(['assets/big-b.js']);
  });
  it('tells a static import of a big tool from a dynamic one', () => {
    expect(heavyStatic("import { PDFDocument } from 'pdf-lib';")).toEqual(['pdf-lib']);
    expect(heavyStatic("const { PDFDocument } = await import('pdf-lib');")).toEqual([]);
    expect(heavyStatic("import 'tesseract.js';")).toEqual(['tesseract.js']);
  });
  it('no file under src/ imports a big tool at the start', () => {
    const hits = walk('src')
      .filter((f) => /\.(js|svelte)$/.test(f))
      .map((f) => [f, heavyStatic(readFileSync(f, 'utf8'))])
      .filter(([, h]) => h.length);
    expect(hits, `load these with await import(): ${HEAVY.join(', ')}`).toEqual([]);
  });
  it('App.svelte loads only Heute at the start; every other page through PAGES', () => {
    const app = readFileSync('src/App.svelte', 'utf8');
    const eager = [...app.matchAll(/^\s*import (\w+) from '\.\/pages\/(\w+)\.svelte';/gm)].map((m) => m[2]);
    expect(eager, 'add a new page to PAGES in App.svelte: Name: () => import(\'./pages/Name.svelte\')').toEqual(['Home']);
    const lazy = [...app.matchAll(/import\('\.\/pages\/(\w+)\.svelte'\)/g)].map((m) => m[1]);
    const pages = readdirSync('src/pages').filter((f) => f.endsWith('.svelte')).map((f) => f.replace('.svelte', ''));
    for (const p of lazy) expect(pages).toContain(p);
    expect(lazy.length).toBeGreaterThan(40);
  });
});

describe('loadPage', () => {
  const store = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  };
  it('loads once and keeps the page', async () => {
    let n = 0;
    const load = async () => ((n += 1), { default: 'Page' });
    expect(loadedOf(load)).toBe(null);
    expect(await loadPage(load)).toBe('Page');
    expect(await loadPage(load)).toBe('Page');
    expect(loadedOf(load)).toBe('Page');
    expect(n).toBe(1);
  });
  it('a missing part after a new version reloads once, then shows the error', async () => {
    const s = store();
    let reloads = 0;
    const load = async () => {
      throw new Error('Failed to fetch dynamically imported module');
    };
    const first = loadPage(load, { reload: () => (reloads += 1), store: s, now: 1_000_000 });
    await new Promise((r) => setTimeout(r, 10));
    expect(reloads).toBe(1);
    void first;
    await expect(loadPage(load, { reload: () => (reloads += 1), store: s, now: 1_030_000 })).rejects.toThrow(/dynamically imported/);
    expect(reloads).toBe(1);
  });
});
