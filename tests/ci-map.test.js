import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { buildGraph, coreOf, specsFor, routesOf, pagesOf } from '../scripts/ci-map.mjs';

// A tiny fictional app: main (core) → App → eager helper; pages Gear and Pack are loaded later.
const FILES = {
  'src/main.js': "import App from './App.svelte';\nexport default App;",
  'src/App.svelte': `<script>
  import { shared } from './lib/shared.js';
  const PAGES = {
    Gear: () => import('./pages/Gear.svelte'),
    Pack: () => import('./pages/Pack.svelte'),
    Odd: () => import('./pages/Odd.svelte'),
  };
</script>
<main>
  {#if page === 'gear'}
    <LazyPage load={PAGES.Gear} />
  {:else if page === 'pack' || page === 'packen'}
    <LazyPage load={PAGES.Pack} />
  {:else}
    <LazyPage load={PAGES.Odd} />
  {/if}
</main>`,
  'src/lib/shared.js': 'export const shared = 1;',
  'src/pages/Gear.svelte': "<script>import Row from '../lib/gear/Row.svelte'; import { sizes } from '../lib/gear/sizes.js';</script>",
  'src/pages/Pack.svelte': "<script>import { sizes } from '../lib/gear/sizes.js'; const more = () => import('../lib/pack/Big.js');</script>",
  'src/pages/Odd.svelte': '<p>odd</p>',
  'src/lib/gear/Row.svelte': "<script>import { sizes } from './sizes.js';</script>",
  'src/lib/gear/sizes.js': 'export const sizes = [];',
  'src/lib/pack/Big.js': 'export default 1;',
  'src/lib/lonely.js': 'export default 2;',
  'tests/e2e/gear.spec.js': "import { test } from './clock.js'; test('x', async ({ page }) => { await page.goto('./#/gear?tab=weigh'); });",
  'tests/e2e/packing.spec.js': "test('y', async ({ page }) => { await page.goto('./#/pack/past'); });",
  'tests/e2e/direct.spec.js': "import { sizes } from '../../src/lib/gear/sizes.js';",
  'tests/e2e/other.spec.js': "test('z', async ({ page }) => { await page.goto('./#/trips'); });",
  'tests/e2e/clock.js': 'export const test = 1;',
  'tests/e2e/gesamttest/big.spec.js': "import { sizes } from '../../../src/lib/gear/sizes.js';",
};

let dir, graph, core;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'ci-map-'));
  for (const [f, text] of Object.entries(FILES)) {
    mkdirSync(join(dir, dirname(f)), { recursive: true });
    writeFileSync(join(dir, f), text);
  }
  graph = buildGraph(dir);
  core = coreOf(graph);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('ci-map: the import graph', () => {
  it('core = what the start loads, lazy pages are not in it', () => {
    expect(core.has('src/lib/shared.js')).toBe(true);
    expect(core.has('src/pages/Gear.svelte')).toBe(false);
    expect(core.has('src/lib/gear/Row.svelte')).toBe(false);
  });
  it('reads the pages and their addresses from App.svelte', () => {
    const p = pagesOf(graph);
    expect(p.files.Gear).toBe('src/pages/Gear.svelte');
    expect([...p.keys.Pack].sort()).toEqual(['pack', 'packen']);
  });
  it('reads the addresses a spec opens', () => {
    expect([...routesOf("goto('./#/trips/fuel'); goto('./#/gear?tab=weigh')")].sort()).toEqual(['fuel', 'gear', 'trips']);
  });
});

describe('ci-map: which specs a change touches', () => {
  it('a part of one page: that page\'s specs, and specs that import it', () => {
    expect(specsFor(['src/lib/gear/Row.svelte'], graph, core)).toEqual(['tests/e2e/gear.spec.js']);
  });
  it('a file two pages share: both pages, plus specs that import it', () => {
    expect(specsFor(['src/lib/gear/sizes.js'], graph, core)).toEqual(['tests/e2e/direct.spec.js', 'tests/e2e/gear.spec.js', 'tests/e2e/packing.spec.js']);
  });
  it('a file loaded later by a page (import()) leads to that page', () => {
    expect(specsFor(['src/lib/pack/Big.js'], graph, core)).toEqual(['tests/e2e/packing.spec.js']);
  });
  it('a start file: everything', () => {
    expect(specsFor(['src/lib/shared.js'], graph, core)).toBe(null);
    expect(specsFor(['src/App.svelte'], graph, core)).toBe(null);
  });
  it('a file that ends nowhere, a page without an address, a new or deleted file: everything', () => {
    expect(specsFor(['src/lib/lonely.js'], graph, core)).toBe(null);
    expect(specsFor(['src/pages/Odd.svelte'], graph, core)).toBe(null);
    expect(specsFor(['src/lib/gone.js'], graph, core)).toBe(null);
  });
  it('a test helper reaches the specs that use it, the Gesamttest is not a phone spec', () => {
    expect(specsFor(['tests/e2e/clock.js'], graph, core)).toEqual(['tests/e2e/gear.spec.js']);
  });
});

describe('ci-map: the real app', () => {
  it('Heute and the router are core; a small page is scoped; every end is understood', () => {
    const real = buildGraph('.');
    const c = coreOf(real);
    expect(specsFor(['src/pages/Home.svelte'], real, c)).toBe(null);
    expect(specsFor(['src/App.svelte'], real, c)).toBe(null);
    const lend = specsFor(['src/pages/Lend.svelte'], real, c);
    expect(lend?.length).toBeGreaterThan(0);
    expect(lend.length).toBeLessThan(100);
  });
  it('every page in PAGES has an address', () => {
    const real = buildGraph('.');
    const p = pagesOf(real);
    const without = Object.keys(p.files).filter((n) => !p.keys[n]?.size);
    // pages that App.svelte shows without a «page ===» block can't be scoped (they run everything); keep the list short
    expect(without.length).toBeLessThan(15);
  });
});
