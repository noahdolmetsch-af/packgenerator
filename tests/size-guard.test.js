// Wächter «Dateigrösse» and «Seiten später laden» (Tempo, 19.10.2026): see scripts/size-guard.mjs, src/lib/nav/lazy.js.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { oversize, heavyStatic, startBytes, startWarning, MAX_START_JS_BYTES, MAX_JS_BYTES, HEAVY } from '../scripts/size-guard.mjs';
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
  it('counts only the start files for the start budget', () => {
    const files = [
      { name: 'assets/main-a.js', bytes: 10 },
      { name: 'assets/start-b.js', bytes: 600 },
      { name: 'assets/de-texts-2-c.js', bytes: 700 },
      { name: 'assets/Pack-d.js', bytes: 450 },
      { name: 'assets/style.css', bytes: 999 },
    ];
    expect(startBytes(files)).toBe(1310);
    expect(MAX_START_JS_BYTES).toBe(5_000_000);
  });
  it('warns from 90 % of the start budget, never fails, says nothing below or above', () => {
    expect(startWarning(4_500_000)).toBeNull(); // exactly 90 %
    expect(startWarning(4_500_001)).toMatch(/90 %/);
    expect(startWarning(4_900_000)).toMatch(/98 %.*5\.0 MB/);
    expect(startWarning(3_000_000)).toBeNull();
    expect(startWarning(5_000_001)).toBeNull(); // over the limit the build fails (the error, not the warning)
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
  it('the handbook (English and German) is not part of the start: only its pages and load.js import it', () => {
    const allowed = ['src/lib/handbook/load.js', 'src/lib/handbook/late-de.js', 'src/pages/Handbook.svelte', 'src/pages/MiniApps.svelte'];
    const hits = walk('src')
      .filter((f) => /\.(js|svelte)$/.test(f))
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => {
        const text = readFileSync(f, 'utf8');
        const own = f.startsWith('src/lib/handbook/') ? /['"]\.\/texte-de\.js['"]/.test(text) : false;
        return own || /['"][^'"]*(\/handbook\.js|handbook\/texte-de\.js)['"]/.test(text);
      });
    expect(hits.sort()).toEqual(allowed.sort());
  });
  it('the handbook-only German is not used by any other place (it is not loaded there)', async () => {
    // a text that is also used outside the handbook must stay in src/lib/i18n/de/handbuch.js (loaded at the start)
    const LATE = (await import('../src/lib/handbook/texte-de.js')).default;
    const others = walk('src')
      .filter((f) => /\.(js|svelte)$/.test(f) && !f.replace(/\\/g, '/').startsWith('src/lib/i18n/de/') && !/src[\\/]lib[\\/](handbook\.js|handbook[\\/]texte-de\.js)$/.test(f))
      .map((f) => readFileSync(f, 'utf8').replace(/\\/g, ''))
      .join('\n');
    const used = Object.keys(LATE).filter((k) => others.includes(k.replace(/\\/g, '').slice(0, 24)));
    expect(used, 'move these texts from handbook/texte-de.js to i18n/de/handbuch.js').toEqual([]);
  }, 30000);
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

describe('loadPage default reload', () => {
  it('loads fresh (old offline copy removed), not a plain reload', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/lib/nav/lazy.js', import.meta.url), 'utf8');
    expect(src).toMatch(/reload = \(\) => freshReload\(\)/);
    expect(src).not.toMatch(/location\.reload\(\)/);
  });
});
